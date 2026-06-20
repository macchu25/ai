package alert

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CameraState struct {
	SuspectStart               time.Time `json:"suspect_start"`
	LastAlert                  time.Time `json:"last_alert"`
	LocalAlertSent             bool      `json:"local_alert_sent"`
	AlertPaused                bool      `json:"alert_paused"`
	SnapshotCaptured           bool      `json:"snapshot_captured"`
	TelegramAlertSent          bool      `json:"telegram_alert_sent"`
	PhoneCallInitiated         bool      `json:"phone_call_initiated"`
	CapturedImageBytes         []byte    `json:"captured_image_bytes,omitempty"`
	CapturedSkeletonImageBytes []byte    `json:"captured_skeleton_image_bytes,omitempty"`
	LastTelegramAlertTime      time.Time `json:"last_telegram_alert_time"`
	LastPhoneCallTime          time.Time `json:"last_phone_call_time"`
}

type StateStorage interface {
	Get(ctx context.Context, camID primitive.ObjectID) (*CameraState, error)
	Set(ctx context.Context, camID primitive.ObjectID, state *CameraState) error
	Delete(ctx context.Context, camID primitive.ObjectID) error
}

// RedisStorage implements StateStorage using Redis
type RedisStorage struct {
	client *redis.Client
}

func NewRedisStorage(url string) *RedisStorage {
	rdb := redis.NewClient(&redis.Options{
		Addr: url,
	})
	return &RedisStorage{client: rdb}
}

func NewSmartStorage(redisURL string) StateStorage {
	if redisURL == "" {
		fmt.Println("[Storage] Sử dụng bộ nhớ MemoryStorage (RAM).")
		return NewMemoryStorage()
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:        redisURL,
		DialTimeout: 1 * time.Second,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		fmt.Printf("[Storage] ⚠️ Không thể kết nối tới Redis (%v). Tự động chuyển sang sử dụng bộ nhớ MemoryStorage (RAM).\n", err)
		return NewMemoryStorage()
	}

	fmt.Println("[Storage] ✅ Kết nối tới Redis thành công.")
	return &RedisStorage{client: rdb}
}

func (r *RedisStorage) Get(ctx context.Context, camID primitive.ObjectID) (*CameraState, error) {
	key := fmt.Sprintf("cam_state:%s", camID.Hex())
	val, err := r.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var state CameraState
	err = json.Unmarshal([]byte(val), &state)
	return &state, err
}

func (r *RedisStorage) Set(ctx context.Context, camID primitive.ObjectID, state *CameraState) error {
	key := fmt.Sprintf("cam_state:%s", camID.Hex())
	data, _ := json.Marshal(state)
	return r.client.Set(ctx, key, data, 24*time.Hour).Err()
}

func (r *RedisStorage) Delete(ctx context.Context, camID primitive.ObjectID) error {
	key := fmt.Sprintf("cam_state:%s", camID.Hex())
	return r.client.Del(ctx, key).Err()
}

// MemoryStorage implements StateStorage using an in-memory map (Fallback)
type MemoryStorage struct {
	states map[primitive.ObjectID]*CameraState
	mu     sync.RWMutex
}

func NewMemoryStorage() *MemoryStorage {
	return &MemoryStorage{states: make(map[primitive.ObjectID]*CameraState)}
}

func (m *MemoryStorage) Get(ctx context.Context, camID primitive.ObjectID) (*CameraState, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.states[camID], nil
}

func (m *MemoryStorage) Set(ctx context.Context, camID primitive.ObjectID, state *CameraState) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.states[camID] = state
	return nil
}

func (m *MemoryStorage) Delete(ctx context.Context, camID primitive.ObjectID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.states, camID)
	return nil
}

package cloud

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"
)

// SyncManager quản lý việc đẩy dữ liệu lên Cloud
type SyncManager struct {
	Provider string // AWS, Google, or Firebase
}

func NewSyncManager() *SyncManager {
	provider := os.Getenv("CLOUD_PROVIDER")
	if provider == "" { provider = "AWS S3" }
	return &SyncManager{Provider: provider}
}

// UploadIncidentEvidence giả lập việc đẩy ảnh/video lên Cloud
func (s *SyncManager) UploadIncidentEvidence(localPath string) (string, error) {
	filename := filepath.Base(localPath)
	
	// GIẢ LẬP: Trong thực tế, bạn sẽ dùng AWS SDK hoặc Google SDK tại đây
	log.Printf("☁️ [Cloud Sync] Đang đẩy bằng chứng '%s' lên %s...", filename, s.Provider)
	
	// Giả lập thời gian tải lên
	time.Sleep(1 * time.Second)
	
	// Tạo URL giả định (Sau này sẽ là URL thật từ S3)
	cloudURL := fmt.Sprintf("https://storage.casos.ai/evidence/%s", filename)
	
	log.Printf("✅ [Cloud Sync] Đã lưu trữ thành công: %s", cloudURL)
	
	return cloudURL, nil
}

// UploadHLSFolder giả lập việc đẩy toàn bộ thư mục video HLS của sự cố lên Cloud
func (s *SyncManager) UploadHLSFolder(localFolder string, incidentID string) (string, error) {
	log.Printf("☁️ [Cloud Sync] Đang bắt đầu đồng bộ thư mục video HLS '%s' lên %s...", incidentID, s.Provider)

	// Duyệt qua toàn bộ tệp trong thư mục (bao gồm .ts và .m3u8)
	err := filepath.Walk(localFolder, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			filename := filepath.Base(path)
			log.Printf("   [Cloud Sync] Uploading segment: %s/%s to %s", incidentID, filename, s.Provider)
			// Giả lập độ trễ upload từng phần nhỏ
			time.Sleep(50 * time.Millisecond)
		}
		return nil
	})
	if err != nil {
		return "", err
	}

	// Tạo URL giả định của file stream.m3u8 trên Cloud
	cloudURL := fmt.Sprintf("https://storage.casos.ai/evidence/%s/stream.m3u8", incidentID)
	log.Printf("✅ [Cloud Sync] Đã lưu trữ thành công toàn bộ video sự cố HLS lên: %s", cloudURL)
	return cloudURL, nil
}

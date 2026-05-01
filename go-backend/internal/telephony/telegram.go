package telephony

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"log"
	"time"
	"strings"
	"strconv"
)

type InlineButton struct {
	Text         string `json:"text"`
	CallbackData string `json:"callback_data,omitempty"`
}
type InlineKeyboardMarkup struct {
	InlineKeyboard [][]InlineButton `json:"inline_keyboard"`
}

var httpClient = &http.Client{ Timeout: 10 * time.Second }

// SendTelegramAlertCustom gửi tin nhắn bảo mật
func SendTelegramAlertCustom(chatID string, message string, buttons interface{}) error {
	token := os.Getenv("TELEGRAM_BOT_TOKEN")
	if token == "" || chatID == "" { return nil }

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", token)
	payload := map[string]interface{}{
		"chat_id": chatID,
		"text": message,
		"parse_mode": "HTML",
		"disable_web_page_preview": true,
	}
	if buttons != nil { payload["reply_markup"] = buttons }

	body, _ := json.Marshal(payload)
	httpClient.Post(url, "application/json", bytes.NewBuffer(body))
	return nil
}

// SendTelegramPhotoCustom gửi ảnh bảo mật
func SendTelegramPhotoCustom(chatID string, caption string, imagePath string, buttons interface{}) error {
	token := os.Getenv("TELEGRAM_BOT_TOKEN")
	if token == "" || chatID == "" { return nil }

	file, err := os.Open(imagePath)
	if err != nil { return err }
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("photo", filepath.Base(imagePath))
	io.Copy(part, file)

	writer.WriteField("chat_id", chatID)
	writer.WriteField("caption", caption)
	writer.WriteField("parse_mode", "HTML")
	if buttons != nil {
		buttonsJSON, _ := json.Marshal(buttons)
		writer.WriteField("reply_markup", string(buttonsJSON))
	}
	writer.Close()

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendPhoto", token)
	req, _ := http.NewRequest("POST", url, body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	httpClient.Do(req)
	return nil
}

// StartBotListener lắng nghe kèm XÁC THỰC NGƯỜI GỬI (Security)
func StartBotListener(onAction func(senderChatID string, action, data string)) {
	token := os.Getenv("TELEGRAM_BOT_TOKEN")
	if token == "" { return }

	log.Println("🛡️ [Casos Security] Bot Listener đang hoạt động với lớp xác thực...")
	offset := 0

	for {
		url := fmt.Sprintf("https://api.telegram.org/bot%s/getUpdates?offset=%d&timeout=30", token, offset)
		resp, err := httpClient.Get(url)
		if err != nil {
			time.Sleep(10 * time.Second)
			continue
		}

		var result struct {
			Ok     bool `json:"ok"`
			Result []struct {
				UpdateID      int `json:"update_id"`
				CallbackQuery struct {
					ID   string `json:"id"`
					Data string `json:"data"`
					From struct {
						ID int64 `json:"id"`
					} `json:"from"`
				} `json:"callback_query"`
			} `json:"result"`
		}

		json.NewDecoder(resp.Body).Decode(&result)
		resp.Body.Close()

		for _, update := range result.Result {
			if update.CallbackQuery.Data != "" {
				senderID := strconv.FormatInt(update.CallbackQuery.From.ID, 10)
				parts := strings.SplitN(update.CallbackQuery.Data, ":", 2)
				if len(parts) == 2 {
					// Truyền thêm senderID để Backend kiểm tra quyền
					onAction(senderID, parts[0], parts[1])
					
					ackURL := fmt.Sprintf("https://api.telegram.org/bot%s/answerCallbackQuery?callback_query_id=%s", token, update.CallbackQuery.ID)
					httpClient.Get(ackURL)
				}
			}
			offset = update.UpdateID + 1
		}
	}
}

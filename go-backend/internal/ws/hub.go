package ws

type PrivateMessage struct {
	UserID string
	Data   []byte
}

// Hub duy trì danh sách các client đang kết nối và xử lý logic phát tin nhắn 
// Broadcast đến các client thuộc về User cụ thể.
type Hub struct {
	// Quản lý các client web socket đang connect
	clients map[*Client]bool

	// Channel nhận dữ liệu cần push xuống cho các Client cụ thể
	Broadcast chan PrivateMessage

	// Đăng ký client mới
	Register chan *Client

	// Hủy đăng ký client khi bị ngắt kết nối
	Unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan PrivateMessage),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.clients[client] = true
		case client := <-h.Unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
		case pm := <-h.Broadcast:
			for client := range h.clients {
				// Privacy Check: Only send if client's UserID matches the target
				if client.UserID == pm.UserID {
					select {
					case client.send <- pm.Data:
					default:
						close(client.send)
						delete(h.clients, client)
					}
				}
			}
		}
	}
}

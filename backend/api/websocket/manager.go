package websocket

import (
	"sync"

	"github.com/gorilla/websocket"
)

type Manager struct {
	clients map[string]*websocket.Conn
	mu      sync.Mutex
}

var WSManager = &Manager{
	clients: make(map[string]*websocket.Conn),
}

func (m *Manager) AddClient(jobID string, conn *websocket.Conn) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.clients[jobID] = conn
}

func (m *Manager) RemoveClient(jobID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.clients, jobID)
}

func (m *Manager) SendResult(jobID string, data []byte) {
	m.mu.Lock()
	conn, ok := m.clients[jobID]
	m.mu.Unlock()

	if ok {
		conn.WriteMessage(websocket.TextMessage, data)
		conn.Close()
		m.RemoveClient(jobID)
	}
}

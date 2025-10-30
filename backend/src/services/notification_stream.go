package services

import (
	"backend/src/models"
	"sync"
)

type subscriber chan models.Notification

type NotificationHub struct {
	mu    sync.RWMutex
	subs  map[uint]map[subscriber]struct{}
}

var hub *NotificationHub
var once sync.Once

func GetNotificationHub() *NotificationHub {
	once.Do(func() {
		hub = &NotificationHub{subs: make(map[uint]map[subscriber]struct{})}
	})
	return hub
}

func (h *NotificationHub) Subscribe(userID uint) subscriber {
	s := make(subscriber, 10)
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.subs[userID]; !ok {
		h.subs[userID] = make(map[subscriber]struct{})
	}
	h.subs[userID][s] = struct{}{}
	return s
}

func (h *NotificationHub) Unsubscribe(userID uint, s subscriber) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if userSubs, ok := h.subs[userID]; ok {
		delete(userSubs, s)
		close(s)
		if len(userSubs) == 0 {
			delete(h.subs, userID)
		}
	}
}

func (h *NotificationHub) Publish(n models.Notification) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if userSubs, ok := h.subs[n.UserID]; ok {
		for s := range userSubs {
			select { case s <- n: default: }
		}
	}
}

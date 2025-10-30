package controllers

import (
	"backend/src/config"
	"backend/src/models"
	"backend/src/types"
	"backend/src/utils"
	"backend/src/services"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type NotificationController struct{}

func NewNotificationController() *NotificationController { return &NotificationController{} }

// ListNotifications godoc
// @Summary      List my notifications
// @Tags         Notification
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        unread_only query bool  false "Only unread"
// @Param        limit       query int   false "Limit" default(20)
// @Param        offset      query int   false "Offset" default(0)
// @Success      200 {array} models.Notification
// @Router       /notifications [get]
func (nc *NotificationController) ListNotifications(c *gin.Context) {
	uid, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "Unauthorized", Message: "User not authenticated"})
		return
	}

	unreadOnly := c.Query("unread_only") == "true"
	limit := 20
	offset := 0
	if v := c.Query("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 100 { limit = n }
	}
	if v := c.Query("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 { offset = n }
	}

	var notifs []models.Notification
	q := config.DB.Where("user_id = ?", uid).Order("created_at DESC").Limit(limit).Offset(offset)
	if unreadOnly { q = q.Where("read = ?", false) }
	if err := q.Find(&notifs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Database error", Message: "Failed to fetch notifications"})
		return
	}
	c.JSON(http.StatusOK, notifs)
}

// MarkRead godoc
// @Summary      Mark a notification as read
// @Tags         Notification
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Notification ID"
// @Success      204 "No Content"
// @Router       /notifications/{id} [patch]
func (nc *NotificationController) MarkRead(c *gin.Context) {
	uid, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "Unauthorized", Message: "User not authenticated"})
		return
	}
	id := c.Param("id")
	var n models.Notification
	if err := config.DB.First(&n, id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Error: "Not found", Message: "Notification not found"})
		return
	}
	if n.UserID != uid {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "Unauthorized", Message: "Cannot modify others' notifications"})
		return
	}
	if err := config.DB.Model(&n).Update("read", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Database error", Message: "Failed to update"})
		return
	}
	c.Status(http.StatusNoContent)
}

// Stream provides Server-Sent Events for real-time notifications.
// Authentication via Authorization header or token query parameter.
func (nc *NotificationController) Stream(c *gin.Context) {
	var userID uint
	if uidVal, ok := c.Get("userID"); ok {
		userID = uidVal.(uint)
	} else {
		// Try token param
		token := c.Query("token")
		if token == "" {
			c.Status(http.StatusUnauthorized)
			return
		}
		claims, err := utils.ValidateToken(token)
		if err != nil { c.Status(http.StatusUnauthorized); return }
		userID = claims.UserID
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	hub := services.GetNotificationHub()
	sub := hub.Subscribe(userID)
	defer hub.Unsubscribe(userID, sub)

	// notify open
	c.Writer.Write([]byte(":ok\n\n"))
	c.Writer.Flush()

	// Send events
	notify := c.Writer.CloseNotify()
	for {
		select {
		case <-notify:
			return
		case n := <-sub:
			b, _ := json.Marshal(n)
			c.Writer.Write([]byte("data: "))
			c.Writer.Write(b)
			c.Writer.Write([]byte("\n\n"))
			c.Writer.Flush()
		}
	}
}

// MarkAllRead godoc
// @Summary      Mark all notifications as read
// @Tags         Notification
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      204 "No Content"
// @Router       /notifications/mark-all-read [post]
func (nc *NotificationController) MarkAllRead(c *gin.Context) {
	uid, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "Unauthorized", Message: "User not authenticated"})
		return
	}
	if err := config.DB.Model(&models.Notification{}).Where("user_id = ? AND read = ?", uid, false).Update("read", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Database error", Message: "Failed to update"})
		return
	}
	c.Status(http.StatusNoContent)
}

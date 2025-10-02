package types

type PostStatus string

const (
	PostStatusPublished PostStatus = "published"
	PostStatusArchived  PostStatus = "archived"
)

type NotificationType string

const (
	NotificationTypeInvite  NotificationType = "invite"
	NotificationTypeFollow  NotificationType = "follow"
	NotificationTypeMessage NotificationType = "message"
	NotificationTypeSystem  NotificationType = "system"
)

func (ps PostStatus) IsValid() bool {
	switch ps {
	case PostStatusPublished, PostStatusArchived:
		return true
	}
	return false
}

func (nt NotificationType) IsValid() bool {
	switch nt {
	case NotificationTypeInvite, NotificationTypeFollow, NotificationTypeMessage, NotificationTypeSystem:
		return true
	}
	return false
}

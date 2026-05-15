package service

import (
	"context"
	"sobat-pintar/pkg/fcm"
)

type NotificationService interface {
	SendPushNotification(ctx context.Context, userID, title, body string) error
}

type notificationService struct {
	fcmClient *fcm.Client
}

func NewNotificationService(fcmClient *fcm.Client) NotificationService {
	return &notificationService{fcmClient: fcmClient}
}

func (s *notificationService) SendPushNotification(ctx context.Context, userID, title, body string) error {
	// TODO: Get user device token and send notification
	return nil
}

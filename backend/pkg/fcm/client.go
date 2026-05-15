package fcm

import (
	"context"

	"google.golang.org/api/option"
	// "firebase.google.com/go/v4"
	// "firebase.google.com/go/v4/messaging"
)

type Client struct {
	// App *firebase.App
}

func NewClient(ctx context.Context, credentialsPath string) (*Client, error) {
	_ = option.WithCredentialsFile(credentialsPath)
	// app, err := firebase.NewApp(ctx, nil, opt)
	// if err != nil {
	// 	return nil, err
	// }
	return &Client{}, nil
}

package mailer

import (
	"testing"

	"sobat-pintar/internal/config"
)

func TestNewSenderSeparatesDisplayNameFromEnvelopeAddress(t *testing.T) {
	sender, err := NewSender(&config.Config{
		EmailFrom: "Sobat Pintar <no-reply@example.com>",
		SMTPHost:  "smtp.example.com",
		SMTPPort:  "587",
	})
	if err != nil {
		t.Fatalf("NewSender returned error: %v", err)
	}

	smtp, ok := sender.(*smtpSender)
	if !ok {
		t.Fatalf("expected smtpSender, got %T", sender)
	}

	if smtp.from != "Sobat Pintar <no-reply@example.com>" {
		t.Fatalf("unexpected From header: %q", smtp.from)
	}
	if smtp.envelopeFrom != "no-reply@example.com" {
		t.Fatalf("unexpected envelope sender: %q", smtp.envelopeFrom)
	}
}

func TestNewSenderRejectsInvalidSMTPFromAddress(t *testing.T) {
	_, err := NewSender(&config.Config{
		EmailFrom: "Sobat Pintar",
		SMTPHost:  "smtp.example.com",
		SMTPPort:  "587",
	})
	if err == nil {
		t.Fatal("expected invalid EMAIL_FROM error")
	}
}

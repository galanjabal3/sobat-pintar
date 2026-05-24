package mailer

import (
	"bytes"
	"context"
	"crypto/tls"
	"fmt"
	"html"
	"net"
	"net/mail"
	"net/smtp"
	"strings"
	"time"

	"sobat-pintar/internal/config"
	"sobat-pintar/pkg/logger"
)

type Sender interface {
	SendVerificationEmail(ctx context.Context, to, name, verifyURL string) error
}

type consoleSender struct {
	from string
}

type smtpSender struct {
	from         string
	envelopeFrom string
	host         string
	port         string
	username     string
	password     string
}

func NewSender(cfg *config.Config) (Sender, error) {
	if cfg == nil {
		return nil, fmt.Errorf("mailer config is required")
	}

	if cfg.SMTPHost == "" || cfg.SMTPPort == "" || cfg.EmailFrom == "" {
		logger.Info("SMTP is not fully configured; verification emails will be logged in development only")
		return &consoleSender{from: defaultFrom(cfg.EmailFrom)}, nil
	}

	from, err := mail.ParseAddress(cfg.EmailFrom)
	if err != nil {
		return nil, fmt.Errorf("invalid EMAIL_FROM: %w", err)
	}

	return &smtpSender{
		from:         cfg.EmailFrom,
		envelopeFrom: from.Address,
		host:         cfg.SMTPHost,
		port:         cfg.SMTPPort,
		username:     cfg.SMTPUsername,
		password:     cfg.SMTPPassword,
	}, nil
}

func defaultFrom(from string) string {
	if strings.TrimSpace(from) != "" {
		return from
	}
	return "Sobat Pintar <no-reply@sobatpintar.local>"
}

func (s *consoleSender) SendVerificationEmail(ctx context.Context, to, name, verifyURL string) error {
	_ = ctx
	logger.Info("Verification email prepared", "to", to, "name", name, "link", verifyURL, "from", s.from)
	return nil
}

func (s *smtpSender) SendVerificationEmail(ctx context.Context, to, name, verifyURL string) error {
	_ = ctx

	subject := "Verifikasi email Sobat Pintar"
	body := buildVerificationEmailBody(name, verifyURL)
	message := bytes.NewBuffer(nil)
	message.WriteString(fmt.Sprintf("From: %s\r\n", s.from))
	message.WriteString(fmt.Sprintf("To: %s\r\n", to))
	message.WriteString("MIME-Version: 1.0\r\n")
	message.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	message.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	message.WriteString("\r\n")
	message.WriteString(body)

	addr := net.JoinHostPort(s.host, s.port)
	conn, err := net.DialTimeout("tcp", addr, 10*time.Second)
	if err != nil {
		return err
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.host)
	if err != nil {
		return err
	}
	defer client.Close()

	if ok, _ := client.Extension("STARTTLS"); ok {
		if err := client.StartTLS(&tls.Config{ServerName: s.host}); err != nil {
			return err
		}
	}

	if s.username != "" {
		auth := smtp.PlainAuth("", s.username, s.password, s.host)
		if err := client.Auth(auth); err != nil {
			return err
		}
	}

	if err := client.Mail(s.envelopeFrom); err != nil {
		return err
	}
	if err := client.Rcpt(to); err != nil {
		return err
	}

	w, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := w.Write(message.Bytes()); err != nil {
		_ = w.Close()
		return err
	}
	if err := w.Close(); err != nil {
		return err
	}

	return client.Quit()
}

func buildVerificationEmailBody(name, verifyURL string) string {
	escapedName := html.EscapeString(name)
	escapedURL := html.EscapeString(verifyURL)

	return fmt.Sprintf(`<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:0;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e5e7eb;">
        <h1 style="color:#111827;font-size:24px;line-height:1.2;margin:0 0 16px;">Verifikasi email Sobat Pintar</h1>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">Halo %s, klik tombol di bawah untuk mengaktifkan akun Sobat Pintar kamu.</p>
        <p style="margin:24px 0;">
          <a href="%s" style="display:inline-block;background:#02D48F;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:16px;font-weight:700;">Verifikasi Email</a>
        </p>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Kalau tombol tidak bisa diklik, buka tautan berikut:</p>
        <p style="font-size:14px;line-height:1.6;margin:8px 0 0;">
          <a href="%s" style="color:#2563eb;text-decoration:underline;">Buka halaman verifikasi email</a>
        </p>
      </div>
    </div>
  </body>
</html>`, escapedName, escapedURL, escapedURL)
}

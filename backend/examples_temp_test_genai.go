package main

import (
    "context"
    "fmt"
    "log"
    "os"

    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    
    apiKey := os.Getenv("GEMINI_API_KEY")
    if apiKey == "" {
        log.Fatal("GEMINI_API_KEY environment variable not set")
    }

    client, err := genai.NewClient(ctx, &genai.ClientConfig{
        APIKey: apiKey,
    })
    if err != nil {
        log.Fatal(err)
    }

    model := os.Getenv("GEMINI_MODEL")
    if model == "" {
        model = "gemini-1.5-flash"
    }

    fmt.Printf("Testing model: %s\n", model)
    result, err := client.Models.GenerateContent(
        ctx,
        model,
        genai.Text("Hello, how are you?"),
        nil,
    )
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Response: %s\n", result.Text())
}

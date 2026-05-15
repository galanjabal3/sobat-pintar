package dto

type UploadImageResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    struct {
		URL     string `json:"url"`
		PublicID string `json:"public_id"`
	} `json:"data"`
}

package dto

type ExplainRequest struct {
	Question string `json:"question"`
	ImageURL string `json:"image_url"`
	Level    string `json:"level"`
}

type ExplainResponse struct {
	ID       string `json:"id"`
	Question string `json:"question"`
	ImageURL string `json:"image_url"`
	Answer   string `json:"answer"`
	Level    string `json:"level"`
}

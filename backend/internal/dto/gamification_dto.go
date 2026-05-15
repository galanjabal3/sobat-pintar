package dto

type BadgeResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageURL    string `json:"image_url"`
	IsOwned     bool   `json:"is_owned"`
}

type LeaderboardResponse struct {
	UserName string `json:"user_name"`
	Points   int    `json:"points"`
}

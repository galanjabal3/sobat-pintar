package dto

type AIQuotaFeatureResponse struct {
	Feature   string `json:"feature"`
	Used      int    `json:"used"`
	Limit     int    `json:"limit"`
	Remaining int    `json:"remaining"`
}

type AIQuotaResponse struct {
	Date   string                   `json:"date"`
	Quotas []AIQuotaFeatureResponse `json:"quotas"`
}

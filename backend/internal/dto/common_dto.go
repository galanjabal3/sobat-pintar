package dto

type BaseResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type ErrorResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Error   string `json:"error,omitempty"`
}

func SuccessResponse(message string, data interface{}) BaseResponse {
	return BaseResponse{
		Success: true,
		Message: message,
		Data:    data,
	}
}

func SuccessMessage(message string) BaseResponse {
	return BaseResponse{
		Success: true,
		Message: message,
	}
}

func FailureResponse(message string, details ...string) ErrorResponse {
	res := ErrorResponse{
		Success: false,
		Message: message,
	}

	if len(details) > 0 {
		res.Error = details[0]
	}

	return res
}

type Pagination struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	TotalItems int `json:"total_items"`
	TotalPages int `json:"total_pages"`
}

type PaginatedResponse struct {
	BaseResponse
	Pagination Pagination `json:"pagination"`
}

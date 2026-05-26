package dto

import (
	"encoding/json"
	"sync/atomic"
)

var exposeErrorDetails atomic.Bool

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

func SetExposeErrorDetails(expose bool) {
	exposeErrorDetails.Store(expose)
}

func (r ErrorResponse) MarshalJSON() ([]byte, error) {
	type response struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		Error   string `json:"error,omitempty"`
	}

	details := ""
	if exposeErrorDetails.Load() {
		details = r.Error
	}
	return json.Marshal(response{Success: r.Success, Message: r.Message, Error: details})
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

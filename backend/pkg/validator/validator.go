package validator

import (
	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

// Validate validates a struct
func Validate(s interface{}) error {
	return validate.Struct(s)
}

// GetValidator returns the underlying validator instance
func GetValidator() *validator.Validate {
	return validate
}

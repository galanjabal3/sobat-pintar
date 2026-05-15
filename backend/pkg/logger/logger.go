package logger

import (
	"fmt"
	"os"
	"strings"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func Init(env string) {
	if env == "development" {
		output := zerolog.ConsoleWriter{
			Out:        os.Stderr,
			TimeFormat: "15:04:05",
			FormatLevel: func(i interface{}) string {
				var l string
				if ll, ok := i.(string); ok {
					switch ll {
					case "debug":
						l = "DBG"
					case "info":
						l = "INF"
					case "warn":
						l = "WRN"
					case "error":
						l = "ERR"
					case "fatal":
						l = "FTL"
					default:
						l = strings.ToUpper(ll)
					}
				}
				
				emoji := "✅"
				switch l {
				case "WRN":
					emoji = "⚠️ "
				case "ERR", "FTL":
					emoji = "❌"
				case "DBG":
					emoji = "🔍"
				}

				return fmt.Sprintf("%s %s", emoji, l)
			},
			FormatMessage: func(i interface{}) string {
				return fmt.Sprintf("| %s", i)
			},
			FormatFieldName: func(i interface{}) string {
				return fmt.Sprintf("%s=", i)
			},
			FormatFieldValue: func(i interface{}) string {
				return fmt.Sprintf("%s", i)
			},
		}
		log.Logger = log.Output(output)
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	} else {
		zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}
}

func Info(msg string, keyVals ...interface{}) {
	log.Info().Fields(keyVals).Msg(msg)
}

func Error(err error, msg string, keyVals ...interface{}) {
	log.Error().Err(err).Fields(keyVals).Msg(msg)
}

func Fatal(err error, msg string, keyVals ...interface{}) {
	log.Fatal().Err(err).Fields(keyVals).Msg(msg)
}

func Debug(msg string, keyVals ...interface{}) {
	log.Debug().Fields(keyVals).Msg(msg)
}

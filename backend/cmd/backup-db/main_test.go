package main

import "testing"

func TestDatabaseNameFromDSN(t *testing.T) {
	tests := []struct {
		name string
		dsn  string
		want string
	}{
		{
			name: "standard postgres database",
			dsn:  "postgresql://user:secret@localhost:5432/sobat_pintar?sslmode=disable",
			want: "sobat_pintar",
		},
		{
			name: "supabase postgres database",
			dsn:  "postgresql://user:secret@example.supabase.com:5432/postgres?sslmode=require",
			want: "postgres",
		},
		{
			name: "unsafe filename characters",
			dsn:  "postgresql://user:secret@localhost:5432/sobat pintar",
			want: "sobat-pintar",
		},
		{
			name: "missing database name",
			dsn:  "not-a-valid-dsn",
			want: "sobat-pintar",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := databaseNameFromDSN(tt.dsn); got != tt.want {
				t.Fatalf("databaseNameFromDSN() = %q, want %q", got, tt.want)
			}
		})
	}
}

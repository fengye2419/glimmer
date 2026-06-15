package envfile

import (
	"os"
	"strings"
)

// Load reads KEY=VALUE lines from .env files without overriding existing env vars.
func Load(paths ...string) {
	for _, path := range paths {
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		for _, line := range strings.Split(string(data), "\n") {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			key, value, ok := strings.Cut(line, "=")
			if !ok {
				continue
			}
			key = strings.TrimSpace(key)
			value = strings.TrimSpace(value)
			if key == "" || os.Getenv(key) != "" {
				continue
			}
			_ = os.Setenv(key, value)
		}
	}
}

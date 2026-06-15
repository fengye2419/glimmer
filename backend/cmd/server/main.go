package main

import (
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"glimmer/internal/api"
	"glimmer/internal/envfile"
	"glimmer/internal/llm"
	"glimmer/internal/store"
)

func main() {
	envfile.Load(".env", "../.env")

	dataDir := os.Getenv("DATA_DIR")
	if dataDir == "" {
		wd, _ := os.Getwd()
		dataDir = filepath.Join(wd, "data")
	}

	st, err := store.NewJSONStore(dataDir)
	if err != nil {
		log.Fatalf("init store: %v", err)
	}

	llmCfg := llm.ConfigFromEnv()
	llmClient := llm.NewClient(llmCfg)

	r := gin.Default()
	corsOrigins := []string{"http://localhost:5173", "http://127.0.0.1:5173"}
	if v := strings.TrimSpace(os.Getenv("CORS_ALLOW_ORIGINS")); v != "" {
		corsOrigins = nil
		for _, origin := range strings.Split(v, ",") {
			if o := strings.TrimSpace(origin); o != "" {
				corsOrigins = append(corsOrigins, o)
			}
		}
	}
	r.Use(cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
	}))

	h := api.NewHandler(st, llmClient)
	h.Register(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("glimmer backend listening on :%s (llm=%s)", port, llmCfg.Provider)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

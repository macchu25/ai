package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"strings"
	"time"
)

const (
	go2rtcExe      = "go2rtc.exe"
	cloudflaredExe = "cloudflared.exe"
	configFile     = "go2rtc.yaml"
	backendURL     = "http://localhost:8080/api/v1/bridge/register"
)

// Config represents the user's local config
type Config struct {
	RTSPUrl string `json:"rtsp_url"`
	UserID  string `json:"user_id"`
}

func main() {
	fmt.Println("======================================")
	fmt.Println("  CARDIAC SYNC BRIDGE TOOL (v1.0.0)   ")
	fmt.Println("======================================")

	// 1. Read or Create Local Config
	config := loadConfig()

	// 2. Setup go2rtc.yaml
	setupGo2rtcConfig(config.RTSPUrl)

	// 3. Start go2rtc
	fmt.Println("[*] Starting go2rtc (Local Stream Server)...")
	cmdGo2rtc := exec.Command(fmt.Sprintf(".\\%s", go2rtcExe))
	cmdGo2rtc.Stdout = os.Stdout
	cmdGo2rtc.Stderr = os.Stderr
	err := cmdGo2rtc.Start()
	if err != nil {
		log.Fatalf("Failed to start go2rtc: %v. Please make sure go2rtc.exe is in the folder.", err)
	}
	defer func() {
		fmt.Println("[*] Stopping go2rtc...")
		cmdGo2rtc.Process.Kill()
	}()

	// Wait a bit for go2rtc to initialize
	time.Sleep(2 * time.Second)

	// 4. Start Cloudflare Tunnel
	fmt.Println("[*] Starting Cloudflare Tunnel...")
	cmdCf := exec.Command(fmt.Sprintf(".\\%s", cloudflaredExe), "tunnel", "--url", "http://127.0.0.1:1984")
	
	// Cloudflared logs to stderr
	cfStderr, err := cmdCf.StderrPipe()
	if err != nil {
		log.Fatalf("Failed to attach to cloudflared stderr: %v", err)
	}

	err = cmdCf.Start()
	if err != nil {
		log.Fatalf("Failed to start cloudflared: %v. Please make sure cloudflared.exe is in the folder.", err)
	}
	defer func() {
		fmt.Println("[*] Stopping cloudflared...")
		cmdCf.Process.Kill()
	}()

	// 5. Read cloudflared output to find the trycloudflare.com URL
	tunnelURL := ""
	urlRegex := regexp.MustCompile(`https://[a-zA-Z0-9-]+\.trycloudflare\.com`)
	
	go func() {
		scanner := bufio.NewScanner(cfStderr)
		for scanner.Scan() {
			line := scanner.Text()
			fmt.Println("[Cloudflared]", line) // Output for debugging
			if tunnelURL == "" {
				match := urlRegex.FindString(line)
				if match != "" {
					tunnelURL = match
					fmt.Println("\n======================================")
					fmt.Printf("[+] TUNNEL ESTABLISHED: %s\n", tunnelURL)
					fmt.Println("======================================\n")
					
					// 6. Send URL to Backend
					registerBridgeURL(config.UserID, tunnelURL)
				}
			}
		}
	}()

	// Wait for user to exit
	fmt.Println("[*] Press ENTER to stop the bridge...")
	bufio.NewReader(os.Stdin).ReadBytes('\n')
}

func loadConfig() Config {
	// Try to read config.json
	file, err := os.ReadFile("config.json")
	if err != nil {
		fmt.Println("[-] config.json not found. Creating a default one...")
		defaultConfig := Config{
			RTSPUrl: "rtsp://username:password@192.168.1.100:554/stream",
			UserID:  "test-user-123",
		}
		data, _ := json.MarshalIndent(defaultConfig, "", "  ")
		os.WriteFile("config.json", data, 0644)
		fmt.Println("[!] Please edit config.json with your actual Camera RTSP URL and restart the tool.")
		os.Exit(1)
	}

	var config Config
	json.Unmarshal(file, &config)
	if strings.Contains(config.RTSPUrl, "192.168.1.100") {
		fmt.Println("[!] Warning: You are using the default RTSP URL in config.json. Make sure this is correct.")
	}
	return config
}

func setupGo2rtcConfig(rtspURL string) {
	configStr := fmt.Sprintf(`streams:
  camera: %s
`, rtspURL)
	os.WriteFile(configFile, []byte(configStr), 0644)
}

func registerBridgeURL(userID, url string) {
	fmt.Println("[*] Registering tunnel URL with Backend API...")
	
	payload := map[string]string{
		"user_id": userID,
		"url":     url,
	}
	data, _ := json.Marshal(payload)
	
	resp, err := http.Post(backendURL, "application/json", bytes.NewBuffer(data))
	if err != nil {
		fmt.Printf("[-] Failed to register with backend: %v\n", err)
		return
	}
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode == 200 || resp.StatusCode == 201 {
		fmt.Println("[+] Registration successful!")
	} else {
		fmt.Printf("[-] Registration failed (Status %d): %s\n", resp.StatusCode, string(body))
	}
}

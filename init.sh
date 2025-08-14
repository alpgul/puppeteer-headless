#!/bin/bash

sleep 3
# Start Xvfb (X Virtual Framebuffer) in the background
Xvfb :0 -ac -screen 0 1920x1080x24 &

# AdGuard VPN login
adguardvpn-cli login -u "$ADGUARD_USERNAME" -p "$ADGUARD_PASSWORD"

# Configure AdGuard VPN settings
adguardvpn-cli config set-dns 1.1.1.1 set-crash-reporting off set-tun-routing-mode AUTO set-mode SOCKS set-socks-host 127.0.0.1 set-socks-port 1080

# Connect to AdGuard VPN (Germany location)
adguardvpn-cli connect -l DE -y

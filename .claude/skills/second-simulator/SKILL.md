---
name: second-simulator
description: Boot and open a second iOS simulator for testing multi-user features (family sharing, invites, etc.)
user_invocable: true
---

# Second Simulator

Boot a second iOS simulator (iPhone 17 Pro Max) alongside the already-running primary simulator. Opens Expo Go on it pointing at the local dev server.

## Steps

1. Check which simulators are currently booted
2. If iPhone 17 Pro Max is not already booted, boot it
3. Open the Simulator app for the second device
4. Open the Expo Go URL on the second simulator using `xcrun simctl openurl`

## Commands

```bash
# Boot the second simulator (iPhone 17 Pro Max)
xcrun simctl boot "iPhone 17 Pro Max" 2>/dev/null || true

# Open it in the Simulator app
open -a Simulator --args -CurrentDeviceUDID 74A1F2FE-31B6-496D-AA13-4C0CF0EA328E

# Give it a moment to fully open, then launch Expo Go
sleep 3
xcrun simctl openurl "iPhone 17 Pro Max" exp://192.168.4.36:8081
```

After running, the user will have two simulators:
- **iPhone 17 Pro** — primary account
- **iPhone 17 Pro Max** — second account for testing

Remind the user they can sign up with a different email on the second simulator to test family sharing features.

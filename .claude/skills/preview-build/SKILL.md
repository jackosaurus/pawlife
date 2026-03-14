---
name: preview-build
description: Build and deploy an iOS preview build to your phone via EAS
user_invocable: true
---

# iOS Preview Build

Run an EAS preview build for iOS so the user can install it on their phone.

## Steps

1. Run `eas build --profile preview --platform ios --non-interactive` to start the build.
2. The command will output a build URL on expo.dev — share that link with the user so they can monitor progress and install when ready.
3. If the build command fails, show the error and suggest fixes (e.g. login with `eas login`, register device with `eas device:create`).

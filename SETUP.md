# 🚀 NoteMate Setup Guide

Follow these steps to get NoteMate running on your machine.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Firebase

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

### Enable Authentication

1. In your Firebase project, go to **Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method
4. Click "Save"

### Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps"
4. Click the **Web** icon `</>`
5. Register your app with a nickname (e.g., "NoteMate Web")
6. Copy the `firebaseConfig` object values

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase credentials:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=notemate-xxxxx.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=notemate-xxxxx
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=notemate-xxxxx.appspot.com
   EXPO_PUBLIC_FIREBASE_SENDER_ID=123456789
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxx
   ```

## Step 4: Start Development Server

```bash
npx expo start
```

## Step 5: Run the App

Choose one of the following options:

### iOS Simulator (Mac only)
Press `i` in the terminal or scan the QR code with your iPhone

### Android Emulator
Press `a` in the terminal or scan the QR code with your Android device

### Web Browser (for testing)
Press `w` in the terminal

## 🎉 You're All Set!

You should now see the login screen. Try creating an account!

## Common Issues

### "Firebase not initialized" error
- Make sure `.env` file exists in the root directory
- Verify all Firebase credentials are correct
- Restart the development server: `Ctrl+C` then `npx expo start`

### "Unable to resolve module" errors
- Clear cache: `npx expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### TypeScript navigation errors
- These are expected for dynamic routes
- The app will still run correctly
- Routes will be typed after first build

## Next Steps

1. **Test Authentication**: Create an account and log in
2. **Upload a Video**: Try the video upload feature (note: processing is simulated)
3. **Explore Chat**: Interact with the AI chat interface
4. **Customize Theme**: Edit `src/theme/light.ts` and `src/theme/dark.ts`

## Need Help?

Check the main [README.md](./README.md) for detailed documentation.

---

Happy coding! 🎉

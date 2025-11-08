# ⚡ Quick Start - NoteMate

Get NoteMate running in 5 minutes!

## 1. Install Dependencies (1 min)
```bash
npm install
```

## 2. Firebase Setup (3 min)

### A. Create Firebase Project
1. Visit: https://console.firebase.google.com
2. Click "Add project" → Enter "NoteMate" → Continue
3. Disable Google Analytics (optional) → Create project

### B. Enable Authentication
1. Click "Authentication" → "Get started"
2. Select "Email/Password" → Enable → Save

### C. Get Configuration
1. Click gear icon ⚙️ → "Project settings"
2. Scroll to "Your apps" → Click Web icon `</>`
3. Nickname: "NoteMate" → Register app
4. Copy the config values (don't close this page!)

## 3. Configure Environment (1 min)

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and paste your Firebase values:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=notemate-xxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=notemate-xxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=notemate-xxx.appspot.com
EXPO_PUBLIC_FIREBASE_SENDER_ID=1234567890
EXPO_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abc123
```

## 4. Start App (30 sec)
```bash
npx expo start
```

Press:
- `i` for iOS Simulator
- `a` for Android Emulator
- Scan QR with Expo Go app

## 5. Test It! ✅

1. You should see the **Login screen**
2. Click "Sign up" → Create an account
3. You'll be redirected to **New Chat**
4. Click "Upload Video" → Select any video
5. Watch the progress animation
6. Start chatting!

## 🎉 You're Done!

NoteMate is now running with:
- ✅ Firebase Authentication
- ✅ Beautiful UI
- ✅ Complete navigation
- ✅ All screens working

## Need Help?

- **Detailed setup**: See [SETUP.md](./SETUP.md)
- **Full docs**: See [README.md](./README.md)
- **Implementation**: See [IMPLEMENTATION.md](./IMPLEMENTATION.md)

---

**Tip**: The video processing and AI chat are currently simulated. See IMPLEMENTATION.md for backend integration TODOs.

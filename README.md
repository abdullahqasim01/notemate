# 📘 NoteMate - AI-Powered Video Note Extractor

A modern React Native application built with Expo that extracts notes from videos and provides an AI-powered chat interface for interactive learning.

## 🎯 Features

- **Firebase Authentication**: Email/password login, signup, and password reset
- **Video Upload**: Upload videos for note extraction
- **AI Chat Interface**: ChatGPT-style conversation about video content
- **Dark/Light Theme**: Beautiful ChatGPT-inspired theming
- **Drawer Navigation**: Easy access to chat history and settings
- **User Profile Management**: Update profile, change password, and preferences

## 🛠️ Tech Stack

- **Framework**: Expo SDK 54+
- **Language**: TypeScript
- **Routing**: Expo Router v3
- **UI Kit**: React Native Paper (Material Design 3)
- **Authentication**: Firebase Auth v10+
- **File Handling**: expo-document-picker, expo-av, expo-image-picker
- **Navigation**: React Navigation Drawer

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio
- Firebase project with Authentication enabled

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Firebase credentials from [Firebase Console](https://console.firebase.google.com):
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   EXPO_PUBLIC_FIREBASE_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. **Enable Firebase Authentication**
   - Go to Firebase Console > Authentication
   - Enable **Email/Password** sign-in method

4. **Start the app**
   ```bash
   npx expo start
   ```

5. **Run on device**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app

## 📁 Project Structure

```
app/
├── (auth)/              # Authentication screens
│   ├── login.tsx
│   ├── signup.tsx
│   └── forgot-password.tsx
├── (main)/              # Main app screens
│   ├── _layout.tsx      # Drawer navigation
│   ├── new-chat.tsx
│   ├── generating.tsx
│   ├── chat/[id].tsx
│   └── settings.tsx
├── _layout.tsx          # Root layout
└── index.tsx            # Auth redirect

src/
├── components/          # Reusable components
├── hooks/               # Custom hooks
├── lib/                 # Firebase config
├── theme/               # Theme colors
└── types/               # TypeScript types
```

## 🎨 Theme

ChatGPT-inspired color scheme with light/dark modes:

- **Light**: White background, ChatGPT green (`#10A37F`)
- **Dark**: Dark background (`#121212`), ChatGPT green

## 📱 Screens

1. **Login/Signup** - Firebase authentication
2. **New Chat** - Upload video to start
3. **Generating** - Progress indicator
4. **Chat** - AI conversation interface
5. **Settings** - Profile and preferences

## 🔧 TODO Items

The following features require backend integration:

- [ ] Google OAuth login
- [ ] Video to text extraction API
- [ ] AI chat backend
- [ ] Firestore chat history
- [ ] Cloud storage for videos
- [ ] Push notifications

## 🐛 Troubleshooting

**Firebase errors**: Ensure `.env` file exists with valid credentials

**Navigation types**: Some routes may need `as any` casting until types are generated

**Drawer not working**: Restart app after installing gesture-handler

## 📄 License

MIT License

---

Built with ❤️ using Expo and React Native

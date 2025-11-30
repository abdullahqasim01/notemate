# NoteMate App - Complete Flow Documentation

## 📱 Application Overview

NoteMate is a React Native app that allows users to upload videos, automatically extract notes using AI, and have text-based conversations about the content.

**Tech Stack:**
- **Frontend:** Expo SDK 54, React Native, TypeScript
- **Authentication:** Firebase (Email/Password)
- **Backend:** NestJS (REST API)
- **File Storage:** UploadThings
- **Video Processing:** FFmpeg (client-side video → audio conversion)

---

## 🔐 Authentication Flow

### 1. Signup
**Screen:** `app/(auth)/signup.tsx`

**Flow:**
```
User enters: name, email, password
  ↓
Firebase: createUserWithEmailAndPassword()
  ↓
Firebase: updateProfile(displayName: name)
  ↓
Navigate to: /(main)/new-chat
```

**Firebase Methods Used:**
- `createUserWithEmailAndPassword(auth, email, password)`
- `updateProfile(user, { displayName })`

**No Backend Endpoints** - Firebase handles authentication independently

---

### 2. Login
**Screen:** `app/(auth)/login.tsx`

**Flow:**
```
User enters: email, password
  ↓
Firebase: signInWithEmailAndPassword()
  ↓
IF success → Navigate to: /(main)/new-chat
IF error → Show error message
```

**Firebase Methods Used:**
- `signInWithEmailAndPassword(auth, email, password)`

**No Backend Endpoints**

---

### 3. Forgot Password
**Screen:** `app/(auth)/forgot-password.tsx`

**Flow:**
```
User enters: email
  ↓
Firebase: sendPasswordResetEmail()
  ↓
Show success message
```

**Firebase Methods Used:**
- `sendPasswordResetEmail(auth, email)`

**No Backend Endpoints**

---

### 4. Logout
**Screen:** `app/(main)/settings.tsx`

**Flow:**
```
User clicks "Logout"
  ↓
Firebase: signOut()
  ↓
Navigate to: /login
```

**Firebase Methods Used:**
- `signOut(auth)`

**No Backend Endpoints**

---

## 🎬 Video Upload & Note Generation Flow

### Step-by-Step Process

#### **Step 1: User Selects Video**
**Screen:** `app/(main)/new-chat.tsx`

**Flow:**
```
User clicks "Upload Video"
  ↓
Open document picker (type: video/*)
  ↓
User selects video file
  ↓
Call Backend: POST /chats
  ↓
Navigate to: /(main)/generating with {chatId, videoUri}
```

**Backend Endpoint:**
```typescript
POST /chats
Headers: {
  Authorization: "Bearer {firebase-id-token}"
}
Body: {} // Empty body

Response: {
  chatId: string
}

Status Codes:
- 201: Chat created successfully
- 401: Unauthorized (invalid/missing token)
- 500: Server error
```

---

#### **Step 2: Processing Screen**
**Screen:** `app/(main)/generating.tsx`

**Complete Flow:**

```
1. Create Chat (10%)
   ↓
   POST /chats
   ↓
   Get chatId

2. Convert Video to Audio (20%)
   ↓
   FFmpeg: video → audio (client-side)
   ↓
   Save as .m4a in cache directory

3. Get Upload URL (25%)
   ↓
   POST /uploads/sign-url?type=audio&chatId={chatId}
   ↓
   Get {uploadUrl, publicUrl}

4. Upload Audio (35%)
   ↓
   PUT audio file to uploadUrl (UploadThings)
   ↓
   Get publicUrl (audio location)

5. Notify Backend (40%)
   ↓
   POST /chats/{chatId}/process-audio
   Body: {audioUrl}
   ↓
   Backend starts processing

6. Poll for Status (40-100%)
   ↓
   GET /chats/{chatId} (every 5 seconds)
   ↓
   Check chat.status:
   - "processing" → 40%
   - "transcribing" → 60%
   - "generating_notes" → 80%
   - "completed" → 100%
   ↓
   Navigate to: /(main)/chat/{chatId}
```

**Backend Endpoints:**

##### 1️⃣ Get Signed Upload URL
```typescript
POST /uploads/sign-url?type=audio&chatId={chatId}
Headers: {
  Authorization: "Bearer {firebase-id-token}"
}
Query Params: {
  type: "audio" | "transcription" | "notes" | "video"
  chatId?: string
}

Response: {
  uploadUrl: string,      // Pre-signed UploadThings URL for PUT
  fileKey: string,        // Unique file identifier
  publicUrl: string       // Public URL to access the file after upload
}

Status Codes:
- 200: Success
- 401: Unauthorized
- 400: Invalid parameters
- 500: Server error
```

##### 2️⃣ Process Audio (Trigger AI Processing)
```typescript
POST /chats/{chatId}/process-audio
Headers: {
  Authorization: "Bearer {firebase-id-token}"
}
Body: {
  audioUrl: string  // Public URL from UploadThings
}

Response: {
  success: boolean,
  message?: string
}

Backend Should:
1. Save audioUrl to chat record
2. Set chat.status = "processing"
3. Trigger background job to:
   - Transcribe audio → text (Whisper AI or similar)
   - Generate notes from transcription (GPT or similar)
   - Update chat.status throughout:
     * "transcribing" (during audio → text)
     * "generating_notes" (during text → notes)
     * "completed" (when done)
   - Save transcription and notes URLs to chat
4. Return immediately (don't wait for processing)

Status Codes:
- 200: Processing started
- 401: Unauthorized
- 404: Chat not found
- 400: Invalid audioUrl
- 500: Server error
```

##### 3️⃣ Get Chat Details (Polling)
```typescript
GET /chats/{chatId}
Headers: {
  Authorization: "Bearer {firebase-id-token}"
}

Response: {
  id: string,
  userId: string,
  title?: string,
  videoUrl?: string,
  transcriptionUrl?: string,  // URL to transcription text file
  notesUrl?: string,          // URL to notes text/markdown file
  status?: "processing" | "transcribing" | "generating_notes" | "completed" | "failed",
  createdAt: string,          // ISO date
  updatedAt: string           // ISO date
}

Status Codes:
- 200: Success
- 401: Unauthorized
- 404: Chat not found
- 500: Server error
```

---

## 💬 Chat Conversation Flow

### Opening a Chat
**Screen:** `app/(main)/chat/[id].tsx`

**Flow:**
```
User navigates to /chat/{id}
  ↓
Load chat details: GET /chats/{id}
  ↓
Load messages: GET /chats/{id}/messages
  ↓
IF notesUrl exists → Fetch notes from URL
  ↓
Display chat UI with messages and notes
```

**Backend Endpoints:**

##### 1️⃣ Get Messages
```typescript
GET /chats/{chatId}/messages
Headers: {
  Authorization: "Bearer {firebase-id-token}"
}

Response: Message[]

Message Type: {
  id: string,
  chatId: string,
  role: "user" | "assistant",
  content: string,
  createdAt: string  // ISO date
}

Status Codes:
- 200: Success
- 401: Unauthorized
- 404: Chat not found
- 500: Server error
```

---

### Sending a Message
**Screen:** `app/(main)/chat/[id].tsx`

**Flow:**
```
User types message
  ↓
User clicks send
  ↓
POST /chats/{chatId}/messages
Body: {content: "user message"}
  ↓
Backend:
  - Saves user message
  - Generates AI response using chat context + notes
  - Returns both messages
  ↓
Display both messages in UI
```

**Backend Endpoint:**

```typescript
POST /chats/{chatId}/messages
Headers: {
  Authorization: "Bearer {firebase-id-token}"
}
Body: {
  content: string  // User's message text
}

Response: {
  userMessage: {
    id: string,
    chatId: string,
    role: "user",
    content: string,      // User's message
    createdAt: string
  },
  aiMessage: {
    id: string,
    chatId: string,
    role: "assistant",
    content: string,      // AI's response
    createdAt: string
  }
}

Backend Should:
1. Save user's message to database
2. Generate AI response using:
   - Chat history
   - Extracted notes from video
   - User's question
3. Save AI message to database
4. Return both messages

Status Codes:
- 201: Messages created
- 401: Unauthorized
- 404: Chat not found
- 400: Empty/invalid content
- 500: Server error
```

---

## 📚 Chat History (Sidebar)

### Loading Chat History
**Screen:** `app/(main)/_layout.tsx` (Drawer)

**Flow:**
```
Drawer opens
  ↓
Get Firebase ID token
  ↓
GET /chats/history?token={firebase-token}
  ↓
Display list of chats in sidebar
```

**Backend Endpoint:**

```typescript
GET /chats/history?token={firebase-id-token}
Headers: {
  Authorization: "Bearer {firebase-id-token}"
}
Query Params: {
  token: string  // Firebase ID token for user identification
}

Response: ChatHistoryItem[]

ChatHistoryItem Type: {
  id: string,
  title: string
}

Backend Should:
1. Verify Firebase token
2. Extract userId from token
3. Query all chats for this user
4. Return simplified list (id + title)
5. Sort by most recent first

Status Codes:
- 200: Success
- 401: Unauthorized (invalid token)
- 500: Server error
```

---

## 🔄 Complete Endpoint Summary

### Required Backend Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| `POST` | `/chats` | Create new chat | ✅ Firebase |
| `GET` | `/chats/history` | Get user's chat list | ✅ Firebase |
| `GET` | `/chats/{id}` | Get chat details | ✅ Firebase |
| `POST` | `/chats/{id}/process-audio` | Start audio processing | ✅ Firebase |
| `GET` | `/chats/{id}/messages` | Get chat messages | ✅ Firebase |
| `POST` | `/chats/{id}/messages` | Send message & get AI reply | ✅ Firebase |
| `POST` | `/uploads/sign-url` | Get UploadThings signed URL | ✅ Firebase |

---

## 📦 TypeScript Types Reference

### Request Types
```typescript
// Empty - just creates chat
interface CreateChatRequest {}

// Process uploaded audio
interface ProcessAudioRequest {
  audioUrl: string;
}

// Send message
interface SendMessageRequest {
  content: string;
}

// Get signed upload URL
interface SignedUrlRequest {
  type: 'transcription' | 'notes' | 'audio' | 'video';
  chatId?: string;
}
```

### Response Types
```typescript
interface CreateChatResponse {
  chatId: string;
}

interface ProcessAudioResponse {
  success: boolean;
  message?: string;
}

interface Chat {
  id: string;
  userId: string;
  title?: string;
  videoUrl?: string;
  transcriptionUrl?: string;
  notesUrl?: string;
  status?: 'processing' | 'transcribing' | 'generating_notes' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

interface ChatHistoryItem {
  id: string;
  title: string;
}

interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface SendMessageResponse {
  userMessage: Message;
  aiMessage: Message;
}

interface SignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}
```

---

## 🔐 Authentication & Authorization

### Firebase Token Usage
All backend endpoints require Firebase authentication. The frontend:
1. Gets Firebase ID token: `await firebaseUser.getIdToken()`
2. Sends in header: `Authorization: Bearer {token}`

### Backend Verification
Backend must:
1. Verify Firebase token using Firebase Admin SDK
2. Extract `userId` from verified token
3. Use `userId` for database queries
4. Return 401 if token is invalid/expired

---

## 🎯 Backend Processing Requirements

### Audio Processing Pipeline
When `POST /chats/{id}/process-audio` is called:

```
1. Receive audioUrl
   ↓
2. Update chat: status = "processing"
   ↓
3. Download audio from UploadThings
   ↓
4. Update chat: status = "transcribing"
   ↓
5. Transcribe audio → text (Whisper AI)
   ↓
6. Save transcription to UploadThings
   ↓
7. Update chat: transcriptionUrl, status = "generating_notes"
   ↓
8. Generate notes from transcription (GPT)
   ↓
9. Save notes to UploadThings
   ↓
10. Update chat: notesUrl, status = "completed"
```

### AI Chat Response
When `POST /chats/{id}/messages` is called:

```
1. Save user message to database
   ↓
2. Retrieve:
   - Chat history (previous messages)
   - Extracted notes (from notesUrl)
   ↓
3. Build prompt for AI:
   - System: "You are a helpful assistant with access to video notes"
   - Context: Include notes
   - History: Include previous messages
   - User: Current question
   ↓
4. Generate AI response (GPT)
   ↓
5. Save AI message to database
   ↓
6. Return both messages
```

---

## ⚙️ Environment Variables

### Frontend (.env)
```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Backend API
EXPO_PUBLIC_API_URL=http://localhost:3000  # or your deployed URL
```

### Backend (.env)
```bash
# Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# UploadThings
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_app_id

# AI Services
OPENAI_API_KEY=your_openai_key  # For GPT
WHISPER_API_KEY=your_whisper_key  # For transcription

# Database
DATABASE_URL=your_database_url
```

---

## 🐛 Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Resource created
- `400` - Bad request (invalid input)
- `401` - Unauthorized (invalid/missing Firebase token)
- `404` - Resource not found
- `500` - Server error

### Frontend Error Display
- Network errors → Show "Connection failed" message
- 401 errors → Logout and redirect to login
- 404 errors → Show "Chat not found"
- 500 errors → Show "Server error, please try again"

---

## 📊 Database Schema Suggestion

### Users Table
```typescript
{
  id: string,              // Firebase UID
  email: string,
  name: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Chats Table
```typescript
{
  id: string,              // UUID
  userId: string,          // Foreign key to Users
  title: string,
  videoUrl: string,
  audioUrl: string,
  transcriptionUrl: string,
  notesUrl: string,
  status: string,          // processing, transcribing, generating_notes, completed, failed
  createdAt: Date,
  updatedAt: Date
}
```

### Messages Table
```typescript
{
  id: string,              // UUID
  chatId: string,          // Foreign key to Chats
  role: string,            // user, assistant
  content: text,
  createdAt: Date
}
```

---

## 🚀 Testing Checklist

- [ ] Signup new account
- [ ] Login with credentials
- [ ] Upload video file
- [ ] Verify FFmpeg conversion (video → audio)
- [ ] Verify audio upload to UploadThings
- [ ] Verify `/process-audio` call
- [ ] Monitor polling requests to `/chats/{id}`
- [ ] Verify status changes (processing → transcribing → generating_notes → completed)
- [ ] Navigate to chat screen when complete
- [ ] View generated notes
- [ ] Send text message
- [ ] Receive AI response
- [ ] Verify chat appears in sidebar
- [ ] Logout and login again
- [ ] Verify chat persistence

---

## 📝 Notes

1. **Client-side FFmpeg** - Video to audio conversion happens on the device, reducing backend processing
2. **Firebase Auth Only** - Backend doesn't store passwords, only verifies Firebase tokens
3. **UploadThings** - All files (audio, transcription, notes) stored in UploadThings, not on backend server
4. **Polling** - Frontend polls every 5 seconds for max 5 minutes (60 attempts)
5. **Text-only Chat** - No voice messages, only text input/output
6. **Background Processing** - Audio processing should be async/background job, not blocking the endpoint

---

## 🎨 UI Flow Diagram

```
┌─────────────┐
│   Signup    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Login    │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│  New Chat   │─────▶│  Generating  │
│ (Upload)    │      │   (Progress) │
└─────────────┘      └──────┬───────┘
                            │
                            ▼
       ┌────────────────────┴────────────────────┐
       │                                         │
       ▼                                         ▼
┌─────────────┐                          ┌─────────────┐
│    Chat     │                          │   Sidebar   │
│ (Messages)  │◀─────────────────────────│  (History)  │
└─────────────┘                          └─────────────┘
       │
       ▼
┌─────────────┐
│  Settings   │
│  (Logout)   │
└─────────────┘
```

---

**End of Documentation**

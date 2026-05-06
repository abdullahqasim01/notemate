# NoteMate — Product Requirements Document

## 1. Overview

NoteMate is a React Native mobile app that lets users upload videos, automatically extract structured notes using AI, and have text-based conversations about the video content.

**Platform:** iOS & Android (Expo SDK 54)  
**Auth:** Firebase (Email/Password)  
**Backend:** NestJS REST API (`https://notemate-backend.onrender.com`)  
**Storage:** Filebase (S3-compatible)  
**Video Processing:** FFmpeg (client-side, video → audio)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54, React Native 0.81.5, React 19 |
| Language | TypeScript (strict mode) |
| Navigation | Expo Router v6 (file-based), React Navigation Drawer |
| UI Library | React Native Paper (Material Design 3) |
| Auth | Firebase v12 (Email/Password) |
| HTTP Client | Axios (30s timeout) |
| Video Processing | `@palashakhenia/ffmpeg-kit-react-native-sf` |
| File Picker | `expo-document-picker` |
| File System | `expo-file-system` |
| Markdown | `react-native-markdown-display` |
| Storage | `expo-secure-store`, `@react-native-async-storage/async-storage` |
| State | React Context API |

---

## 3. Environment Variables

### Frontend (`.env`)
```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
EXPO_PUBLIC_API_URL=https://notemate-backend.onrender.com
```

### Backend (`.env`)
```
FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY
FIREBASE_CLIENT_EMAIL
FILEBASE_ACCESS_KEY_ID
FILEBASE_SECRET_ACCESS_KEY
FILEBASE_BUCKET_NAME
OPENAI_API_KEY
DATABASE_URL
```

---

## 4. Navigation Structure

```
app/
├── index.tsx                  → Auth redirect (→ /login or /new-chat)
├── (auth)/
│   ├── login.tsx
│   ├── signup.tsx
│   └── forgot-password.tsx
└── (main)/                    → Drawer navigator
    ├── new-chat.tsx
    ├── chat/[id].tsx
    └── settings.tsx
```

**Provider stack (root `_layout.tsx`):**  
`SafeAreaProvider` → `AuthProvider` → `ChatProvider` → `BackgroundJobProvider` → `ThemeProvider` → `PaperProvider`

---

## 5. Screens & Layout

### 5.1 Login (`/login`)
- Email text input
- Password input with show/hide toggle
- "Forgot Password?" link → `/forgot-password`
- Login button
- "Sign up" link → `/signup`
- Error snackbar on failure

### 5.2 Signup (`/signup`)
- Full name input
- Email input
- Password input with show/hide toggle
- Confirm password input with show/hide toggle
- Signup button
- "Login" link → `/login`
- Error snackbar for validation/signup errors

### 5.3 Forgot Password (`/forgot-password`)
- Back button
- Email input
- "Send Reset Link" button
- "Remember your password?" link → `/login`
- Success/error snackbars

### 5.4 New Chat (`/new-chat`)
- Empty state: video emoji icon + "Upload a video to start" heading
- "Upload Video" button (opens document picker, `type: video/*`)
- Warning banner if a background job is already running
- Error message display
- "Go to Processing Chat" button if a job is active

### 5.5 Chat (`/chat/[id]`)
Three conditional states:

**Processing state** (status: `processing` | `transcribing` | `generating_notes`):
- "Generating Notes..." heading
- `GenerationSteps` component showing 5-step progress

**Failed state** (status: `failed` | `error`):
- Error message
- "Delete Chat" button

**Chat state** (status: `completed` | `done`):
- Header with "Notes" button
- `FlatList` of `ChatBubble` components
- Text input + send button
- Notes modal (markdown viewer, triggered by header button)

### 5.6 Settings (`/settings`)
- Profile section: avatar, display name, email (read-only)
- "Change Photo" button
- "Update Profile" button
- Password section: new password + confirm password fields
- "Change Password" button
- Preferences: theme selector (Light / Dark / System)
- Logout button

### 5.7 Drawer (sidebar, all main screens)
- "NoteMate" title header
- "New Chat" button → `/new-chat`
- "Recent Chats" list (from `/chats/history`)
  - Each item navigates to `/chat/[id]`
  - Long-press or menu → delete chat
- Settings link → `/settings`
- Logout link
- Refresh button

---

## 6. Components

### `ChatBubble`
- Props: `message: Message`
- User messages: right-aligned, light background
- AI messages: left-aligned, darker background, markdown rendered
- Avatars: user icon (user), robot icon (AI)

### `GenerationSteps`
- Props: `status: string, progress: number`
- 5 steps: Converting → Uploading → Transcribing → Generating Notes → Done
- Completed steps: checkmark icon
- Active step: spinner
- Pending steps: empty circle

### `ProgressBar`
- Props: `progress: number, label?: string, color?: string`
- Shows percentage text
- Used in notes modal while loading

---

## 7. State Management (Contexts)

### `AuthContext`
| State | Type | Description |
|---|---|---|
| `user` | `User \| null` | App user object |
| `firebaseUser` | `FirebaseUser \| null` | Raw Firebase user |
| `loading` | `boolean` | Auth state loading |

Methods: `login()`, `signup()`, `logout()`, `refreshUser()`, `resetPassword()`

### `ChatContext`
| State | Type | Description |
|---|---|---|
| `chats` | `ChatHistoryItem[]` | Sidebar chat list |
| `currentChatId` | `string \| null` | Active chat ID |
| `currentChat` | `Chat \| null` | Active chat details |
| `messages` | `Message[]` | Messages for active chat |
| `notes` | `string \| null` | Markdown notes content |
| `loading` | `boolean` | Loading state |
| `sending` | `boolean` | Message send in progress |

Methods: `refreshChats()`, `createChat()`, `loadChat()`, `loadMessages()`, `addMessage()`, `deleteChat()`, `clearChat()`

### `BackgroundJobContext`
| State | Type | Description |
|---|---|---|
| `jobs` | `Record<string, JobStatus>` | All active/recent jobs |
| `activeJobs` | `number` | Count of running jobs |

Methods: `startJob()`, `retryJob()`, `cancelJob()`, `cleanupJob()`

Job lifecycle: `queued` → `converting` → `uploading` → `processing` → `completed` / `failed`  
Polls backend every **5 seconds**, max **10 minutes** (120 attempts).

### `ThemeContext`
| State | Type | Description |
|---|---|---|
| `themeMode` | `'light' \| 'dark' \| 'system'` | User preference |
| `isDarkMode` | `boolean` | Resolved dark mode flag |

Persists to `AsyncStorage`. Respects system color scheme when set to `'system'`.

---

## 8. API Reference

Base URL: `https://notemate-backend.onrender.com`  
All endpoints require: `Authorization: Bearer {firebase-id-token}`

---

### 8.1 Create Chat

```
POST /chats
```

**Headers:**
```
Authorization: Bearer {firebase-id-token}
```

**Body:** _(empty)_

**Response `201`:**
```json
{
  "chatId": "string"
}
```

**Error codes:** `401`, `500`

---

### 8.2 Get Chat History

```
GET /chats/history
```

**Headers:**
```
Authorization: Bearer {firebase-id-token}
```

**Query params:**
```
token={firebase-id-token}
```

**Response `200`:**
```json
[
  { "id": "string", "title": "string" }
]
```

Sorted by most recent first.  
**Error codes:** `401`, `500`

---

### 8.3 Get Chat Details

```
GET /chats/{chatId}
```

**Headers:**
```
Authorization: Bearer {firebase-id-token}
```

**Response `200`:**
```json
{
  "id": "string",
  "userId": "string",
  "title": "string",
  "videoUrl": "string",
  "transcriptionUrl": "string",
  "notesUrl": "string",
  "status": "processing | transcribing | generating_notes | completed | done | failed | error",
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}
```

**Error codes:** `401`, `404`, `500`

---

### 8.4 Delete Chat

```
DELETE /chats/{chatId}
```

**Headers:**
```
Authorization: Bearer {firebase-id-token}
```

**Response `200`:**
```json
{ "message": "string" }
```

**Error codes:** `401`, `404`, `500`

---

### 8.5 Get Signed Upload URL

```
POST /uploads/sign-url?type=audio&chatId={chatId}
```

**Headers:**
```
Authorization: Bearer {firebase-id-token}
```

**Query params:**
```
type: "audio" | "transcription" | "notes" | "video"
chatId: string (optional)
```

**Response `200`:**
```json
{
  "uploadUrl": "string",
  "fileKey": "string",
  "publicUrl": "string"
}
```

`uploadUrl` is a pre-signed Filebase S3 URL for a direct `PUT` request.  
**Error codes:** `400`, `401`, `500`

---

### 8.6 Upload Audio to Filebase (Direct S3 PUT)

```
PUT {uploadUrl}
```

**Headers:**
```
Content-Type: audio/mp4
```

**Body:** Raw audio file blob (`.m4a`)

This call goes directly to Filebase, not the NestJS backend.

---

### 8.7 Trigger Audio Processing

```
POST /chats/{chatId}/process-audio
```

**Headers:**
```
Authorization: Bearer {firebase-id-token}
```

**Body:**
```json
{
  "fileKey": "string"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "string"
}
```

Backend starts an async job:
1. Sets `status = "processing"`
2. Downloads audio from Filebase
3. Sets `status = "transcribing"` → transcribes with Whisper
4. Sets `status = "generating_notes"` → generates notes with GPT
5. Saves `transcriptionUrl` and `notesUrl` to chat
6. Sets `status = "completed"`

Returns immediately (non-blocking).  
**Error codes:** `400`, `401`, `404`, `500`

---

### 8.8 Get Messages

```
GET /chats/{chatId}/messages
```

**Headers:**
```
Authorization: Bearer {firebase-id-token}
```

**Response `200`:**
```json
[
  {
    "id": "string",
    "chatId": "string",
    "role": "user | assistant",
    "text": "string",
    "createdAt": "ISO date string | { _seconds: number, _nanoseconds: number }"
  }
]
```

**Error codes:** `401`, `404`, `500`

---

### 8.9 Send Message

```
POST /chats/{chatId}/messages
```

**Headers:**
```
Authorization: Bearer {firebase-id-token}
```

**Body:**
```json
{
  "text": "string"
}
```

**Response `201`:**
```json
{
  "userMessage": {
    "id": "string",
    "chatId": "string",
    "role": "user",
    "text": "string",
    "createdAt": "ISO date string"
  },
  "aiMessage": {
    "id": "string",
    "chatId": "string",
    "role": "assistant",
    "text": "string",
    "createdAt": "ISO date string"
  }
}
```

Backend builds AI prompt from: system instruction + extracted notes + chat history + user message.  
**Error codes:** `400`, `401`, `404`, `500`

---

### 8.10 Get Notes Download URL

```
GET /chats/{chatId}/notes/download
```

**Headers:**
```
Authorization: Bearer {firebase-id-token}
```

**Response `200`:**
```json
{
  "downloadUrl": "string"
}
```

Frontend fetches the markdown notes content from `downloadUrl` directly.  
**Error codes:** `401`, `404`, `500`

---

## 9. Complete Endpoint Summary

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `POST` | `/chats` | Create new chat | Firebase |
| `GET` | `/chats/history` | Get user's chat list | Firebase |
| `GET` | `/chats/{id}` | Get chat details + status | Firebase |
| `DELETE` | `/chats/{id}` | Delete a chat | Firebase |
| `POST` | `/chats/{id}/process-audio` | Trigger AI processing | Firebase |
| `GET` | `/chats/{id}/messages` | Get all messages | Firebase |
| `POST` | `/chats/{id}/messages` | Send message, get AI reply | Firebase |
| `POST` | `/uploads/sign-url` | Get Filebase pre-signed URL | Firebase |
| `GET` | `/chats/{id}/notes/download` | Get notes download URL | Firebase |
| `PUT` | `{uploadUrl}` (Filebase) | Upload audio file directly | Pre-signed URL |

---

## 10. Core User Flows

### 10.1 Authentication

**Signup:**
1. User enters name, email, password
2. `createUserWithEmailAndPassword(auth, email, password)`
3. `updateProfile(user, { displayName: name })`
4. Navigate to `/new-chat`

**Login:**
1. User enters email, password
2. `signInWithEmailAndPassword(auth, email, password)`
3. Navigate to `/new-chat`

**Forgot Password:**
1. User enters email
2. `sendPasswordResetEmail(auth, email)`
3. Show success message

**Logout:**
1. `signOut(auth)`
2. Navigate to `/login`

---

### 10.2 Video Upload & Note Generation

```
1. User taps "Upload Video"
   → expo-document-picker opens (type: video/*)

2. POST /chats  →  get chatId

3. Navigate to /chat/{chatId}  (shows processing UI)

4. BackgroundJobContext starts job:
   a. FFmpeg: convert video → .m4a audio  (progress: converting)
   b. POST /uploads/sign-url  →  get uploadUrl + fileKey  (progress: uploading)
   c. PUT {uploadUrl}  →  upload audio to Filebase  (progress: uploading)
   d. POST /chats/{chatId}/process-audio  { fileKey }  (progress: processing)
   e. Poll GET /chats/{chatId} every 5s:
      - "processing"        → step 3/5 active
      - "transcribing"      → step 4/5 active
      - "generating_notes"  → step 5/5 active
      - "completed"         → job done, load chat
      - "failed"            → show error state
```

Polling: every 5 seconds, max 10 minutes (120 attempts).

---

### 10.3 Chat Conversation

```
1. Chat loads: GET /chats/{id}  +  GET /chats/{id}/messages
2. If notesUrl exists: GET /chats/{id}/notes/download → fetch markdown
3. User types message → POST /chats/{id}/messages { text }
4. Optimistic UI: show user message immediately
5. Response arrives: append aiMessage to list
```

---

### 10.4 Notes Viewing

1. User taps "Notes" button in chat header
2. Modal opens, fetches notes via `GET /chats/{id}/notes/download`
3. Renders markdown content with `react-native-markdown-display`

---

## 11. Data Models

### `Chat`
```typescript
interface Chat {
  id: string;
  userId: string;
  title?: string;
  videoUrl?: string;
  transcriptionUrl?: string;
  notesUrl?: string;
  status?: 'processing' | 'transcribing' | 'generating_notes' | 'completed' | 'done' | 'failed' | 'error';
  createdAt: string;
  updatedAt: string;
}
```

### `Message`
```typescript
interface Message {
  id: string;
  chatId?: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string | { _seconds: number; _nanoseconds: number };
}
```

### `ChatHistoryItem`
```typescript
interface ChatHistoryItem {
  id: string;
  title: string;
}
```

### `JobStatus`
```typescript
interface JobStatus {
  chatId: string;
  status: 'queued' | 'converting' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string | null;
  videoUri?: string;
}
```

### `SignedUrlResponse`
```typescript
interface SignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}
```

---

## 12. Error Handling

| HTTP Code | Meaning | Frontend Behavior |
|---|---|---|
| `200` | Success | Normal flow |
| `201` | Created | Normal flow |
| `400` | Bad request | Show validation error |
| `401` | Unauthorized | Logout + redirect to `/login` |
| `404` | Not found | Show "Chat not found" |
| `500` | Server error | Show "Server error, try again" |

Network errors show "Connection failed" message.

---

## 13. Theme System

- Three modes: `light`, `dark`, `system`
- Persisted to `AsyncStorage`
- `system` mode follows device color scheme via `useColorScheme()`
- Applied via React Native Paper `PaperProvider` with custom theme tokens
- Theme files: `src/theme/light.ts`, `src/theme/dark.ts`

---

## 14. Database Schema

### Users
```
id          string   (Firebase UID)
email       string
name        string
createdAt   Date
updatedAt   Date
```

### Chats
```
id                string   (UUID)
userId            string   (FK → Users)
title             string
audioUrl          string
transcriptionUrl  string
notesUrl          string
status            string   (processing | transcribing | generating_notes | completed | failed)
createdAt         Date
updatedAt         Date
```

### Messages
```
id        string   (UUID)
chatId    string   (FK → Chats)
role      string   (user | assistant)
content   text
createdAt Date
```

---

## 15. Key Constraints & Notes

1. **Client-side FFmpeg** — video → audio conversion runs on-device; reduces backend load
2. **Firebase auth only** — backend never stores passwords; verifies Firebase ID tokens via Admin SDK
3. **Filebase for all files** — audio, transcription, and notes stored in Filebase, not on the backend server
4. **Async processing** — `POST /process-audio` returns immediately; backend runs the pipeline as a background job
5. **Polling** — frontend polls `GET /chats/{id}` every 5s for up to 10 minutes
6. **Text-only chat** — no voice input/output; text messages only
7. **Portrait orientation only**
8. **iOS bundle ID / Android package:** `com.notemate.app`

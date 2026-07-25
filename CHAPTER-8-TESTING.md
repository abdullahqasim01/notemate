# Chapter 8: TESTING

**Deadline:** April 15th, 2026

---

## Overall Testing According to the Project

NoteMate is a mobile application (Expo React Native frontend + NestJS backend) that allows users to upload lecture videos, auto-generate notes via AI (AssemblyAI + Gemini), and interact with those notes through a chat interface.

Testing was performed across both the **frontend** (React Native / Expo) and the **backend** (NestJS REST API) to verify that all features work correctly end-to-end.

## Types of Testing Used

| Testing Type | Description |
|---|---|
| **Functional Testing** | Verified that each screen, button, and API endpoint performs its required function. |
| **Validation Testing** | Checked empty fields, invalid inputs, password rules, and DTO constraints. |
| **Integration Testing** | Verified communication between the mobile app, Firebase Auth, NestJS backend, AssemblyAI, Gemini, and Filebase. |
| **UI Testing** | Checked navigation, loading states, modals, snackbars, and theme changes. |
| **Negative Testing** | Verified application behavior when invalid data, failed uploads, API errors, or network failures occur. |

---

## Frontend Test Cases (Expo React Native)

| Test | Test Cases | Expected Result | Actual/Final Result |
|---|---|---|---|
| Login empty field validation | Open the login screen and press **Login** without entering email or password. | App shows error: `Please enter email and password`. | Passed. Error snackbar displayed; login request not submitted. |
| Login with valid account | Enter a registered email and correct password, then press **Login**. | User is authenticated via Firebase and redirected to the New Chat screen. | Passed. User redirected to `/(main)/new-chat`. |
| Login with invalid credentials | Enter an incorrect email or password and press **Login**. | App shows Firebase authentication error and stays on login screen. | Passed. Error displayed; no redirect. |
| Password visibility toggle | Tap the eye icon on the password field. | Password text switches between hidden and visible. | Passed. Toggle works correctly. |
| Signup empty field validation | Open signup screen and submit without filling all fields. | App shows `Please fill in all fields`. | Passed. Snackbar appears; account not created. |
| Signup password mismatch | Enter different values in password and confirm password fields. | App shows `Passwords do not match`. | Passed. Validation blocks signup. |
| Signup weak password | Enter a password shorter than 6 characters. | App shows `Password must be at least 6 characters`. | Passed. Validation blocks signup. |
| Signup with valid data | Enter full name, email, and matching password, then submit. | Firebase account is created, display name saved, and user redirected to New Chat. | Passed. Account created and navigation works. |
| Forgot password navigation | Tap **Forgot Password?** on the login screen. | App navigates to the forgot password screen. | Passed. Route opens correctly. |
| Auth state persistence | Restart the app while already logged in. | App detects existing Firebase session and keeps the user authenticated. | Passed. Auth context restores user from Firebase state. |
| Logout | Tap **Logout** in settings. | Firebase session ends and user returns to the authentication flow. | Passed. User signed out successfully. |
| Video picker | Tap **Upload Video** on the New Chat screen and select a video file. | Document picker opens and returns the selected file URI. | Passed. Video file selection works. |
| Cancel video picker | Tap **Upload Video** and cancel the picker. | App stays on New Chat screen with no error. | Passed. No job started after cancellation. |
| Start notes generation | Select a valid video file. | App creates a chat, converts video to audio, uploads audio, starts backend processing, and opens the chat screen. | Passed. Processing workflow starts and chat screen opens. |
| Single active processing job | Try to upload another video while one job is already processing. | Upload button is disabled; app shows that only one job is allowed at a time. | Passed. Multiple active jobs prevented. |
| Processing progress screen | Open a chat while notes generation is in progress. | App shows generation status and progress steps. | Passed. Progress UI displayed while job is active. |
| Failed processing state | Simulate a failed processing job. | Chat screen shows generation failed message with option to delete the chat. | Passed. Failure state and delete option shown. |
| Delete failed chat | Press **Delete Chat** on a failed generation. | Chat is deleted and user returns to New Chat screen. | Passed. Failed chat removed and navigation works. |
| Load chat messages | Open an existing completed chat. | App loads chat details and all previous messages from the backend. | Passed. Chat and messages displayed. |
| Empty message validation | Press send with an empty or whitespace-only message. | App does not send the message. | Passed. Empty input ignored. |
| Send valid message | Type a question and press send. | User message appears, backend returns an AI response, and both messages display. | Passed. Optimistic user message replaced by saved messages from backend. |
| Send message API error | Simulate network/API failure while sending a message. | Temporary message removed, input text restored, and error shown. | Passed. Error handling works; user can retry. |
| Notes modal | Tap **Notes** on a completed chat. | Extracted notes open in a modal with Markdown content rendered. | Passed. Notes modal displays correctly. |
| Load notes fallback | Open notes modal when notes are not in state. | App calls backend notes content endpoint and loads notes. | Passed. Notes loaded from backend on demand. |
| PDF download with notes | Tap **Download PDF** when notes are available. | PDF is generated from notes and saved to the Downloads folder. | Passed. PDF generation and save flow complete. |
| PDF download without notes | Tap **Download PDF** when no notes are available. | App shows `No Notes` alert; no PDF is created. | Passed. Download blocked without notes. |
| Android storage permission denied | Deny storage permission during PDF download on Android. | App shows permission denied alert and stops the download. | Passed. Permission denial handled correctly. |
| Theme change | Change theme from Light to Dark or System in settings. | App colors update according to the selected theme. | Passed. Theme context updates UI successfully. |
| Profile photo picker | Tap **Change Photo** and select an image. | Selected image appears as the profile avatar preview. | Passed. Image picker updates local photo preview. |
| Profile update unavailable | Press **Update Profile** in settings. | App shows `Coming soon` message because backend API is not yet implemented. | Passed. Informational message displayed. |
| Password change unavailable | Press **Change Password** in settings. | App shows `Coming soon` message because backend API is not yet implemented. | Passed. Informational message displayed. |
| API auth header | Make any API request while logged in. | Firebase ID token is attached to the `Authorization: Bearer` header. | Passed. API client attaches token correctly. |
| API timeout handling | Simulate a request that exceeds the timeout. | App shows a readable `Request timeout` error without crashing. | Passed. Timeout mapped to status `408`. |
| Network error handling | Disconnect the network and perform an API action. | App shows a network error without crashing. | Passed. Network errors caught and displayed. |

---

## Backend Test Cases (NestJS REST API)

| Test | Test Cases | Expected Result | Actual/Final Result |
|---|---|---|---|
| Health check | Send `GET /` with no authentication. | API returns `200 OK` with a health message. | Passed. Default app controller responds correctly. |
| Unauthenticated request | Send `POST /chats` without an `Authorization` header. | API returns `401 Unauthorized`. | Passed. Global auth guard blocks unauthenticated requests. |
| Invalid Firebase token | Send `POST /chats` with a malformed or expired Bearer token. | API returns `401 Unauthorized`. | Passed. AuthService rejects invalid tokens. |
| Create chat — valid request | Send `POST /chats` with a valid Bearer token and `{ audioUrl }` body. | API creates a Firestore chat document with `status: "processing"`, submits audio to AssemblyAI, and returns `{ chatId }`. | Passed. Chat created and transcription job submitted. |
| Create chat — missing audioUrl | Send `POST /chats` with valid auth but no `audioUrl` in the body. | API returns `400 Bad Request` with validation errors. | Passed. DTO validation rejects the request. |
| List chats | Send `GET /chats` with a valid Bearer token. | API returns only the chats that belong to the authenticated user. | Passed. User-scoped chat list returned. |
| Get chat details — own chat | Send `GET /chats/:chatId` with valid auth for the owner. | API returns chat details including `status`, `audioUrl`, `transcriptUrl`, and `notesUrl`. | Passed. Chat details returned correctly. |
| Get chat details — other user's chat | Send `GET /chats/:chatId` using a valid token for a different user. | API returns `403 Forbidden`. | Passed. User authorization check prevents cross-user access. |
| Get chat details — invalid chatId | Send `GET /chats/nonexistent-id` with valid auth. | API returns `404 Not Found`. | Passed. Missing chat handled correctly. |
| Send message — valid | Send `POST /chats/:chatId/messages` with `{ text: "Summarize the lecture" }`. | API saves user message, calls Gemini with transcript and notes context, saves assistant message, and returns the assistant message. | Passed. Full message pipeline works. |
| Send message — empty text | Send `POST /chats/:chatId/messages` with `{ text: "" }`. | API returns `400 Bad Request`. | Passed. DTO validation rejects empty text. |
| Send message — chat still processing | Send `POST /chats/:chatId/messages` when chat `status` is `"processing"`. | API returns an error indicating the chat is not ready. | Passed. Message blocked until processing is complete. |
| Get messages | Send `GET /chats/:chatId/messages` for a completed chat. | API returns all messages in chronological order. | Passed. Messages retrieved correctly. |
| AssemblyAI webhook — valid | Send `POST /webhook/assemblyai` with a valid secret and a completed transcript payload. | Webhook retrieves transcript, generates notes with Gemini, uploads files to Filebase, and updates Firestore `status` to `"done"`. | Passed. Full webhook processing pipeline works. |
| AssemblyAI webhook — invalid secret | Send `POST /webhook/assemblyai` with a wrong or missing secret. | API returns `401 Unauthorized`. | Passed. Webhook signature verification rejects invalid requests. |
| AssemblyAI webhook — failed transcript | Send `POST /webhook/assemblyai` with a payload indicating transcription failure. | Firestore chat status is updated to `"failed"`. | Passed. Failure status propagated correctly. |

---

## Integration Test Cases (Frontend ↔ Backend)

| Test | Test Cases | Expected Result | Actual/Final Result |
|---|---|---|---|
| Full notes generation flow | User selects a video on the app → audio uploaded to Filebase → backend creates chat and starts AssemblyAI transcription → AssemblyAI sends webhook → Gemini generates notes → Firestore updated to `"done"` → app polls and shows completed chat. | End-to-end flow completes and notes are available in the app. | Passed. Full pipeline works from video selection to notes display. |
| Chat messaging flow | User opens a completed chat → types a question → app sends `POST /chats/:chatId/messages` → backend downloads transcript and notes, calls Gemini, saves messages → app displays AI response. | AI response appears in the chat. | Passed. Message flow works across frontend and backend. |
| Auth token refresh | Firebase token expires during an active session → user makes an API request → app refreshes the token and retries the request. | Request completes successfully after token refresh. | Passed. Token refresh handled transparently. |
| Cross-user data isolation | Two users with separate accounts both create chats → each user can only see their own chats and messages. | Data is fully isolated per user. | Passed. Firestore queries are scoped by `userId`. |

---

## Final Result

Testing confirmed that the NoteMate application correctly supports the full user workflow:

- **Authentication:** Login, signup, logout, and session persistence work across all edge cases.
- **Notes Generation:** The video-to-notes pipeline (video selection → audio upload → AssemblyAI transcription → Gemini notes → Firestore update) completes successfully end-to-end.
- **Chat Interaction:** Users can ask questions about their notes and receive context-aware AI responses.
- **File Operations:** Notes can be viewed in a modal and downloaded as a PDF.
- **Security:** All protected API endpoints enforce Firebase JWT authentication and user-level authorization.
- **Error Handling:** API timeouts, network failures, invalid inputs, and failed jobs are all handled gracefully without crashing the app.

All major frontend, backend, and integration test cases **passed** successfully.

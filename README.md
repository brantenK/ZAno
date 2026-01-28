<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Zano Finance Autopilot

AI-powered financial document automation. Automatically scan your Gmail for invoices, receipts, and statements, classify them with AI, and organize them in Google Drive.

## ✨ Features

- 🔍 **Gmail Scanning** - Automatically find financial documents in your inbox
- 🤖 **AI Classification** - Gemini AI classifies documents as invoices, receipts, statements, etc.
- 📁 **Auto-Organization** - Files are organized in Google Drive by type, vendor, and date
- 👥 **Supplier Management** - Track suppliers and their documents by financial year
- 📊 **Dashboard** - Real-time overview of processed documents with charts
- 📱 **Mobile Camera** - Snap receipts and invoices with AI-powered data extraction
- 💬 **AI Help Bot** - In-app chatbot for assistance
- ⚡ **PWA Ready** - Install on mobile for native-like experience

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A Google Cloud project with Gmail and Drive APIs enabled
- Firebase project for authentication
- Gemini API key

### Installation

1. **Clone and install:**
   ```bash
   git clone <your-repo-url>
   cd zano-finance-autopilot
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your credentials in `.env.local`:
   ```env
   # Required
   GEMINI_API_KEY=your_gemini_api_key
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   
   # Optional
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000)

## 🔧 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** → **Sign-in method** → **Google**
4. Add your domain to **Authorized domains** (localhost is added by default)
5. Go to **Project Settings** → **General** → **Your apps** → Add web app
6. Copy the config values to your `.env.local`

## ☁️ Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable these APIs:
   - Gmail API
   - Google Drive API
3. Configure OAuth consent screen
4. Add your Firebase project's OAuth client

## 🚢 Deployment (Vercel)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard:**
   - `GEMINI_API_KEY` (required for API proxy)
   - All `VITE_FIREBASE_*` variables

4. **Add your Vercel domain to:**
   - Firebase Authorized domains
   - Google OAuth redirect URIs

## 📁 Architecture

```
zano-finance-autopilot/
├── api/
│   └── classify.ts           # Vercel Edge Function (Gemini API proxy)
├── src/
│   ├── components/           # 15 React components
│   │   ├── Dashboard.tsx     # Main overview with charts
│   │   ├── HelpBot.tsx       # AI chatbot assistant
│   │   ├── SupplierManager.tsx
│   │   ├── CameraFab.tsx     # Mobile camera capture
│   │   └── ...
│   ├── services/             # 10 API services
│   │   ├── gmailService.ts   # Gmail API integration
│   │   ├── driveService.ts   # Google Drive operations
│   │   ├── geminiService.ts  # AI classification
│   │   ├── errorService.ts   # Centralized error handling
│   │   └── ...
│   ├── stores/               # Zustand state management
│   │   ├── authStore.ts
│   │   ├── syncStore.ts
│   │   └── uiStore.ts
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCameraCapture.ts
│   │   └── useSupplierProcessing.ts
│   └── types/                # TypeScript definitions
└── ARCHITECTURE.md           # Full technical documentation
```

> 📖 See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete technical documentation.

## 🔐 Security

| Feature | Implementation |
|---------|---------------|
| OAuth Scopes | Minimal: `gmail.readonly`, `drive.file` |
| API Key Protection | Gemini key stays server-side via Edge Function |
| CSP Headers | Strict Content Security Policy |
| No Data Storage | Your documents stay in YOUR Google Drive |

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 19, TypeScript, Tailwind CSS, Vite |
| **State** | Zustand |
| **AI** | Google Gemini 2.0 Flash |
| **Auth** | Firebase Authentication (Google OAuth) |
| **APIs** | Gmail API, Google Drive API |
| **Storage** | IndexedDB (client-side) |
| **Deployment** | Vercel (with Edge Functions) |
| **PWA** | vite-plugin-pwa |

## 🧪 Testing

> ⚠️ **IMPORTANT:** Always run tests before deploying changes!

### Test Commands

```bash
# Unit tests (fast, run frequently)
npm test

# E2E tests (run before deploying)
npm run test:e2e

# E2E with interactive UI
npm run test:e2e:ui

# E2E with visible browser
npm run test:e2e:headed
```

### Test Coverage

| Type | Tests | Command |
|------|-------|---------|
| Unit | 21 | `npm test` |
| E2E | 19 | `npm run test:e2e` |
| **Total** | **40** | - |

### 📋 Development Checklist

Before pushing changes or deploying, always:

- [ ] Run `npm test` - Unit tests pass?
- [ ] Run `npm run test:e2e` - E2E tests pass?
- [ ] Run `npm run build` - Build succeeds?

### When to Run E2E Tests

| Scenario | Run E2E? |
|----------|----------|
| Changed a component | ✅ Yes |
| Added a new feature | ✅ Yes |
| Before deploying | ✅ **Always** |
| Quick bug fix | Optional |
| Updated dependencies | ✅ Yes |

## 🔒 Pre-commit Hooks

This project uses **Husky** to run automatic checks before every commit:

```
✅ Unit tests (npm test)
✅ Build check (npm run build)
```

If any check fails, the commit is blocked. This ensures broken code never gets committed!

### Bypass (Emergency Only)
```bash
git commit --no-verify -m "your message"
```

## 📄 License

MIT

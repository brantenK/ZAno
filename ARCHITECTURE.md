# Zano Finance Autopilot - Architecture Overview

> Comprehensive technical documentation for the Zano Finance Autopilot application.

---

## 🎯 What This App Does

Zano Finance Autopilot is an **AI-powered financial document automation tool** that:

1. **Scans your Gmail** for financial documents (invoices, receipts, statements)
2. **Classifies documents** using Google Gemini AI
3. **Auto-organizes** everything in your Google Drive by type, vendor, and date
4. **Tracks suppliers** and their document history by financial year
5. **Captures receipts** via mobile camera with AI-powered data extraction

---

## 📊 Stats At-A-Glance

| Category | Count |
|----------|-------|
| Source Files | 42 |
| React Components | 15 |
| Services | 10 |
| Zustand Stores | 3 |
| Custom Hooks | 3 |
| Type Definitions | 3 |
| Unit Tests | 21 |

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React 19)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  Dashboard  │  │  Suppliers  │  │   Reports   │  Components     │
│  │  HelpBot    │  │  SenderList │  │  CameraFab  │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         │                │                │                         │
│  ┌──────┴────────────────┴────────────────┴──────┐                 │
│  │              ZUSTAND STORES                    │                 │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │                 │
│  │  │authStore │ │syncStore │ │ uiStore  │       │                 │
│  │  └──────────┘ └──────────┘ └──────────┘       │                 │
│  └──────────────────────┬────────────────────────┘                 │
│                         │                                           │
│  ┌──────────────────────┴────────────────────────┐                 │
│  │                SERVICES LAYER                  │                 │
│  │  ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │                 │
│  │  │gmailService │ │driveService │ │geminiSvc │ │                 │
│  │  │authService  │ │supplierSvc  │ │errorSvc  │ │                 │
│  │  │storageSvc   │ │docProcessSvc│ │retrySvc  │ │                 │
│  │  └─────────────┘ └─────────────┘ └──────────┘ │                 │
│  └───────────────────────────────────────────────┘                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Gmail API   │  │  Drive API   │  │  Gemini AI   │              │
│  │  (readonly)  │  │  (file)      │  │  (classify)  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │   Firebase   │  │   Vercel     │                                │
│  │   (Auth)     │  │ (Edge Proxy) │                                │
│  └──────────────┘  └──────────────┘                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```
zano-finance-autopilot/
├── api/
│   └── classify.ts          # Vercel Edge Function - Gemini API proxy
├── public/
│   ├── pwa-192x192.png      # PWA icons
│   └── pwa-512x512.png
├── src/
│   ├── components/          # 15 React components
│   │   ├── Dashboard.tsx    # Main overview with charts
│   │   ├── HelpBot.tsx      # AI chatbot assistant
│   │   ├── SupplierManager.tsx
│   │   ├── SenderList.tsx
│   │   ├── Reports.tsx
│   │   ├── CameraFab.tsx    # Mobile camera button
│   │   ├── ScanResultModal.tsx
│   │   ├── LandingPage.tsx
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # Firebase auth wrapper
│   │   ├── useCameraCapture.ts    # Mobile capture flow
│   │   └── useSupplierProcessing.ts
│   ├── services/            # Business logic
│   │   ├── gmailService.ts      # Gmail API integration
│   │   ├── driveService.ts      # Google Drive operations
│   │   ├── geminiService.ts     # AI classification
│   │   ├── authService.ts       # Firebase OAuth
│   │   ├── supplierService.ts   # Supplier CRUD
│   │   ├── storageService.ts    # IndexedDB wrapper
│   │   ├── documentProcessingService.ts
│   │   ├── errorService.ts      # Centralized error handling
│   │   ├── retryHelper.ts       # Exponential backoff
│   │   └── processedEmailsService.ts
│   ├── stores/              # Zustand state management
│   │   ├── authStore.ts
│   │   ├── syncStore.ts
│   │   └── uiStore.ts
│   ├── types/               # TypeScript definitions
│   │   ├── index.ts         # Core types (Email, Document, etc.)
│   │   ├── supplier.ts      # Supplier & financial year
│   │   └── scan.ts          # Camera scan types
│   ├── config/
│   │   └── firebase.ts      # Firebase initialization
│   └── App.tsx              # Main application
├── index.html               # Entry point with CSP
├── vite.config.ts           # Vite + PWA config
└── package.json
```

---

## 🔧 Services Breakdown

### Core Services

| Service | Purpose |
|---------|---------|
| `gmailService` | Fetch emails, search by query, download attachments |
| `driveService` | Create folders, upload files, check duplicates |
| `geminiService` | Classify documents via AI, analyze images |
| `authService` | Firebase Google OAuth, token management |

### Data Services

| Service | Purpose |
|---------|---------|
| `storageService` | IndexedDB wrapper (replaces localStorage) |
| `supplierService` | CRUD for suppliers, email history |
| `processedEmailsService` | Track which emails have been synced |

### Infrastructure Services

| Service | Purpose |
|---------|---------|
| `errorService` | Centralized error handling, 7 error types |
| `retryHelper` | Exponential backoff with jitter |
| `documentProcessingService` | Full document processing pipeline |

---

## 🧩 State Management (Zustand)

### `authStore`
```typescript
{
  user: AuthUser | null,
  isAuthenticated: boolean,
  signIn(), signOut()
}
```

### `syncStore`
```typescript
{
  emails: Email[],
  senders: Sender[],
  processedDocs: DocumentRecord[],
  isSyncing: boolean,
  syncLogs: string[],
  loadEmailsFromGmail(),
  runAutopilotSync()
}
```

### `uiStore`
```typescript
{
  activeTab: string,
  notification: { message, type } | null,
  notify(), setActiveTab()
}
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| OAuth Scopes | Minimal: `gmail.readonly`, `drive.file` |
| API Key Protection | Gemini key stays server-side via Edge Function |
| CSP Headers | Strict Content Security Policy |
| Token Storage | SessionStorage with expiry checking |
| Auth Expiry | Auto-detection, re-auth modal |

---

## 📱 Mobile / PWA Features

- **Progressive Web App** with service worker
- **Mobile camera capture** via CameraFab component
- **Gemini Vision** for receipt/invoice OCR
- **Offline storage** via IndexedDB
- **Responsive design** for all screen sizes

---

## 🗓️ Financial Year System

The app uses **South African financial year** (March - February):

```typescript
// From types/supplier.ts
function getCurrentFinancialYear(): string {
  // Returns "2025-2026" if current month >= March
  // Returns "2024-2025" if current month < March
}
```

Suppliers can be filtered by specific months within the financial year.

---

## 🤖 AI Features

### Document Classification
- **Model:** Gemini 2.0 Flash
- **Input:** Email subject, snippet, attachment filename
- **Output:** DocType, vendor name, amount, currency

### Image Analysis (Mobile)
- **Input:** Camera photo (Base64)
- **Output:** Extracted receipt/invoice data
- **Use case:** Snap a receipt, auto-extract vendor & amount

### HelpBot
- **Embedded AI chatbot** for user assistance
- **Context-aware** about app features
- **Uses Gemini** for conversational responses

---

## 🧪 Testing

```
Test Files: 4
Total Tests: 21

├── driveService.test.ts     # Folder creation, upload, deduplication
├── geminiService.test.ts    # Proxy vs direct API, error handling
├── gmailService.test.ts     # Email parsing, attachments, rate limiting
└── processedEmailsService.test.ts  # Persistence, deduplication
```

Run tests: `npm test`

---

## 🚀 Deployment

**Platform:** Vercel (recommended)

1. Edge Function at `/api/classify` proxies Gemini API
2. Static frontend served from CDN
3. Environment variables for all secrets

Required env vars:
- `GEMINI_API_KEY` (server-side only)
- `VITE_FIREBASE_*` (client-side)

---

## 📈 Performance Optimizations

| Optimization | Details |
|--------------|---------|
| Code Splitting | React.lazy for 6 heavy components |
| Folder Caching | DriveService caches folder IDs |
| Rate Limiting | 200-300ms delays between API calls |
| Retry Logic | Exponential backoff for transient errors |
| IndexedDB | Scalable storage (vs 5MB localStorage) |

---

## 🛣️ Future Enhancements

- [ ] Background sync when offline
- [ ] Gmail Watch API for push notifications
- [ ] Multi-user backend (Supabase)
- [ ] Analytics dashboard

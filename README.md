# Product Admin Dashboard

A small admin dashboard for managing a product catalog — log in, browse/search/filter/sort products, view details, and add/edit/delete items. Built with Next.js (App Router), React, Tailwind CSS and Axios, backed by the free [DummyJSON](https://dummyjson.com) API.

## 📋 Table of Contents
- [Overview](#-overview)
- [Tech Stack](#️-tech-stack)
- [Architecture](#️-architecture)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Setup Instructions](#-setup-instructions)
- [Pages & Routes](#-pages--routes)
- [Data Persistence Approach](#️-data-persistence-approach)
- [Security](#-security)
- [Development](#-development)
- [Notes: Choices, a Problem I Faced, and Where AI Helped](#-notes-choices-a-problem-i-faced-and-where-ai-helped)
- [License](#-license)

## 🎯 Overview
DummyJSON is a free, public REST API that simulates a real product catalog, but it never actually saves any change you send it — every `add`/`edit`/`delete` call returns a success response without touching the server's data. This project treats that as a design constraint rather than a limitation: on top of DummyJSON's read endpoints, the app keeps a small local "overrides" layer (in the browser's `localStorage`) so that from the user's point of view, changes genuinely persist, are logged, and can even be undone.

The app is:
- A **login-gated** dashboard — only authenticated users can reach `/products` and its sub-pages.
- A **product catalog** — searchable, filterable, sortable, paginated, with a full details view.
- A lightweight **admin tool** — add, edit, delete, restore, and a change-history log, plus a stats dashboard.

## 🛠️ Tech Stack
**Frontend / Framework**
- Next.js 14 (App Router, client components)
- React 18
- Tailwind CSS 3

**Data**
- Axios (one shared instance — see [Security](#-security))
- [DummyJSON](https://dummyjson.com) — free public REST API for products, auth, and categories
- Browser `localStorage` — local overrides layer (add/edit/delete/restore + history)

**Hosting**
- Vercel (auto-deploys from the `main` branch on every push)

No React Query/SWR and no ready-made table/pagination libraries are used — pagination, debounced search, sorting, and URL-state sync are all hand-written.

## 🏗️ Architecture
```
┌──────────────────────────┐
│   Next.js App Router     │
│   (Client Components)    │
│  - /login                │
│  - /products (+ [id])    │
│  - /dashboard, /history  │
└─────────────┬─────────────┘
              │ Axios (lib/axios.js)
              │ token attached, 401s handled centrally
              ▼
┌──────────────────────────┐
│   DummyJSON REST API      │
│  /auth/login               │
│  /products, /products/:id  │
│  /products/search           │
│  /products/categories       │
└─────────────┬─────────────┘
              │
              ▼ merged with
┌──────────────────────────┐
│  localStorage overrides   │
│  (lib/overrides.js)       │
│  added / edited / deleted │
│  / history                │
└──────────────────────────┘
```

**Auth flow:** `/login` posts to `POST /auth/login` (with `expiresInMins: 5`) → JWT + expiry timestamp stored in `localStorage` → every subsequent request has the token attached by an Axios request interceptor → a response interceptor catches any `401` and logs the user out → a client-side timer in `Protected.js` also auto-logs-out exactly when the 5-minute token expires, even before a request fails.

## ✨ Features
**Auth**
- ✅ Login with DummyJSON credentials, inline error on failure
- ✅ Route protection — all `/products*`, `/dashboard`, `/history` pages redirect to `/login` if not authenticated
- ✅ 5-minute JWT expiry with automatic logout
- ✅ Logout button
- ✅ Login button guarded against double-submits

**Product Catalog**
- ✅ Table view (desktop) / card view (mobile) — image, title, category, price, rating, stock
- ✅ Pagination — page numbers, Previous/Next, page size (10/20/50), "Showing X–Y of Z"
- ✅ Debounced search (400ms) via `/products/search`, resets to page 1
- ✅ Category filter (`/products/categories`) and sort by price/rating/title, asc/desc
- ✅ Stale-response protection — fast typing while search is slow never shows outdated results
- ✅ All filters/sort/page state kept in the URL — refresh or share the link, same view
- ✅ Invalid URL values (`?page=abc`, `?page=999`, bad `pageSize`) are sanitised, never crash

**Product Details**
- ✅ `/products/[id]` — images, description, price, rating, stock, reviews
- ✅ "Not found" page for an invalid/nonexistent id

**Admin Actions**
- ✅ Add / Edit product with field validation
- ✅ Delete with a confirm modal
- ✅ Save button guarded against double-submits
- ✅ **Change history** (`/history`) — every add/edit/delete/restore logged with a timestamp; edits show a before → after diff
- ✅ **Restore deleted products** directly from the history log

**States & Extras**
- ✅ Loader while data is loading
- ✅ Empty state when nothing matches
- ✅ Error state with a Retry button on failure
- ✅ `/dashboard` — total products, inventory value, low/out-of-stock counts, average rating, category breakdown

## 📂 Project Structure
```
product-admin-dashboard/
├── app/
│   ├── login/page.js              # Login page
│   ├── products/
│   │   ├── page.js                # Product list: search/filter/sort/paginate
│   │   ├── new/page.js            # Add product
│   │   └── [id]/
│   │       ├── page.js            # Product details
│   │       └── edit/page.js       # Edit product
│   ├── dashboard/page.js          # Stats overview
│   ├── history/page.js            # Change history + restore
│   ├── layout.js, page.js, globals.css
├── components/
│   ├── Protected.js               # Auth guard + session-expiry timer
│   ├── ProductForm.js             # Shared add/edit form with validation
│   ├── Pagination.js
│   ├── ConfirmModal.js
│   └── Loader.js
├── lib/
│   ├── axios.js                   # Shared Axios instance: token + error handling
│   └── overrides.js               # localStorage layer: add/edit/delete/restore/history
├── README.md
└── NOTES.md                       # Extended write-up of design decisions & bug fixes
```

## 🚀 Setup Instructions
**Prerequisites:** Node.js 18+

```bash
git clone <this-repo-url>
cd product-admin-dashboard
npm install
npm run dev
```

Open **http://localhost:3000** — it redirects to `/login`.

**Demo credentials:**
- Username: `emilys`
- Password: `emilyspass`

(The login page also has a "Use demo credentials" button so nothing sensitive is pre-filled by default.)

**Build for production:**
```bash
npm run build
npm start
```

No environment variables or API keys are needed — the app talks to DummyJSON's public API directly.

## 🔌 Pages & Routes
| Route | Description | Protected |
|---|---|---|
| `/login` | Login form | No |
| `/products` | Product list with search/filter/sort/pagination | Yes |
| `/products/[id]` | Product detail view | Yes |
| `/products/new` | Add product form | Yes |
| `/products/[id]/edit` | Edit product form | Yes |
| `/dashboard` | Catalog stats overview | Yes |
| `/history` | Change log + restore deleted items | Yes |

**External API calls used** (all via the shared Axios instance in `lib/axios.js`):
```
POST  /auth/login                       # login, with expiresInMins: 5
GET   /products?limit=&skip=            # paginated list
GET   /products/search?q=&limit=&skip=  # search
GET   /products/category/:slug          # category filter
GET   /products/categories              # category list
GET   /products/:id                     # product details
POST  /products/add                     # add (not actually persisted by DummyJSON)
PUT   /products/:id                     # edit (not actually persisted by DummyJSON)
DELETE /products/:id                    # delete (not actually persisted by DummyJSON)
```

## 🗄️ Data Persistence Approach
DummyJSON's write endpoints (`add`/`update`/`delete`) respond with success but never change the underlying dataset — a second `GET` always returns the original data. Since the assignment still asks for changes to "show in the app anyway," this project keeps a small local store in `localStorage` (`lib/overrides.js`):

```js
{
  added:   [ /* full product objects created locally */ ],
  edited:  { [productId]: { /* patched fields */ } },
  deleted: [ /* ids hidden from view */ ],
  history: [ /* { type, productId, title, before, after, timestamp } */ ]
}
```

Every product list/detail fetch merges the live API response with this local store, so add/edit/delete/restore all behave correctly from the user's perspective — while the real API call is still made first, per the assignment's requirement. This is **per-browser** data: it doesn't sync across devices and clears if the user wipes site storage, which is an accepted trade-off given DummyJSON has no real backend to persist to.

## 🔐 Security
- **One shared Axios instance** (`lib/axios.js`): a request interceptor attaches the JWT to every outgoing call; a response interceptor catches any `401` in one place and logs the user out.
- **Short-lived sessions**: login requests `expiresInMins: 5` from DummyJSON, appropriate for an admin tool. The expiry timestamp is stored alongside the token, and `Protected.js` sets a client-side timer to log the user out exactly when it lapses — this is a defense-in-depth measure on top of (not a replacement for) the server rejecting an expired token.
- **No pre-filled credentials**: the login form starts empty; a "Use demo credentials" button fills them in on demand instead of exposing them by default.
- **Route protection**: every dashboard page is wrapped in a `Protected` component that checks for a valid, unexpired token before rendering.
- **Double-submit guards**: both the login form and the product form use a `useRef` flag (not state, so it can't be delayed by a re-render) to block a second click from firing a duplicate request.

## 💻 Development
```bash
npm run dev     # start dev server with hot reload
npm run build   # production build
npm start       # run the production build
```
No test suite or linting config is included beyond Next.js's defaults, given the project's scope and timeframe.

## 📝 Notes: Choices, a Problem I Faced, and Where AI Helped
**Search vs. category filter:** DummyJSON can't search and filter by category in the same request. This app lets search win — the category dropdown disables (with a note shown to the user) whenever a search term is active, since a typed search is a more deliberate action than browsing a category.

**A problem I faced:** keeping the URL as the single source of truth for filters while debouncing the search box was fiddly — pushing a new URL on every keystroke would spam the router. Fix: the raw typed text lives in local component state for instant UI feedback, and only gets pushed into the URL (which triggers the actual fetch) after a 400ms debounce timer.

**Where AI helped:** I used an AI assistant to scaffold the page structure, the pagination/URL-sync logic, and the local-overrides persistence layer, then reviewed, tested, and fixed bugs in it myself (see `NOTES.md` for two real bugs this surfaced: locally-added products always 404'ing on their detail page, and edits to locally-added products not reflecting on the product list — both traced to two code paths reading the same local state inconsistently, and fixed by aligning them).

Full extended write-up, including every design decision and bug fix made along the way, is in [`NOTES.md`](./NOTES.md).

## 📄 License
Built as a learning/assignment project using DummyJSON's free public API. No license restrictions on this code.

---
*Last updated: September 2026*

# Product Admin Dashboard

Next.js (App Router) + React + Tailwind CSS + Axios, using the free [DummyJSON](https://dummyjson.com) API.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000 — it redirects to `/login`.

Login with:
- username: `emilys`
- password: `emilyspass`

## Deploy

Push to GitHub, then import the repo in Vercel (no env vars needed) and deploy.

## What's finished

- Login page with error handling, logout, route protection (redirects to `/login` if no token)
- Product list: table on desktop, cards on mobile (image, title, category, price, rating, stock)
- Pagination: page numbers, Previous/Next, page size (10/20/50), "Showing X-Y of Z"
- Debounced search (400ms) via `/products/search`, resets to page 1 on change
- Category filter (`/products/categories`) and sort by price/rating/title, asc/desc
- Product details page `/products/[id]` with images, description, reviews, and a "not found" state for bad ids
- Add/Edit product with validation, Delete with a confirm modal
- Loading / empty / error (with Retry) states everywhere data is fetched
- One shared Axios instance (`lib/axios.js`) that attaches the token and handles 401s in one place
- Page, search, category, sort and page size are all kept in the URL — refresh or share the link and you get the same view
- Stale search responses are ignored using a request-id ref, so fast typing + `&delay=2000` never shows outdated results
- Login and Save buttons are guarded against double-submits with a `useRef` flag

## Notes

See `NOTES.md` for the write-up on design decisions, the search+category conflict, fake persistence, and where AI was used.

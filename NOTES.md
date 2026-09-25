# Notes

## Search + category filter conflict
DummyJSON can't search and filter by category in the same request. My choice:
when a search term is present, search wins and the category dropdown is
disabled (with a small note shown to the user). Reasoning: search is a more
specific, deliberate action than browsing a category, and dropping the
category silently (without saying anything) would be confusing.

## Add/Edit/Delete aren't really persisted
The DummyJSON docs say `/products/add`, `PUT /products/:id`, and
`DELETE /products/:id` all return a success response but never change the
underlying data. So the app still calls those endpoints (to follow the spec),
but also keeps a small "overrides" object in `localStorage`
(`lib/overrides.js`): added products, edited-by-id patches, and deleted ids.
Every product list/detail fetch merges the API response with these overrides,
so from the user's point of view changes stick (per browser), even though the
server itself is untouched.

## Race condition on fast typing
Each fetch is tagged with an incrementing request id. When a response comes
back, it's only applied to state if its id still matches the latest request;
otherwise it's a stale response from an old keystroke and gets ignored. This
was tested with `&delay=2000` appended to the search URL.

## Bad URL values
`?page=abc` -> `parseInt` gives `NaN` -> falls back to page 1.
`?page=999` -> fetch happens, comes back empty, and once the real total is
known the page snaps back to 1 automatically.
`?pageSize=999` -> only 10/20/50 are accepted, anything else falls back to 10.

## Double-submit protection
Both the login form and the product form use a `useRef` flag that's set
before the request starts and cleared in `finally`. Since refs don't trigger
re-renders, this reliably blocks a second click that lands before the button
even gets disabled from a state update.

## One problem I faced
Getting the URL (search params) to be the single source of truth while also
debouncing the search input was a bit fiddly — you don't want to push a new
URL on every keystroke (that would spam History/router), but you also want
the input to feel responsive. Fix: keep the raw typed text in local
component state (`inputValue`) for instant feedback, and only push it into
the URL (which triggers the actual fetch) after the debounce timer fires.

## Later improvements
- Login no longer pre-fills the demo credentials (a "Use demo credentials"
  button fills them in one click instead, so it's still easy to test but
  nothing sensitive is exposed by default).
- Login now sends `expiresInMins: 5` to DummyJSON, so the JWT it gets back
  expires in 5 minutes. The expiry timestamp is stored alongside the token,
  and `Protected` sets a timer to auto-logout exactly when it runs out —
  this is on top of the existing 401 handling in `lib/axios.js`, which
  catches it if the server rejects an expired token before the client timer
  fires.
- Added a `/dashboard` page: total products, inventory value, low/out-of-
  stock counts, average rating, and a simple category breakdown — gives the
  app an actual "admin dashboard" landing view instead of just a list.
- Product table/cards now show colored stock badges (in stock / low stock /
  out of stock) instead of a bare number, and category is shown as a pill.

## Change history + restore deleted items
Added a `/history` page and extended `lib/overrides.js` with a `history`
array. Every add, edit, delete and restore gets logged with a timestamp;
edits store a before/after snapshot so the page can show exactly which
fields changed. Deletes can be undone with a "Restore" button, which simply
removes that id from the `deleted` list — the product's data still comes
from the live API (or from the edited/added override if there is one), so
nothing needs to be re-created from scratch.

## Bug fix: newly-added products showed "not found"
Locally-added products get a new id (`Date.now()`) that doesn't exist on the
real DummyJSON server. The detail page originally always called
`GET /products/:id` first, which 404'd for these ids before the local
override was ever checked. Fixed by adding `isLocallyAdded()` in
`lib/overrides.js` and having the detail page use the local copy directly,
skipping the API call, whenever the product was created in this browser.

## Bug fix: deleting a locally-added product didn't actually hide it
`applyOverrides()` filtered the API-fetched products against the `deleted`
list, but spread `data.added` back in unconditionally — so deleting a
product you'd created yourself (e.g. via "Add Product") still marked it
deleted internally, but it kept showing up in the products list and the
dashboard. Fixed by filtering `data.added` against `deleted` too.

## Bug fix: editing a locally-added product didn't show on the list
`editProduct()` always saves changes into the `edited` patch map, keyed by
id. The detail page checks that map first, so it correctly showed an edited
version of a locally-added product — but `applyOverrides()` (used by the
products list and dashboard) only applied `edited` patches to products that
came from the real API, never to `added` (locally-created) ones. So editing
a product you'd added yourself showed the fix on its detail page but not in
the list. Fixed by applying the same `edited` patch to `added` products too.

## Where AI helped
Used an AI assistant to scaffold the page structure quickly and to write
the first draft of the pagination/URL-sync logic, which I then reviewed and
adjusted (e.g. the stale-request guard and the page-999 snap-back). All of it
was in a time-boxed session, so the styling is intentionally minimal.

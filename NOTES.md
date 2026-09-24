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

## Where AI helped
Used an AI assistant to scaffold the page structure quickly and to write
the first draft of the pagination/URL-sync logic, which I then reviewed and
adjusted (e.g. the stale-request guard and the page-999 snap-back). All of it
was in a time-boxed session, so the styling is intentionally minimal.

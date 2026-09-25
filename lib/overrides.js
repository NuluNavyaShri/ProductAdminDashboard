// DummyJSON's add/edit/delete endpoints respond with success but never
// actually change the data on the server. To make the app *behave* like
// changes are saved, we keep a small local overrides store and merge it
// with whatever the API returns. `history` additionally logs every add,
// edit and delete so the user can review what changed and undo a delete.
const KEY = 'productOverrides';

function read() {
  if (typeof window === 'undefined') return { added: [], edited: {}, deleted: [], history: [] };
  const raw = localStorage.getItem(KEY);
  const data = raw ? JSON.parse(raw) : {};
  return {
    added: data.added || [],
    edited: data.edited || {},
    deleted: data.deleted || [],
    history: data.history || [],
  };
}
function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function logHistory(data, entry) {
  data.history.unshift({ id: `${Date.now()}-${Math.random()}`, timestamp: Date.now(), ...entry });
  data.history = data.history.slice(0, 100); // cap so it never grows forever
}

export function addProduct(product) {
  const data = read();
  const newProduct = { ...product, id: Date.now() };
  data.added.unshift(newProduct);
  logHistory(data, { type: 'add', productId: newProduct.id, title: newProduct.title, after: newProduct });
  write(data);
  return newProduct;
}

// `before` is the product's state right before the edit, passed in by the
// edit page (it already has it loaded), so the history entry can show what
// changed.
export function editProduct(id, product, before) {
  const data = read();
  data.edited[id] = { ...product, id: Number(id) };
  logHistory(data, { type: 'edit', productId: Number(id), title: product.title, before, after: product });
  write(data);
}

// `snapshot` is the product being deleted, so we still have its title/price
// to show in the history list and to restore from.
export function deleteProduct(id, snapshot) {
  const data = read();
  if (!data.deleted.includes(Number(id))) data.deleted.push(Number(id));
  logHistory(data, { type: 'delete', productId: Number(id), title: snapshot?.title || `Product #${id}`, before: snapshot });
  write(data);
}

// Undo a delete: just remove it from the deleted list. The product's data
// comes back from the API (or from an edited/added override) automatically.
export function restoreProduct(id) {
  const data = read();
  data.deleted = data.deleted.filter((d) => d !== Number(id));
  const title = data.edited[id]?.title || data.added.find((p) => p.id === Number(id))?.title || `Product #${id}`;
  logHistory(data, { type: 'restore', productId: Number(id), title });
  write(data);
}

export function applyOverrides(products) {
  const data = read();
  const addedList = data.added
    .filter((p) => !data.deleted.includes(p.id))
    .map((p) => (data.edited[p.id] ? { ...p, ...data.edited[p.id] } : p));
  const list = products
    .filter((p) => !data.deleted.includes(p.id))
    .map((p) => (data.edited[p.id] ? { ...p, ...data.edited[p.id] } : p));
  return [...addedList, ...list];
}

// True only for products created locally with "Add Product" — these have no
// real counterpart on the DummyJSON server, so their detail page must never
// try to fetch them from the API (that would always 404).
export function isLocallyAdded(id) {
  const data = read();
  return data.added.some((p) => p.id === Number(id));
}

export function getOverrideById(id) {
  const data = read();
  if (data.deleted.includes(Number(id))) return { deleted: true };
  if (data.edited[id]) return data.edited[id];
  return data.added.find((p) => p.id === Number(id)) || null;
}

export function getHistory() {
  return read().history;
}

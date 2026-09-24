// DummyJSON's add/edit/delete endpoints respond with success but never
// actually change the data on the server. To make the app *behave* like
// changes are saved, we keep a small local overrides store and merge it
// with whatever the API returns.
const KEY = 'productOverrides';

function read() {
  if (typeof window === 'undefined') return { added: [], edited: {}, deleted: [] };
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : { added: [], edited: {}, deleted: [] };
}
function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function addProduct(product) {
  const data = read();
  const newProduct = { ...product, id: Date.now() };
  data.added.unshift(newProduct);
  write(data);
  return newProduct;
}

export function editProduct(id, product) {
  const data = read();
  data.edited[id] = { ...product, id: Number(id) };
  write(data);
}

export function deleteProduct(id) {
  const data = read();
  if (!data.deleted.includes(Number(id))) data.deleted.push(Number(id));
  write(data);
}

export function applyOverrides(products) {
  const data = read();
  const list = products
    .filter((p) => !data.deleted.includes(p.id))
    .map((p) => (data.edited[p.id] ? { ...p, ...data.edited[p.id] } : p));
  return [...data.added, ...list];
}

export function getOverrideById(id) {
  const data = read();
  if (data.deleted.includes(Number(id))) return { deleted: true };
  if (data.edited[id]) return data.edited[id];
  return data.added.find((p) => p.id === Number(id)) || null;
}

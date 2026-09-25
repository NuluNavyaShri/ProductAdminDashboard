'use client';
import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/axios';
import Protected from '../../components/Protected';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { applyOverrides, deleteProduct as deleteOverride } from '../../lib/overrides';

const PAGE_SIZES = [10, 20, 50];

function StockBadge({ stock }) {
  let cls = 'bg-emerald-100 text-emerald-700';
  let label = 'In stock';
  if (stock === 0) {
    cls = 'bg-red-100 text-red-700';
    label = 'Out of stock';
  } else if (stock < 10) {
    cls = 'bg-amber-100 text-amber-700';
    label = 'Low stock';
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>
      {stock} · {label}
    </span>
  );
}

function ProductsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Every filter/sort/page value is read from the URL so refresh/share works.
  // Bad values (?page=abc, ?page=999, weird pageSize) are sanitised here
  // instead of being trusted directly.
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const rawSize = parseInt(searchParams.get('pageSize') || '10', 10);
  const pageSize = PAGE_SIZES.includes(rawSize) ? rawSize : 10;
  const search = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || '';
  const order = searchParams.get('order') || 'asc';

  const [inputValue, setInputValue] = useState(search);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  // Used to ignore stale responses: if the user types fast, an old slow
  // request must never overwrite a newer one.
  const requestIdRef = useRef(0);
  const debounceRef = useRef(null);

  function updateParams(next) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) params.delete(k);
      else params.set(k, v);
    });
    router.push(`/products?${params.toString()}`);
  }

  useEffect(() => {
    api
      .get('/products/categories')
      .then((res) => setCategories(res.data.map((c) => (typeof c === 'string' ? c : c.slug))))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    const myId = ++requestIdRef.current;
    setLoading(true);
    setError('');
    const skip = (page - 1) * pageSize;
    const params = { limit: pageSize, skip };
    if (sortBy) {
      params.sortBy = sortBy;
      params.order = order;
    }

    // DummyJSON can't search and filter-by-category in one call, so when a
    // search term is present we search across all categories and ignore the
    // category dropdown (a note is shown to the user explaining this).
    let request;
    if (search) {
      request = api.get('/products/search', { params: { ...params, q: search } });
    } else if (category) {
      request = api.get(`/products/category/${category}`, { params });
    } else {
      request = api.get('/products', { params });
    }

    request
      .then((res) => {
        if (myId !== requestIdRef.current) return; // a newer request already won
        setProducts(applyOverrides(res.data.products));
        setTotal(res.data.total);
      })
      .catch(() => {
        if (myId !== requestIdRef.current) return;
        setError('Failed to load products.');
      })
      .finally(() => {
        if (myId === requestIdRef.current) setLoading(false);
      });
  }, [page, pageSize, search, category, sortBy, order]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounce the search box: wait 400ms after the user stops typing.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (inputValue !== search) updateParams({ q: inputValue, page: 1 });
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  // If page > totalPages (e.g. ?page=999), snap back to page 1 once we know the real total.
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    if (!loading && page > totalPages && total > 0) updateParams({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, totalPages]);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
    router.push('/login');
  }

  function confirmDelete() {
    const snapshot = products.find((p) => p.id === deleteId);
    deleteOverride(deleteId, snapshot);
    setDeleteId(null);
    fetchProducts();
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="text-sm text-slate-500">{total} items in your catalog</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard" className="border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50">
            Dashboard
          </Link>
          <Link href="/history" className="border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50">
            History
          </Link>
          <Link href="/products/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg">
            + Add Product
          </Link>
          <button onClick={handleLogout} className="border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50">
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        <input
          placeholder="Search products..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="border rounded px-3 py-1.5 flex-1 min-w-[180px]"
        />
        <select
          value={category}
          disabled={!!search}
          onChange={(e) => updateParams({ category: e.target.value, page: 1 })}
          className="border rounded px-2 py-1.5 disabled:bg-gray-100"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => updateParams({ sortBy: e.target.value })} className="border rounded px-2 py-1.5">
          <option value="">Sort by</option>
          <option value="price">Price</option>
          <option value="rating">Rating</option>
          <option value="title">Title</option>
        </select>
        <select value={order} onChange={(e) => updateParams({ order: e.target.value })} className="border rounded px-2 py-1.5">
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
        <select value={pageSize} onChange={(e) => updateParams({ pageSize: e.target.value, page: 1 })} className="border rounded px-2 py-1.5">
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>
      </div>

      {search && category && (
        <p className="text-xs text-amber-600 mb-2">
          Category filter is ignored while searching — the API can&apos;t do both at once, so search wins.
        </p>
      )}

      {loading && <Loader />}

      {!loading && error && (
        <div className="text-center py-10">
          <p className="text-red-600 mb-2">{error}</p>
          <button onClick={fetchProducts} className="border px-3 py-1 rounded">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && <p className="text-center py-10 text-gray-500">No products found.</p>}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="hidden md:block rounded-xl border border-slate-200 overflow-hidden bg-white">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-3 px-3">Image</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Rating</th>
                  <th>Stock</th>
                  <th className="px-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-indigo-50/40 transition-colors">
                    <td className="py-2 px-3">
                      <img src={p.thumbnail || p.images?.[0]} alt={p.title} className="w-12 h-12 object-cover rounded-lg" />
                    </td>
                    <td>
                      <Link href={`/products/${p.id}`} className="text-indigo-600 font-medium hover:underline">
                        {p.title}
                      </Link>
                    </td>
                    <td>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{p.category}</span>
                    </td>
                    <td className="font-medium">${p.price}</td>
                    <td>⭐ {p.rating}</td>
                    <td>
                      <StockBadge stock={p.stock} />
                    </td>
                    <td className="whitespace-nowrap px-3">
                      <Link href={`/products/${p.id}/edit`} className="text-indigo-600 mr-3">
                        Edit
                      </Link>
                      <button onClick={() => setDeleteId(p.id)} className="text-red-600">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {products.map((p) => (
              <div key={p.id} className="border border-slate-200 rounded-xl p-3 flex gap-3 bg-white shadow-sm">
                <img src={p.thumbnail || p.images?.[0]} alt={p.title} className="w-16 h-16 object-cover rounded-lg" />
                <div className="flex-1">
                  <Link href={`/products/${p.id}`} className="font-medium text-indigo-600">
                    {p.title}
                  </Link>
                  <p className="text-xs text-gray-500">{p.category}</p>
                  <p className="text-sm mt-0.5">
                    <span className="font-medium">${p.price}</span> • ⭐{p.rating}
                  </p>
                  <div className="mt-1">
                    <StockBadge stock={p.stock} />
                  </div>
                  <div className="mt-2 text-sm">
                    <Link href={`/products/${p.id}/edit`} className="text-indigo-600 mr-3">
                      Edit
                    </Link>
                    <button onClick={() => setDeleteId(p.id)} className="text-red-600">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={(p) => updateParams({ page: p })} />
        </>
      )}

      <ConfirmModal open={!!deleteId} title="Delete this product?" onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Protected>
      <Suspense fallback={<Loader />}>
        <ProductsInner />
      </Suspense>
    </Protected>
  );
}

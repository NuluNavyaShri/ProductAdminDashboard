'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../lib/axios';
import Protected from '../../components/Protected';
import Loader from '../../components/Loader';
import { applyOverrides } from '../../lib/overrides';

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}

function DashboardInner() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    setError('');
    // A high limit pulls the full catalog in one call so the stats below
    // reflect everything, not just one page.
    api
      .get('/products', { params: { limit: 200 } })
      .then((res) => setProducts(applyOverrides(res.data.products)))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (loading) return <Loader />;
  if (error) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-600 mb-2">{error}</p>
        <button onClick={load} className="border px-3 py-1 rounded">
          Retry
        </button>
      </div>
    );
  }

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const avgRating = totalProducts ? (products.reduce((s, p) => s + (p.rating || 0), 0) / totalProducts).toFixed(2) : '0';

  const byCategory = {};
  products.forEach((p) => {
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
  });
  const categoryRows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCount = Math.max(...categoryRows.map(([, c]) => c), 1);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of your product catalog</p>
        </div>
        <Link href="/products" className="border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50">
          Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Products" value={totalProducts} accent="text-indigo-600" />
        <StatCard label="Inventory Value" value={`$${totalValue.toLocaleString()}`} accent="text-emerald-600" />
        <StatCard label="Low Stock" value={lowStock} accent="text-amber-600" />
        <StatCard label="Out of Stock" value={outOfStock} accent="text-red-600" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-slate-800">Top Categories</h2>
          <span className="text-sm text-slate-500">Avg rating: ⭐ {avgRating}</span>
        </div>
        <div className="space-y-2">
          {categoryRows.map(([cat, count]) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="w-32 text-sm text-slate-600 truncate">{cat}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-3">
                <div className="bg-indigo-500 h-3 rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
              </div>
              <span className="w-6 text-sm text-slate-600 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Protected>
      <DashboardInner />
    </Protected>
  );
}

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Protected from '../../components/Protected';
import { getHistory, restoreProduct } from '../../lib/overrides';

const TYPE_STYLES = {
  add: 'bg-emerald-100 text-emerald-700',
  edit: 'bg-indigo-100 text-indigo-700',
  delete: 'bg-red-100 text-red-700',
  restore: 'bg-amber-100 text-amber-700',
};

// Shows only the fields that actually changed between an edit's before/after,
// so the log stays readable instead of repeating the whole product object.
function EditDiff({ before, after }) {
  if (!before || !after) return null;
  const fields = ['title', 'category', 'price', 'stock', 'rating', 'description'];
  const changed = fields.filter((f) => String(before[f]) !== String(after[f]));
  if (changed.length === 0) return null;
  return (
    <ul className="text-xs text-slate-500 mt-1 space-y-0.5">
      {changed.map((f) => (
        <li key={f}>
          <span className="capitalize">{f}</span>: <span className="line-through">{String(before[f])}</span> →{' '}
          <span className="text-slate-700">{String(after[f])}</span>
        </li>
      ))}
    </ul>
  );
}

function HistoryInner() {
  const [history, setHistory] = useState([]);

  function load() {
    setHistory(getHistory());
  }
  useEffect(load, []);

  function handleRestore(productId) {
    restoreProduct(productId);
    load();
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Change History</h1>
          <p className="text-sm text-slate-500">Every add, edit and delete made in this browser — deletes can be undone</p>
        </div>
        <Link href="/products" className="border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50">
          Back to Products
        </Link>
      </div>

      {history.length === 0 && <p className="text-slate-500 text-center py-10">No changes yet.</p>}

      <div className="space-y-2">
        {history.map((h) => (
          <div key={h.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${TYPE_STYLES[h.type] || 'bg-slate-100 text-slate-700'}`}>
                {h.type}
              </span>
              <span className="font-medium text-slate-800">{h.title}</span>
              <p className="text-xs text-slate-400 mt-0.5">{new Date(h.timestamp).toLocaleString()}</p>
              {h.type === 'edit' && <EditDiff before={h.before} after={h.after} />}
            </div>
            {h.type === 'delete' && (
              <button
                onClick={() => handleRestore(h.productId)}
                className="text-indigo-600 text-sm shrink-0 border border-indigo-200 rounded-lg px-2.5 py-1 hover:bg-indigo-50"
              >
                Restore
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Protected>
      <HistoryInner />
    </Protected>
  );
}

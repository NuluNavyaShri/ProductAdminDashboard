'use client';
import { useState, useRef } from 'react';

// Shared by both "Add product" and "Edit product" pages.
export default function ProductForm({ initial, onSubmit, submitLabel }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    category: initial?.category || '',
    price: initial?.price ?? '',
    stock: initial?.stock ?? '',
    rating: initial?.rating ?? '',
    description: initial?.description || '',
    thumbnail: initial?.thumbnail || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false); // guards against double-click submits

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.category.trim()) e.category = 'Category is required';
    if (form.price === '' || Number(form.price) <= 0) e.price = 'Price must be greater than 0';
    if (form.stock === '' || Number(form.stock) < 0) e.stock = 'Stock cannot be negative';
    if (form.rating !== '' && (Number(form.rating) < 0 || Number(form.rating) > 5)) e.rating = 'Rating must be 0-5';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting.current) return;
    if (!validate()) return;
    submitting.current = true;
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        rating: form.rating === '' ? 0 : Number(form.rating),
      });
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  }

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-3">
      <div>
        <label className="block text-sm mb-1">Title</label>
        <input value={form.title} onChange={(e) => set('title', e.target.value)} className="w-full border rounded px-2 py-1.5" />
        {errors.title && <p className="text-red-600 text-xs">{errors.title}</p>}
      </div>
      <div>
        <label className="block text-sm mb-1">Category</label>
        <input value={form.category} onChange={(e) => set('category', e.target.value)} className="w-full border rounded px-2 py-1.5" />
        {errors.category && <p className="text-red-600 text-xs">{errors.category}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Price</label>
          <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} className="w-full border rounded px-2 py-1.5" />
          {errors.price && <p className="text-red-600 text-xs">{errors.price}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Stock</label>
          <input type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} className="w-full border rounded px-2 py-1.5" />
          {errors.stock && <p className="text-red-600 text-xs">{errors.stock}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">Rating (0-5)</label>
        <input type="number" step="0.1" value={form.rating} onChange={(e) => set('rating', e.target.value)} className="w-full border rounded px-2 py-1.5" />
        {errors.rating && <p className="text-red-600 text-xs">{errors.rating}</p>}
      </div>
      <div>
        <label className="block text-sm mb-1">Thumbnail URL</label>
        <input value={form.thumbnail} onChange={(e) => set('thumbnail', e.target.value)} className="w-full border rounded px-2 py-1.5" />
      </div>
      <div>
        <label className="block text-sm mb-1">Description</label>
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="w-full border rounded px-2 py-1.5" rows={3} />
      </div>
      <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}

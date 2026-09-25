'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Protected from '../../../../components/Protected';
import ProductForm from '../../../../components/ProductForm';
import Loader from '../../../../components/Loader';
import api from '../../../../lib/axios';
import { editProduct, getOverrideById } from '../../../../lib/overrides';

function EditInner() {
  const { id } = useParams();
  const router = useRouter();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const override = getOverrideById(id);
    if (override && !override.deleted) {
      setInitial(override);
      setLoading(false);
      return;
    }
    api
      .get(`/products/${id}`)
      .then((res) => setInitial(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(data) {
    try {
      await api.put(`/products/${id}`, data);
    } catch {
      // keep local edit even if the API call fails, see NOTES.md
    }
    editProduct(id, data, initial);
    router.push(`/products/${id}`);
  }

  if (loading) return <Loader />;

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Edit Product</h1>
      <ProductForm initial={initial} onSubmit={handleSubmit} submitLabel="Save" />
    </div>
  );
}

export default function EditProductPage() {
  return (
    <Protected>
      <EditInner />
    </Protected>
  );
}

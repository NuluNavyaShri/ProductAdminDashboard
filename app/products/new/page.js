'use client';
import { useRouter } from 'next/navigation';
import Protected from '../../../components/Protected';
import ProductForm from '../../../components/ProductForm';
import api from '../../../lib/axios';
import { addProduct } from '../../../lib/overrides';

function NewInner() {
  const router = useRouter();

  async function handleSubmit(data) {
    try {
      await api.post('/products/add', data); // API accepts this but never actually persists it
    } catch {
      // even if the API call fails we still keep the product locally, see NOTES.md
    }
    const created = addProduct(data);
    router.push(`/products/${created.id}`);
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Add Product</h1>
      <ProductForm onSubmit={handleSubmit} submitLabel="Create" />
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Protected>
      <NewInner />
    </Protected>
  );
}

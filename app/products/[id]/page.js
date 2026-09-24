'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/axios';
import Protected from '../../../components/Protected';
import Loader from '../../../components/Loader';
import { getOverrideById } from '../../../lib/overrides';

function DetailInner() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    setNotFound(false);

    const override = getOverrideById(id);
    if (override?.deleted) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    api
      .get(`/products/${id}`)
      .then((res) => setProduct(override ? { ...res.data, ...override } : res.data))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
        else setError('Failed to load product.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;

  if (notFound) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold mb-2">Product not found</h2>
        <Link href="/products" className="text-blue-600">
          Back to products
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-600 mb-2">{error}</p>
        <Link href="/products" className="text-blue-600">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Link href="/products" className="text-blue-600 text-sm">
        &larr; Back
      </Link>
      <div className="grid md:grid-cols-2 gap-6 mt-3">
        <div className="flex gap-2 overflow-x-auto">
          {(product.images?.length ? product.images : [product.thumbnail]).map((img, i) => (
            <img key={i} src={img} alt={product.title} className="w-32 h-32 object-cover rounded" />
          ))}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="text-gray-500">{product.category}</p>
          <p className="text-xl mt-2">${product.price}</p>
          <p className="mt-2">{product.description}</p>
          <p className="mt-1 text-sm">
            ⭐ {product.rating} • Stock: {product.stock}
          </p>
          <Link href={`/products/${id}/edit`} className="inline-block mt-3 bg-blue-600 text-white px-3 py-1.5 rounded">
            Edit
          </Link>
        </div>
      </div>

      <h2 className="text-lg font-semibold mt-8 mb-2">Reviews</h2>
      {product.reviews?.length ? (
        <div className="space-y-3">
          {product.reviews.map((r, i) => (
            <div key={i} className="border rounded p-3">
              <p className="font-medium">
                {r.reviewerName} • ⭐{r.rating}
              </p>
              <p className="text-sm text-gray-600">{r.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No reviews yet.</p>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Protected>
      <DetailInner />
    </Protected>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Wrap any page that requires login in this. Checks localStorage on mount
// (can't check on the server since the token lives in the browser only).
export default function Protected({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return <div className="p-8 text-center text-gray-500">Checking session...</div>;
  return children;
}

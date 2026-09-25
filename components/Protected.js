'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Wrap any page that requires login in this. Checks localStorage on mount
// (can't check on the server since the token lives in the browser only),
// and auto-logs-out once the 5-minute JWT expiry is reached, even if the
// server-side 401 hasn't fired yet.
export default function Protected({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const expiry = Number(localStorage.getItem('tokenExpiry') || 0);

    if (!token) {
      router.replace('/login');
      return;
    }

    const msLeft = expiry - Date.now();
    if (expiry && msLeft <= 0) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiry');
      router.replace('/login');
      return;
    }

    setReady(true);

    // Auto-logout exactly when the token expires, so a user sitting on the
    // page doesn't keep working with a dead session.
    let timer;
    if (expiry) {
      timer = setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiry');
        router.replace('/login');
      }, msLeft);
    }
    return () => clearTimeout(timer);
  }, [router]);

  if (!ready) return <div className="p-8 text-center text-gray-500">Checking session...</div>;
  return children;
}

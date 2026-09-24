'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('emilys');
  const [password, setPassword] = useState('emilyspass');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false); // blocks double-click submits

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('https://dummyjson.com/auth/login', { username, password });
      const token = res.data.accessToken || res.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(res.data));
      router.push('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your username and password.');
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 w-80">
        <h1 className="text-xl font-semibold mb-4">Admin Login</h1>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <label className="block text-sm mb-1">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border rounded px-2 py-1 mb-3" />
        <label className="block text-sm mb-1">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded px-2 py-1 mb-4" />
        <button disabled={loading} className="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-50">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

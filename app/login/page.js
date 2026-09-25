'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      // expiresInMins asks DummyJSON to issue a JWT that expires in 5
      // minutes, since this is an admin dashboard and short sessions are
      // safer than long-lived ones.
      const res = await axios.post('https://dummyjson.com/auth/login', {
        username,
        password,
        expiresInMins: 5,
      });
      const token = res.data.accessToken || res.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(res.data));
      localStorage.setItem('tokenExpiry', String(Date.now() + 5 * 60 * 1000));
      router.push('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your username and password.');
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  }

  function fillDemoCredentials() {
    setUsername('emilys');
    setPassword('emilyspass');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-sm border border-slate-100">
        <div className="mb-6 text-center">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 font-bold text-lg">
            P
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Product Admin</h1>
          <p className="text-sm text-slate-500">Sign in to manage your catalog</p>
        </div>

        {error && <p className="text-red-600 text-sm mb-3 bg-red-50 border border-red-100 rounded px-3 py-2">{error}</p>}

        <label className="block text-sm mb-1 text-slate-600">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <label className="block text-sm mb-1 text-slate-600">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors text-white rounded-lg py-2.5 font-medium disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="mt-4 text-center">
          <button type="button" onClick={fillDemoCredentials} className="text-xs text-indigo-600 hover:underline">
            Use demo credentials
          </button>
        </div>
      </form>
    </div>
  );
}

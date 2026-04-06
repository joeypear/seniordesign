import React, { useState } from 'react';
import { login, register } from '@/lib/localAuth';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const { refreshUser } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await register(email, password, username);
      }
      refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-orange-50 via-white to-teal-50 dark:from-[#161B2E] dark:via-[#161B2E] dark:to-[#161B2E] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/dr-monster-logo.png"
            alt="DR Monster Logo"
            className="w-16 h-16 mb-3"
          />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            DR{' '}
            <span style={{ background: 'linear-gradient(to right, #f97316, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Monster
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Diabetic Retinopathy Detection</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#22263A] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2E3350] p-6">
          {/* Tab toggle */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-[#2C3150] p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#3D4470] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#3D4470] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2E3350] bg-gray-50 dark:bg-[#1A1D2E] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2E3350] bg-gray-50 dark:bg-[#1A1D2E] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2E3350] bg-gray-50 dark:bg-[#1A1D2E] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #f97316, #f43f5e)' }}
            >
              {loading
                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          Your data is stored locally on this device.
        </p>
      </div>
    </div>
  );
}

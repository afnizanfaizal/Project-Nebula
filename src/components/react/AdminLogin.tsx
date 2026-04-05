import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError('Firebase Auth is not configured.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? 'Sign-in failed.');
        return;
      }

      window.location.href = '/admin/dashboard';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Firebase auth error codes are verbose — trim to the useful part
      setError(msg.replace('Firebase: ', '').replace(/ \(auth\/.*\)\.?$/, ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-6 min-h-screen">
      <div className="w-full max-w-xs">
        {/* Lock icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
        </div>

        <h1 className="text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1 tracking-tight">
          Admin Access
        </h1>
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-500 mb-8">
          Sign in with your admin account
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
            placeholder="Email"
            className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800
                       bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm
                       placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                       focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100
                       focus:border-zinc-900 dark:focus:border-zinc-100 transition"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-zinc-200 dark:border-zinc-800
                         bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm
                         placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                         focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100
                         focus:border-zinc-900 dark:focus:border-zinc-100 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center justify-center w-10
                         text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400
                         cursor-pointer transition-colors"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100
                       text-white dark:text-zinc-900 text-sm font-semibold
                       hover:bg-zinc-700 dark:hover:bg-white active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-8 text-center pt-8 border-t border-zinc-100 dark:border-zinc-900">
          <a
            href="/"
            className="group inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

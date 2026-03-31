import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export default function AdminLogin() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

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
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
            <svg className="w-4.5 h-4.5 text-zinc-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
        </div>

        <h1 className="text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1 tracking-tight">
          Admin Access
        </h1>
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-500 mb-8">
          Sign in with your Firebase account
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
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="Password"
            className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800
                       bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm
                       placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                       focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100
                       focus:border-zinc-900 dark:focus:border-zinc-100 transition"
          />
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
      </div>
    </div>
  );
}

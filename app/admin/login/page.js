'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from         = searchParams.get('from') || '/admin';

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(from);
    } else {
      setError('Incorrect password. Try again.');
      setPassword('');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Enter admin password"
        autoFocus
        required
        style={{
          width: '100%', padding: '12px 14px', fontSize: '0.95rem',
          border: `1.5px solid ${error ? '#E8431A' : 'rgba(0,0,0,0.15)'}`,
          borderRadius: 10, outline: 'none', fontFamily: 'inherit',
          boxSizing: 'border-box', marginBottom: 12,
        }}
      />
      {error && <p style={{ color: '#E8431A', fontSize: '0.8rem', marginBottom: 10 }}>{error}</p>}
      <button
        type="submit"
        disabled={loading || !password}
        style={{
          width: '100%', padding: '12px', background: '#111827', color: '#fff',
          border: 'none', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          opacity: loading || !password ? 0.5 : 1,
        }}
      >
        {loading ? 'Checking…' : 'Sign In'}
      </button>
    </form>
  );
}

export default function AdminLogin() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F8F7F4', fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{
        background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 16,
        padding: '40px 36px', width: '100%', maxWidth: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/logo.png" alt="City Tour Guide" style={{ height: 52, margin: '0 auto 16px' }} />
          <p style={{ fontSize: '0.78rem', color: '#6B7280', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            Admin Access
          </p>
        </div>
        <Suspense fallback={<div style={{ height: 120 }} />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

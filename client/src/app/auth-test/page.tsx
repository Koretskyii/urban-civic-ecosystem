'use client';

import { useState } from 'react';
import { useLogin, useRegister, useLogout, useCurrentUser } from '@/hooks';
import { useAuthStore } from '@/store';

export default function AuthTestPage() {
  const [tab, setTab] = useState<'login' | 'register'>('register');

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Hooks
  const login = useLogin();
  const register = useRegister();
  const logout = useLogout();
  const { data: profile, isLoading: profileLoading } = useCurrentUser();

  // Store
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleRegister = () => {
    register.mutate({ name, email, password });
  };

  const handleLogin = () => {
    login.mutate({ email, password });
  };

  const handleLogout = () => {
    logout.mutate();
  };

  const error = login.error || register.error || logout.error;

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', fontFamily: 'monospace' }}>
      <h1>🔐 Auth Test Page</h1>

      {/* ───── Auth State ───── */}
      <fieldset style={{ marginBottom: 20, padding: 16 }}>
        <legend><strong>Zustand Store State</strong></legend>
        <pre style={{ fontSize: 13, overflow: 'auto' }}>
          {JSON.stringify({ isAuthenticated, user, token: token ? `${token.slice(0, 20)}…` : null }, null, 2)}
        </pre>
      </fieldset>

      {/* ───── Profile Query ───── */}
      <fieldset style={{ marginBottom: 20, padding: 16 }}>
        <legend><strong>useCurrentUser() query</strong></legend>
        {profileLoading ? (
          <p>⏳ Loading profile…</p>
        ) : profile ? (
          <pre style={{ fontSize: 13 }}>{JSON.stringify(profile, null, 2)}</pre>
        ) : (
          <p style={{ color: '#888' }}>Not authenticated — query disabled</p>
        )}
      </fieldset>

      {/* ───── Error ───── */}
      {error && (
        <div style={{ background: '#fee', border: '1px solid #c00', padding: 12, marginBottom: 16, borderRadius: 6 }}>
          <strong>❌ Error:</strong> {(error as Error).message}
        </div>
      )}

      {/* ───── Authenticated Actions ───── */}
      {isAuthenticated ? (
        <div>
          <p>✅ Ви авторизовані як <strong>{user?.name}</strong></p>
          <button
            onClick={handleLogout}
            disabled={logout.isPending}
            style={{ padding: '10px 24px', cursor: 'pointer', background: '#c00', color: '#fff', border: 'none', borderRadius: 6 }}
          >
            {logout.isPending ? 'Logging out…' : '🚪 Logout'}
          </button>
        </div>
      ) : (
        <>
          {/* ───── Tabs ───── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => setTab('register')}
              style={{
                padding: '8px 20px',
                background: tab === 'register' ? '#333' : '#eee',
                color: tab === 'register' ? '#fff' : '#333',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Register
            </button>
            <button
              onClick={() => setTab('login')}
              style={{
                padding: '8px 20px',
                background: tab === 'login' ? '#333' : '#eee',
                color: tab === 'login' ? '#fff' : '#333',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Login
            </button>
          </div>

          {/* ───── Form ───── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tab === 'register' && (
              <input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
              />
            )}
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
            />
            <button
              onClick={tab === 'register' ? handleRegister : handleLogin}
              disabled={register.isPending || login.isPending}
              style={{
                padding: '10px 24px',
                cursor: 'pointer',
                background: '#0070f3',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 'bold',
              }}
            >
              {(register.isPending || login.isPending)
                ? 'Processing…'
                : tab === 'register'
                  ? '📝 Register'
                  : '🔑 Login'}
            </button>
          </div>
        </>
      )}

      {/* ───── Raw Token ───── */}
      {token && (
        <details style={{ marginTop: 20 }}>
          <summary style={{ cursor: 'pointer' }}>🔑 Raw Token</summary>
          <pre style={{ fontSize: 11, wordBreak: 'break-all', whiteSpace: 'pre-wrap', marginTop: 8 }}>
            {token}
          </pre>
        </details>
      )}
    </div>
  );
}

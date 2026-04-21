import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await loginAsGuest();
      navigate('/');
    } catch (err) {
      setError('Guest login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.logo}>
        <div style={styles.logoMark}>⚡</div>
        CODESYNC
      </div>

      <div style={styles.card}>
        {/* Tabs */}
        <div style={styles.tabs}>
          <button style={{ ...styles.tab, ...(tab === 'login' ? styles.tabActive : {}) }} onClick={() => setTab('login')}>Sign In</button>
          <button style={{ ...styles.tab, ...(tab === 'register' ? styles.tabActive : {}) }} onClick={() => setTab('register')}>Register</button>
        </div>

        <h2 style={styles.title}>{tab === 'login' ? 'Welcome back' : 'Create account'}</h2>
        <p style={styles.sub}>{tab === 'login' ? 'Sign in to your CodeSync account' : 'Join CodeSync to collaborate in real time'}</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={submit}>
          {tab === 'register' && (
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input style={styles.input} name="username" value={form.username} onChange={handle} placeholder="cooldev99" required />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required />
          </div>
          <button type="submit" style={styles.btnPrimary} disabled={loading}>
            {loading ? 'Please wait...' : (tab === 'login' ? 'Sign In →' : 'Create Account →')}
          </button>
        </form>

        <div style={styles.divider}><span>or</span></div>
        <button style={styles.btnGhost} onClick={handleGuest} disabled={loading}>
          👤 Continue as Guest
        </button>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, padding: 20 },
  logo: { fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 40, display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: { width: 32, height: 32, background: 'linear-gradient(135deg,#7c6dfa,#a78bfa)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  card: { background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 16, padding: 40, width: '100%', maxWidth: 400 },
  tabs: { display: 'flex', background: 'var(--bg3)', borderRadius: 8, padding: 4, marginBottom: 28 },
  tab: { flex: 1, textAlign: 'center', padding: '8px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--txt2)', transition: 'all 0.2s' },
  tabActive: { background: 'var(--bg4)', color: 'var(--txt)' },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 6 },
  sub: { fontSize: 13, color: 'var(--txt2)', marginBottom: 24 },
  error: { background: 'rgba(248,113,113,0.1)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--txt2)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' },
  input: { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: 'var(--txt)', outline: 'none' },
  btnPrimary: { width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: 11, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  divider: { textAlign: 'center', color: 'var(--txt3)', fontSize: 12, margin: '20px 0', position: 'relative' },
  btnGhost: { width: '100%', background: 'var(--bg3)', color: 'var(--txt2)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};

export default AuthPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const LobbyPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // 'create' | 'join'
  const [roomName, setRoomName] = useState('My Coding Session');
  const [language, setLanguage] = useState('python');
  const [joinId, setJoinId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createRoom = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/rooms/create', { name: roomName, language });
      navigate(`/room/${data.room.roomId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room.');
    } finally { setLoading(false); }
  };

  const joinRoom = async () => {
    if (!joinId.trim()) { setError('Enter a Room ID.'); return; }
    setLoading(true); setError('');
    try {
      await api.post(`/rooms/${joinId.trim().toUpperCase()}/join`);
      navigate(`/room/${joinId.trim().toUpperCase()}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Room not found.');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>
          <div style={s.logoMark}>⚡</div> CODESYNC
        </div>
        <div style={s.userInfo}>
          <span style={{ color: 'var(--txt2)', fontSize: 13 }}>{user?.username}</span>
          <button style={s.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Hero */}
      <div style={s.hero}>
        <h1 style={s.heroTitle}>Hello, <span style={{ color: 'var(--accent)' }}>{user?.username}</span> 👋</h1>
        <p style={s.heroSub}>Start a collaborative session or jump into an existing one</p>
      </div>

      {/* Cards */}
      <div style={s.grid}>
        <div style={s.card} onClick={() => { setModal('create'); setError(''); }}>
          <div style={{ ...s.cardIcon, background: 'var(--accent-glow)' }}>✦</div>
          <h3 style={s.cardTitle}>Create Room</h3>
          <p style={s.cardDesc}>Start a new collaborative session and invite others with a unique Room ID</p>
        </div>
        <div style={s.card} onClick={() => { setModal('join'); setError(''); }}>
          <div style={{ ...s.cardIcon, background: 'rgba(45,212,191,0.15)' }}>⇲</div>
          <h3 style={s.cardTitle}>Join Room</h3>
          <p style={s.cardDesc}>Enter a Room ID shared by the session owner to collaborate in real time</p>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <button style={s.closeBtn} onClick={() => setModal(null)}>✕</button>
            <h3 style={s.modalTitle}>{modal === 'create' ? '✦ Create New Room' : '⇲ Join a Room'}</h3>

            {error && <div style={s.error}>{error}</div>}

            {modal === 'create' ? (
              <>
                <label style={s.label}>Room Name</label>
                <input style={s.input} value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="My Coding Session" />
                <label style={s.label}>Language</label>
                <select style={s.input} value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                </select>
                <button style={s.btnPrimary} onClick={createRoom} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Room & Start →'}
                </button>
              </>
            ) : (
              <>
                <label style={s.label}>Room ID</label>
                <input style={{ ...s.input, fontFamily: 'var(--mono)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 16 }}
                  value={joinId} onChange={e => setJoinId(e.target.value.toUpperCase())}
                  placeholder="SYNC-XXXX" />
                <button style={s.btnPrimary} onClick={joinRoom} disabled={loading}>
                  {loading ? 'Joining...' : 'Join Room →'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  header: { width: '100%', maxWidth: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px' },
  logo: { display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 14, letterSpacing: '0.15em', color: 'var(--accent)', textTransform: 'uppercase' },
  logoMark: { width: 28, height: 28, background: 'linear-gradient(135deg,#7c6dfa,#a78bfa)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 },
  userInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  logoutBtn: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: 'var(--txt2)', cursor: 'pointer' },
  hero: { textAlign: 'center', margin: '40px 0 48px' },
  heroTitle: { fontSize: 36, fontWeight: 800, marginBottom: 10 },
  heroSub: { fontSize: 15, color: 'var(--txt2)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 700, width: '100%', padding: '0 20px' },
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, cursor: 'pointer', transition: 'all 0.2s' },
  cardIcon: { width: 48, height: 48, borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 },
  cardTitle: { fontSize: 18, fontWeight: 700, marginBottom: 8 },
  cardDesc: { fontSize: 13, color: 'var(--txt2)', lineHeight: 1.6 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modal: { background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, position: 'relative' },
  closeBtn: { position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: 'var(--txt3)', fontSize: 18, cursor: 'pointer' },
  modalTitle: { fontSize: 20, fontWeight: 700, marginBottom: 20 },
  error: { background: 'rgba(248,113,113,0.1)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--txt2)', marginBottom: 6, marginTop: 16, letterSpacing: '0.05em', textTransform: 'uppercase' },
  input: { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: 'var(--txt)', outline: 'none', fontFamily: 'var(--sans)' },
  btnPrimary: { width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: 11, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 24 },
};

export default LobbyPage;

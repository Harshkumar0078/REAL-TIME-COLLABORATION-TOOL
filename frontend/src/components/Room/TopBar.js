import React, { useState } from 'react';
import { LANGUAGES, getLanguage } from '../../utils/languages';

const USER_COLORS = ['#7c6dfa','#2dd4bf','#f472b6','#fbbf24','#60a5fa','#34d399','#f87171','#a78bfa'];

const TopBar = ({ roomId, language, users, isRunning, aiOpen, onLanguageChange, onRun, onSave, onToggleAI, onLeave }) => {
  const [langOpen, setLangOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const lang = getLanguage(language);

  const copyRoomId = () => {
    navigator.clipboard?.writeText(roomId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={s.bar}>
      <div style={s.logo}>
        <div style={s.logoMark}>⚡</div>
        <span>CODESYNC</span>
      </div>
      <div style={s.divider} />

      {/* Room ID */}
      <div style={s.roomLabel} onClick={copyRoomId} title="Click to copy Room ID">
        <div style={s.liveDot} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{roomId}</span>
        <span style={{ color: 'var(--txt3)', fontSize: 11 }}>{copied ? '✓ Copied' : '⎘'}</span>
      </div>

      {/* Language picker */}
      <div style={{ position: 'relative' }}>
        <div style={s.langBtn} onClick={() => setLangOpen(!langOpen)}>
          <div style={{ ...s.langDot, background: lang.color }} />
          <span>{lang.name}</span>
          <span style={{ color: 'var(--txt3)' }}>▾</span>
        </div>
        {langOpen && (
          <div style={s.langDropdown}>
            {LANGUAGES.map((l) => (
              <div key={l.id} style={s.langOption} onClick={() => { onLanguageChange(l.id); setLangOpen(false); }}>
                <div style={{ ...s.langDot, background: l.color }} />
                {l.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* User avatars */}
      <div style={s.avatars}>
        {users.slice(0, 5).map((u, i) => (
          <div key={u.socketId} title={u.username} style={{ ...s.avatar, background: u.color || USER_COLORS[i % USER_COLORS.length], marginLeft: i === 0 ? 0 : -6, zIndex: users.length - i }}>
            {u.username?.[0]?.toUpperCase() || '?'}
          </div>
        ))}
        {users.length > 5 && <span style={{ fontSize: 11, color: 'var(--txt2)', marginLeft: 6 }}>+{users.length - 5}</span>}
      </div>
      <span style={{ fontSize: 12, color: 'var(--txt2)', marginLeft: 6 }}>{users.length} online</span>

      <div style={s.divider} />

      <button style={s.iconBtn} onClick={onSave} title="Save snapshot">💾 Save</button>
      <button style={s.iconBtn} onClick={copyRoomId} title="Share room">🔗 Share</button>
      <button style={{ ...s.iconBtn, ...s.aiBtnStyle, ...(aiOpen ? s.aiActive : {}) }} onClick={onToggleAI}>✦ AI</button>
      <button style={{ ...s.iconBtn, ...s.runBtn }} onClick={onRun} disabled={isRunning}>
        {isRunning ? '⏳ Running' : '▶ Run'}
      </button>
      <button style={s.leaveBtn} onClick={onLeave} title="Leave room">← Leave</button>
    </div>
  );
};

const s = {
  bar: { height: 48, background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0, zIndex: 10 },
  logo: { fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 7, letterSpacing: '0.05em', marginRight: 4 },
  logoMark: { width: 22, height: 22, background: 'linear-gradient(135deg,#7c6dfa,#a78bfa)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 },
  divider: { width: 1, height: 24, background: 'var(--border)' },
  roomLabel: { display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' },
  langBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--txt)' },
  langDot: { width: 8, height: 8, borderRadius: '50%' },
  langDropdown: { position: 'absolute', top: '110%', left: 0, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: 6, zIndex: 100, minWidth: 140, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' },
  langOption: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: 'var(--txt2)' },
  avatars: { display: 'flex', alignItems: 'center' },
  avatar: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, border: '2px solid var(--bg2)', cursor: 'default' },
  iconBtn: { display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 600, color: 'var(--txt2)', cursor: 'pointer' },
  aiBtnStyle: { background: 'var(--accent-glow)', borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: 700 },
  aiActive: { background: 'rgba(124,109,250,0.3)' },
  runBtn: { background: 'var(--green-dim)', borderColor: 'var(--green)', color: 'var(--green)', fontWeight: 700 },
  leaveBtn: { background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 600, color: 'var(--txt3)', cursor: 'pointer' },
};

export default TopBar;

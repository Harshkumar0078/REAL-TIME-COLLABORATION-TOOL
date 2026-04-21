import React, { useState, useEffect, useRef } from 'react';

const ChatPanel = ({ messages, currentUser, onSend }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const msg = input.trim();
    if (!msg) return;
    setInput('');
    onSend(msg);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const formatTime = (iso) => {
    const d = iso ? new Date(iso) : new Date();
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  };

  return (
    <div style={s.panel}>
      <div style={s.header}>💬 Chat</div>
      <div style={s.messages}>
        {messages.map((msg, i) => (
          msg.system ? (
            <div key={msg.id || i} style={s.system}>{msg.message}</div>
          ) : (
            <div key={msg.id || i} style={s.msg}>
              <div style={s.msgHeader}>
                <span style={{ ...s.msgUser, color: msg.color || 'var(--accent)' }}>{msg.username}</span>
                <span style={s.msgTime}>{formatTime(msg.timestamp)}</span>
              </div>
              <div style={s.msgBody}>{msg.message}</div>
            </div>
          )
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={s.inputRow}>
        <input
          style={s.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message..."
          maxLength={500}
        />
        <button style={s.sendBtn} onClick={send}>→</button>
      </div>
    </div>
  );
};

const s = {
  panel: { width: 260, display: 'flex', flexDirection: 'column', background: 'var(--bg2)', flexShrink: 0, overflow: 'hidden' },
  header: { padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--txt3)', flexShrink: 0 },
  messages: { flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 },
  system: { fontSize: 11, color: 'var(--txt3)', fontStyle: 'italic', textAlign: 'center', padding: '2px 0' },
  msg: { fontSize: 12, lineHeight: 1.4 },
  msgHeader: { display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 },
  msgUser: { fontSize: 11, fontWeight: 700 },
  msgTime: { fontSize: 10, color: 'var(--txt3)' },
  msgBody: { color: 'var(--txt2)', paddingLeft: 2, wordBreak: 'break-word' },
  inputRow: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderTop: '1px solid var(--border)' },
  input: { flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 9px', fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--txt)', outline: 'none' },
  sendBtn: { background: 'var(--accent)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, flexShrink: 0 },
};

export default ChatPanel;

import React, { useState, useRef, useEffect } from 'react';
import api from '../../utils/api';

const QUICK_ACTIONS = [
  { label: '🔍 Explain',    action: 'explain',  prompt: 'Explain what this code does' },
  { label: '🐛 Fix Bugs',   action: 'fix',      prompt: 'Find and fix bugs in this code' },
  { label: '⚡ Optimize',   action: 'optimize', prompt: 'Optimize this code' },
  { label: '🧪 Write Tests',action: 'test',     prompt: 'Write unit tests for this code' },
];

// Renders markdown-like content: code blocks, inline code, bold, newlines
const renderContent = (content) => {
  if (!content) return null;

  // Split by triple-backtick code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    // Triple backtick code block
    if (part.startsWith('```')) {
      const lines    = part.split('\n');
      const lang     = lines[0].replace('```', '').trim();
      const codeText = lines.slice(1).join('\n').replace(/```$/, '').trimEnd();
      return (
        <div key={i} style={s.codeBlockWrap}>
          {lang && <div style={s.codeLang}>{lang}</div>}
          <pre style={s.codeBlock}>{codeText}</pre>
        </div>
      );
    }

    // Regular text — handle inline code, bold, and newlines
    return (
      <span key={i}>
        {part.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((chunk, j) => {
          if (chunk.startsWith('`') && chunk.endsWith('`')) {
            return <code key={j} style={s.inlineCode}>{chunk.slice(1, -1)}</code>;
          }
          if (chunk.startsWith('**') && chunk.endsWith('**')) {
            return <strong key={j}>{chunk.slice(2, -2)}</strong>;
          }
          // Preserve newlines
          return chunk.split('\n').map((line, k, arr) => (
            <span key={k}>
              {line}
              {k < arr.length - 1 && <br />}
            </span>
          ));
        })}
      </span>
    );
  });
};

const AIPanel = ({ code, language, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: `Hi! I can explain your code, find bugs, suggest optimizations, or write tests. What would you like help with?` }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef  = useRef(null);
  const isSending  = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (promptText, action) => {
    if (isSending.current || loading) return;
    const msg = (promptText || input).trim();
    if (!msg) return;

    isSending.current = true;
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: msg }]);

    try {
      const { data } = await api.post('/ai/assist', {
        prompt:   msg,
        code:     code?.substring(0, 3000) || '',
        language,
        action,
      });
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'AI request failed.';
      setMessages(prev => [...prev, { role: 'ai', content: `⚠️ ${errMsg}`, isError: true }]);
    } finally {
      setLoading(false);
      isSending.current = false;
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={s.header}>
        <span style={{ color: 'var(--accent)', fontWeight: 800 }}>✦ AI Assistant</span>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
      </div>

      {/* Quick actions */}
      <div style={s.quickActions}>
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.action}
            style={s.quickBtn}
            onClick={() => send(a.prompt, a.action)}
            disabled={loading}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={s.messages}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...s.msg,
              ...(msg.role === 'user' ? s.userMsg : s.aiMsg),
              ...(msg.isError ? s.errorMsg : {}),
            }}
          >
            <div style={s.msgLabel}>{msg.role === 'user' ? 'You' : '✦ AI'}</div>
            <div style={s.msgContent}>
              {renderContent(msg.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ ...s.msg, ...s.aiMsg }}>
            <div style={s.msgLabel}>✦ AI</div>
            <div style={s.thinking}>
              <span style={s.dot} />
              <span style={{ ...s.dot, animationDelay: '0.2s' }} />
              <span style={{ ...s.dot, animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={s.inputRow}>
        <input
          style={s.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about your code..."
          disabled={loading}
        />
        <button
          style={{ ...s.sendBtn, opacity: (loading || !input.trim()) ? 0.5 : 1 }}
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
        >
          →
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

const s = {
  panel:        { width: 360, background: 'var(--bg2)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' },
  header:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  closeBtn:     { background: 'none', border: 'none', color: 'var(--txt3)', fontSize: 16, cursor: 'pointer' },
  quickActions: { display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  quickBtn:     { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 600, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'var(--sans)' },
  messages:     { flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 },
  msg:          { borderRadius: 10, padding: '10px 13px', fontSize: 13, lineHeight: 1.7 },
  aiMsg:        { background: 'var(--bg3)', border: '1px solid var(--border)' },
  userMsg:      { background: 'var(--accent-glow)', border: '1px solid rgba(124,109,250,0.2)' },
  errorMsg:     { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' },
  msgLabel:     { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, color: 'var(--txt3)' },
  msgContent:   { color: 'var(--txt2)', wordBreak: 'break-word', overflowWrap: 'break-word' },
  codeBlockWrap:{ background: 'var(--bg)', borderRadius: 8, overflow: 'hidden', marginTop: 8, marginBottom: 4, border: '1px solid var(--border)' },
  codeLang:     { background: 'var(--bg4)', padding: '3px 10px', fontSize: 10, fontWeight: 700, color: 'var(--txt3)', letterSpacing: '0.08em', textTransform: 'uppercase' },
  codeBlock:    { margin: 0, padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--teal)', overflowX: 'auto', whiteSpace: 'pre', lineHeight: 1.6 },
  inlineCode:   { background: 'var(--bg)', fontFamily: 'var(--mono)', fontSize: 11, padding: '1px 5px', borderRadius: 3, color: 'var(--teal)', border: '1px solid var(--border)' },
  inputRow:     { display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--border)', flexShrink: 0 },
  input:        { flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 11px', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--txt)', outline: 'none' },
  sendBtn:      { background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '0 14px', color: '#fff', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
  thinking:     { display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' },
  dot:          { width: 6, height: 6, borderRadius: '50%', background: 'var(--txt3)', display: 'inline-block', animation: 'bounce 1.2s infinite' },
};

export default AIPanel;

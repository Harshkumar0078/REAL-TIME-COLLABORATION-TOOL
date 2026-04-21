import React, { useState, useEffect, useRef } from 'react';

const TYPE_COLORS = {
  success: '#22c55e',
  error:   '#f87171',
  info:    '#60a5fa',
  cmd:     '#555b73',
  default: '#e2e4f0',
};

const ConsolePanel = ({ output, isRunning, onRun, onClear }) => {
  const [stdin, setStdin] = useState('');
  const [stdinOpen, setStdinOpen] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const handleRun = () => {
    onRun(stdin); // pass stdin value up
  };

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={s.header}>
        <span>🖥 Console</span>
        {isRunning && <span style={{ fontSize: 11, color: 'var(--amber)', marginLeft: 8 }}>● Running...</span>}
        <div style={s.actions}>
          <button
            style={{ ...s.btn, ...(stdinOpen ? s.stdinBtnActive : {}) }}
            onClick={() => setStdinOpen(!stdinOpen)}
            title="Provide input for your program (stdin)"
          >
            ⌨ Input
          </button>
          <button style={s.btn} onClick={onClear}>Clear</button>
          <button style={{ ...s.btn, ...s.runBtn }} onClick={handleRun} disabled={isRunning}>
            {isRunning ? '⏳' : '▶'} Run
          </button>
        </div>
      </div>

      {/* Stdin input area */}
      {stdinOpen && (
        <div style={s.stdinBox}>
          <div style={s.stdinLabel}>
            Program Input (stdin) — one value per line
          </div>
          <textarea
            style={s.stdinArea}
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder={'e.g.\n5\nhello world\n42'}
            rows={3}
            spellCheck={false}
          />
        </div>
      )}

      {/* Output */}
      <div style={s.output}>
        {output.length === 0 && (
          <div style={{ color: 'var(--txt3)', fontSize: 12 }}>
            » Output will appear here after running code
            {!stdinOpen && <span style={{ color: 'var(--txt3)' }}> · click ⌨ Input if your program needs user input</span>}
          </div>
        )}
        {output.map((line) => (
          <div
            key={line.id}
            style={{ ...s.line, color: TYPE_COLORS[line.type] || TYPE_COLORS.default }}
          >
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

const s = {
  panel:        { flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', borderRight: '1px solid var(--border)', overflow: 'hidden' },
  header:       { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--txt3)', flexShrink: 0 },
  actions:      { marginLeft: 'auto', display: 'flex', gap: 6 },
  btn:          { background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontFamily: 'var(--sans)', fontWeight: 600, color: 'var(--txt3)', cursor: 'pointer' },
  stdinBtnActive: { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-glow)' },
  runBtn:       { background: 'var(--green-dim)', borderColor: 'var(--green)', color: 'var(--green)' },
  stdinBox:     { padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0 },
  stdinLabel:   { fontSize: 10, fontWeight: 700, color: 'var(--txt3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 },
  stdinArea:    { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--teal)', outline: 'none', resize: 'vertical', lineHeight: 1.6 },
  output:       { flex: 1, overflowY: 'auto', padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.7 },
  line:         { marginBottom: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
};

export default ConsolePanel;

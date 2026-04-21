import React from 'react';

const Sidebar = ({ users, snapshots, currentUser, onRestoreSnapshot, onSaveSnapshot }) => {
  return (
    <div style={s.sidebar}>
      {/* Collaborators */}
      <div style={s.section}>
        <div style={s.sectionTitle}>
          <span>Collaborators</span>
          <span style={s.count}>{users.length}</span>
        </div>
        {users.length === 0 && <div style={s.empty}>No users online</div>}
        {users.map((u) => (
          <div key={u.socketId} style={s.userItem}>
            <div style={{ ...s.avatar, background: u.color || '#7c6dfa' }}>
              {u.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={s.userInfo}>
              <div style={s.userName}>
                {u.username}
                {u.userId === currentUser?.id && <span style={s.youBadge}>you</span>}
              </div>
              <div style={s.userStatus}>Online</div>
            </div>
            <div style={s.onlineDot} />
          </div>
        ))}
      </div>

      <div style={s.hr} />

      {/* Version History */}
      <div style={s.section}>
        <div style={s.sectionTitle}>
          <span>Versions</span>
          <button style={s.smallBtn} onClick={onSaveSnapshot}>+ Save</button>
        </div>
        {snapshots.length === 0 && <div style={s.empty}>No snapshots yet</div>}
        {snapshots.map((snap) => (
          <div key={snap._id || snap.id} style={s.versionItem} onClick={() => onRestoreSnapshot(snap._id || snap.id)} title="Click to restore">
            <div style={s.vDot} />
            <div>
              <div style={s.vLabel}>{snap.label || 'Snapshot'}</div>
              <div style={s.vMeta}>{snap.savedByUsername} · {new Date(snap.createdAt).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const s = {
  sidebar: { width: 220, background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' },
  section: { padding: '14px 14px 8px' },
  sectionTitle: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  count: { background: 'var(--bg4)', borderRadius: 4, padding: '1px 6px', fontSize: 10, color: 'var(--txt2)' },
  empty: { fontSize: 12, color: 'var(--txt3)', padding: '4px 0' },
  userItem: { display: 'flex', alignItems: 'center', gap: 9, padding: '6px 2px' },
  avatar: { width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 },
  youBadge: { fontSize: 9, background: 'var(--accent-glow)', color: 'var(--accent)', borderRadius: 3, padding: '1px 4px', fontWeight: 700 },
  userStatus: { fontSize: 10, color: 'var(--txt3)' },
  onlineDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 },
  hr: { height: 1, background: 'var(--border)', margin: '4px 14px' },
  smallBtn: { background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, color: 'var(--txt3)', cursor: 'pointer' },
  versionItem: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 4px', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  vDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--txt3)', flexShrink: 0, marginTop: 4 },
  vLabel: { fontSize: 12, fontWeight: 600, color: 'var(--txt2)' },
  vMeta: { fontSize: 10, color: 'var(--txt3)', marginTop: 2 },
};

export default Sidebar;

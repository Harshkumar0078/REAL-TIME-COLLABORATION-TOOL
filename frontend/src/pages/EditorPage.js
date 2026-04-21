import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../utils/api';
import { DEFAULT_CODE } from '../utils/languages';
import CodeEditor from '../components/Editor/CodeEditor';
import Sidebar from '../components/Room/Sidebar';
import TopBar from '../components/Room/TopBar';
import ConsolePanel from '../components/Editor/ConsolePanel';
import ChatPanel from '../components/Chat/ChatPanel';
import AIPanel from '../components/AI/AIPanel';

const EditorPage = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [users, setUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [notification, setNotification] = useState('');
  const isRemoteUpdate = useRef(false);

  // ── Load room ─────────────────────────────────────────────────
  useEffect(() => {
    const loadRoom = async () => {
      try {
        const { data } = await api.get(`/rooms/${roomId}`);
        setRoom(data.room);
        setCode(data.room.currentCode || DEFAULT_CODE[data.room.language] || '');
        setLanguage(data.room.language || 'python');
      } catch {
        navigate('/');
      }
    };
    loadRoom();
    loadSnapshots();
  }, [roomId]);

  const loadSnapshots = async () => {
    try {
      const { data } = await api.get(`/rooms/${roomId}/snapshots`);
      setSnapshots(data.snapshots);
    } catch (_) {}
  };

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  // ── Console helpers ───────────────────────────────────────────
  const addLog = useCallback((type, text) => {
    setConsoleOutput(prev => [...prev, { type, text, id: Date.now() + Math.random() }]);
  }, []);

  const clearConsole = useCallback(() => setConsoleOutput([]), []);

  // ── Chat helpers ──────────────────────────────────────────────
  const addChatSystem = useCallback((msg) => {
    setChatMessages(prev => [...prev, { id: Date.now(), system: true, message: msg }]);
  }, []);

  // ── Socket events ─────────────────────────────────────────────
  const onRoomJoined = useCallback(({ currentCode, language: lang, users: u }) => {
    if (currentCode) setCode(currentCode);
    if (lang) setLanguage(lang);
    setUsers(u || []);
    addLog('info', `» Joined room ${roomId} · ${lang || 'python'}`);
  }, [roomId, addLog]);

  const onCodeUpdate = useCallback(({ code: newCode }) => {
    isRemoteUpdate.current = true;
    setCode(newCode);
  }, []);

  const onUserJoined = useCallback(({ username, users: u }) => {
    setUsers(u || []);
    addChatSystem(`${username} joined the room`);
  }, [addChatSystem]);

  const onUserLeft = useCallback(({ username, users: u }) => {
    setUsers(u || []);
    addChatSystem(`${username} left the room`);
  }, [addChatSystem]);

  const onChatMessage = useCallback((msg) => {
    setChatMessages(prev => [...prev, msg]);
  }, []);

  const onLanguageChanged = useCallback(({ language: lang, changedBy }) => {
    setLanguage(lang);
    notify(`🌐 ${changedBy} switched to ${lang}`);
  }, []);

  const onSnapshotSaved = useCallback(({ savedBy, snapshot }) => {
    notify(`💾 ${savedBy} saved a snapshot`);
    setSnapshots(prev => [snapshot, ...prev].slice(0, 20));
  }, []);

  const onCodeRestored = useCallback(({ code: restoredCode, label, restoredBy }) => {
    isRemoteUpdate.current = true;
    setCode(restoredCode);
    notify(`🔄 ${restoredBy} restored: ${label}`);
  }, []);

  const onExecutionResult = useCallback(({ result, executedBy }) => {
    addLog('info', `» ${executedBy} ran the code:`);
    if (result.stdout) addLog('success', result.stdout);
    if (result.stderr) addLog('error', result.stderr);
  }, [addLog]);

  const onError = useCallback(({ message }) => {
    addLog('error', `Socket error: ${message}`);
  }, [addLog]);

  const {
    emitCodeChange,
    emitChatMessage,
    emitLanguageChange,
    emitSaveSnapshot,
    emitRestoreSnapshot,
    emitExecutionResult,
  } = useSocket({
    roomId,
    username: user?.username,
    onRoomJoined,
    onCodeUpdate,
    onUserJoined,
    onUserLeft,
    onChatMessage,
    onLanguageChanged,
    onSnapshotSaved,
    onCodeRestored,
    onExecutionResult,
    onError,
  });

  // ── Code change ───────────────────────────────────────────────
  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode);
    if (!isRemoteUpdate.current) {
      emitCodeChange(newCode);
    }
    isRemoteUpdate.current = false;
  }, [emitCodeChange]);

  // ── Run code ──────────────────────────────────────────────────
  const runCode = async (stdin = '') => {
    if (isRunning) return;
    setIsRunning(true);
    clearConsole();
    addLog('cmd', `$ run ${language}`);

    try {
      const { data } = await api.post('/code/execute', { code, language, stdin: stdin || '' });
      const { result } = data;

      if (result.stage === 'compile') {
        addLog('error', '── Compilation Error ──');
      }

      if (result.stdout && result.stdout.trim()) {
        addLog('success', result.stdout.trimEnd());
      } else if (!result.stderr || !result.stderr.trim()) {
        addLog('info', '(no output)');
      }

      if (result.stderr && result.stderr.trim()) {
        addLog('error', result.stderr.trimEnd());
      }

      if (result.executionTime) {
        addLog('info', `Time: ${result.executionTime}${result.memoryUsed ? ' · Mem: ' + result.memoryUsed : ''}`);
      }

      const exitOk = !result.exitCode || result.exitCode === 0;
      addLog(exitOk ? 'info' : 'error', `── exit code: ${result.exitCode ?? 0} ──`);

      emitExecutionResult(result);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.details ||
        err.message ||
        'Execution failed. Is the backend running?';
      addLog('error', `Error: ${msg}`);
    } finally {
      setIsRunning(false);
    }
  };

  // ── Language ──────────────────────────────────────────────────
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    emitLanguageChange(lang);
  };

  // ── Snapshots ─────────────────────────────────────────────────
  const handleSaveSnapshot = (label) => {
    emitSaveSnapshot(code, label || 'Manual save');
    loadSnapshots();
  };

  const handleRestoreSnapshot = (snapshotId) => {
    emitRestoreSnapshot(snapshotId);
  };

  // ── Chat ──────────────────────────────────────────────────────
  const handleSendChat = (message) => {
    emitChatMessage(message);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBar
        roomId={roomId}
        language={language}
        users={users}
        isRunning={isRunning}
        aiOpen={aiOpen}
        onLanguageChange={handleLanguageChange}
        onRun={runCode}
        onSave={() => handleSaveSnapshot('Manual save')}
        onToggleAI={() => setAiOpen(!aiOpen)}
        onLeave={() => navigate('/')}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          users={users}
          snapshots={snapshots}
          currentUser={user}
          onRestoreSnapshot={handleRestoreSnapshot}
          onSaveSnapshot={() => handleSaveSnapshot()}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <CodeEditor
            code={code}
            language={language}
            onChange={handleCodeChange}
            users={users}
            currentUserId={user?.id}
          />

          <div style={{ height: 200, borderTop: '1px solid var(--border)', display: 'flex', flexShrink: 0 }}>
            <ConsolePanel
              output={consoleOutput}
              isRunning={isRunning}
              onRun={runCode}
              onClear={clearConsole}
            />
            <ChatPanel
              messages={chatMessages}
              currentUser={user}
              onSend={handleSendChat}
            />
          </div>
        </div>

        {aiOpen && (
          <AIPanel
            code={code}
            language={language}
            onClose={() => setAiOpen(false)}
          />
        )}
      </div>

      {notification && (
        <div style={{ position: 'fixed', top: 60, right: 16, zIndex: 999, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 16px', fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {notification}
        </div>
      )}
    </div>
  );
};

export default EditorPage;

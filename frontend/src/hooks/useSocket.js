import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../utils/socket';

export const useSocket = ({
  roomId,
  username,
  onCodeUpdate,
  onCursorUpdate,
  onUserJoined,
  onUserLeft,
  onChatMessage,
  onLanguageChanged,
  onSnapshotSaved,
  onCodeRestored,
  onExecutionResult,
  onRoomJoined,
  onError,
}) => {
  const socket = useRef(getSocket());

  useEffect(() => {
    const s = socket.current;
    if (!roomId || !username) return;

    // Join room
    s.emit('join-room', { roomId, username });

    // Listeners
    if (onRoomJoined)      s.on('room-joined', onRoomJoined);
    if (onCodeUpdate)      s.on('code-update', onCodeUpdate);
    if (onCursorUpdate)    s.on('cursor-update', onCursorUpdate);
    if (onUserJoined)      s.on('user-joined', onUserJoined);
    if (onUserLeft)        s.on('user-left', onUserLeft);
    if (onChatMessage)     s.on('chat-message', onChatMessage);
    if (onLanguageChanged) s.on('language-updated', onLanguageChanged);
    if (onSnapshotSaved)   s.on('snapshot-saved', onSnapshotSaved);
    if (onCodeRestored)    s.on('code-restored', onCodeRestored);
    if (onExecutionResult) s.on('execution-result', onExecutionResult);
    if (onError)           s.on('error', onError);

    return () => {
      s.emit('leave-room', { roomId });
      s.off('room-joined');
      s.off('code-update');
      s.off('cursor-update');
      s.off('user-joined');
      s.off('user-left');
      s.off('chat-message');
      s.off('language-updated');
      s.off('snapshot-saved');
      s.off('code-restored');
      s.off('execution-result');
      s.off('error');
    };
  }, [roomId, username]);

  const emitCodeChange = useCallback((code, delta) => {
    socket.current.emit('code-change', { roomId, code, delta });
  }, [roomId]);

  const emitCursorMove = useCallback((position, selection) => {
    socket.current.emit('cursor-move', { roomId, position, selection });
  }, [roomId]);

  const emitChatMessage = useCallback((message) => {
    socket.current.emit('chat-message', { roomId, message });
  }, [roomId]);

  const emitLanguageChange = useCallback((language) => {
    socket.current.emit('language-change', { roomId, language });
  }, [roomId]);

  const emitSaveSnapshot = useCallback((code, label) => {
    socket.current.emit('save-snapshot', { roomId, code, label });
  }, [roomId]);

  const emitRestoreSnapshot = useCallback((snapshotId) => {
    socket.current.emit('restore-snapshot', { roomId, snapshotId });
  }, [roomId]);

  const emitExecutionResult = useCallback((result) => {
    socket.current.emit('execution-result', { roomId, result });
  }, [roomId]);

  return {
    emitCodeChange,
    emitCursorMove,
    emitChatMessage,
    emitLanguageChange,
    emitSaveSnapshot,
    emitRestoreSnapshot,
    emitExecutionResult,
  };
};

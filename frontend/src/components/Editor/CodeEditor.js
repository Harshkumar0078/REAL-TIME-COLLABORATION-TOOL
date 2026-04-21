import React, { useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { getLanguage } from '../../utils/languages';

const MONACO_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '4b5563', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'a78bfa' },
    { token: 'string', foreground: '86efac' },
    { token: 'number', foreground: 'fb923c' },
    { token: 'type', foreground: '2dd4bf' },
    { token: 'function', foreground: '60a5fa' },
  ],
  colors: {
    'editor.background': '#0d0f14',
    'editor.foreground': '#e2e4f0',
    'editor.lineHighlightBackground': '#13161e',
    'editor.selectionBackground': '#7c6dfa33',
    'editorLineNumber.foreground': '#555b73',
    'editorLineNumber.activeForeground': '#8b90a8',
    'editorCursor.foreground': '#7c6dfa',
    'editor.findMatchBackground': '#7c6dfa44',
    'editorGutter.background': '#0d0f14',
    'scrollbarSlider.background': '#212636',
    'scrollbarSlider.hoverBackground': '#2d3244',
  },
};

const CodeEditor = ({ code, language, onChange, users, currentUserId }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const lang = getLanguage(language);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom theme
    monaco.editor.defineTheme('codesync-dark', MONACO_THEME);
    monaco.editor.setTheme('codesync-dark');

    // Editor options
    editor.updateOptions({
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontLigatures: true,
      lineHeight: 22,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'off',
      tabSize: 2,
      insertSpaces: true,
      automaticLayout: true,
      padding: { top: 12, bottom: 12 },
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      renderLineHighlight: 'line',
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true },
      suggest: { showKeywords: true },
      quickSuggestions: true,
    });
  };

  const handleChange = useCallback((value) => {
    if (onChange) onChange(value || '');
  }, [onChange]);

  // Update remote cursor decorations
  const updateCursorDecorations = useCallback((cursorData) => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const editor = editorRef.current;

    const newDecorations = [];
    if (cursorData.position) {
      const { lineNumber, column } = cursorData.position;
      newDecorations.push({
        range: new monaco.Range(lineNumber, column, lineNumber, column + 1),
        options: {
          className: `remote-cursor`,
          beforeContentClassName: `remote-cursor-label`,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });
    }

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, []);

  return (
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      <style>{`
        .remote-cursor { border-left: 2px solid #f472b6; }
        .remote-cursor-label::before {
          content: attr(data-username);
          background: #f472b6;
          color: white;
          font-size: 10px;
          padding: 1px 4px;
          border-radius: 3px;
          position: absolute;
          top: -18px;
          white-space: nowrap;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          z-index: 10;
        }
        .monaco-editor .margin { background: #0d0f14 !important; }
      `}</style>

      <Editor
        height="100%"
        language={lang.monacoId}
        value={code}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme="codesync-dark"
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 12 },
        }}
      />
    </div>
  );
};

export default CodeEditor;

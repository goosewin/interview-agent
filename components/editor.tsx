'use client';

import { Editor as MonacoEditor, type OnMount } from '@monaco-editor/react';
import { memo, useRef, useState } from 'react';

type MemoizedEditorProps = {
  language: string;
  initialCode: string;
  onMount?: OnMount;
  onCodeChange?: (code: string) => void;
};

type IStandaloneCodeEditor = Parameters<OnMount>[0];

const Editor = memo(function Editor({
  language,
  initialCode,
  onMount,
  onCodeChange,
}: MemoizedEditorProps) {
  const [localCode, setLocalCode] = useState(initialCode);
  const editorRef = useRef<IStandaloneCodeEditor>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    if (onMount) onMount(editor, monaco);
  };

  const handleChange = (value: string | undefined) => {
    const newCode = value || '';
    setLocalCode(newCode);
    if (onCodeChange) onCodeChange(newCode);
  };

  return (
    <MonacoEditor
      height="100%"
      language={language}
      value={localCode}
      onChange={handleChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        automaticLayout: true,
      }}
      onMount={handleEditorDidMount}
    />
  );
});

export default Editor;

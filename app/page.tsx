'use client';

import { Conversation } from '@/component/conversation';
import Editor from '@monaco-editor/react';
import { useState } from 'react';
import Split from 'react-split';

const languages = ['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp'];

export default function Home() {
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [code, setCode] = useState('');

  return (
    <main className="h-screen w-full bg-gray-900 text-white">
      <Split
        className="split flex h-full"
        sizes={[40, 60]}
        minSize={[200, 400]}
        gutterSize={4}
        gutterStyle={() => ({
          backgroundColor: '#4a5568',
          cursor: 'col-resize',
        })}
      >
        <div className="h-full overflow-auto p-6">
          <h1 className="mb-4 text-2xl font-bold">Problem Description</h1>
          <div className="prose prose-invert">
            {/* Add your problem description here */}
            <p>Sample problem description...</p>
            <Conversation />
          </div>
        </div>

        <div className="flex h-full flex-col">
          <div className="flex justify-end bg-gray-800 p-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="rounded border border-gray-600 bg-gray-700 px-3 py-1 text-white"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language={selectedLanguage}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      </Split>
    </main>
  );
}

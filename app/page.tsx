'use client';

import { Conversation } from '@/components/conversation';
import { InterviewRecorder } from '@/lib/recording';
import Editor from '@monaco-editor/react';
import { useCallback, useRef, useState } from 'react';
import Split from 'react-split';

const languages = ['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp'];

export default function Home() {
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [code, setCode] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<InterviewRecorder | null>(null);

  const startRecording = useCallback(async () => {
    try {
      recorderRef.current = new InterviewRecorder({
        onError: (error) => {
          console.error('Recording error:', error);
          setIsRecording(false);
        },
      });
      await recorderRef.current.startRecording();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;

    try {
      const recording = await recorderRef.current.stopRecording();
      setIsRecording(false);

      // Create unique interview ID
      const interviewId = crypto.randomUUID();

      // Upload recording
      const formData = new FormData();
      formData.append('recording', recording, 'recording.webm');
      formData.append('interviewId', interviewId);

      const response = await fetch('/api/recording', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload recording');
      }

      const result = await response.json();
      console.log('Recording uploaded:', result);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, []);

  return (
    <main className="w-full h-screen text-white bg-gray-900">
      <Split
        className="flex h-full split"
        sizes={[40, 60]}
        minSize={[200, 400]}
        gutterSize={4}
        gutterStyle={() => ({
          backgroundColor: '#4a5568',
          cursor: 'col-resize',
        })}
      >
        <div className="h-full p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Problem Description</h1>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`rounded px-4 py-2 font-semibold ${isRecording
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
                }`}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          </div>
          <div className="prose prose-invert">
            <p>Sample problem description...</p>
            <Conversation />
          </div>
        </div>

        <div className="flex flex-col h-full">
          <div className="flex justify-end p-2 bg-gray-800">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-1 text-white bg-gray-700 border border-gray-600 rounded"
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

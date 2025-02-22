'use client';

import { Conversation } from '@/components/conversation';
import { createInterview } from '@/lib/db';
import { InterviewRecorder } from '@/lib/recording';
import Editor from '@monaco-editor/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Split from 'react-split';

const languages = ['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp'];

// TODO: Replace with actual auth
const TEMP_USER_ID = 'GOOSE';

export default function Home() {
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [code, setCode] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const recorderRef = useRef<InterviewRecorder | null>(null);

  useEffect(() => {
    const initInterview = async () => {
      const interview = await createInterview({
        userId: TEMP_USER_ID,
        language: selectedLanguage,
        problemDescription: 'Sample problem description...',
      });
      setInterviewId(interview.id);
    };

    initInterview();
  }, [selectedLanguage]);

  const startRecording = useCallback(async () => {
    if (!interviewId) return;

    try {
      recorderRef.current = new InterviewRecorder({
        onError: (error) => {
          console.error('Recording error:', error);
          setIsRecording(false);
        },
      });
      await recorderRef.current.startRecording();

      // Notify backend that recording started
      const formData = new FormData();
      formData.append('action', 'start');
      formData.append('interviewId', interviewId);
      formData.append('recording', new Blob(), 'placeholder.webm'); // Placeholder for API validation

      const response = await fetch('/api/recording', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to start recording');
      }

      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [interviewId]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current || !interviewId) return;

    try {
      const recording = await recorderRef.current.stopRecording();
      setIsRecording(false);

      // Upload recording
      const formData = new FormData();
      formData.append('recording', recording, 'recording.webm');
      formData.append('interviewId', interviewId);
      formData.append('action', 'stop');

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
  }, [interviewId]);

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
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Problem Description</h1>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`rounded px-4 py-2 font-semibold ${
                isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
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

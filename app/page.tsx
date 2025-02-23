'use client';

import ChatView from '@/components/ChatView';
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
  const [currentInterviewId, setCurrentInterviewId] = useState<string>();
  const [voiceMessages, setVoiceMessages] = useState<Array<{
    message: string;
    source: 'ai' | 'user';
  }>>([]);
  const recorderRef = useRef<InterviewRecorder | null>(null);
  const handleVoiceMessage = useCallback((message: { message: string; source: 'ai' | 'user'; clear?: boolean }) => {
    console.log('handleVoiceMessage - received message:', message);
    
    if (message.clear) {
      setVoiceMessages([]);
      return;
    }

    setVoiceMessages(prev => {
      console.log('handleVoiceMessage - current messages:', prev);
      console.log('handleVoiceMessage - updating with:', [...prev, message]);
      return [...prev, message];
    });
  }, []); // No dependencies needed since we use the function form of setState

  const startRecording = useCallback(async () => {
    try {
      // Create new interview session
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLanguage,
          problemDescription: "Sample problem description...",
          status: 'active',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create interview session');
      }

      const { id: interviewId } = await response.json();
      setCurrentInterviewId(interviewId);
      setIsRecording(true);
      // Clear previous messages when starting new session
      setVoiceMessages([]);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [selectedLanguage]);

  const startScreenRecording = useCallback(async () => {
    try {
      if (!currentInterviewId) {
        throw new Error('No active interview session');
      }
      recorderRef.current = new InterviewRecorder({
        onError: (error) => {
          console.error('Recording error:', error);
          setIsRecording(false);
        },
      });
      await recorderRef.current.startRecording();
    } catch (error) {
      console.error('Failed to start screen recording:', error);
    }
  }, [currentInterviewId]);

  const stopScreenRecording = useCallback(async () => {
    if (!recorderRef.current || !currentInterviewId) return;

    try {
      const recording = await recorderRef.current.stopRecording();

      // Upload recording
      const formData = new FormData();
      formData.append('recording', recording, 'recording.webm');
      formData.append('interviewId', currentInterviewId);

      const response = await fetch('/api/recording', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload recording');
      }
    } catch (error) {
      console.error('Failed to stop screen recording:', error);
    }
  }, [currentInterviewId]);

  const stopRecording = useCallback(async () => {
    if (!currentInterviewId) return;

    try {
      setIsRecording(false);
      // Stop screen recording if it's running
      if (recorderRef.current) {
        await stopScreenRecording();
      }
      // Update interview status to completed
      await fetch(`/api/interviews/${currentInterviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          status: 'completed',
        }),
      });
      // Clear messages when stopping session
      setVoiceMessages([]);
      setCurrentInterviewId(undefined);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, [currentInterviewId, code, stopScreenRecording]);

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
            <div className="flex gap-2">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`rounded px-4 py-2 font-semibold ${isRecording
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
                  }`}
              >
                {isRecording ? 'Stop Interview' : 'Start Interview'}
              </button>
              {currentInterviewId && (
                <button
                  onClick={recorderRef.current ? stopScreenRecording : startScreenRecording}
                  className={`rounded px-4 py-2 font-semibold ${recorderRef.current
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                  {recorderRef.current ? 'Stop Recording' : 'Start Recording'}
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col h-full gap-4">
            <div className="prose prose-invert flex-shrink-0">
              <p>Sample problem description...</p>
            </div>
            <div className="flex-shrink-0">
              <Conversation onMessage={handleVoiceMessage} />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatView
                interviewId={currentInterviewId}
                voiceMessages={voiceMessages}
              />
            </div>
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

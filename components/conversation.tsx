'use client';

import { useConversation } from '@11labs/react';
import { useCallback } from 'react';

export function Conversation({ onMessage }: { onMessage: (message: { message: string; source: 'ai' | 'user'; clear?: boolean }) => void }) {
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => {
      console.log('Disconnected');
      // Clear messages when conversation ends
      onMessage({ message: '', source: 'ai', clear: true });
    },
    onMessage: (message: unknown) => {
      console.log('Message:', message);
      onMessage(message as { message: string; source: 'ai' | 'user' });
    },
    onError: (error: Error) => console.error('Error:', error),
  });

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Clear messages when starting new conversation
      onMessage({ message: '', source: 'ai', clear: true });

      // Start the conversation with your agent
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_AGENT_ID,
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation, onMessage]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        <button
          onClick={startConversation}
          disabled={conversation.status === 'connected'}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Start Conversation
        </button>
        <button
          onClick={stopConversation}
          disabled={conversation.status !== 'connected'}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          Stop Conversation
        </button>
      </div>

      <div className="flex flex-col items-center">
        <p>Status: {conversation.status}</p>
        <p>Agent is {conversation.isSpeaking ? 'speaking' : 'listening'}</p>
      </div>
    </div>
  );
}

'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

export function Conversation({
  onMessage,
  autoStart = false,
}: {
  onMessage: (message: { message: string; source: 'ai' | 'user'; clear?: boolean }) => void;
  autoStart?: boolean;
}) {
  const isActive = useRef(false);
  const messageHandlerRef = useRef(onMessage);
  const [status, setStatus] = useState<string>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const initRef = useRef(false);

  // Keep message handler up to date
  useEffect(() => {
    messageHandlerRef.current = onMessage;
  }, [onMessage]);

  const conversationRef = useRef(
    useConversation({
      onConnect: useCallback(() => {
        if (!initRef.current) return;
        console.log('Connected');
        isActive.current = true;
        setStatus('connected');
      }, []),
      onDisconnect: useCallback(() => {
        if (!initRef.current) return;
        console.log('Disconnected');
        isActive.current = false;
        setStatus('disconnected');
        messageHandlerRef.current({ message: '', source: 'ai', clear: true });
      }, []),
      onMessage: useCallback((message: unknown) => {
        if (!initRef.current) return;
        const typedMessage = message as {
          message: string;
          source: 'ai' | 'user';
          speaking?: boolean;
        };
        messageHandlerRef.current(typedMessage);
        setIsSpeaking(!!typedMessage.speaking);
      }, []),
      onError: useCallback((error: Error) => {
        if (!initRef.current) return;
        console.error('Error:', error);
        isActive.current = false;
        setStatus('error');
      }, []),
    })
  );
  const conversation = conversationRef.current;

  const startConversation = useCallback(async () => {
    if (isActive.current) return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      messageHandlerRef.current({ message: '', source: 'ai', clear: true });
      initRef.current = true;
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_AGENT_ID,
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      isActive.current = false;
      setStatus('error');
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    if (!isActive.current) return;
    try {
      await conversation.endSession();
    } finally {
      isActive.current = false;
      initRef.current = false;
      setStatus('disconnected');
    }
  }, [conversation]);

  // Handle auto-start and cleanup
  useEffect(() => {
    if (autoStart && !isActive.current) {
      startConversation();
    }
    return () => {
      // Stop the session only on component unmount
      stopConversation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center">
        <p>Status: {status}</p>
        <p>Agent is {isSpeaking ? 'speaking' : 'listening'}</p>
      </div>
    </div>
  );
}

'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

type Message = {
  message: string;
  source: 'ai' | 'user';
  clear?: boolean;
  timeInCallSecs?: number;
};

export function Conversation({
  onMessage,
  autoStart = false,
  audioDestination = null,
}: {
  onMessage: (message: Message) => void;
  autoStart?: boolean;
  audioDestination?: AudioNode | null;
}) {
  const isActive = useRef(false);
  const messageHandlerRef = useRef(onMessage);
  const [status, setStatus] = useState<string>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const initRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);

  // Keep message handler up to date without causing re-renders
  useEffect(() => {
    messageHandlerRef.current = onMessage;
  }, [onMessage]);

  // Create stable callbacks
  const handleConnect = useCallback(() => {
    if (!initRef.current) return;
    console.log('Connected');
    isActive.current = true;
    startTimeRef.current = Date.now();
    setStatus('connected');
  }, []);

  const handleDisconnect = useCallback(() => {
    if (!initRef.current) return;
    console.log('Disconnected');
    isActive.current = false;
    startTimeRef.current = null;
    setStatus('disconnected');
    messageHandlerRef.current({ message: '', source: 'ai', clear: true });
  }, []);

  const handleMessage = useCallback((message: unknown) => {
    if (!initRef.current) return;
    const typedMessage = message as {
      message: string;
      source: 'ai' | 'user';
      speaking?: boolean;
    };

    const timeInCallSecs = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0;

    messageHandlerRef.current({
      ...typedMessage,
      timeInCallSecs,
    });
    setIsSpeaking(!!typedMessage.speaking);
  }, []);

  const handleError = useCallback((error: Error) => {
    if (!initRef.current) return;
    console.error('Error:', error);
    isActive.current = false;
    startTimeRef.current = null;
    setStatus('error');
  }, []);

  // Create stable conversation instance with audio destination
  const conversationRef = useRef(
    useConversation({
      onConnect: handleConnect,
      onDisconnect: handleDisconnect,
      onMessage: handleMessage,
      onError: handleError,
      audioDestination, // Pass audio destination to Eleven Labs
    })
  );

  const startConversation = useCallback(async () => {
    if (isActive.current) return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      messageHandlerRef.current({ message: '', source: 'ai', clear: true });
      initRef.current = true;
      await conversationRef.current.startSession({
        agentId: process.env.NEXT_PUBLIC_AGENT_ID,
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      isActive.current = false;
      startTimeRef.current = null;
      setStatus('error');
    }
  }, []);

  const stopConversation = useCallback(async () => {
    if (!isActive.current) return;
    try {
      await conversationRef.current.endSession();
    } finally {
      isActive.current = false;
      initRef.current = false;
      startTimeRef.current = null;
      setStatus('disconnected');
    }
  }, []);

  // Handle auto-start and cleanup with proper cleanup check
  useEffect(() => {
    let mounted = true;

    if (mounted && autoStart && !isActive.current) {
      startConversation();
    }

    return () => {
      mounted = false;
      if (isActive.current) {
        stopConversation();
      }
    };
  }, [autoStart, startConversation, stopConversation]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center">
        <p>Status: {status}</p>
        <p>Agent is {isSpeaking ? 'speaking' : 'listening'}</p>
      </div>
    </div>
  );
}

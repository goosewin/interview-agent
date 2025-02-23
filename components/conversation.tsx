'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type Message = {
  message: string;
  source: 'ai' | 'user';
  clear?: boolean;
  timeInCallSecs?: number;
  audioUrl?: string;
};

export type CodeUpdateData = {
  language?: string;
  code?: string;
  cursor?: {
    lineNumber?: number;
    column?: number;
  };
  selections?: Array<{
    startLineNumber?: number;
    startColumn?: number;
    endLineNumber?: number;
    endColumn?: number;
  }>;
  timeInCallSecs?: number;
};

type ConversationProps = {
  onMessage: (message: Message) => void;
  autoStart?: boolean;
  conversationRef?: React.RefObject<ReturnType<typeof useConversation>>;
  candidateName?: string;
  interviewId: string;
  problemDescription?: string;
};

export function Conversation({
  onMessage,
  autoStart = false,
  conversationRef,
  candidateName,
  interviewId,
  problemDescription = '',
}: ConversationProps) {
  const isActive = useRef(false);
  const messageHandlerRef = useRef(onMessage);
  const [status, setStatus] = useState<string>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const initRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);

  const handleConnect = useCallback(() => {
    if (!initRef.current) return;
    console.log('Connected to Eleven Labs');
    isActive.current = true;
    startTimeRef.current = Date.now();
    setStatus('connected');
  }, []);

  const handleDisconnect = useCallback(() => {
    if (!initRef.current) return;
    console.log('Disconnected from Eleven Labs');
    isActive.current = false;
    startTimeRef.current = null;
    setStatus('disconnected');
    messageHandlerRef.current({ message: '', source: 'ai', clear: true });
  }, []);

  const handleMessage = useCallback((message: unknown) => {
    if (!initRef.current) return;

    // Assume message structure has the following properties
    const typedMessage = message as {
      message: string;
      source: 'ai' | 'user';
      speaking?: boolean;
      audioUrl?: string;
    };

    console.log('Received message from Eleven Labs:', typedMessage);

    if (typeof typedMessage.speaking === 'boolean') {
      setIsSpeaking(typedMessage.speaking);
    }

    const timeInCallSecs = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0;

    if (typedMessage.audioUrl) {
      console.log('Got audio URL from Eleven Labs:', typedMessage.audioUrl);
    }

    messageHandlerRef.current({
      message: typedMessage.message,
      source: typedMessage.source,
      timeInCallSecs,
      audioUrl: typedMessage.audioUrl,
    });
  }, []);

  const handleError = useCallback((error: Error) => {
    if (!initRef.current) return;
    console.error('Eleven Labs error:', error);
    isActive.current = false;
    startTimeRef.current = null;
    setStatus('error');
  }, []);

  // Create a stable conversation instance.
  const conversationInstance = useConversation({
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onMessage: handleMessage,
    onError: handleError,
  });
  const internalConversationRef = useRef(conversationInstance);

  useEffect(() => {
    if (conversationRef?.current) {
      Object.assign(conversationRef.current, internalConversationRef.current);
    }
  }, [conversationRef]);

  const getSignedUrl = async (): Promise<string> => {
    const response = await fetch('/api/get-signed-url');
    if (!response.ok) {
      throw new Error(`Failed to get signed url: ${response.statusText}`);
    }
    const { signedUrl } = await response.json();
    return signedUrl;
  };

  const startConversation = useCallback(async () => {
    if (isActive.current) return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      messageHandlerRef.current({ message: '', source: 'ai', clear: true });
      initRef.current = true;
      const signedUrl = await getSignedUrl();
      await internalConversationRef.current.startSession({
        agentId: process.env.NEXT_PUBLIC_AGENT_ID,
        signedUrl,
        dynamicVariables: {
          userName: candidateName || 'Candidate',
          interviewId,
          problemDescription: problemDescription || '',
        },
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      isActive.current = false;
      startTimeRef.current = null;
      setStatus('error');
    }
  }, [candidateName, interviewId, problemDescription]);

  const stopConversation = useCallback(async () => {
    if (!isActive.current) return;
    try {
      await internalConversationRef.current.endSession();
    } finally {
      isActive.current = false;
      initRef.current = false;
      startTimeRef.current = null;
      setStatus('disconnected');
    }
  }, []);

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
        <p className="text-sm text-muted-foreground">
          Status: {status}. {isSpeaking ? 'Speaking' : 'Listening'}
        </p>
      </div>
    </div>
  );
}

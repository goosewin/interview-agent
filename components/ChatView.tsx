import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'agent';
  message: string;
  time_in_call_secs: number;
};

type TranscriptEntry = {
  role: 'user' | 'agent';
  message: string;
  time_in_call_secs: number;
};

interface ChatViewProps {
    interviewId?: string;
}

const ChatView = ({ interviewId }: ChatViewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Fetch chat history and transcript
  useEffect(() => {
    const fetchChatData = async () => {
      if (!interviewId) return;
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/chat/${interviewId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch chat data');
        }
        
        const data = await response.json();
        
        if (data.messages) {
          setMessages(data.messages);
        }
        
        if (data.transcript) {
          setTranscript(data.transcript);
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setError('Failed to load chat data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatData();
  }, [interviewId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !interviewId || isSending) return;

    const newMessage: Message = {
      role: 'user',
      message: userInput,
      time_in_call_secs: Math.floor((Date.now() - new Date().setHours(0,0,0,0)) / 1000),
    };

    try {
      setIsSending(true);
      setMessages(prev => [...prev, newMessage]);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          message: userInput,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'agent',
        message: data.message,
        time_in_call_secs: Math.floor((Date.now() - new Date().setHours(0,0,0,0)) / 1000),
      }]);
      
      setUserInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!interviewId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Start recording to begin the interview
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Chat Messages Panel */}
      <div className="flex flex-col h-full border rounded-lg bg-background">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Chat Messages
          </h2>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col",
                  msg.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3",
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p>{msg.message}</p>
                  <span className="text-xs opacity-70">
                    {formatTime(msg.time_in_call_secs)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isSending}
            />
            <Button type="submit" disabled={isSending}>
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Send'
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Transcript Panel */}
      <div className="flex flex-col h-full border rounded-lg bg-background">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Transcript
          </h2>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {transcript.map((entry, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col",
                  entry.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3",
                    entry.role === 'user'
                      ? 'bg-primary/10'
                      : 'bg-muted'
                  )}
                >
                  <p>{entry.message}</p>
                  <span className="text-xs opacity-70">
                    {formatTime(entry.time_in_call_secs)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ChatView;
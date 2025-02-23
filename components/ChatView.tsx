import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatViewProps {
    interviewId?: string;
    voiceMessages?: {
        message: string;
        source: 'ai' | 'user';
    }[];
}

const ChatView = ({ interviewId, voiceMessages = [] }: ChatViewProps) => {
    console.log('ChatView - interviewId:', interviewId);
    console.log('ChatView - voiceMessages:', voiceMessages);

    return (
      <div className="flex flex-col h-full border rounded-lg bg-background overflow-hidden">
        <div className="p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Transcript
          </h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            {voiceMessages.length === 0 && !interviewId ? (
              <div className="flex items-center justify-center h-16 text-muted-foreground">
                Start recording to begin the interview...
              </div>
            ) : (
              voiceMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col",
                    msg.source === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      msg.source === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-black'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
};

export default ChatView;
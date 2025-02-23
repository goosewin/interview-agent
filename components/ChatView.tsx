import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ChatViewProps {
  interviewId?: string;
  voiceMessages?: {
    message: string;
    source: 'ai' | 'user';
  }[];
}

const ChatView = ({ interviewId, voiceMessages = [] }: ChatViewProps) => {
  return (
    <div className="flex h-[300px] flex-col overflow-hidden rounded-lg border bg-background">
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {voiceMessages.length === 0 && !interviewId ? (
            <div className="flex h-16 items-center justify-center text-muted-foreground">
              Start recording to begin the interview...
            </div>
          ) : (
            voiceMessages.map((msg, idx) => (
              <div
                key={idx}
                className={cn('flex flex-col', msg.source === 'user' ? 'items-end' : 'items-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg p-3',
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

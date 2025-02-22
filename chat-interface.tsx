import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Download, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'agent' | 'user';
  content: string;
  timestamp: string;
}

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages] = useState<Message[]>([
    {
      role: 'agent',
      content: 'Hello, I am a generative AI agent. How may I assist you today?',
      timestamp: '4:08:28 PM',
    },
    {
      role: 'user',
      content: "Hi, I'd like to check my bill.",
      timestamp: '4:08:37 PM',
    },
    {
      role: 'agent',
      content:
        "Please hold for a second.\n\nOk, I can help you with that\n\nI'm pulling up your current bill information\n\nYour current bill is $150, and it is due on August 31, 2024.\n\nIf you need more details, feel free to ask!",
      timestamp: '4:08:37 PM',
    },
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn('flex max-w-[80%] gap-2', message.role === 'user' && 'ml-auto')}
            >
              {message.role === 'agent' && (
                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-primary" />
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {message.role === 'agent' ? 'GenerativeAgent' : 'G5'}
                  </span>
                  <span className="text-sm text-muted-foreground">{message.timestamp}</span>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
                {message.role === 'agent' && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type a message as a customer"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="max-h-32 min-h-[44px]"
          />
          <Button className="px-8">Send</Button>
        </div>
      </div>
    </div>
  );
}

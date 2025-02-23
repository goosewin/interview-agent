'use client';

import ChatView from '@/components/ChatView';
import { Conversation } from '@/components/conversation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InterviewRecorder } from '@/lib/recording';
import { cn } from '@/lib/utils';
import { Editor, type OnMount } from '@monaco-editor/react';
import { Check, Play, X } from 'lucide-react';
import type { editor } from 'monaco-editor';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type Interview = {
  id: string;
  problemId: string;
  language: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  problemDescription: string;
};

type DeviceInfo = {
  deviceId: string;
  label: string;
};

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' }
];

export default function Interview() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes in seconds
  const [output, setOutput] = useState('');
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [, setProblemContent] = useState('');
  const [, setIsRunning] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<Array<{
    message: string;
    source: 'ai' | 'user';
  }>>([]);

  // Preflight state
  const [preflightComplete, setPreflightComplete] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [micPermission, setMicPermission] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Device selection state
  const [videoDevices, setVideoDevices] = useState<DeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<DeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');

  const recorderRef = useRef<InterviewRecorder | null>(null);

  useEffect(() => {
    async function fetchInterview() {
      try {
        const response = await fetch(`/api/interviews/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch interview');
        }
        const data = await response.json();

        // Redirect if interview is not active
        if (data.status === 'cancelled' || data.status === 'completed') {
          router.push('/?error=Interview is no longer active');
          return;
        }

        setInterview(data);
        setProblemContent(data.problemDescription);

        if (data.language) setLanguage(data.language);
      } catch (error) {
        console.error('Error fetching interview:', error);
        setError('Failed to load interview');
      } finally {
        setIsLoading(false);
      }
    }
    fetchInterview();
  }, [id, router]);

  // Cleanup media streams on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  async function getDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`
        }));
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 5)}...`
        }));

      setVideoDevices(videoInputs);
      setAudioDevices(audioInputs);
    } catch (error) {
      console.error('Error getting devices:', error);
      toast.error('Failed to get available devices');
    }
  }

  async function checkDevices() {
    try {
      // Request permissions first to get device labels
      const initialStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // Stop the initial stream since we'll create a new one with selected devices
      initialStream.getTracks().forEach(track => track.stop());
      await getDevices();
    } catch (error) {
      console.error('Error checking devices:', error);
      toast.error('Failed to access media devices');
    }
  }

  async function startMediaStream() {
    try {
      if (!selectedVideoDevice || !selectedAudioDevice) {
        return;
      }

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedVideoDevice },
        audio: { deviceId: selectedAudioDevice },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      setStream(newStream);
      setCameraPermission(true);
      setMicPermission(true);
      toast.success('Media devices connected successfully!');
    } catch (error) {
      console.error('Media stream error:', error);
      toast.error('Failed to access media devices');
      setCameraPermission(false);
      setMicPermission(false);
    }
  }

  useEffect(() => {
    checkDevices();
  }, []);

  useEffect(() => {
    startMediaStream();
  }, [selectedVideoDevice, selectedAudioDevice]);

  function handleStartInterview() {
    if (!cameraPermission || !micPermission || !consentGiven || !dataConsent) {
      toast.error('Please complete all checks and provide consent');
      return;
    }
    setPreflightComplete(true);
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleRunCode = () => {
    if (editorRef.current) {
      const editorCode = editorRef.current.getValue();
      try {
        // In a real implementation, this should be done server-side
        const result = eval(editorCode);
        setOutput(`Output: ${result}\n`);
      } catch (error) {
        setOutput(`Error: ${error}\n`);
      }
    }
  };

  useEffect(() => {
    if (preflightComplete && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [preflightComplete, stream]);

  // Timer effect
  useEffect(() => {
    if (preflightComplete && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [preflightComplete, timeLeft]);

  const handleVoiceMessage = useCallback((message: { message: string; source: 'ai' | 'user'; clear?: boolean }) => {
    if (message.clear) {
      setVoiceMessages([]);
      return;
    }

    setVoiceMessages(prev => [...prev, { message: message.message, source: message.source }]);
  }, []);

  const startRecording = useCallback(async () => {
    if (!interview) return;

    try {
      setIsRecording(true);
      setIsRunning(true);
      // Clear previous messages when starting new session
      setVoiceMessages([]);

      // Start screen recording
      recorderRef.current = new InterviewRecorder({
        onError: (error) => {
          console.error('Recording error:', error);
          setIsRecording(false);
          setIsRunning(false);
        },
      });
      await recorderRef.current.startRecording();

      // Update interview status
      await fetch(`/api/interviews/${interview.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in_progress',
        }),
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      setIsRunning(false);
    }
  }, [interview]);

  const stopRecording = useCallback(async () => {
    if (!interview || !recorderRef.current) return;

    try {
      setIsRecording(false);
      setIsRunning(false);

      // Stop screen recording
      const recording = await recorderRef.current.stopRecording();
      recorderRef.current = null;

      // Upload recording
      const formData = new FormData();
      formData.append('recording', recording, 'recording.webm');
      formData.append('interviewId', interview.id);
      formData.append('action', 'stop');

      await fetch('/api/recording', {
        method: 'POST',
        body: formData,
      });

      // Update interview status
      await fetch(`/api/interviews/${interview.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          code,
        }),
      });

      // Clear messages when stopping session
      setVoiceMessages([]);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, [interview, code]);

  useEffect(() => {
    if (id) {
      startRecording();
    }
    return () => {
      stopRecording();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading interview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.push('/')}>Return Home</Button>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p>Interview not found</p>
        <Button onClick={() => router.push('/')}>Return Home</Button>
      </div>
    );
  }

  if (!preflightComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-b from-background to-muted">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">System Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-8">
              {/* Microphone Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Microphone</h2>
                    <span className="flex items-center justify-center w-5 h-5">
                      {selectedAudioDevice ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-destructive" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Select Microphone</Label>
                  <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your microphone" />
                    </SelectTrigger>
                    <SelectContent>
                      {audioDevices.map(device => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Camera Status */}
              <div className={cn("space-y-4", !selectedAudioDevice && "opacity-50 pointer-events-none")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Camera</h2>
                    <span className="flex items-center justify-center w-5 h-5">
                      {selectedVideoDevice ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-destructive" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Select Camera</Label>
                  <Select value={selectedVideoDevice} onValueChange={setSelectedVideoDevice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {videoDevices.map(device => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative overflow-hidden rounded-lg aspect-video bg-muted">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="object-cover w-full h-full"
                  />
                  {!selectedVideoDevice && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                      <p className="text-muted-foreground">
                        {selectedAudioDevice ? "Please select a camera device above" : "Please select a microphone first"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Consent Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent"
                  checked={consentGiven}
                  onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
                  className="mt-1"
                />
                <label
                  htmlFor="consent"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I consent to being recorded during the interview session
                </label>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="data-consent"
                  checked={dataConsent}
                  onCheckedChange={(checked) => setDataConsent(checked as boolean)}
                  className="mt-1"
                />
                <label
                  htmlFor="data-consent"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the processing of my personal data for the purpose of this interview
                </label>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleStartInterview}
              size="lg"
              className="w-full"
              disabled={!cameraPermission || !micPermission || !consentGiven || !dataConsent}
            >
              Start Interview
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background">
      <ResizablePanelGroup direction="horizontal" className="min-h-screen rounded-lg">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="flex flex-col h-full gap-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Camera View */}
              <Card className="p-4">
                <div className="font-bold">{/* TODO: get candidate name */}Candidate Name</div>
                <div className="relative overflow-hidden bg-black rounded-lg aspect-square">
                  {/* candidate name */}
                  <video ref={videoRef} autoPlay playsInline muted className="object-cover w-full h-full" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="font-bold">AI Interviewer</div>
                <div className="relative overflow-hidden bg-black rounded-lg aspect-square">
                  {/* AI interviewer video feed */}
                </div>
              </Card>
            </div>

            {/* Problem Description */}
            <Card className="flex flex-col flex-1 overflow-hidden">
              <CardHeader>
                <CardTitle>Problem</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto prose prose-invert max-w-none">
                {/* <ProblemContent content={interview.problemDescription} /> */}
              </CardContent>
            </Card>

            {/* Voice Chat */}
            <Card className="p-4">
              <Conversation onMessage={handleVoiceMessage} />
              <div className="h-48 mt-4 overflow-y-auto">
                <ChatView
                  interviewId={interview.id}
                  voiceMessages={voiceMessages}
                />
              </div>
            </Card>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={75}>
          <div className="flex flex-col h-full p-4">
            {/* Language Selector */}
            <div className="flex flex-row mb-4">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="self-center ml-auto text-xl font-bold text-primary">{formatTime(timeLeft)}</div>
            </div>

            <ResizablePanelGroup direction="vertical" className="flex-1 border rounded-lg">
              <ResizablePanel defaultSize={70}>
                <div className="h-full p-4 bg-zinc-950">
                  <Editor
                    height="100%"
                    defaultLanguage={language}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      automaticLayout: true,
                    }}
                    onMount={handleEditorDidMount}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30}>
                <div className="relative h-full p-4 bg-black">
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute text-white bg-green-600 top-2 right-2 hover:bg-green-700"
                    onClick={handleRunCode}
                  >
                    <Play className="w-4 h-4 mr-2" /> Run
                  </Button>
                  <pre className="text-white font-mono mt-8 overflow-auto h-[calc(100%-3rem)]">{output}</pre>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

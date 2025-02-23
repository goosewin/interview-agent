'use client';

import AIInterviewer from '@/components/AIInterviewer';
import ChatView from '@/components/ChatView';
import { Conversation } from '@/components/conversation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { useConversation } from '@11labs/react';
import { Editor, type OnMount } from '@monaco-editor/react';
import { Check, Loader2, Play, X } from 'lucide-react';
import type { editor } from 'monaco-editor';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import ProblemContent from './ProblemContent';

type Interview = {
  id: string;
  problemId: string;
  language: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled' | 'abandoned';
  problemDescription: string;
  code?: string;
  candidateName?: string;
  scheduledStartTime: string;
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
  { value: 'kotlin', label: 'Kotlin' },
];

export default function Interview() {
  const params = useParams();
  const identifier = params.id as string;
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes in seconds
  const [reconnectDeadline, setReconnectDeadline] = useState<Date | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [output, setOutput] = useState('');
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [, setProblemContent] = useState('');
  const [, setIsRunning] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [, /* isRecording */ setIsRecording] = useState(false);
  const voiceMessagesRef = useRef<Array<{ message: string; source: 'ai' | 'user' }>>([]);
  const [voiceMessages, setVoiceMessages] = useState<
    Array<{ message: string; source: 'ai' | 'user' }>
  >([]);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string>();

  // Keep code in sync with refs for immediate access
  const codeRef = useRef(code);
  const startTimeRef = useRef<number | null>(null);
  const interviewIdRef = useRef<string | null>(null);
  const recorderRef = useRef<InterviewRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Preflight state
  const [preflightComplete, setPreflightComplete] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [micPermission, setMicPermission] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Device selection state
  const [videoDevices, setVideoDevices] = useState<DeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<DeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedPlaybackDevice, setSelectedPlaybackDevice] = useState<string>('');
  const [playbackDevices, setPlaybackDevices] = useState<DeviceInfo[]>([]);

  // Audio destination for Eleven Labs
  const [, /* audioDestination */ setAudioDestination] = useState<AudioNode | null>(null);
  const conversationRef = useRef<ReturnType<typeof useConversation>>(null!);

  useEffect(() => {
    codeRef.current = code;
    if (interview?.id) {
      fetch('/api/tools/code-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          interviewId: interview.id,
        }),
      }).catch((error) => {
        console.error('Failed to update code:', error);
      });
    }
  }, [code, language, interview?.id]);

  useEffect(() => {
    voiceMessagesRef.current = voiceMessages;
  }, [voiceMessages]);

  const handleVoiceMessage = useCallback(
    async (message: {
      message: string;
      source: 'ai' | 'user';
      clear?: boolean;
      timeInCallSecs?: number;
      audioUrl?: string;
    }) => {
      if (message.clear) {
        // Don't clear messages on disconnect/cleanup
        if (!message.source) {
          setVoiceMessages([]);
          voiceMessagesRef.current = [];
        }
        return;
      }

      // Update audio URL for lip syncing
      if (message.source === 'ai' && message.audioUrl) {
        setCurrentAudioUrl(message.audioUrl);
      }

      // Update state through ref to avoid re-renders
      const newMessages = [
        ...voiceMessagesRef.current,
        { message: message.message, source: message.source },
      ];
      voiceMessagesRef.current = newMessages;
      setVoiceMessages(newMessages);

      // Persist message to database
      const currentInterviewId = interviewIdRef.current;
      if (currentInterviewId) {
        try {
          await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              interviewId: currentInterviewId,
              role: message.source === 'ai' ? 'assistant' : 'user',
              content: message.message,
              timeInCallSecs: message.timeInCallSecs,
            }),
          });
        } catch (error) {
          console.error('Failed to persist message:', error);
        }
      }
    },
    [] // No dependencies needed since we use refs
  );

  useEffect(() => {
    if (interview?.id) {
      interviewIdRef.current = interview.id;
    }
  }, [interview?.id]);

  useEffect(() => {
    async function fetchInterview() {
      try {
        const response = await fetch(`/api/interviews/${identifier}?join=true`);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch interview');
        }
        const data = await response.json();

        // Redirect if interview is cancelled or abandoned
        if (data.status === 'cancelled' || data.status === 'abandoned') {
          router.push('/?error=Interview is no longer active');
          return;
        }

        setInterview(data);
        setProblemContent(data.problemDescription);
        if (data.code) setCode(data.code);
        if (data.language) setLanguage(data.language);

        // Update last active timestamp using identifier
        await fetch(`/api/interviews/${identifier}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lastActiveAt: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error('Error fetching interview:', error);
        setError('Failed to load interview');
      } finally {
        setIsLoading(false);
      }
    }
    fetchInterview();

    // Set up periodic heartbeat using identifier
    const heartbeatInterval = setInterval(async () => {
      if (!interview?.id) return;
      try {
        await fetch(`/api/interviews/${identifier}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lastActiveAt: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error('Failed to update lastActiveAt:', error);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [identifier, router]);

  // Cleanup media streams on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  async function getDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter((device) => device.kind === 'videoinput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`,
        }));
      const audioInputs = devices
        .filter((device) => device.kind === 'audioinput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 5)}...`,
        }));
      const audioOutputs = devices
        .filter((device) => device.kind === 'audiooutput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Speaker ${device.deviceId.slice(0, 5)}...`,
        }));

      setVideoDevices(videoInputs);
      setAudioDevices(audioInputs);
      setPlaybackDevices(audioOutputs);
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
      initialStream.getTracks().forEach((track) => track.stop());
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
        stream.getTracks().forEach((track) => track.stop());
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    startMediaStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideoDevice, selectedAudioDevice]);

  const startRecording = useCallback(async () => {
    if (!interview) return;

    try {
      setIsRecording(true);
      setIsRunning(true);
      startTimeRef.current = Date.now();
      // Clear previous messages when starting new session
      setVoiceMessages([]);

      // Start screen recording
      recorderRef.current = new InterviewRecorder({
        onError: (error) => {
          console.error('Recording error:', error);
          setIsRecording(false);
          setIsRunning(false);
        },
        onAudioNode: (audioNode) => {
          // Store audio node in state for Conversation component
          setAudioDestination(audioNode);
        },
      });

      const result = await recorderRef.current.startRecording();
      if (!result) throw new Error('Failed to start recording');

      // Notify backend that recording has started
      const response = await fetch('/api/recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interview.id,
          action: 'start',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start recording');
      }

      // Update interview status using identifier
      await fetch(`/api/interviews/${identifier}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in_progress',
        }),
      });

      return result;
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      setIsRunning(false);
      toast.error('Failed to start recording. Please try refreshing the page.');
      throw error;
    }
  }, [interview]);

  function handleStartInterview() {
    if (
      !cameraPermission ||
      !micPermission ||
      !consentGiven ||
      !dataConsent ||
      !selectedPlaybackDevice
    ) {
      toast.error('Please complete all checks and provide consent');
      return;
    }

    setIsStarting(true);
    toast.info('Please select the screen you want to share...');

    // Start recording first
    startRecording()
      .then(async (result) => {
        if (!result) {
          throw new Error('Failed to start recording');
        }
        try {
          await result.proceed();
          // Update interview status to in_progress
          await fetch(`/api/interviews/${identifier}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'in_progress',
              lastActiveAt: new Date().toISOString(),
            }),
          });
          setPreflightComplete(true);
          setIsInterviewStarted(true);
        } catch (error) {
          console.error('Failed to start recording:', error);
          result.screenStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          toast.error('Failed to start screen recording. Please try again.');
        } finally {
          setIsStarting(false);
        }
      })
      .catch((error) => {
        // This catches screen share permission denial
        console.error('Failed to get screen share:', error);
        toast.error('Please grant screen share permission to continue');
        setIsStarting(false);
      });
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
        setTimeLeft((prev) => {
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

  const stopRecording = useCallback(async () => {
    if (!interview || !recorderRef.current) return;

    try {
      setIsRecording(false);
      setIsRunning(false);

      // Stop screen recording and wait for upload
      const recording = await recorderRef.current.stopRecording();
      recorderRef.current = null;

      // Upload recording
      const formData = new FormData();
      formData.append('recording', recording, 'recording.webm');
      formData.append('interviewId', interview.id);
      formData.append('action', 'stop');

      const response = await fetch('/api/recording', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload recording');
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      toast.error('Failed to save recording. Please try ending the interview again.');
    }
  }, [interview]);

  // Update the useEffect to not start recording again
  useEffect(() => {
    if (isInterviewStarted && interview) {
      // No need to start recording here anymore since we do it in preflight
      return;
    }

    // Create a cleanup function that returns a Promise
    const cleanup = async () => {
      if (isInterviewStarted) {
        try {
          // Add a small delay to ensure recording data is available
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Save any pending messages before stopping
          const currentMessages = voiceMessagesRef.current;
          if (currentMessages.length > 0) {
            const lastMessage = currentMessages[currentMessages.length - 1];
            await handleVoiceMessage({
              message: lastMessage.message,
              source: lastMessage.source,
              timeInCallSecs: Math.floor((Date.now() - startTimeRef.current!) / 1000),
            });
          }

          await stopRecording();
        } catch (error) {
          console.error('Failed to stop recording:', error);
        }
      }
    };

    // Use beforeunload to handle page closes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      cleanup();
      // Show a confirmation dialog
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Run cleanup
      cleanup();
    };
  }, [isInterviewStarted, interview, stopRecording, handleVoiceMessage]);

  const handleEndInterview = useCallback(async () => {
    if (!interview || isSaving) return;

    try {
      setIsSaving(true);
      toast.info('Saving interview data...');

      // Save any pending messages
      const currentMessages = voiceMessagesRef.current;
      if (currentMessages.length > 0) {
        const lastMessage = currentMessages[currentMessages.length - 1];
        await handleVoiceMessage({
          message: lastMessage.message,
          source: lastMessage.source,
          timeInCallSecs: Math.floor((Date.now() - startTimeRef.current!) / 1000),
        });
      }

      // Stop recording first if it exists
      let recording: Blob | undefined;
      if (recorderRef.current) {
        recording = await recorderRef.current.stopRecording();
        recorderRef.current = null;
      }

      // Save final code state using identifier
      await fetch(`/api/interviews/${identifier}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeRef.current,
          language,
          status: 'completed',
        }),
      });

      // Upload recording if we have one
      if (recording) {
        const formData = new FormData();
        formData.append('recording', recording, 'recording.webm');
        formData.append('interviewId', interview.id);
        formData.append('action', 'stop');

        const response = await fetch('/api/recording', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload recording');
        }
      }

      // Trigger evaluation workflow
      const evalResponse = await fetch(`/api/interviews/${interview.id}/complete`, {
        method: 'POST',
      });

      if (!evalResponse.ok) {
        throw new Error('Failed to start evaluation');
      }

      // Generate evaluation report
      toast.info('Generating evaluation report...');
      const evaluationResponse = await fetch(`/api/interviews/${identifier}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: voiceMessagesRef.current,
          problemStatement: interview.problemDescription,
          finalSolution: codeRef.current,
          candidateName: interview.candidateName,
        }),
      });

      if (!evaluationResponse.ok) {
        throw new Error('Failed to generate evaluation report');
      }

      // Stop media streams
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      setIsInterviewStarted(false);
      toast.success('Interview completed successfully!');

      // Small delay to ensure user sees success message
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push('/');
    } catch (error) {
      console.error('Failed to end interview:', error);
      toast.error('Failed to end interview properly. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [interview, handleVoiceMessage, stream, router, language, isSaving, identifier]);

  // Add beforeunload handler when saving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSaving) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSaving]);

  // Keep track of last active timestamp
  const updateLastActive = useCallback(async () => {
    if (!interview?.id) return;
    try {
      await fetch(`/api/interviews/${identifier}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastActiveAt: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to update lastActiveAt:', error);
    }
  }, [identifier, interview?.id]);

  // Check interview timing and status
  const checkInterviewStatus = useCallback(() => {
    if (!interview) return null;

    const now = new Date();
    const startTime = new Date(interview.scheduledStartTime);
    const minutesUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));
    const minutesLate = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));

    if (interview.status === 'abandoned') {
      return {
        canJoin: false,
        message: 'This interview has been abandoned due to inactivity.',
      };
    }

    if (interview.status === 'completed') {
      return {
        canJoin: false,
        message: 'This interview has been completed.',
      };
    }

    if (interview.status === 'cancelled') {
      return {
        canJoin: false,
        message: 'This interview has been cancelled.',
      };
    }

    // Check if candidate is more than 10 minutes late
    if (minutesLate > 10 && interview.status === 'not_started') {
      // Mark as abandoned
      fetch(`/api/interviews/${identifier}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'abandoned',
          lastActiveAt: new Date().toISOString(),
        }),
      });

      return {
        canJoin: false,
        message: 'This interview has been abandoned as you were more than 10 minutes late.',
      };
    }

    if (minutesUntilStart > 5) {
      return {
        canJoin: false,
        message: `This interview is scheduled to start in ${minutesUntilStart} minutes. Please return closer to the start time.`,
      };
    }

    return {
      canJoin: true,
      message: null,
    };
  }, [interview, identifier]);

  // Handle disconnection and reconnection
  useEffect(() => {
    let abandonTimer: NodeJS.Timeout | null = null;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        // User left - start 5 minute timer
        const deadline = new Date(Date.now() + 5 * 60 * 1000);
        setReconnectDeadline(deadline);
        setIsReconnecting(true);

        // Set timer to mark as abandoned after 5 minutes
        abandonTimer = setTimeout(
          async () => {
            try {
              await fetch(`/api/interviews/${identifier}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: 'abandoned',
                  lastActiveAt: new Date().toISOString(),
                }),
              });
              router.refresh();
            } catch (error) {
              console.error('Failed to abandon interview:', error);
            }
          },
          5 * 60 * 1000
        );
      } else {
        // User returned
        setIsReconnecting(false);
        setReconnectDeadline(null);
        if (abandonTimer) clearTimeout(abandonTimer);
        updateLastActive();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (abandonTimer) clearTimeout(abandonTimer);
    };
  }, [identifier, router, updateLastActive]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading interview...</p>
      </div>
    );
  }

  const status = checkInterviewStatus();
  if (!status || !status.canJoin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{status?.message || 'Unable to join interview.'}</p>
        <Button onClick={() => router.push('/')}>Return Home</Button>
      </div>
    );
  }

  if (isReconnecting) {
    const timeLeft = reconnectDeadline
      ? Math.max(0, Math.floor((reconnectDeadline.getTime() - Date.now()) / 1000))
      : 0;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">
          You have {minutes}:{seconds.toString().padStart(2, '0')} minutes to reconnect before the
          interview is marked as abandoned.
        </p>
        <p className="text-muted-foreground">Please return to the interview to continue.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.push('/')}>Return Home</Button>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>Interview not found</p>
        <Button onClick={() => router.push('/')}>Return Home</Button>
      </div>
    );
  }

  if (!preflightComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-semibold">System Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-8">
              {/* Audio Playback Device */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Audio Playback</h2>
                    <span className="flex h-5 w-5 items-center justify-center">
                      {selectedPlaybackDevice ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-destructive" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Select where you want to hear the AI interviewer&apos;s voice.
                  </p>
                  <Select value={selectedPlaybackDevice} onValueChange={setSelectedPlaybackDevice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose audio output" />
                    </SelectTrigger>
                    <SelectContent>
                      {playbackDevices.map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Microphone Status */}
              <div
                className={cn(
                  'space-y-4',
                  !selectedPlaybackDevice && 'pointer-events-none opacity-50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Microphone</h2>
                    <span className="flex h-5 w-5 items-center justify-center">
                      {selectedAudioDevice ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-destructive" />
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
                      {audioDevices.map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Camera Status */}
              <div
                className={cn(
                  'space-y-4',
                  (!selectedAudioDevice || !selectedPlaybackDevice) &&
                    'pointer-events-none opacity-50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Camera</h2>
                    <span className="flex h-5 w-5 items-center justify-center">
                      {selectedVideoDevice ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-destructive" />
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
                      {videoDevices.map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                  {!selectedVideoDevice && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                      <p className="text-muted-foreground">
                        {selectedAudioDevice
                          ? 'Please select a camera device above'
                          : 'Please select a microphone first'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Consent Checkboxes */}
            <div
              className={cn(
                'space-y-4',
                (!selectedVideoDevice || !selectedAudioDevice || !selectedPlaybackDevice) &&
                  'pointer-events-none opacity-50'
              )}
            >
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
              disabled={
                !cameraPermission ||
                !micPermission ||
                !consentGiven ||
                !dataConsent ||
                !selectedPlaybackDevice ||
                isStarting
              }
            >
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Interview...
                </>
              ) : (
                'Start Interview'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <>
      {isSaving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-lg bg-card p-8 shadow-lg">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Saving Interview Data</h3>
                <p className="text-muted-foreground">
                  Please wait while we save your interview recording and transcript.
                  <br />
                  Do not close this window.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="h-screen bg-background">
        <ResizablePanelGroup direction="horizontal" className="min-h-screen rounded-lg">
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <div className="flex h-full flex-col gap-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Camera View */}
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">{interview.candidateName}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* AI Profile */}
                <AIInterviewer audioUrl={currentAudioUrl} />
              </div>

              {/* Problem Description */}
              <Card className="flex flex-1 flex-col overflow-hidden">
                <CardHeader>
                  <CardTitle>Problem</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-invert max-w-none flex-1 overflow-y-auto">
                  {interview && <ProblemContent content={interview.problemDescription} />}
                </CardContent>
              </Card>

              {/* Voice Chat */}
              <Card className="p-4">
                <Conversation
                  onMessage={handleVoiceMessage}
                  autoStart={isInterviewStarted}
                  conversationRef={conversationRef}
                  candidateName={interview.candidateName}
                  interviewId={interview.id}
                />
                <Accordion type="single" collapsible>
                  <AccordionItem value="transcript">
                    <AccordionTrigger>Transcript</AccordionTrigger>
                    <AccordionContent>
                      <ChatView interviewId={interview.id} voiceMessages={voiceMessages} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={75}>
            <div className="flex h-full flex-col p-4">
              {/* Language Selector */}
              <div className="mb-4 flex flex-row items-center">
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
                <div className="ml-auto flex items-center gap-4">
                  <div className="text-xl font-bold text-primary">{formatTime(timeLeft)}</div>
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={handleEndInterview}
                    className="font-semibold"
                  >
                    End Interview
                  </Button>
                </div>
              </div>

              <ResizablePanelGroup direction="vertical" className="flex-1 rounded-lg border">
                <ResizablePanel defaultSize={70}>
                  <div className="h-full bg-zinc-950 p-4">
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
                  <div className="relative h-full bg-black p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute right-2 top-2 bg-green-600 text-white hover:bg-green-700"
                      onClick={handleRunCode}
                    >
                      <Play className="mr-2 h-4 w-4" /> Run
                    </Button>
                    <pre className="mt-8 h-[calc(100%-3rem)] overflow-auto font-mono text-white">
                      {output}
                    </pre>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}

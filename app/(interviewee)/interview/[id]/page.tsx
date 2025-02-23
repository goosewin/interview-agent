'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Editor } from '@monaco-editor/react';
import { Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type Interview = {
  id: string;
  problemDescription: string;
  language: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
};

type DeviceInfo = {
  deviceId: string;
  label: string;
};

export default function Interview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

  const startRecording = async () => {
    try {
      if (!stream) {
        throw new Error('No media stream available');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const recordingBlob = new Blob(chunksRef.current, { type: 'video/webm' });
        chunksRef.current = [];

        // Create form data with the recording
        const formData = new FormData();
        formData.append('recording', recordingBlob, 'recording.webm');
        formData.append('interviewId', id);
        formData.append('action', 'stop');

        try {
          const response = await fetch('/api/recording', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload recording');
          }
        } catch (error) {
          console.error('Error uploading recording:', error);
          setError('Failed to upload recording');
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Capture chunks every second
      setIsRecording(true);

      // Start recording on server
      const response = await fetch('/api/recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId: id, action: 'start' }),
      });

      if (!response.ok) {
        throw new Error('Failed to start recording');
      }
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please check your camera and microphone permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading interview...</p>
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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
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
                      {videoDevices.map(device => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
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
    <div className="container mx-auto max-w-5xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Technical Interview</h1>
        <Button
          variant={isRecording ? 'destructive' : 'default'}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={interview.status !== 'not_started'}
        >
          {isRecording ? 'Stop Recording' : 'Start Interview'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Problem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none dark:prose-invert">
            {interview.problemDescription}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Code Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <Editor
            height="400px"
            defaultLanguage={interview.language}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              automaticLayout: true,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

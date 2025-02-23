type RecordingOptions = {
  onDataAvailable?: (blob: Blob) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onStop?: () => void;
  onAudioNode?: (audioNode: AudioNode) => void; // Callback to get audio node for Eleven Labs
};

export class InterviewRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private options: RecordingOptions;
  private audioContext: AudioContext | null = null;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;

  constructor(options: RecordingOptions = {}) {
    this.options = options;
  }

  // Get the audio node for Eleven Labs to connect to
  getAudioDestination(): AudioNode | null {
    return this.audioDestination;
  }

  private cleanupAudioContext() {
    if (this.audioContext?.state !== 'closed') {
      this.audioContext?.close();
    }
    this.audioContext = null;
    this.audioDestination = null;
  }

  async startRecording() {
    try {
      // Get screen share (video only) first
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false, // We'll handle audio separately
      });

      // Return the stream immediately so UI can check if permission was granted
      return {
        screenStream, proceed: async () => {
          try {
            // Get microphone stream
            const micStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100,
              },
              video: false,
            });

            // Create new AudioContext for mixing
            this.audioContext = new AudioContext();
            this.audioDestination = this.audioContext.createMediaStreamDestination();

            // Connect microphone audio
            const micSource = this.audioContext.createMediaStreamSource(micStream);
            const micGain = this.audioContext.createGain();
            micGain.gain.value = 0.7; // Slightly lower mic volume
            micSource.connect(micGain).connect(this.audioDestination);

            // Notify about audio node availability for Eleven Labs
            if (this.options.onAudioNode) {
              this.options.onAudioNode(this.audioDestination);
            }

            // Create final stream with video and mixed audio
            this.stream = new MediaStream([
              ...screenStream.getVideoTracks(),
              ...this.audioDestination.stream.getAudioTracks()
            ]);

            // Create MediaRecorder with optimized settings
            this.mediaRecorder = new MediaRecorder(this.stream, {
              mimeType: 'video/webm;codecs=vp9,opus',
              videoBitsPerSecond: 3000000,
              audioBitsPerSecond: 128000,
            });

            // Handle data chunks
            this.mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                this.chunks.push(event.data);
                this.options.onDataAvailable?.(event.data);
              }
            };

            // Handle recording stop
            this.mediaRecorder.onstop = () => {
              const recording = new Blob(this.chunks, { type: 'video/webm' });
              this.chunks = [];
              this.options.onStop?.();
              return recording;
            };

            // Start recording
            this.mediaRecorder.start(1000);
            this.options.onStart?.();
          } catch (error) {
            screenStream.getTracks().forEach(track => track.stop());
            this.cleanupAudioContext();
            this.options.onError?.(error as Error);
            throw error;
          }
        }
      };
    } catch (error) {
      this.cleanupAudioContext();
      this.options.onError?.(error as Error);
      throw error;
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const recording = new Blob(this.chunks, { type: 'video/webm' });
        this.chunks = [];
        this.stream?.getTracks().forEach((track) => track.stop());
        this.stream = null;
        this.mediaRecorder = null;
        this.cleanupAudioContext();
        this.options.onStop?.();
        resolve(recording);
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

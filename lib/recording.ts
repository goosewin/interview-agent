type RecordingOptions = {
  onDataAvailable?: (blob: Blob) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onStop?: () => void;
};

export class InterviewRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private options: RecordingOptions;

  constructor(options: RecordingOptions = {}) {
    this.options = options;
  }

  async startRecording() {
    try {
      // Get both screen and audio streams
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // Combine the streams
      const tracks = [...screenStream.getTracks(), ...audioStream.getAudioTracks()];
      this.stream = new MediaStream(tracks);

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'video/webm;codecs=vp9,opus',
      });

      // Handle data chunks as they become available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          this.options.onDataAvailable?.(event.data);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        const recording = new Blob(this.chunks, {
          type: 'video/webm',
        });
        this.chunks = [];
        this.options.onStop?.();
        return recording;
      };

      // Start recording
      this.mediaRecorder.start(1000); // Capture chunks every second
      this.options.onStart?.();
    } catch (error) {
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
        const recording = new Blob(this.chunks, {
          type: 'video/webm',
        });
        this.chunks = [];
        this.stream?.getTracks().forEach((track) => track.stop());
        this.stream = null;
        this.mediaRecorder = null;
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

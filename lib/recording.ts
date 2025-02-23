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
      let screenStream: MediaStream;

      while (true) {
        try {
          // Get screen stream with specific display surface
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              displaySurface: 'monitor', // Enforce full screen
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
            },
            audio: true,
          });

          // Check if user selected a monitor/screen
          const track = screenStream.getVideoTracks()[0];
          const settings = track.getSettings();
          if (settings.displaySurface === 'monitor') {
            break; // Valid selection, proceed
          }

          // Invalid selection, stop tracks and retry
          screenStream.getTracks().forEach((track) => track.stop());
          throw new Error('Please select your entire screen for sharing');
        } catch (error) {
          if ((error as Error).name === 'NotAllowedError') {
            throw error; // User denied permission, don't retry
          }
          // For other errors or invalid selections, continue loop to retry
          continue;
        }
      }

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

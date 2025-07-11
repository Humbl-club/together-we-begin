import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Video, VideoOff, Play, Pause, Square, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaRecorderProps {
  onRecordingComplete: (file: File, type: 'audio' | 'video') => void;
  maxDuration?: number; // in seconds
  audioOnly?: boolean;
}

export const MediaRecorder: React.FC<MediaRecorderProps> = ({
  onRecordingComplete,
  maxDuration = 300, // 5 minutes default
  audioOnly = false
}) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [mediaType, setMediaType] = useState<'audio' | 'video'>('audio');
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startRecording = useCallback(async (type: 'audio' | 'video') => {
    try {
      const constraints = type === 'video' 
        ? { video: true, audio: true }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const mediaRecorder = new window.MediaRecorder(stream, {
        mimeType: type === 'video' 
          ? 'video/webm;codecs=vp9,opus' 
          : 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: type === 'video' ? 'video/webm' : 'audio/webm'
        });
        setRecordedBlob(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setMediaType(type);
      setDuration(0);

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Recording Failed",
        description: "Unable to access microphone/camera. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [maxDuration, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  }, [isRecording, isPaused]);

  const playRecording = useCallback(() => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    
    if (mediaType === 'video') {
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.play();
        setIsPlaying(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [recordedBlob, mediaType]);

  const stopPlayback = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const uploadRecording = useCallback(() => {
    if (recordedBlob) {
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, {
        type: recordedBlob.type
      });
      onRecordingComplete(file, mediaType);
      setRecordedBlob(null);
      setDuration(0);
    }
  }, [recordedBlob, mediaType, onRecordingComplete]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (duration / maxDuration) * 100;

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        {/* Recording Controls */}
        {!recordedBlob && (
          <div className="space-y-4">
            <div className="flex gap-2 justify-center">
              {!isRecording ? (
                <>
                  <Button
                    onClick={() => startRecording('audio')}
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Record Audio
                  </Button>
                  {!audioOnly && (
                    <Button
                      onClick={() => startRecording('video')}
                      variant="outline"
                      size="lg"
                      className="flex items-center gap-2"
                    >
                      <Video className="h-4 w-4" />
                      Record Video
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={pauseRecording}
                    variant="outline"
                    size="lg"
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    size="lg"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Recording Progress */}
            {isRecording && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {isPaused ? 'Paused' : 'Recording'} {mediaType}
                  </span>
                  <span className="text-sm font-mono">
                    {formatDuration(duration)} / {formatDuration(maxDuration)}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                {isRecording && !isPaused && (
                  <div className="flex justify-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Playback Controls */}
        {recordedBlob && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {mediaType === 'video' ? 'Video' : 'Audio'} recorded ({formatDuration(duration)})
              </p>
              
              {mediaType === 'video' ? (
                <video
                  ref={videoRef}
                  className="w-full max-w-sm mx-auto rounded-lg"
                  controls
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                <audio
                  ref={audioRef}
                  className="w-full"
                  controls
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              )}
            </div>

            <div className="flex gap-2 justify-center">
              <Button
                onClick={uploadRecording}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Send Recording
              </Button>
              <Button
                onClick={() => {
                  setRecordedBlob(null);
                  setDuration(0);
                }}
                variant="outline"
              >
                Record Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
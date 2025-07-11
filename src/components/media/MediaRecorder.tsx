import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { RecordingControls } from './RecordingControls';
import { PlaybackControls } from './PlaybackControls';

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
  const {
    isRecording,
    isPaused,
    duration,
    recordedBlob,
    mediaType,
    startRecording,
    stopRecording,
    pauseRecording,
    uploadRecording,
    resetRecording
  } = useMediaRecorder({ maxDuration, onRecordingComplete });

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        {!recordedBlob ? (
          <RecordingControls
            isRecording={isRecording}
            isPaused={isPaused}
            duration={duration}
            maxDuration={maxDuration}
            mediaType={mediaType}
            audioOnly={audioOnly}
            onStartRecording={startRecording}
            onPauseRecording={pauseRecording}
            onStopRecording={stopRecording}
          />
        ) : (
          <PlaybackControls
            recordedBlob={recordedBlob}
            duration={duration}
            mediaType={mediaType}
            onUpload={uploadRecording}
            onRecordAgain={resetRecording}
          />
        )}
      </CardContent>
    </Card>
  );
};
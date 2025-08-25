import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Mic, Video, Play, Pause, Square } from 'lucide-react';
import { formatDuration, calculateProgress } from '@/utils/mediaUtils';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  maxDuration: number;
  mediaType: 'audio' | 'video';
  audioOnly?: boolean;
  onStartRecording: (type: 'audio' | 'video') => void;
  onPauseRecording: () => void;
  onStopRecording: () => void;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  isPaused,
  duration,
  maxDuration,
  mediaType,
  audioOnly = false,
  onStartRecording,
  onPauseRecording,
  onStopRecording
}) => {
  const progressPercentage = calculateProgress(duration, maxDuration);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-center">
        {!isRecording ? (
          <>
            <Button
              onClick={() => onStartRecording('audio')}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              Record Audio
            </Button>
            {!audioOnly && (
              <Button
                onClick={() => onStartRecording('video')}
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
              onClick={onPauseRecording}
              variant="outline"
              size="lg"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              onClick={onStopRecording}
              variant="destructive"
              size="lg"
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

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
  );
};
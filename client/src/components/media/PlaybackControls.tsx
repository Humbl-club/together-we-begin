import React, { useRef, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { formatDuration } from '@/utils/mediaUtils';

interface PlaybackControlsProps {
  recordedBlob: Blob;
  duration: number;
  mediaType: 'audio' | 'video';
  onUpload: () => void;
  onRecordAgain: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  recordedBlob,
  duration,
  mediaType,
  onUpload,
  onRecordAgain
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handlePlayEnd = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const url = URL.createObjectURL(recordedBlob);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">
          {mediaType === 'video' ? 'Video' : 'Audio'} recorded ({formatDuration(duration)})
        </p>
        
        {mediaType === 'video' ? (
          <video
            ref={videoRef}
            src={url}
            className="w-full max-w-sm mx-auto rounded-lg"
            controls
            onEnded={handlePlayEnd}
            onPlay={handlePlay}
            onPause={handlePause}
          />
        ) : (
          <audio
            ref={audioRef}
            src={url}
            className="w-full"
            controls
            onEnded={handlePlayEnd}
            onPlay={handlePlay}
            onPause={handlePause}
          />
        )}
      </div>

      <div className="flex gap-2 justify-center">
        <Button
          onClick={onUpload}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Send Recording
        </Button>
        <Button
          onClick={onRecordAgain}
          variant="outline"
        >
          Record Again
        </Button>
      </div>
    </div>
  );
};
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const calculateProgress = (duration: number, maxDuration: number): number => {
  return (duration / maxDuration) * 100;
};
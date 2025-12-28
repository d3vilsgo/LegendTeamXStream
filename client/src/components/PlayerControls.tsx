import { RotateCw, Volume2, VolumeX, Pause, Play } from "lucide-react";

interface PlayerControlsProps {
  isPlaying: boolean;
  muted: boolean;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onRestart: () => void;
}

export default function PlayerControls({
  isPlaying,
  muted,
  onPlayPause,
  onMuteToggle,
  onRestart,
}: PlayerControlsProps) {
  return (
    <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex gap-4 bg-black bg-opacity-60 rounded-full px-5 py-3 shadow-xl backdrop-blur-md z-10">
      <button onClick={onRestart} title="Başa sar">
        <RotateCw size={24} className="text-white hover:text-blue-400 transition" />
      </button>
      <button onClick={onPlayPause} title={isPlaying ? "Duraklat" : "Oynat"}>
        {isPlaying ? (
          <Pause size={24} className="text-white hover:text-blue-400 transition" />
        ) : (
          <Play size={24} className="text-white hover:text-blue-400 transition" />
        )}
      </button>
      <button onClick={onMuteToggle} title="Ses aç/kapat">
        {muted ? (
          <VolumeX size={24} className="text-white hover:text-red-400 transition" />
        ) : (
          <Volume2 size={24} className="text-white hover:text-green-400 transition" />
        )}
      </button>
    </div>
  );
}

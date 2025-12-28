import { useState } from "react";
import { X } from "lucide-react";
import { MediaItem } from "@shared/schema";
import EnhancedPlayer from "./Player/EnhancedPlayer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface PlayerPanelProps {
  mediaItem: MediaItem;
  onClose: () => void;
}

export default function PlayerPanel({ mediaItem, onClose }: PlayerPanelProps) {
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePlayerError = (error: Error) => {
    toast({
      title: "Oynatma Hatası",
      description: "Video oynatılırken bir hata oluştu: " + error.message,
      variant: "destructive",
    });
  };

  const toggleFullscreen = () => {
    const elem = document.getElementById("player-container");
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="truncate">{mediaItem.name}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </DialogHeader>
        <div id="player-container" className="w-full">
          <EnhancedPlayer
            mediaItem={mediaItem}
            contentType={"vod"} // veya "live"
            userId={1}
            onError={handlePlayerError}
          />
        </div>
        <Button className="w-full mt-3" variant="outline" onClick={toggleFullscreen}>
          {isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

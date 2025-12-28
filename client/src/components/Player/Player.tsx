import EnhancedPlayer from "./EnhancedPlayer";

interface PlayerProps {
  mediaItem: any;
  userId: number;
  contentType: "vod" | "live" | "series";
}

export default function Player({ mediaItem, userId, contentType }: PlayerProps) {
  return (
    <EnhancedPlayer
      mediaItem={mediaItem}
      userId={userId}
      contentType={contentType}
      onError={(e) => console.error("Player error:", e)}
    />
  );
}
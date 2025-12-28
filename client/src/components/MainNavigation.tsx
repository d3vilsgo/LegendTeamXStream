import { Tv, Film, Clapperboard, History, Star } from 'lucide-react';
import { ContentMode } from '@shared/schema';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MainNavigationProps {
  currentMode: ContentMode;
  onModeChange: (mode: ContentMode) => void;
}

export default function MainNavigation({ currentMode, onModeChange }: MainNavigationProps) {
  const isMobile = useIsMobile();
  
  const isActive = (mode: ContentMode) => currentMode === mode;
  
  // Helper for rendering nav items
  const NavItem = ({ mode, label, icon }: { mode: ContentMode, label: string, icon: React.ReactNode }) => {
    const active = isActive(mode);
    
    if (isMobile) {
      return (
        <Button
          variant={active ? "default" : "ghost"}
          size="icon"
          onClick={() => onModeChange(mode)}
          className={active ? "bg-primary text-primary-foreground" : ""}
        >
          {icon}
        </Button>
      );
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={active ? "default" : "ghost"}
              onClick={() => onModeChange(mode)}
              className={`w-full justify-start ${active ? "bg-primary text-primary-foreground" : ""}`}
            >
              {icon}
              <span className="ml-2">{label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  return (
    <div className={`flex ${isMobile ? "flex-row w-full justify-around py-2 border-t fixed bottom-0 left-0 right-0 bg-background z-10" : "flex-col min-h-screen p-4 border-r"}`}>
      <div className={`flex ${isMobile ? "w-full justify-around" : "flex-col space-y-2"}`}>
        <NavItem
          mode="live"
          label="Canlı TV"
          icon={<Tv className="h-5 w-5" />}
        />
        
        <NavItem
          mode="vod"
          label="Filmler"
          icon={<Film className="h-5 w-5" />}
        />
        
        <NavItem
          mode="series"
          label="Diziler"
          icon={<Clapperboard className="h-5 w-5" />}
        />
        
        {!isMobile && (
          <>
            <div className="my-4 border-b" />
            
            <NavItem
              mode="favorites"
              label="Favoriler"
              icon={<Star className="h-5 w-5" />}
            />
            
            <NavItem
              mode="history"
              label="Geçmiş"
              icon={<History className="h-5 w-5" />}
            />
          </>
        )}
      </div>
    </div>
  );
}
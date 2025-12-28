import { useState } from 'react';
import { Play } from 'lucide-react';

interface Episode {
  id: string;
  episode_num: number;
  title: string;
  season_num: number;
}

interface SeriesEpisodeSelectorProps {
  series: any;
  onEpisodeSelect: (episode: Episode) => void;
  onClose: () => void;
}

export default function SeriesEpisodeSelector({ 
  series, 
  onEpisodeSelect, 
  onClose 
}: SeriesEpisodeSelectorProps) {
  const [selectedSeason, setSelectedSeason] = useState(1);

  // Mock episodes oluştur
  const generateMockEpisodes = (seasonNum: number) => {
    const episodes: Episode[] = [];
    for (let i = 1; i <= 10; i++) {
      episodes.push({
        id: `${series.series_id || series.id}_s${seasonNum}e${i}`,
        episode_num: i,
        title: `Episode ${i}`,
        season_num: seasonNum,
      });
    }
    return episodes;
  };

  const currentEpisodes = generateMockEpisodes(selectedSeason);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{series.name}</h2>
              <p className="text-gray-400 mt-1">Sezon ve bölüm seçin</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[60vh]">
          {/* Season Selector */}
          <div className="w-1/4 border-r border-gray-700 p-4">
            <h3 className="text-white font-medium mb-4">Sezonlar</h3>
            <div className="space-y-2">
              {[1, 2, 3].map((seasonNum) => (
                <button
                  key={seasonNum}
                  onClick={() => setSelectedSeason(seasonNum)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedSeason === seasonNum
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>Sezon {seasonNum}</span>
                    <span className="text-xs">10 bölüm</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Episodes List */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-white font-medium mb-4">
              Sezon {selectedSeason} Bölümleri
            </h3>
            
            <div className="space-y-3">
              {currentEpisodes.map((episode) => (
                <div
                  key={episode.id}
                  className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer group"
                  onClick={() => {
                    console.log('🎬 Episode selected:', episode);
                    onEpisodeSelect(episode);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-sm font-medium">
                        {episode.episode_num}
                      </span>
                      <h4 className="text-white font-medium group-hover:text-blue-400 transition-colors">
                        {episode.title}
                      </h4>
                    </div>
                    
                    <button className="bg-blue-600 hover:bg-blue-700 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <Play className="w-4 h-4 text-white" fill="currentColor" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { DebriefSummary } from './components/DebriefSummary';
import { fetchLeagueStandings, generateGameweekSummary, getCurrentGameweek } from './services/fpl';
import { GameweekSummary } from './types/fpl';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<GameweekSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedGameweek, setSelectedGameweek] = useState<number | null>(null);
  const [currentGameweek, setCurrentGameweek] = useState<number | null>(null);

  useEffect(() => {
    const initializeGameweek = async () => {
      try {
        const current = await getCurrentGameweek();
        setCurrentGameweek(current);
        setSelectedGameweek(current);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize gameweek');
      }
    };

    initializeGameweek();
  }, []);

  useEffect(() => {
    if (!selectedGameweek) return;

    let isMounted = true;

    const loadLeagueData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const progressInterval = setInterval(() => {
          setLoadingProgress(prev => {
            if (prev >= 90) return prev;
            return prev + 10;
          });
        }, 500);

        const standings = await fetchLeagueStandings(5669, selectedGameweek);
        const summary = generateGameweekSummary(standings);
        
        clearInterval(progressInterval);
        
        if (isMounted) {
          setLoadingProgress(100);
          setSummary(summary);
          setTimeout(() => setIsLoading(false), 500);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch league data');
          setSummary(null);
        }
      }
    };

    loadLeagueData();

    return () => {
      isMounted = false;
    };
  }, [selectedGameweek]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-[#37003c] mx-auto mb-6 animate-pulse" />
          <h1 className="text-3xl font-bold text-[#37003c] mb-3">Loading FPL Debrief</h1>
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#00ff87] transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-gray-600 mt-3">Loading league data... {loadingProgress}%</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Trophy className="w-16 h-16 text-[#ff2882] mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-[#37003c] mb-4">Unable to Load Data</h1>
          <p className="text-[#ff2882] mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#37003c] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#240028] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!summary || !selectedGameweek || !currentGameweek) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#37003c] py-6 mb-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-[#00ff87] mr-3" />
              <h1 className="text-2xl font-bold text-white">FPL Debrief</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {selectedGameweek !== currentGameweek && (
                <button
                  onClick={() => setSelectedGameweek(currentGameweek)}
                  className="bg-[#00ff87] text-[#37003c] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#00cc6a] transition-colors"
                >
                  Latest GW
                </button>
              )}
              
              <div className="relative">
                <select
                  value={selectedGameweek}
                  onChange={(e) => setSelectedGameweek(Number(e.target.value))}
                  className="appearance-none bg-white text-[#37003c] px-4 py-2 pr-8 rounded-lg text-sm font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00ff87]"
                >
                  {Array.from({ length: currentGameweek }, (_, i) => currentGameweek - i).map(gw => (
                    <option key={gw} value={gw}>
                      Gameweek {gw}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#37003c]">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="flex justify-center">
          <DebriefSummary summary={summary} />
        </div>
      </div>
    </div>
  );
}

export default App;
'use client';

import { createClient } from '@/lib/supabase';
import { DatabaseOdds } from '@/lib/types/database';
import { useEffect, useState } from 'react';

export default function TestOddsPage() {
  const [odds, setOdds] = useState<DatabaseOdds[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const testGameId = 'NSBTswhCNN3a06wtHeGJ'; // Game from Aug 20th that we know has odds
    
    const fetchOddsDirectly = async () => {
      try {
        addDebugLog('Starting direct Supabase test...');
        setIsLoading(true);
        setError(null);
        
        // Test Supabase connection directly
        addDebugLog('Creating Supabase client...');
        const supabase = createClient();
        
        addDebugLog('Testing connection with simple query...');
        const { data: testData, error: testError } = await supabase
          .from('games')
          .select('count')
          .limit(1);
        
        if (testError) {
          addDebugLog('Connection test failed: ' + testError.message);
          setError('Connection test failed: ' + testError.message);
          return;
        }
        
        addDebugLog('Connection test successful!');
        
        // Fetch the specific game
        addDebugLog('Fetching game: ' + testGameId);
        const { data: game, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', testGameId)
          .single();

        if (gameError) {
          addDebugLog('Game fetch error: ' + gameError.message);
          setError('Game fetch error: ' + gameError.message);
          return;
        }

        if (!game) {
          addDebugLog('Game not found');
          setError('Game not found');
          return;
        }

        addDebugLog('Game found: ' + game.away_team + ' @ ' + game.home_team);

        // Fetch odds for this game
        addDebugLog('Fetching odds for game...');
        const { data: oddsData, error: oddsError } = await supabase
          .from('odds')
          .select('*')
          .eq('eventid', testGameId)
          .limit(10);

        if (oddsError) {
          addDebugLog('Odds fetch error: ' + oddsError.message);
          setError('Odds fetch error: ' + oddsError.message);
          return;
        }

        addDebugLog(`Found ${oddsData?.length || 0} odds entries`);
        
        if (oddsData && oddsData.length > 0) {
          addDebugLog('Sample odds: ' + JSON.stringify(oddsData[0], null, 2));
          setOdds(oddsData);
        } else {
          addDebugLog('No odds found for this game');
          setOdds([]);
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        addDebugLog('Exception occurred: ' + errorMessage);
        setError(errorMessage);
      } finally {
        addDebugLog('Fetch completed');
        setIsLoading(false);
      }
    };

    addDebugLog('Component mounted, starting direct test...');
    fetchOddsDirectly();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test Odds Display</h1>
        
        {isLoading && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading odds...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error}
          </div>
        )}
        
        {!isLoading && !error && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              Found {odds.length} odds entries
            </h2>
            
            {odds.length > 0 ? (
              <div className="space-y-4">
                {odds.slice(0, 10).map((odd, index) => (
                  <div key={index} className="border p-4 rounded bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <strong>Odd ID:</strong> {odd.oddid}
                      </div>
                      <div>
                        <strong>Sportsbook:</strong> {odd.sportsbook}
                      </div>
                      <div>
                        <strong>Odds:</strong> {odd.bookodds}
                      </div>
                      <div>
                        <strong>Market:</strong> {odd.marketname}
                      </div>
                    </div>
                    
                    {/* Show additional sportsbook odds if available */}
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      {odd.fanduelodds && (
                        <div>FanDuel: {odd.fanduelodds}</div>
                      )}
                      {odd.draftkingsodds && (
                        <div>DraftKings: {odd.draftkingsodds}</div>
                      )}
                      {odd.espnbetodds && (
                        <div>ESPN BET: {odd.espnbetodds}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No odds found for this game.</p>
            )}
          </div>
        )}
        
        {/* Debug Info */}
        <div className="mt-6 bg-gray-800 text-green-400 p-4 rounded-lg font-mono text-sm">
          <h3 className="text-white font-bold mb-2">Debug Log:</h3>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {debugInfo.map((info, index) => (
              <div key={index}>{info}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

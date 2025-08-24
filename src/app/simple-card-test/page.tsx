'use client';

import SimpleOddsCard from '@/components/games/simple-odds-card';
import { createClient } from '@/lib/supabase';
import { Game } from '@/lib/types/games';
import { useEffect, useState } from 'react';

export default function SimpleCardTestPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const supabase = createClient();
        
        // Get MLB games for Aug 20, 2025
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('league', 'MLB')
          .gte('game_time', '2025-08-20T00:00:00.000Z')
          .lt('game_time', '2025-08-20T23:59:59.999Z')
          .limit(3);

        if (error) throw error;

        // Convert to Game format
        const gameObjects: Game[] = (data || []).map((dbGame: any) => ({
          id: dbGame.id,
          sport_key: 'baseball_mlb',
          sport_title: 'MLB',
          commence_time: dbGame.game_time,
          home_team: dbGame.home_team_name || dbGame.home_team,
          away_team: dbGame.away_team_name || dbGame.away_team,
          bookmakers: []
        }));

        console.log('Converted games:', gameObjects);
        setGames(gameObjects);
        
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Loading games...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Simple Card Test - MLB Games</h1>
      <p className="text-gray-600 mb-6">
        Testing direct database odds display with simple card component
      </p>
      
      {games.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No games found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {games.map((game) => (
            <SimpleOddsCard
              key={game.id}
              game={game}
            />
          ))}
        </div>
      )}
    </div>
  );
}

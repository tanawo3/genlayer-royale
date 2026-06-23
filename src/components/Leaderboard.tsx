import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Trophy, Medal, User, Loader2, Skull, ArrowLeft } from 'lucide-react';

interface MatchRecordResponse {
  player: string;
  difficulty: string;
  kills: number;
  won?: boolean;
  timestamp: string;
}

interface LeaderboardStats {
  address: string;
  count: number;
}

interface LeaderboardProps {
  onBack?: () => void;
}

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Category = 'Wins' | 'Kills';

export default function Leaderboard({ onBack }: LeaderboardProps) {
  const { client, contractAddress, isConnected, address: userAddress } = useWallet();
  const [history, setHistory] = useState<MatchRecordResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('Medium');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Wins');

  useEffect(() => {
    let active = true;

    const fetchLeaderboard = async () => {
      if (!client || !contractAddress) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data: MatchRecordResponse[] = await client.readContract({
          address: contractAddress,
          functionName: 'get_match_history',
          args: []
        });

        if (active) {
          setHistory(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch match history:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchLeaderboard();

    const interval = setInterval(fetchLeaderboard, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [client, contractAddress]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-100">
        <h2 className="text-2xl md:text-3xl font-light tracking-wide text-white mb-8">
          Connect your wallet to view the leaderboard
        </h2>
      </div>
    );
  }

  // Filter and process data based on selections
  const filteredHistory = history.filter(
    record => record && record.difficulty && record.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
  );

  const statsMap = new Map<string, number>();
  
  if (selectedCategory === 'Wins') {
    filteredHistory.forEach(record => {
      // Legacy backwards-compatibility check + new accurate exact win boolean fallback
      const difficultyMap: Record<string, number> = {
         'easy': 2,
         'medium': 5,
         'hard': 10
      };
      
      const requiredKills = difficultyMap[record.difficulty.toLowerCase() as keyof typeof difficultyMap] || Infinity;
      
      const isWin = record.won === true || (record.won === undefined && Number(record.kills) >= requiredKills);
      
      if (isWin) {
        statsMap.set(record.player, (statsMap.get(record.player) || 0) + 1);
      }
    });
  } else {
    // Total Kills
    filteredHistory.forEach(record => {
      statsMap.set(record.player, (statsMap.get(record.player) || 0) + Number(record.kills));
    });
  }

  const fullSortedStats: LeaderboardStats[] = Array.from(statsMap.entries())
    .map(([address, count]) => ({ address, count }))
    .sort((a, b) => b.count - a.count);

  const sortedStats = fullSortedStats.slice(0, 50); // Top 50 for full page

  const userRankIndex = userAddress ? fullSortedStats.findIndex(s => s.address.toLowerCase() === userAddress.toLowerCase()) : -1;
  const userStat = userRankIndex >= 0 ? fullSortedStats[userRankIndex] : null;
  const showUserAtBottom = userAddress && userRankIndex >= 50;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-8 py-12">
      <div className="w-full flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-8 border-b border-white/10 flex">
        <div className="flex flex-col mb-4 md:mb-0">
          {onBack && (
            <button 
              onClick={onBack}
              className="flex items-center text-zinc-400 hover:text-white transition-colors mb-4 text-sm font-mono w-max"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game
            </button>
          )}
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-medium tracking-wide text-white">Leaderboard</h3>
          </div>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Difficulty Toggle */}
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
            {['Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff as Difficulty)}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                  selectedDifficulty === diff 
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Category Toggle */}
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
            {['Wins', 'Kills'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as Category)}
                className={`px-3 py-1 flex items-center gap-1 text-xs font-mono rounded-md transition-all ${
                  selectedCategory === cat 
                    ? 'bg-purple-500/20 text-purple-400 font-bold' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {cat === 'Kills' && <Skull className="w-3 h-3" />}
                {cat === 'Wins' && <Trophy className="w-3 h-3" />}
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8 w-full">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      ) : sortedStats.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10 w-full">
          <p className="text-zinc-500 font-mono text-sm">
            No records for {selectedDifficulty} mode yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3 w-full">
          {sortedStats.map((stat, index) => {
            const isCurrentUser = userAddress && stat.address.toLowerCase() === userAddress.toLowerCase();
            return (
              <div 
                key={stat.address} 
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isCurrentUser ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/40 border-white/5'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs ${isCurrentUser ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-400'}`}>
                    {index === 0 ? <Medal className="w-4 h-4 text-yellow-500" /> : `#${index + 1}`}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className={`w-4 h-4 ${isCurrentUser ? 'text-emerald-400' : 'text-emerald-500'}`} />
                    <span className={`font-mono text-sm ${isCurrentUser ? 'text-emerald-300 font-bold' : 'text-zinc-300'}`}>
                      {stat.address.substring(0, 6)}...{stat.address.substring(stat.address.length - 4)}
                      {isCurrentUser && <span className="ml-2 text-xs text-emerald-500/70 uppercase">(You)</span>}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold font-mono ${selectedCategory === 'Kills' ? (isCurrentUser ? 'text-purple-300' : 'text-purple-400') : (isCurrentUser ? 'text-emerald-300' : 'text-emerald-400')}`}>
                    {stat.count}
                  </span>
                  <span className={`text-xs tracking-wider uppercase font-mono ${isCurrentUser ? 'text-emerald-500/70' : 'text-zinc-500'}`}>
                    {selectedCategory}
                  </span>
                </div>
              </div>
            );
          })}
          
          {showUserAtBottom && userStat && (
            <div className="pt-4 mt-4 border-t border-white/10">
              <div 
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs">
                    #{userRankIndex + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-sm text-emerald-300 font-bold">
                      {userStat.address.substring(0, 6)}...{userStat.address.substring(userStat.address.length - 4)}
                      <span className="ml-2 text-xs text-emerald-500/70 uppercase">(You)</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold font-mono ${selectedCategory === 'Kills' ? 'text-purple-300' : 'text-emerald-300'}`}>
                    {userStat.count}
                  </span>
                  <span className="text-emerald-500/70 text-xs tracking-wider uppercase font-mono">
                    {selectedCategory}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

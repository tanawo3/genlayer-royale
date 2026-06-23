import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Trophy, Skull, Loader2, Calendar, ArrowLeft, RefreshCw, BookOpen, Medal } from 'lucide-react';

interface MatchRecordResponse {
  player: string;
  difficulty: string;
  kills: number;
  won?: boolean;
  timestamp: string;
  play_style?: string;
  narrative?: string;
}

interface PlayerStatsResponse {
  total_kills: number;
  total_wins: number;
  matches_played: number;
  title: string;
  lore?: string;
  achievements?: string;
}

interface UserProfileViewProps {
  onBack: () => void;
}

export default function UserProfileView({ onBack }: UserProfileViewProps) {
  const { client, contractAddress, isConnected, address, clearContractAddress, deployContract, isDeploying } = useWallet();
  const [history, setHistory] = useState<MatchRecordResponse[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingLore, setIsGeneratingLore] = useState(false);
  const [filterMode, setFilterMode] = useState<string>('All');

  const handleRedeploy = async () => {
    clearContractAddress();
    await deployContract();
    setHistory([]);
    setPlayerStats(null);
  };
  
  const handleGenerateLore = async () => {
    if (!client || !contractAddress) return;
    try {
      setIsGeneratingLore(true);
      await client.writeContract({
        address: contractAddress,
        functionName: 'generate_player_lore',
        args: []
      });
      // Give it a second to reflect
      setTimeout(fetchHistory, 15000); // 15 seconds mostly for consensus
    } catch (err) {
      console.error("Failed to generate lore:", err);
    } finally {
      setIsGeneratingLore(false);
    }
  };

  const fetchHistory = async () => {
    if (!client || !contractAddress || !address) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [historyData, statsData] = await Promise.all([
        client.readContract({
          address: contractAddress,
          functionName: 'get_match_history',
          args: []
        }),
        client.readContract({
          address: contractAddress,
          functionName: 'get_player_stats',
          args: [address]
        }).catch(() => null)
      ]);

      // Filter only user's matches
      const userMatches = ((historyData as MatchRecordResponse[]) || []).filter(
        (record) => record.player.toLowerCase() === address.toLowerCase()
      ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setHistory(userMatches);
      
      if (statsData) {
        setPlayerStats(statsData as PlayerStatsResponse);
      }
    } catch (err) {
      console.error("Failed to fetch match history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, [client, contractAddress, address]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] pt-4 text-slate-100">
        <h2 className="text-2xl md:text-3xl font-light tracking-wide text-white mb-8">
          Connect your wallet to view your profile
        </h2>
      </div>
    );
  }

  // Fallback to locally calculated stats if not in contract (for backward compatibility)
  const totalMatches = playerStats ? Number(playerStats.matches_played) : history.length;
  
  const difficultyMap: Record<string, number> = {
    'easy': 2,
    'medium': 5,
    'hard': 10
  };

  const totalWins = playerStats ? Number(playerStats.total_wins) : history.filter(record => {
    const requiredKills = difficultyMap[record.difficulty.toLowerCase() as keyof typeof difficultyMap] || Infinity;
    return record.won === true || (record.won === undefined && Number(record.kills) >= requiredKills);
  }).length;
  
  const totalKills = playerStats ? Number(playerStats.total_kills) : history.reduce((acc, curr) => acc + Number(curr.kills), 0);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-100px)] pt-4 text-slate-100 font-sans">
      <div className="flex-1 w-full relative rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-y-auto flex flex-col items-center px-8 py-12">
          
          <div className="w-full max-w-4xl flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-8 border-b border-white/10 gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <button 
                  onClick={onBack}
                  className="flex items-center text-zinc-400 hover:text-white transition-colors text-sm font-mono"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Game
                </button>
                <button
                  onClick={handleRedeploy}
                  disabled={isDeploying}
                  className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-mono text-amber-500/80 rounded border border-amber-500/20 transition-colors"
                >
                  {isDeploying ? 'Deploying...' : 'Redeploy Contract'}
                </button>
                {isDeploying && (
                  <span className="text-xs font-mono text-cyan-400 animate-pulse">
                    Deploying intelligent contract... Committing on GenLayer takes ~10-20s. Please wait.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">My Profile</h1>
                {playerStats?.title && (
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-mono font-bold tracking-widest uppercase">
                    {playerStats.title}
                  </span>
                )}
              </div>
              <p className="font-mono text-emerald-400 break-all">{address}</p>
            </div>
            
            <div className="flex gap-6">
              <div className="text-center px-6 py-3 bg-white/5 rounded-xl border border-white/10">
                <span className="block text-3xl font-bold font-mono text-emerald-400">{totalWins}</span>
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Wins</span>
              </div>
              <div className="text-center px-6 py-3 bg-white/5 rounded-xl border border-white/10">
                <span className="block text-3xl font-bold font-mono text-purple-400">{totalKills}</span>
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Kills</span>
              </div>
              <div className="text-center px-6 py-3 bg-white/5 rounded-xl border border-white/10">
                <span className="block text-3xl font-bold font-mono text-zinc-300">{totalMatches}</span>
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Matches</span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BookOpen className="w-24 h-24 text-emerald-400" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-medium tracking-wide text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    Protocol Generated Lore
                  </h2>
                  <button
                    onClick={handleGenerateLore}
                    disabled={isGeneratingLore || isLoading}
                    className="flex items-center text-xs font-mono px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/20 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingLore ? (
                      <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Generating...</>
                    ) : (
                      <><RefreshCw className="w-3 h-3 mr-1.5" /> Generate</>
                    )}
                  </button>
                </div>
                {playerStats?.lore && playerStats.lore !== "No lore yet." ? (
                  <p className="text-sm font-sans tracking-wide text-zinc-300 italic leading-relaxed">
                    "{playerStats.lore}"
                  </p>
                ) : (
                  <p className="text-sm font-sans text-zinc-500 italic">
                    Your story hasn't been written yet. Generate your lore using GenLayer's LLM consensus by clicking the button above!
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Medal className="w-24 h-24 text-purple-400" />
              </div>
              <div className="relative z-10">
                <h2 className="text-xl font-medium tracking-wide text-white flex items-center gap-2 mb-4">
                  <Medal className="w-5 h-5 text-purple-400" />
                  Achievements
                </h2>
                {playerStats?.achievements ? (
                  <div className="flex flex-wrap gap-2">
                    {playerStats.achievements.split(',').filter(Boolean).map((achievement, i) => (
                      <span key={i} className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-xs font-mono font-bold tracking-wider">
                        {achievement}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-sans text-zinc-500 italic">
                    Play matches and achieve specific conditions (like winning with no kills) to unlock on-chain achievements!
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="w-full max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-medium tracking-wide text-white">My Match History</h2>
              
              <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 w-max">
                {['All', 'Easy', 'Medium', 'Hard'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-4 py-1.5 text-xs font-mono rounded-md transition-all ${
                      filterMode === mode 
                        ? 'bg-emerald-500/20 text-emerald-400 font-bold' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
                <p className="text-zinc-500 font-mono">You haven't explicitly saved any match results yet.</p>
                <p className="text-zinc-600 text-sm mt-2">Play a game and record your match on-chain to see it here.</p>
              </div>
            ) : history.filter(record => filterMode === 'All' || record.difficulty.toLowerCase() === filterMode.toLowerCase()).length === 0 ? (
               <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
                 <p className="text-zinc-500 font-mono">No {filterMode} matches found in your history.</p>
               </div>
            ) : (
              <div className="space-y-3">
                {history
                  .filter(record => filterMode === 'All' || record.difficulty.toLowerCase() === filterMode.toLowerCase())
                  .map((record, index) => {
                  const requiredKills = difficultyMap[record.difficulty.toLowerCase() as keyof typeof difficultyMap] || Infinity;
                  const isWin = record.won === true || (record.won === undefined && Number(record.kills) >= requiredKills);
                  
                  return (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${isWin ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-black/40 border-white/5'}`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-400'}`}>
                          {isWin ? <Trophy className="w-5 h-5" /> : <Skull className="w-5 h-5 opacity-50" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <span className={`font-bold ${isWin ? 'text-emerald-400' : 'text-zinc-300'}`}>
                              {isWin ? 'VICTORY' : 'DEFEAT'}
                            </span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 border border-white/10">
                              {record.difficulty}
                            </span>
                            {record.play_style && record.play_style !== 'Standard' && (
                              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                {record.play_style}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-2">
                            <Calendar className="w-3 h-3" />
                            {new Date(record.timestamp).toLocaleString()}
                          </div>
                          {record.narrative && (
                            <p className="text-sm font-sans tracking-wide text-zinc-400 italic bg-black/40 p-3 rounded-lg border border-white/5 max-w-xl">
                              "{record.narrative}"
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="block font-bold font-mono text-purple-400 text-lg">
                            {record.kills}
                          </span>
                          <span className="text-[10px] tracking-widest uppercase font-mono text-zinc-500">
                            Kills
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
        </div>
    </div>
  );
}

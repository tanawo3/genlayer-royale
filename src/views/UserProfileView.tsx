import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Trophy, Skull, Loader2, Calendar, ArrowLeft, RefreshCw, BookOpen, Medal } from 'lucide-react';
import { toast } from 'sonner';
import { genLayerService } from '../services/genlayer';

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
  handle?: string;
  current_loadout?: string;
  lore?: string;
  achievements?: string | string[];
  faction?: string;
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
  const [isGeneratingLoadout, setIsGeneratingLoadout] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [handleInput, setHandleInput] = useState('');
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
      setTimeout(fetchHistory, 15000);
    } catch (err) {
      console.error("Failed to generate lore:", err);
    } finally {
      setIsGeneratingLore(false);
    }
  };

  const handleGenerateLoadout = async () => {
    if (!client || !contractAddress) return;
    try {
      setIsGeneratingLoadout(true);
      await genLayerService.generateLoadout(contractAddress);
      setTimeout(fetchHistory, 15000);
    } catch (err) {
      console.error("Failed to generate loadout:", err);
    } finally {
      setIsGeneratingLoadout(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleInput.trim()) {
      toast.error("Please enter an Operation Alias first!");
      return;
    }
    if (!client || !contractAddress) {
      toast.error("Wallet not connected or contract not found.");
      return;
    }
    try {
      setIsRegistering(true);
      toast.info(`Registering alias "${handleInput.trim()}" (Fee: 1 GEN)...`);
      await genLayerService.registerPlayer(contractAddress, handleInput.trim(), 1000000000000000000n); // 1 GEN
      toast.success("Transaction submitted! Waiting for consensus...");
      setTimeout(fetchHistory, 10000);
      setHandleInput('');
    } catch (err: any) {
      console.error("Failed to register player:", err);
      toast.error(err.message || "Failed to register player");
    } finally {
      setIsRegistering(false);
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

      let parsedHistory: MatchRecordResponse[] = [];
      try { parsedHistory = typeof historyData === 'string' ? JSON.parse(historyData) : historyData; } catch (e) {}
      
      let parsedStats: PlayerStatsResponse | null = null;
      try { parsedStats = statsData ? (typeof statsData === 'string' ? JSON.parse(statsData) : statsData) : null; } catch (e) {}

      console.log("DEBUG fetchHistory - Raw statsData:", statsData);
      console.log("DEBUG fetchHistory - Parsed stats:", parsedStats);

      // Filter only user's matches
      const userMatches = (parsedHistory || []).filter(
        (record: any) => record.player.toLowerCase() === address.toLowerCase()
      ).sort((a: any, b: any) => (b.match_id || 0) - (a.match_id || 0));
      
      setHistory(userMatches);
      
      if (parsedStats) {
        setPlayerStats(parsedStats);
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
    <div className="flex flex-col w-full min-h-screen pt-4 pb-12 bg-gen-bg">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
          
          {/* Header Section */}
          <div className="w-full flex flex-col xl:flex-row items-start xl:items-end justify-between mb-8 pb-4 border-b-4 border-white/10 gap-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={onBack}
                  className="flex items-center font-bebas text-lg tracking-widest text-gen-text-muted hover:text-gen-lime transition-colors uppercase"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  SYSTEM RETURN
                </button>
                <button
                  onClick={handleRedeploy}
                  disabled={isDeploying}
                  className="px-3 py-1 bg-gen-bg border-2 border-amber-500/50 hover:bg-amber-500 text-amber-500 hover:text-gen-bg font-bebas text-sm tracking-widest transition-colors uppercase"
                >
                  {isDeploying ? 'DEPLOYING...' : 'REDEPLOY CONTRACT'}
                </button>
              </div>
              
              {isDeploying && (
                <span className="text-sm font-mono tracking-widest text-gen-lime animate-pulse uppercase">
                  DEPLOYING INTELLIGENT CONTRACT. AWAITING SYNC...
                </span>
              )}

              <div className="flex flex-col md:flex-row md:items-end gap-4 mb-2">
                <h1 className="text-5xl md:text-7xl font-bebas tracking-widest text-white leading-none">{playerStats?.handle && !playerStats.handle.startsWith('Rookie_') ? playerStats.handle : 'OPERATIVE'}</h1>
                {playerStats?.title && (
                  <span className="px-4 py-1 bg-gen-lime text-gen-bg text-lg md:text-2xl font-bebas tracking-widest uppercase mb-1">
                    {playerStats.title}
                  </span>
                )}
                {playerStats?.faction && playerStats.faction !== "Unaligned" && (
                  <span className="px-4 py-1 border-2 border-gen-lime text-gen-lime text-lg md:text-2xl font-bebas tracking-widest uppercase mb-1">
                    FACTION: {playerStats.faction}
                  </span>
                )}
              </div>
              <p className="font-mono text-base text-gen-text-muted tracking-widest uppercase break-all">ID: {address}</p>
            </div>
            
            {/* Massive Stats Grid */}
            <div className="grid grid-cols-3 gap-2 w-full xl:w-auto">
              <div className="flex flex-col items-end px-4 py-3 bg-gen-surface border-2 border-white/10">
                <span className="text-xs font-mono tracking-widest text-gen-text-muted uppercase mb-1">VICTORIES</span>
                <span className="text-3xl md:text-5xl font-bebas tracking-widest text-gen-lime leading-none">{totalWins}</span>
              </div>
              <div className="flex flex-col items-end px-4 py-3 bg-gen-surface border-2 border-white/10">
                <span className="text-xs font-mono tracking-widest text-gen-text-muted uppercase mb-1">ELIMINATIONS</span>
                <span className="text-3xl md:text-5xl font-bebas tracking-widest text-white leading-none">{totalKills}</span>
              </div>
              <div className="flex flex-col items-end px-4 py-3 bg-gen-surface border-2 border-white/10">
                <span className="text-xs font-mono tracking-widest text-gen-text-muted uppercase mb-1">DEPLOYMENTS</span>
                <span className="text-3xl md:text-5xl font-bebas tracking-widest text-gen-text-muted leading-none">{totalMatches}</span>
              </div>
            </div>
          </div>

          {/* Registration Block */}
          {(!playerStats?.handle || playerStats.handle.startsWith('Rookie_')) && (
            <div className="w-full bg-gen-surface border-2 border-amber-500/30 p-6 mb-8">
              <h3 className="font-bebas text-2xl tracking-widest text-amber-500 mb-2">UNREGISTERED OPERATIVE DETECTED</h3>
              <p className="font-mono text-sm text-gen-text-muted mb-4">You are currently operating under a temporary alias. Register an official handle to cement your legacy (Fee: 1 GEN).</p>
              <form onSubmit={handleRegister} className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  placeholder="ENTER CALLSIGN..."
                  className="bg-black border border-white/20 text-white font-mono px-4 py-2 w-full md:w-64 focus:outline-none focus:border-gen-lime transition-colors"
                  maxLength={16}
                  required
                />
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-6 py-2 bg-amber-500 hover:bg-white text-black font-bebas tracking-widest transition-colors disabled:opacity-50"
                >
                  {isRegistering ? 'PROCESSING...' : 'REGISTER HANDLE (1 GEN)'}
                </button>
              </form>
            </div>
          )}

          {/* Lore & Achievements Grid */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <div className="bg-gen-surface border-2 border-white/10 p-4 md:p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <BookOpen className="w-32 h-32 text-gen-lime" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-white/10">
                    <h2 className="text-2xl md:text-3xl font-bebas tracking-widest text-white uppercase flex items-center gap-3">
                      PROTOCOL LORE
                    </h2>
                    <button
                      onClick={handleGenerateLore}
                      disabled={isGeneratingLore || isLoading}
                      className="px-3 py-1 font-bebas text-base tracking-widest bg-gen-lime hover:bg-white text-gen-bg transition-colors flex items-center disabled:opacity-50"
                    >
                      {isGeneratingLore ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> RUNNING...</>
                      ) : (
                        <><RefreshCw className="w-4 h-4 mr-2" /> GENERATE</>
                      )}
                    </button>
                  </div>
                  {playerStats?.lore && playerStats.lore !== "No lore yet." ? (
                    <p className="text-sm md:text-base font-mono tracking-wide text-gen-text leading-relaxed uppercase">
                      "{playerStats.lore}"
                    </p>
                  ) : (
                    <p className="text-sm md:text-base font-mono text-gen-text-muted uppercase">
                      NO DATA RECORDED. TRIGGER GENERATION PROTOCOL.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gen-surface border-2 border-white/10 p-4 md:p-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                <Medal className="w-32 h-32 text-white" />
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bebas tracking-widest text-white uppercase mb-4 pb-2 border-b-2 border-white/10">
                  HONORS
                </h2>
                {playerStats?.achievements && playerStats.achievements.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(playerStats.achievements) ? playerStats.achievements : playerStats.achievements.split(',')).filter(Boolean).map((achievement: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-white text-gen-bg text-xs font-mono tracking-widest uppercase font-bold">
                        {achievement}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm md:text-base font-mono text-gen-text-muted uppercase">
                    UNARMED AND FORGOTTEN.
                  </p>
                )}
                
                <div className="mt-8 pt-6 border-t-2 border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl md:text-2xl font-bebas tracking-widest text-white uppercase">CYBERPUNK LOADOUT</h3>
                    <button
                      onClick={handleGenerateLoadout}
                      disabled={isGeneratingLoadout || isLoading}
                      className="px-3 py-1 font-bebas text-sm tracking-widest border border-white/20 hover:bg-white/10 text-white transition-colors flex items-center disabled:opacity-50"
                    >
                      {isGeneratingLoadout ? 'REROLLING...' : 'REROLL LOADOUT'}
                    </button>
                  </div>
                  <div className="p-4 bg-black/50 border border-white/10 flex items-center gap-4">
                    <Skull className="w-8 h-8 text-gen-lime" />
                    <div>
                      <span className="block font-mono text-[10px] text-gen-text-muted tracking-widest uppercase mb-1">EQUIPPED WEAPON</span>
                      <span className="font-bebas text-xl md:text-2xl text-gen-lime tracking-widest">{playerStats?.current_loadout || "NONE"}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Match History */}
          <div className="w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-4 border-b-2 border-white/10">
              <h2 className="text-5xl md:text-6xl font-bebas tracking-widest text-white uppercase">HISTORY LOG</h2>
              
              <div className="flex bg-gen-bg border-2 border-white/20">
                {['All', 'Easy', 'Medium', 'Hard'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-6 py-2 text-lg font-bebas tracking-widest transition-colors uppercase ${
                      filterMode === mode 
                        ? 'bg-gen-lime text-gen-bg' 
                        : 'text-gen-text hover:bg-white/10'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-24">
                <Loader2 className="w-16 h-16 text-gen-lime animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-24 bg-gen-surface border-2 border-white/10">
                <p className="text-2xl font-mono text-gen-text-muted uppercase tracking-widest">LOG EMPTY.</p>
                <p className="text-lg text-gen-text-muted mt-2 font-mono uppercase tracking-widest">COMMENCE OPERATIONS TO RECORD DATA.</p>
              </div>
            ) : history.filter(record => filterMode === 'All' || record.difficulty.toLowerCase() === filterMode.toLowerCase()).length === 0 ? (
               <div className="text-center py-24 bg-gen-surface border-2 border-white/10">
                 <p className="text-2xl font-mono text-gen-text-muted uppercase tracking-widest">NO {filterMode} DATA FOUND.</p>
               </div>
            ) : (
              <div className="flex flex-col gap-4">
                {history
                  .filter(record => filterMode === 'All' || record.difficulty.toLowerCase() === filterMode.toLowerCase())
                  .map((record, index) => {
                  const requiredKills = difficultyMap[record.difficulty.toLowerCase() as keyof typeof difficultyMap] || Infinity;
                  const isWin = record.won === true || (record.won === undefined && Number(record.kills) >= requiredKills);
                  
                  return (
                    <div 
                      key={index} 
                      className={`flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-l-8 border-y-2 border-r-2 transition-colors gap-6 ${isWin ? 'bg-gen-lime/10 border-l-gen-lime border-y-white/10 border-r-white/10' : 'bg-gen-surface border-l-red-500 border-y-white/10 border-r-white/10'}`}
                    >
                      <div className="flex flex-col gap-4 w-full md:w-3/4">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className={`text-4xl md:text-5xl font-bebas tracking-widest ${isWin ? 'text-gen-lime' : 'text-red-500'}`}>
                            {isWin ? 'VICTORY' : 'DEFEAT'}
                          </span>
                          <span className="px-4 py-1 font-mono text-sm tracking-widest uppercase border-2 border-white/20 text-white">
                            {record.difficulty}
                          </span>
                          {record.play_style && record.play_style !== 'Standard' && (
                            <span className="px-4 py-1 font-mono text-sm tracking-widest uppercase bg-white text-gen-bg font-bold">
                              {record.play_style}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-sm font-mono text-gen-text-muted uppercase tracking-widest">
                          <Calendar className="w-4 h-4" />
                          {new Date(record.timestamp).toLocaleString()}
                        </div>

                        {record.narrative && (
                          <p className="text-base md:text-lg font-mono tracking-wide text-gen-text uppercase bg-black/50 p-4 border-l-4 border-white/20 w-full">
                            "{record.narrative}"
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end justify-center w-full md:w-1/4 h-full">
                        <span className="text-sm tracking-widest uppercase font-mono text-gen-text-muted mb-2">ELIMINATIONS</span>
                        <span className={`text-7xl font-bebas tracking-widest leading-none ${isWin ? 'text-white' : 'text-gen-text-muted'}`}>
                          {record.kills}
                        </span>
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

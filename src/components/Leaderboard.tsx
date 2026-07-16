import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../hooks/useWallet';
import { Trophy, Medal, Loader2, Skull, ArrowLeft, Target, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('Medium');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Wins');

  const { data: history = [], isLoading, isError } = useQuery({
    queryKey: ['leaderboard', contractAddress],
    queryFn: async () => {
      if (!client || !contractAddress) return [];
      const data = await client.readContract({
        address: contractAddress,
        functionName: 'get_match_history',
        args: []
      });
      let parsedData: MatchRecordResponse[] = [];
      try {
        parsedData = typeof data === 'string' ? JSON.parse(data) : (data || []);
      } catch (e) {
        console.error("Failed to parse history data", e);
      }
      return parsedData;
    },
    enabled: !!client && !!contractAddress && isConnected,
    refetchInterval: 15000,
  });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="border border-white/10 bg-black/40 backdrop-blur-xl p-10 text-center relative overflow-hidden group max-w-md w-full rounded-2xl shadow-2xl"
        >
          {/* Neon Glow Behind */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gen-lime/20 blur-[60px] rounded-full pointer-events-none transition-transform duration-1000 group-hover:scale-150" />
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border border-gen-lime/30 flex items-center justify-center mx-auto mb-6"
          >
            <Trophy className="w-8 h-8 text-gen-lime drop-shadow-[0_0_8px_rgba(204,255,0,0.8)]" />
          </motion.div>
          <h2 className="text-3xl font-bebas tracking-[0.2em] text-white mb-3">ELITE PROTOCOL</h2>
          <p className="text-gen-text-muted font-mono text-xs uppercase tracking-widest leading-relaxed">
            Authentication Required.<br/>Connect your cryptographic identity to access the global rankings.
          </p>
        </motion.div>
      </div>
    );
  }

  const filteredHistory = history.filter(
    record => record && record.difficulty && record.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
  );

  const statsMap = new Map<string, number>();
  
  if (selectedCategory === 'Wins') {
    filteredHistory.forEach(record => {
      const difficultyMap: Record<string, number> = { 'easy': 2, 'medium': 5, 'hard': 10 };
      const requiredKills = difficultyMap[record.difficulty.toLowerCase() as keyof typeof difficultyMap] || Infinity;
      const isWin = record.won === true || (record.won === undefined && Number(record.kills) >= requiredKills);
      
      if (isWin) {
        statsMap.set(record.player, (statsMap.get(record.player) || 0) + 1);
      }
    });
  } else {
    filteredHistory.forEach(record => {
      statsMap.set(record.player, (statsMap.get(record.player) || 0) + Number(record.kills));
    });
  }

  const sortedStats: LeaderboardStats[] = Array.from(statsMap.entries())
    .map(([address, count]) => ({ address, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[1000px] mx-auto px-4 md:px-8 py-10 min-h-screen">
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
      >
        <div className="flex flex-col">
          {onBack && (
            <motion.button 
              whileHover={{ x: -5 }}
              onClick={onBack}
              className="flex items-center text-gen-text-muted hover:text-white transition-colors mb-4 text-xs font-mono uppercase tracking-[0.2em] w-max"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Terminal
            </motion.button>
          )}
          <div className="flex items-center gap-4 relative">
            <h3 className="text-5xl md:text-7xl font-bebas tracking-[0.1em] text-white leading-none">HALL OF FAME</h3>
            <div className="absolute -right-6 top-0 w-2 h-2 rounded-full bg-gen-lime animate-pulse shadow-[0_0_10px_rgba(204,255,0,0.8)]" />
          </div>
        </div>
        
        {/* Sleek Toggles */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-[#0A0A0A] border border-white/10 rounded-lg p-1 relative z-0">
            {['Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff as Difficulty)}
                className={`relative px-4 py-2 text-sm font-mono tracking-widest uppercase transition-colors z-10 ${
                  selectedDifficulty === diff ? 'text-black' : 'text-gen-text hover:text-white'
                }`}
              >
                {selectedDifficulty === diff && (
                  <motion.div
                    layoutId="diff-pill"
                    className="absolute inset-0 bg-gen-lime rounded-md -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {diff}
              </button>
            ))}
          </div>

          <div className="flex bg-[#0A0A0A] border border-white/10 rounded-lg p-1 relative z-0">
            {['Wins', 'Kills'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as Category)}
                className={`relative flex items-center gap-2 px-4 py-2 text-sm font-mono tracking-widest uppercase transition-colors z-10 ${
                  selectedCategory === cat ? 'text-black' : 'text-gen-text hover:text-white'
                }`}
              >
                {selectedCategory === cat && (
                  <motion.div
                    layoutId="cat-pill"
                    className="absolute inset-0 bg-white rounded-md -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {cat === 'Kills' ? <Target className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                {cat}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 w-full opacity-60">
          <Loader2 className="w-8 h-8 text-gen-lime animate-spin mb-4" />
          <p className="font-mono text-xs tracking-[0.2em] uppercase">Syncing with Mainframe...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 w-full border border-red-500/20 bg-red-500/5 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
          <p className="font-mono text-xs text-red-400 tracking-[0.2em] uppercase">Consensus Sync Failed</p>
        </div>
      ) : sortedStats.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-24 border border-white/5 bg-[#050505] w-full rounded-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)] pointer-events-none" />
          <p className="text-gen-text-muted font-mono text-sm uppercase tracking-[0.2em]">
            No data found for {selectedDifficulty} // {selectedCategory}
          </p>
        </motion.div>
      ) : (
        <div className="w-full relative">
          <div className="flex items-center justify-between p-4 border-b border-white/10 text-gen-text-muted font-mono text-[10px] tracking-[0.2em] uppercase pl-6 pr-6">
             <div className="flex items-center gap-8 w-2/3">
                <span className="w-8">RNK</span>
                <span>OPERATOR ID</span>
             </div>
             <div className="w-1/3 text-right">
                <span>{selectedCategory}</span>
             </div>
          </div>

          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show"
            className="flex flex-col gap-2 mt-4"
          >
            <AnimatePresence mode="popLayout">
              {sortedStats.map((stat, index) => {
                const isCurrentUser = userAddress && stat.address.toLowerCase() === userAddress.toLowerCase();
                const isTop3 = index < 3;
                
                return (
                  <motion.div 
                    layout
                    variants={itemVariants}
                    key={stat.address + selectedDifficulty + selectedCategory}
                    className={`group relative flex items-center justify-between p-5 rounded-xl border transition-all duration-300 ${
                      isCurrentUser 
                        ? 'bg-gen-lime/10 border-gen-lime/30 shadow-[0_0_15px_rgba(204,255,0,0.1)]' 
                        : 'bg-[#0A0A0A] border-white/5 hover:border-white/20 hover:bg-[#111]'
                    }`}
                  >
                    {isTop3 && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-gen-lime to-transparent opacity-50" />
                    )}

                    <div className="flex items-center gap-8 w-2/3">
                      <div className={`flex items-center justify-center w-8 font-bebas text-2xl tracking-widest ${
                        isCurrentUser ? 'text-gen-lime' : isTop3 ? 'text-white' : 'text-gen-text-muted'
                      }`}>
                        {index === 0 ? <Medal className="w-6 h-6 text-gen-lime drop-shadow-[0_0_5px_rgba(204,255,0,0.8)]" /> : `0${index + 1}`.slice(-2)}
                      </div>
                      
                      <div className="flex flex-col">
                        <span className={`font-mono text-sm tracking-wider ${isCurrentUser ? 'text-white font-bold' : 'text-gen-text'}`}>
                          {stat.address.slice(0, 6)}...{stat.address.slice(-4)}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] text-gen-lime font-mono tracking-widest uppercase mt-1">You</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-1/3 text-right">
                      <span className={`font-bebas text-3xl tracking-widest ${isCurrentUser ? 'text-white' : 'text-gen-text'}`}>
                        {stat.count}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </div>
  );
}

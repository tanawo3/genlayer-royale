import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { User, LogOut, Trophy } from 'lucide-react';

interface HeaderProps {
  currentView?: 'lobby' | 'profile' | 'leaderboard';
  setCurrentView?: (view: 'lobby' | 'profile' | 'leaderboard') => void;
}

export default function Header({ currentView = 'lobby', setCurrentView }: HeaderProps) {
  const { isConnected, address, connect, disconnect, isConnecting } = useWallet();

  return (
    <header className="w-full relative z-50 pt-6 pb-4">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer group"
            onClick={() => setCurrentView && setCurrentView('lobby')}
          >
            <div className="relative mr-3 flex items-center justify-center">
              <svg width="34" height="34" viewBox="0 0 63 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative text-white transition-transform duration-300 group-hover:scale-110">
                <path d="M28.2569 20.762L17.6973 43.0771L27.6377 48.0703L0 59L28.2569 0V20.762Z" fill="currentColor" />
                <path d="M34.1562 20.762L44.7159 43.0771L34.7755 48.0703L62.4132 59L34.1562 0V20.762Z" fill="currentColor" />
                <path d="M31.0531 28.0977L37.2395 40.3944L31.0531 43.4429L25.1987 40.3816L31.0531 28.0977Z" fill="currentColor" />
              </svg>
            </div>
            <div className="flex items-center">
              <span className="text-2xl font-black italic tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                GL
              </span>
              <span className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-purple-400 to-cyan-400 ml-1.5 relative group-hover:brightness-125 transition-all duration-300">
                ARENA
                <span className="absolute -top-0.5 -right-2.5 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,1)]" />
              </span>
            </div>
          </div>

          {/* Consensus Combat Rules Banner in the Middle */}
          <div className="hidden md:flex items-center gap-3 bg-zinc-950/60 border border-zinc-900 px-4 py-2 rounded-full backdrop-blur-md shadow-inner shadow-zinc-950">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Consensus:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-950/30 text-[#00E5FF] border border-[#00E5FF]/20 shadow-[0_0_10px_rgba(0,229,255,0.08)]">
                CYAN
              </span>
              <span className="text-zinc-600 font-mono text-xs font-bold">➔</span>
              <span className="text-[11px] font-bold font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-pink-950/35 text-[#FF00FF] border border-[#FF00FF]/25 shadow-[0_0_10px_rgba(255,0,255,0.08)]">
                MAGENTA
              </span>
              <span className="text-zinc-600 font-mono text-xs font-bold">➔</span>
              <span className="text-[11px] font-bold font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-yellow-950/35 text-[#FFEA00] border border-[#FFEA00]/20 shadow-[0_0_10px_rgba(255,234,0,0.08)]">
                YELLOW
              </span>
              <span className="text-zinc-600 font-mono text-xs font-bold">➔</span>
              <span className="text-[11px] font-bold font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-950/30 text-[#00E5FF] border border-[#00E5FF]/20 shadow-[0_0_10px_rgba(0,229,255,0.08)]">
                CYAN
              </span>
            </div>
          </div>
          
          {/* Right Action */}
          <div className="flex items-center gap-3">
            <button
               onClick={() => setCurrentView && setCurrentView('leaderboard')}
               className={`border hover:bg-zinc-800 px-3 py-1.5 rounded-lg font-bold tracking-wider text-xs transition-all flex items-center gap-2 ${currentView === 'leaderboard' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200'}`}
               title="Global Leaderboard"
            >
               <Trophy className="w-4 h-4" />
               <span className="hidden sm:inline">Leaderboard</span>
            </button>
            {isConnected ? (
              <>
                <button 
                  onClick={() => setCurrentView && setCurrentView(currentView === 'profile' ? 'lobby' : 'profile')}
                  className={`border hover:bg-zinc-800 px-4 py-1.5 rounded-lg font-bold tracking-wider text-xs transition-all flex items-center gap-2 ${currentView === 'profile' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-300'}`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{address?.substring(0, 6)}...{address?.substring(address.length - 4)}</span>
                </button>
                <button 
                  onClick={() => {
                     disconnect();
                     if (setCurrentView) setCurrentView('lobby');
                  }}
                  className="bg-zinc-900 border border-zinc-800 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 text-zinc-500 p-1.5 rounded-lg transition-all"
                  title="Disconnect Wallet"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button 
                onClick={connect}
                disabled={isConnecting}
                className="bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-1.5 rounded-lg font-bold tracking-wider text-xs transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
              >
                {isConnecting ? 'SYNCING...' : 'CONNECT WALLET'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

import React, { useEffect, useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { User, LogOut, Trophy, RefreshCw, Skull } from 'lucide-react';
import { Magnetic } from './Magnetic';
import { cn } from '../lib/utils';
import { genLayerService } from '../services/genlayer';

interface HeaderProps {
  currentView?: 'lobby' | 'profile' | 'leaderboard' | 'bosses';
  setCurrentView?: (view: 'lobby' | 'profile' | 'leaderboard' | 'bosses') => void;
}

export default function Header({ currentView = 'lobby', setCurrentView }: HeaderProps) {
  const { isConnected, address, connect, disconnect, isConnecting, contractAddress, deployContract, isDeploying } = useWallet();
  const [treasury, setTreasury] = useState<number | null>(null);

  useEffect(() => {
    if (contractAddress) {
      const fetchTreasury = async () => {
        try {
          const state = await genLayerService.getProtocolState(contractAddress);
          if (state && typeof state.treasury_atto !== 'undefined') {
            setTreasury(state.treasury_atto);
          }
        } catch (e) {
          // ignore
        }
      };
      fetchTreasury();
      const interval = setInterval(fetchTreasury, 10000);
      return () => clearInterval(interval);
    }
  }, [contractAddress]);

  return (
    <header className="w-full relative z-50 pt-3 pb-2 border-b-2 border-white/10 mb-2 bg-gen-bg">
      <div className="w-full px-4 md:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brutalist Logo */}
          <div 
            className="flex items-center cursor-pointer group"
            onClick={() => setCurrentView && setCurrentView('lobby')}
          >
            <div className="flex items-center">
              <span className="font-bebas text-3xl md:text-4xl tracking-widest leading-none text-gen-text">
                GL
              </span>
              <span className="font-bebas text-3xl md:text-4xl tracking-widest leading-none text-gen-lime ml-2 group-hover:text-white transition-colors duration-300">
                ROYALE
              </span>
            </div>
          </div>

          {/* Brutalist Consensus Block (Desktop Only) */}
          <div className="hidden lg:flex flex-col items-start border-l-2 border-white/10 pl-6 ml-6">
            <span className="text-[10px] font-mono font-bold tracking-widest text-gen-text-muted mb-1">
              CONSENSUS PROTOCOL
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono tracking-widest bg-gen-surface px-2 py-0.5 text-gen-text border border-white/10">
                CYAN
              </span>
              <span className="text-gen-lime font-mono text-xs">→</span>
              <span className="text-xs font-bold font-mono tracking-widest bg-gen-surface px-2 py-0.5 text-gen-text border border-white/10">
                MAGENTA
              </span>
              <span className="text-gen-lime font-mono text-xs">→</span>
              <span className="text-xs font-bold font-mono tracking-widest bg-gen-surface px-2 py-0.5 text-gen-text border border-white/10">
                YELLOW
              </span>
            </div>
          </div>
          <div className="flex-1" />

          {/* Treasury Block */}
          {treasury !== null && (
            <div className="hidden lg:flex flex-col items-end border-r-2 border-white/10 pr-6 mr-6">
              <span className="text-[10px] font-mono font-bold tracking-widest text-gen-text-muted mb-1">
                GLOBAL TREASURY
              </span>
              <div className="flex items-center gap-2 text-gen-lime font-mono">
                <span className="text-2xl font-bebas leading-none">{(treasury / 1e18).toFixed(0)}</span>
                <span className="text-xs">GEN</span>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <Magnetic>
              <button
                 onClick={() => setCurrentView && setCurrentView('bosses')}
                 className={cn(
                   "font-mono font-bold tracking-widest text-[10px] md:text-xs px-2 py-1.5 border-2 transition-all flex items-center gap-1.5 whitespace-nowrap",
                   currentView === 'bosses' 
                     ? "bg-gen-lime text-gen-bg border-gen-lime" 
                     : "bg-transparent border-white/20 text-gen-text hover:border-gen-lime hover:text-gen-lime"
                 )}
              >
                 <Skull className="w-3.5 h-3.5" />
                 <span className="hidden sm:inline">BOSSES</span>
              </button>
            </Magnetic>
            <Magnetic>
              <button
                 onClick={() => setCurrentView && setCurrentView('leaderboard')}
                 className={cn(
                   "font-mono font-bold tracking-widest text-[10px] md:text-xs px-2 py-1.5 border-2 transition-all flex items-center gap-1.5 whitespace-nowrap",
                   currentView === 'leaderboard' 
                     ? "bg-gen-lime text-gen-bg border-gen-lime" 
                     : "bg-transparent border-white/20 text-gen-text hover:border-gen-lime hover:text-gen-lime"
                 )}
              >
                 <Trophy className="w-3.5 h-3.5" />
                 <span className="hidden sm:inline">RANKINGS</span>
              </button>
            </Magnetic>
            <Magnetic>
              <button
                 onClick={() => setCurrentView && setCurrentView('disputes')}
                 className={cn(
                   "font-mono font-bold tracking-widest text-[10px] md:text-xs px-2 py-1.5 border-2 transition-all flex items-center gap-1.5 whitespace-nowrap",
                   currentView === 'disputes' 
                     ? "bg-gen-lime text-gen-bg border-gen-lime" 
                     : "bg-transparent border-white/20 text-gen-text hover:border-gen-lime hover:text-gen-lime"
                 )}
              >
                 <span className="hidden sm:inline">APPEALS</span>
              </button>
            </Magnetic>
            <Magnetic>
              <button
                 onClick={() => setCurrentView && setCurrentView('audit')}
                 className={cn(
                   "font-mono font-bold tracking-widest text-[10px] md:text-xs px-2 py-1.5 border-2 transition-all flex items-center gap-1.5 whitespace-nowrap",
                   currentView === 'audit' 
                     ? "bg-gen-lime text-gen-bg border-gen-lime" 
                     : "bg-transparent border-white/20 text-gen-text hover:border-gen-lime hover:text-gen-lime"
                 )}
              >
                 <span className="hidden sm:inline">AUDIT</span>
              </button>
            </Magnetic>
            <Magnetic>
              <button
                 onClick={() => setCurrentView && setCurrentView('admin')}
                 className={cn(
                   "font-mono font-bold tracking-widest text-[10px] md:text-xs px-2 py-1.5 border-2 transition-all flex items-center gap-1.5 whitespace-nowrap",
                   currentView === 'admin' 
                     ? "bg-red-500 text-white border-red-500" 
                     : "bg-transparent border-white/20 text-red-500/70 hover:border-red-500 hover:text-red-500"
                 )}
              >
                 <span className="hidden sm:inline">ADMIN</span>
              </button>
            </Magnetic>
            
            {isConnected ? (
              <div className="flex items-center gap-2">
                <Magnetic>
                  <button 
                    onClick={() => setCurrentView && setCurrentView(currentView === 'profile' ? 'lobby' : 'profile')}
                    className={cn(
                      "font-mono font-bold tracking-widest text-xs md:text-sm px-4 py-2 border-2 transition-all flex items-center gap-2",
                      currentView === 'profile' 
                        ? "bg-white text-gen-bg border-white" 
                        : "bg-gen-surface border-white/20 text-white hover:border-white"
                    )}
                  >
                    <User className="w-4 h-4" />
                    <span>{address?.substring(0, 6)}...{address?.substring(address.length - 4)}</span>
                  </button>
                </Magnetic>
                <Magnetic>
                  <button 
                    onClick={() => {
                       disconnect();
                       if (setCurrentView) setCurrentView('lobby');
                    }}
                    className="bg-transparent border-2 border-red-500/50 hover:bg-red-500 hover:text-gen-bg text-red-500 p-2 transition-all"
                    title="Disconnect Wallet"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </Magnetic>
                <Magnetic>
                  <button 
                    disabled={isDeploying}
                    onClick={async () => {
                      localStorage.removeItem('genlayer_game_contract_v2');
                      await deployContract();
                    }}
                    className="bg-gen-lime hover:bg-white text-gen-bg px-4 py-2 font-bebas text-lg tracking-widest transition-all disabled:opacity-50 disabled:cursor-wait uppercase leading-none"
                    title="Deploy Contract"
                  >
                    {isDeploying ? 'DEPLOYING...' : 'DEPLOY CONTRACT'}
                  </button>
                </Magnetic>
              </div>
            ) : (
              <Magnetic>
                <button 
                  onClick={connect}
                  disabled={isConnecting}
                  className="bg-gen-lime hover:bg-white text-gen-bg px-6 py-2 font-bebas text-xl md:text-2xl tracking-widest transition-all disabled:opacity-50 disabled:cursor-wait uppercase leading-none"
                >
                  {isConnecting ? 'SYNCING...' : 'INITIATE CONNECTION'}
                </button>
              </Magnetic>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

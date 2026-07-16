import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import GameClient from '../components/GameClient';
import { Trophy, ChevronRight } from 'lucide-react';
import { Lobby } from '../types';
import { InfiniteMarquee } from '../components/InfiniteMarquee';
import { TextReveal } from '../components/TextReveal';
import { Magnetic } from '../components/Magnetic';
import { cn } from '../lib/utils';

const MOCK_LOBBIES: Lobby[] = [
  { id: '0x1A4...9fB', name: 'Training Grounds', entryFee: 0, prizePool: 5, players: 4, maxPlayers: 8, shard: 'Gen-Alpha', status: 'Open' },
];

export default function LobbiesView() {
  const { isConnected, connect, client, contractAddress, clearContractAddress, isDeploying, deployContract, address } = useWallet();
  const [activeLobby, setActiveLobby] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [highestScore, setHighestScore] = useState<number | null>(null);
  const [needsDeployment, setNeedsDeployment] = useState(false);

  useEffect(() => {
    if (client) {
      if (contractAddress) {
        const readWithRetry = async (
          addr: string,
          funcName: string,
          argsArray: any[],
          retriesLeft = 6,
          delayMs = 2000
        ): Promise<any> => {
          try {
            return await client.readContract({
              address: addr,
              functionName: funcName,
              args: argsArray
            });
          } catch (err: any) {
            let errMsgOnFail = '';
            try {
              errMsgOnFail = (
                String(err?.message || '') + ' ' + 
                String(err?.details || '') + ' ' + 
                String(err?.error?.message || '') + ' ' + 
                JSON.stringify(err)
              ).toLowerCase();
            } catch {
              errMsgOnFail = String(err || '').toLowerCase();
            }
            const isMissing = 
              errMsgOnFail.includes('not found') || 
              errMsgOnFail.includes('not_found') || 
              errMsgOnFail.includes('notfound') || 
              errMsgOnFail.includes('does not exist') ||
              errMsgOnFail.includes('invalid contract');

            if (isMissing && retriesLeft <= 2) {
              throw err;
            }

            if (retriesLeft > 1) {
              await new Promise(resolve => setTimeout(resolve, delayMs));
              return readWithRetry(addr, funcName, argsArray, retriesLeft - 1, delayMs);
            }
            throw err;
          }
        };

        readWithRetry(contractAddress, 'get_highest_score', [difficulty])
          .then((score: any) => {
            setHighestScore(Number(score));
            setNeedsDeployment(false);
          }).catch((err: any) => {
            let errMsg = '';
            try {
              errMsg = (
                String(err?.message || '') + ' ' + 
                String(err?.details || '') + ' ' + 
                String(err?.error?.message || '') + ' ' + 
                JSON.stringify(err)
              ).toLowerCase();
            } catch {
              errMsg = String(err || '').toLowerCase();
            }

            const isMissing = 
              errMsg.includes('not found') || 
              errMsg.includes('not_found') || 
              errMsg.includes('notfound') || 
              errMsg.includes('does not exist') ||
              errMsg.includes('invalid contract');

            if (isMissing) {
              clearContractAddress();
              setNeedsDeployment(true);
              setHighestScore(0);
            }
          });
      } else {
        setNeedsDeployment(true);
      }
    }
  }, [difficulty, client, contractAddress, clearContractAddress]);

  useEffect(() => {
    if (needsDeployment && !isDeploying) {
       deployContract();
       setNeedsDeployment(false); 
    }
  }, [needsDeployment, isDeploying]);

  const defaultLobby = MOCK_LOBBIES[0];

  const handlePlay = () => {
    if (!isConnected) {
      connect();
      return;
    }
    setActiveLobby(defaultLobby.id);
  };

  if (activeLobby) {
    return (
      <div className="flex flex-col flex-1 w-full h-full min-h-[600px] border-2 border-white/10 bg-gen-surface">
         <GameClient lobby={defaultLobby} onExit={() => setActiveLobby(null)} difficulty={difficulty} />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full relative">
      <div className="mb-2">
        <InfiniteMarquee text="✦ NO MERCY ✦ ON-CHAIN CONSENSUS ✦ CYBERPUNK RUNNER" />
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center py-2 px-4 text-center w-full relative">
        <TextReveal 
          text="SURVIVE THE MAINFRAME" 
          className="font-bebas text-3xl md:text-5xl tracking-widest text-gen-text leading-none mb-2" 
        />
        
        <p className="font-mono text-gen-text-muted text-[10px] md:text-xs max-w-2xl uppercase mb-4 tracking-widest leading-relaxed">
          The ultimate brutalist Web3 arena. Connect your wallet, select your difficulty, and let the consensus algorithm dictate your fate.
        </p>

        {!isConnected ? (
          <Magnetic>
            <button 
              onClick={connect}
              className="bg-gen-lime text-gen-bg font-bebas text-2xl md:text-3xl px-8 py-3 hover:bg-white transition-colors"
            >
              CONNECT BLOCKCHAIN WALLET
            </button>
          </Magnetic>
        ) : (
          <div className="flex flex-col items-center w-full max-w-4xl">
            {/* DIFFICULTY SELECTION */}
            <div className="flex flex-col w-full px-4 md:px-8 py-2">
              <h3 className="font-mono font-bold tracking-widest text-white mb-3 text-center uppercase text-xs md:text-sm">
                SELECT PROTOCOL DIFFICULTY
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-4xl mx-auto w-full mb-3">
                {['Easy', 'Medium', 'Hard'].map((diff) => {
                  const isActive = difficulty === diff;
                  return (
                    <Magnetic key={diff}>
                      <button
                        onClick={() => setDifficulty(diff as 'Easy' | 'Medium' | 'Hard')}
                        className={`
                          w-full flex flex-col items-center justify-center py-4 border-2 transition-all duration-300
                          ${isActive 
                            ? 'bg-gen-lime text-gen-bg border-gen-lime' 
                            : 'bg-gen-surface text-gen-text border-white/20 hover:border-white hover:bg-white/5'
                          }
                        `}
                      >
                        <span className="font-bebas text-xl md:text-2xl tracking-widest uppercase mb-1 leading-none">
                          {diff}
                        </span>
                        <span className={`font-mono text-[9px] tracking-widest uppercase ${isActive ? 'text-gen-bg/80' : 'text-gen-text-muted'}`}>
                          {diff === 'Easy' ? 'LOW RISK // 2 BOTS' : diff === 'Medium' ? 'STANDARD // 5 BOTS' : 'LETHAL // 10 BOTS'}
                        </span>
                      </button>
                    </Magnetic>
                  );
                })}
              </div>
            </div>

            {/* Highest Score */}
            {highestScore !== null && (
              <div className="font-mono text-xs text-gen-text-muted uppercase tracking-widest flex items-center gap-2 bg-gen-surface border-2 border-white/10 px-4 py-1 mb-2">
                <Trophy className="w-3 h-3 text-gen-lime" />
                <span>HIGHEST SCORE ({difficulty}):</span>
                <span className="text-gen-lime font-bold text-base">{highestScore}</span>
              </div>
            )}

            {/* Start Game Action */}
            {isDeploying || needsDeployment ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <p className="text-gen-lime text-[9px] md:text-[10px] font-mono animate-pulse uppercase tracking-widest">INITIALIZING SESSION-LEDGER...</p>
                <button 
                  disabled
                  className="w-full max-w-xs bg-gen-surface border-2 border-white/10 text-gen-text-muted font-bebas text-lg py-2 cursor-not-allowed opacity-50"
                >
                  SYNCHRONIZING
                </button>
              </div>
            ) : (
              <Magnetic className="w-full max-w-xs">
                <button 
                  onClick={handlePlay}
                  className="w-full flex items-center justify-center gap-2 bg-gen-lime hover:bg-white text-gen-bg font-bebas text-xl md:text-2xl tracking-widest px-6 py-2 transition-colors"
                >
                  START GAME <ChevronRight className="w-4 h-4" />
                </button>
              </Magnetic>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

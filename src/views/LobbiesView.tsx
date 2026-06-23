import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import GameClient from '../components/GameClient';
import { Trophy } from 'lucide-react';
import { Lobby } from '../types';

const MOCK_LOBBIES: Lobby[] = [
  { id: '0x1A4...9fB', name: 'Training Grounds', entryFee: 0, prizePool: 5, players: 4, maxPlayers: 8, shard: 'Gen-Alpha', status: 'Open' },
];

export default function LobbiesView() {
  const { isConnected, connect, client, contractAddress, clearContractAddress, isDeploying, deployContract } = useWallet();
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

  return (
    <div className="flex flex-col gap-6 w-full h-[calc(100vh-100px)] pt-4 text-slate-100 font-sans">
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex-1 w-full relative rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-y-auto flex flex-col items-center">
          {activeLobby ? (
            <div className="w-full flex-1 min-h-[600px] flex flex-col">
               <GameClient lobby={defaultLobby} onExit={() => setActiveLobby(null)} difficulty={difficulty} />
            </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center py-16 px-8 text-center min-h-full w-full relative">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-25 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-black to-black">
                </div>
                
                <h2 className="text-2xl md:text-3xl font-light tracking-wide text-white z-10 relative mb-8">
                  {isConnected ? "Ready to play GenLayer Games" : "Connect your wallet to join"}
                </h2>

                {!activeLobby && isConnected && (
                  <div className="flex flex-col items-center z-10 gap-6">
                    <div className="flex gap-4">
                      {['Easy', 'Medium', 'Hard'].map(level => (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level as any)}
                          className={`px-6 py-2 rounded-full font-mono text-sm tracking-wider transition-all duration-200 ${
                            difficulty === level 
                              ? 'bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/20' 
                              : 'bg-white/5 border border-white/10 text-white hover:bg-white/12'
                          }`}
                        >
                          {level.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    
                    {highestScore !== null && (
                      <div className="text-zinc-400 font-mono flex items-center justify-center space-x-2 bg-zinc-900/50 border border-white/5 py-2 px-4 rounded-xl">
                        <Trophy className="w-4 h-4 text-emerald-400" />
                        <span>Highest Score ({difficulty}): <span className="text-emerald-400 font-bold">{highestScore}</span> KILLS</span>
                      </div>
                    )}

                    {isDeploying || needsDeployment ? (
                      <div className="flex flex-col items-center gap-4">
                        <p className="text-zinc-500 text-sm font-mono animate-pulse">Initializing Session-Ledger for Studionet...</p>
                        <button 
                          disabled={true}
                          className="px-10 py-3 rounded-xl font-bold tracking-widest text-sm transition-all border bg-zinc-950 border-zinc-800 text-zinc-600 cursor-not-allowed uppercase"
                        >
                          Synchronizing...
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={handlePlay}
                        className="px-10 py-3 rounded-xl font-bold tracking-widest text-sm transition-transform hover:scale-[1.02] active:scale-98 bg-white hover:bg-emerald-400 text-black uppercase"
                      >
                        Start Game
                      </button>
                    )}
                  </div>
                )}

                {!isConnected && (
                  <button 
                    onClick={connect}
                    className="z-10 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold tracking-wider text-xs py-3.5 px-8 rounded-xl transition-all duration-300"
                  >
                    CONNECT BLOCKCHAIN WALLET
                  </button>
                )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

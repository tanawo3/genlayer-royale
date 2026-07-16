import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../hooks/useWallet';
import { genLayerService } from '../services/genlayer';
import { ShieldCheck, Loader2, Skull, Coins, Zap, Swords, Play } from 'lucide-react';
import { toast } from 'sonner';
import GameClient from './GameClient';

export default function WorldBosses() {
  const { client, contractAddress, isConnected, address } = useWallet();
  const [claimingBossId, setClaimingBossId] = useState<number | null>(null);
  const [isSpawning, setIsSpawning] = useState(false);
  const [activeBossEncounter, setActiveBossEncounter] = useState<any | null>(null);

  const { data: stateData, refetch: refetchState } = useQuery({
    queryKey: ['protocolState', contractAddress],
    queryFn: async () => {
      if (!client || !contractAddress) return null;
      const data = await client.readContract({
        address: contractAddress,
        functionName: 'get_state',
        args: []
      });
      return typeof data === 'string' ? JSON.parse(data) : data;
    },
    enabled: !!client && !!contractAddress && isConnected,
    refetchInterval: 15000,
  });

  const { data: bosses = [], refetch: refetchBosses } = useQuery({
    queryKey: ['worldBosses', contractAddress, stateData?.boss_counter],
    queryFn: async () => {
      if (!client || !contractAddress || !stateData?.boss_counter) return [];
      const count = Number(stateData.boss_counter);
      const bossPromises = [];
      for (let i = 1; i <= count; i++) {
        bossPromises.push(
          client.readContract({
            address: contractAddress,
            functionName: 'get_boss',
            args: [i]
          }).then(res => typeof res === 'string' ? JSON.parse(res) : res)
        );
      }
      const results = await Promise.all(bossPromises);
      return results.filter(b => b && b.boss_id).reverse();
    },
    enabled: !!client && !!contractAddress && !!stateData?.boss_counter,
    refetchInterval: 30000,
  });

  const { data: playerStats, refetch: refetchPlayerStats } = useQuery({
    queryKey: ['playerStats', contractAddress, address],
    queryFn: async () => {
      if (!client || !contractAddress || !address) return null;
      const data = await client.readContract({
         address: contractAddress,
         functionName: 'get_player_stats',
         args: [address]
      });
      return typeof data === 'string' ? JSON.parse(data) : data;
    },
    enabled: !!client && !!contractAddress && !!address,
    refetchInterval: 15000,
  });

  const claimedBounties = Array.isArray(playerStats?.claimed_bounties) 
    ? playerStats.claimed_bounties.map(String) 
    : [];

  const handleClaim = async (bossId: number) => {
    if (!contractAddress) return;
    try {
      setClaimingBossId(bossId);
      toast.info(`Claiming native GEN bounty for Boss #${bossId}...`);
      await genLayerService.claimTournamentBounty(contractAddress, bossId);
      toast.success("Bounty transaction submitted! Validating on GenLayer...");
      
      setTimeout(() => {
         refetchState();
         refetchBosses();
         refetchPlayerStats();
      }, 10000);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to claim bounty");
    } finally {
      setClaimingBossId(null);
    }
  };

  const handleEnterArena = (boss: any) => {
    setActiveBossEncounter(boss);
  };

  const handleSpawnBoss = async () => {
    if (!contractAddress) return;
    try {
      setIsSpawning(true);
      toast.info("Triggering World Boss Event...");
      await genLayerService.triggerWorldBossEvent(contractAddress);
      toast.success("Boss anomaly triggered! Waiting for consensus...");
      setTimeout(() => {
         refetchState();
         refetchBosses();
      }, 10000);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to trigger boss");
    } finally {
      setIsSpawning(false);
    }
  };

  if (!isConnected) return null;

  if (activeBossEncounter) {
    return (
      <div className="flex flex-col flex-1 w-full h-full min-h-[600px] border-2 border-white/10 bg-[#050505]">
        <GameClient 
          lobby={{ id: 'boss', players: 1 } as any} 
          onExit={() => {
            setActiveBossEncounter(null);
            refetchBosses();
          }}
          difficulty="Hard"
          bossMode={activeBossEncounter}
        />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2 mt-2 max-w-2xl mx-auto px-4 pb-48">
      <div className="flex items-center justify-between border-b-2 border-white/10 pb-2 mb-2 mt-2">
        <div className="flex items-center gap-2">
          <Skull className="w-6 h-6 text-gen-lime" />
          <h3 className="text-2xl md:text-3xl font-bebas tracking-widest text-white leading-none">WORLD BOSS EVENTS</h3>
        </div>
        <button 
          onClick={handleSpawnBoss}
          disabled={isSpawning}
          className="bg-gen-lime hover:bg-white text-gen-bg px-3 py-1.5 font-bebas text-sm tracking-widest transition-all disabled:opacity-50 disabled:cursor-wait uppercase leading-none flex items-center gap-1.5"
        >
          {isSpawning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {isSpawning ? 'SPAWNING...' : 'SPAWN BOSS'}
        </button>
      </div>

      <div className="w-full flex items-center justify-between border border-gen-lime/20 bg-[#050505] p-3 mb-2 rounded-lg">
        <div className="flex flex-col">
          <span className="font-mono text-xs text-gen-text-muted tracking-widest uppercase">Global Treasury</span>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-gen-lime" />
            <span className="font-bebas text-2xl text-white tracking-widest">
              {stateData?.treasury_atto !== undefined ? (stateData.treasury_atto / 1e18).toFixed(0) : '0'} <span className="text-sm text-gen-lime">GEN</span>
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-[10px] text-gen-lime/70 tracking-widest uppercase block mb-1">WARNING</span>
          <span className="font-mono text-[9px] text-gen-text-muted tracking-wide max-w-[150px] inline-block leading-snug">
            Attacks require 1 GEN stake.
            Success = 2x Payout. Failure = Slashed.
          </span>
        </div>
      </div>

      {bosses.length === 0 ? (
        <div className="text-center py-8 border border-white/10 bg-gen-surface w-full">
          <p className="text-gen-text-muted font-mono text-sm uppercase tracking-widest">
            NO ACTIVE BOSS ANOMALIES DETECTED.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {bosses.map((boss: any) => {
            const isDefeated = boss.status === 'DEFEATED';
            const isClaimed = claimedBounties.includes(String(boss.boss_id));
            const isClaiming = claimingBossId === boss.boss_id;
            
            return (
              <div key={boss.boss_id} className={`border ${isDefeated ? 'border-gen-lime/30 bg-gen-lime/5' : 'border-red-500/30 bg-red-500/5'} p-3 mx-auto flex flex-col justify-between w-full max-w-xs`}>
                <div className="mb-2">
                  <div className="flex justify-between items-start mb-1.5">
                    <h4 className="font-bebas text-xl tracking-widest text-white">{boss.boss_name}</h4>
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 uppercase tracking-widest ${isDefeated ? 'bg-gen-lime text-black' : 'bg-red-500 text-white'}`}>
                      {boss.status}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-gen-text-muted line-clamp-2 mb-2">{boss.lore}</p>
                  
                  <div className="w-full bg-black/50 h-1 mt-1">
                    <div 
                      className={`h-full ${isDefeated ? 'bg-gen-lime' : 'bg-red-500'}`} 
                      style={{ width: `${Math.max(0, Math.min(100, (Number(boss.current_hp) / Number(boss.hp)) * 100))}%` }} 
                    />
                  </div>
                  <div className="flex justify-between mt-1 font-mono text-[9px] text-gen-text-muted">
                    <span>HP: {boss.current_hp} / {boss.hp}</span>
                    <span>ID: #{boss.boss_id}</span>
                  </div>
                  {boss.last_attack_narrative && (
                    <div className="mt-2 p-1.5 bg-black/40 border border-white/10 font-mono text-[10px] text-gen-text-muted leading-snug">
                      <span className="text-gen-lime">[{boss.status === 'DEFEATED' ? 'KILL FEED' : 'LATEST ATTACK'}]:</span> {boss.last_attack_narrative}
                    </div>
                  )}
                </div>

                <div className="mt-2 pt-3 border-t border-white/10">
                  {isDefeated ? (
                    <button
                      onClick={() => handleClaim(boss.boss_id)}
                      disabled={isClaimed || isClaiming}
                      className={`w-full py-2 font-bebas text-base tracking-widest flex items-center justify-center gap-1.5 transition-all ${
                        isClaimed 
                          ? 'bg-gen-surface text-gen-text-muted cursor-not-allowed border border-white/10' 
                          : 'bg-gen-lime text-black hover:bg-white'
                      }`}
                    >
                      {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                      {isClaimed ? 'BOUNTY CLAIMED' : 'CLAIM BOUNTY (GEN)'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleEnterArena(boss)}
                      className="w-full py-1.5 font-bebas text-sm tracking-widest flex items-center justify-center gap-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      ENTER ARENA
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

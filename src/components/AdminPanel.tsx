import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../hooks/useWallet';
import { genLayerService } from '../services/genlayer';
import { ShieldCheck, Loader2, Key, Users, Plus, Minus, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPanel() {
  const { client, contractAddress, isConnected, address } = useWallet();
  const [modAddress, setModAddress] = useState('');
  const [isSpawning, setIsSpawning] = useState(false);
  const [isModding, setIsModding] = useState(false);

  const { data: stateData, refetch } = useQuery({
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
  });

  const { data: metadataData } = useQuery({
    queryKey: ['contractMetadata', contractAddress],
    queryFn: async () => {
      if (!contractAddress) return null;
      return await genLayerService.getContractMetadata(contractAddress);
    },
    enabled: !!contractAddress && isConnected,
  });

  const { data: healthData } = useQuery({
    queryKey: ['contractHealth', contractAddress],
    queryFn: async () => {
      if (!contractAddress) return null;
      return await genLayerService.getHealthCheck(contractAddress);
    },
    enabled: !!contractAddress && isConnected,
  });

  if (!isConnected || !stateData) return null;

  const isAdmin = stateData.admin?.toLowerCase() === address?.toLowerCase();
  
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-50">
        <ShieldCheck className="w-16 h-16 text-red-500 mb-4" />
        <span className="font-mono text-sm uppercase tracking-widest text-red-500">Access Denied: Admin Clearance Required</span>
      </div>
    );
  }

  const handleSpawnBoss = async () => {
    if (!contractAddress) return;
    try {
      setIsSpawning(true);
      toast.info("Executing Admin Override: Triggering Boss...");
      await genLayerService.triggerWorldBossEvent(contractAddress);
      toast.success("Boss anomaly triggered successfully!");
      refetch();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to trigger boss");
    } finally {
      setIsSpawning(false);
    }
  };

  const handleAddModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractAddress || !client || !modAddress) return;
    try {
      setIsModding(true);
      await client.writeContract({
        address: contractAddress,
        functionName: 'add_moderator',
        args: [modAddress],
        value: 0n
      });
      toast.success(`Moderator ${modAddress} added.`);
      setModAddress('');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to add mod");
    } finally {
      setIsModding(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto pt-0 pb-48 px-4 flex flex-col gap-5 transform scale-95 origin-top">
      <div className="flex items-center gap-3 border-b-2 border-red-500/50 pb-4 mb-2">
        <Settings2 className="w-8 h-8 text-red-500" />
        <h2 className="text-3xl font-bebas tracking-widest text-white">COMMAND CENTER</h2>
      </div>

      <div className="bg-[#050505] border border-red-500/30 p-6 rounded-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] pointer-events-none" />
        <h3 className="font-mono text-sm uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
          <Key className="w-4 h-4" /> Protocol Overrides
        </h3>
        
        <div className="flex items-center justify-between bg-black p-4 border border-white/10 mb-6">
          <span className="font-mono text-xs text-gen-text-muted uppercase">Manual Boss Trigger</span>
          <button 
            onClick={handleSpawnBoss}
            disabled={isSpawning}
            className="bg-red-500 hover:bg-white text-white hover:text-black px-4 py-2 font-bebas tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSpawning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
            {isSpawning ? 'EXECUTING...' : 'FORCE SPAWN BOSS'}
          </button>
        </div>

        <h3 className="font-mono text-sm uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" /> Role Management
        </h3>
        
        <form onSubmit={handleAddModerator} className="flex gap-2">
          <input 
            type="text"
            value={modAddress}
            onChange={(e) => setModAddress(e.target.value)}
            placeholder="0x... Moderator Address"
            className="flex-1 bg-black border border-white/20 p-2 font-mono text-xs text-white focus:outline-none focus:border-red-500"
            required
          />
          <button 
            type="submit"
            disabled={isModding || !modAddress}
            className="bg-white hover:bg-red-500 text-black hover:text-white px-4 py-2 font-bebas tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isModding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            ADD MODERATOR
          </button>
        </form>
      </div>

      <div className="bg-[#050505] border border-white/20 p-6 rounded-lg">
        <h3 className="font-mono text-sm uppercase tracking-widest text-gen-text-muted mb-4 flex items-center gap-2">
          <Settings2 className="w-4 h-4" /> Protocol Diagnostics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-black border border-white/10 p-4 font-mono text-[10px] text-gen-lime overflow-auto max-h-48">
            <span className="text-white mb-2 block border-b border-white/10 pb-1">METADATA.JSON</span>
            <pre>{metadataData ? JSON.stringify(metadataData, null, 2) : 'AWAITING DATA...'}</pre>
          </div>
          <div className="bg-black border border-white/10 p-4 font-mono text-[10px] text-cyan-500 overflow-auto max-h-48">
            <span className="text-white mb-2 block border-b border-white/10 pb-1">HEALTH_CHECK.JSON</span>
            <pre>{healthData ? JSON.stringify(healthData, null, 2) : 'AWAITING DATA...'}</pre>
          </div>
        </div>
      </div>

    </div>
  );
}

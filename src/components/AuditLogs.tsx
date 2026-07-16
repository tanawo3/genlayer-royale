import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../hooks/useWallet';
import { Database, Loader2, Fingerprint, Clock, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuditLogs() {
  const { client, contractAddress, isConnected } = useWallet();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditLogs', contractAddress],
    queryFn: async () => {
      if (!client || !contractAddress) return [];
      const data = await client.readContract({
        address: contractAddress,
        functionName: 'get_audit_logs',
        args: [50] // Fetch last 50
      });
      return typeof data === 'string' ? JSON.parse(data) : data;
    },
    enabled: !!client && !!contractAddress && isConnected,
    refetchInterval: 15000,
  });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] w-full">
        <Database className="w-16 h-16 text-gen-text-muted mb-4 opacity-50" />
        <p className="font-mono text-sm uppercase tracking-widest text-gen-text-muted">Connect wallet to access the Ledger.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-8 border-b-2 border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-gen-lime" />
          <h2 className="text-4xl font-bebas tracking-widest text-white leading-none">ON-CHAIN AUDIT TRAIL</h2>
        </div>
        <div className="flex items-center gap-2 border border-gen-lime/30 bg-gen-lime/10 px-3 py-1 text-gen-lime font-mono text-[10px] uppercase tracking-widest">
          <Fingerprint className="w-3 h-3" />
          Immutable
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-20 opacity-50">
          <Loader2 className="w-8 h-8 text-gen-lime animate-spin mb-4" />
          <span className="font-mono text-xs uppercase tracking-widest">Syncing ledger...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="w-full text-center py-12 border border-white/10 bg-[#050505]">
          <span className="font-mono text-xs text-gen-text-muted uppercase tracking-widest">No audit events recorded yet.</span>
        </div>
      ) : (
        <div data-lenis-prevent="true" className="w-full flex flex-col gap-4 max-h-[65vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gen-lime/20 scrollbar-track-transparent">
          <AnimatePresence>
            {logs.map((log: any, index: number) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-5 flex flex-col"
              >
                <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bebas text-2xl text-white">#{log.id}</span>
                    <span className="px-2 py-0.5 bg-white/10 font-mono text-[10px] text-white uppercase tracking-widest">
                      {log.action}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-gen-text-muted block">OPERATOR</span>
                    <span className="font-mono text-xs text-gen-lime">{log.player.slice(0, 8)}...{log.player.slice(-6)}</span>
                  </div>
                </div>
                
                <div className="bg-black border border-white/5 p-3 font-mono text-xs text-gen-text-muted leading-relaxed mb-3">
                  <span className="text-gen-lime block mb-1 uppercase text-[10px]">AI Reasoning:</span>
                  {log.ai_reasoning || "No reasoning provided."}
                </div>
                
                <div className="flex items-start gap-2 bg-black border border-white/5 p-3 overflow-x-auto">
                  <Terminal className="w-4 h-4 text-gen-text-muted shrink-0 mt-0.5" />
                  <pre className="font-mono text-[10px] text-white">
                    {log.decision}
                  </pre>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

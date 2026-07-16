import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { genLayerService } from '../services/genlayer';
import { ShieldCheck, Scale, Loader2, Send, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function DisputeCourt() {
  const { contractAddress, isConnected, address } = useWallet();
  const [bossId, setBossId] = useState<string>('');
  const [strategy, setStrategy] = useState<string>('');
  const [appealReason, setAppealReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractAddress || !bossId || !strategy || !appealReason) return;
    
    setIsSubmitting(true);
    toast.info("Submitting appeal to the AI Appellate Court...");
    
    try {
      await genLayerService.disputeRejection(
        contractAddress,
        parseInt(bossId, 10),
        "Cyan", // Default color for now, could be fetched from profile
        strategy,
        appealReason
      );
      toast.success("Appeal submitted! The AI Validator is reviewing the case.");
      setStrategy('');
      setAppealReason('');
      setBossId('');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to submit appeal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] w-full">
        <Scale className="w-16 h-16 text-gen-text-muted mb-4 opacity-50" />
        <p className="font-mono text-sm uppercase tracking-widest text-gen-text-muted">Connect wallet to access the Court.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full flex flex-col items-center justify-start py-2 px-4">
      <div className="flex items-center gap-3 mb-4">
        <Scale className="w-6 h-6 text-gen-lime" />
        <h2 className="text-2xl font-bebas tracking-widest text-white">APPELLATE COURT</h2>
      </div>

      <div className="w-full max-w-sm bg-[#0A0A0A] border border-white/10 p-4 relative overflow-hidden rounded-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] pointer-events-none" />
          
          <p className="font-mono text-[10px] text-gen-text-muted mb-4 leading-relaxed border-l-2 border-red-500 pl-3">
          Did the AI unfairly reject your World Boss attack? Submit your original strategy and your argument for why the AI hallucinated or made a mistake. The Supreme AI Validator will review the case.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 relative z-10">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-gen-lime">Boss Encounter ID</label>
            <input 
              type="number" 
              value={bossId}
              onChange={(e) => setBossId(e.target.value)}
              placeholder="e.g. 1"
              className="bg-black border border-white/20 p-2 font-mono text-xs text-white focus:outline-none focus:border-gen-lime transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-gen-lime">Original Strategy Log</label>
            <textarea 
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              placeholder="Paste the exact strategy you used..."
              className="bg-black border border-white/20 p-2 h-14 font-mono text-[10px] text-white focus:outline-none focus:border-gen-lime transition-colors resize-none"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-gen-lime">Appeal Argument</label>
            <textarea 
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="Why was the AI wrong? Provide your logic..."
              className="bg-black border border-white/20 p-2 h-14 font-mono text-[10px] text-white focus:outline-none focus:border-gen-lime transition-colors resize-none"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !bossId || !strategy || !appealReason}
            className="mt-1 bg-white text-black hover:bg-gen-lime font-bebas text-lg tracking-widest py-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isSubmitting ? 'DELIBERATING...' : 'SUBMIT APPEAL'}
          </button>
        </form>
      </div>
    </div>
  );
}

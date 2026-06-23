import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { Trophy, Activity, Wallet, History, ExternalLink, ArrowUpRight } from 'lucide-react';
import { MatchRecord } from '../types';

const MOCK_HISTORY: MatchRecord[] = [
  { id: '1', timestamp: '2 mins ago', mode: 'Nano Shard #1', placement: 1, reward: 25.5, txHash: '0x123...abc', status: 'Confirmed' },
  { id: '2', timestamp: '1 hour ago', mode: 'High Roller Void', placement: 4, reward: 0, txHash: '0xabc...def', status: 'Confirmed' },
  { id: '3', timestamp: '3 hours ago', mode: 'Nano Shard #2', placement: 2, reward: 10, txHash: '0x789...123', status: 'Confirmed' },
  { id: '4', timestamp: '1 day ago', mode: 'Validator Clash', placement: 1, reward: 1500, txHash: '0x456...789', status: 'Confirmed' },
];

export default function DashboardView() {
  const { isConnected, address, balance, connect } = useWallet();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center bg-slate-900/50 border border-slate-800 rounded-xl">
        <Wallet className="w-16 h-16 text-slate-600 mb-6" />
        <h2 className="text-2xl font-bold mb-4 text-white">Connect to View Dashboard</h2>
        <p className="text-slate-400 mb-8 max-w-md">Connect your Genlayer compatible wallet to view your player analytics, match history, and claim unwithdrawn rewards.</p>
        <button onClick={connect} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-colors">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Player Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center"><Wallet className="w-4 h-4 mr-2" /> Total Balance</div>
          <div className="text-3xl font-mono font-bold text-white">{balance.toLocaleString()} GEN</div>
          <div className="text-sm text-green-400 mt-2 flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" /> +1,535 this week</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center"><Trophy className="w-4 h-4 mr-2" /> Global Rank</div>
          <div className="text-2xl font-mono font-bold text-indigo-400 uppercase">Diamond II</div>
          <div className="text-sm text-slate-500 mt-2">Top 4% of players</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center"><Activity className="w-4 h-4 mr-2" /> Win Rate</div>
          <div className="text-3xl font-mono font-bold text-white">42.8%</div>
          <div className="text-sm text-slate-500 mt-2">1,024 matches played</div>
        </div>
        <div className="bg-indigo-600/10 border border-indigo-500/30 p-6 rounded-xl flex flex-col justify-between shadow-[0_0_20px_rgba(79,70,229,0.1)]">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Claimable Rewards</div>
            <div className="text-2xl font-mono font-bold text-white">142.5 GEN</div>
          </div>
          <button className="bg-indigo-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.2)] w-full mt-4 transition-all">
            Claim to Wallet
          </button>
        </div>
      </div>

      {/* Match History */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
        <div className="border-b border-slate-800 p-6 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center"><History className="w-5 h-5 mr-2" /> Match History</h3>
          <button className="text-[10px] font-bold font-mono tracking-widest uppercase text-indigo-400 hover:underline flex items-center">View on Explorer <ExternalLink className="w-3 h-3 ml-1" /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                <th className="p-4 font-normal">When</th>
                <th className="p-4 font-normal">Lobby</th>
                <th className="p-4 font-normal">Placement</th>
                <th className="p-4 font-normal">Reward</th>
                <th className="p-4 font-normal">Tx Hash (Genlayer)</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {MOCK_HISTORY.map((record) => (
                <tr key={record.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 text-slate-400 whitespace-nowrap text-xs">{record.timestamp}</td>
                  <td className="p-4 text-slate-200 text-xs font-bold">{record.mode}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      record.placement === 1 ? 'bg-amber-500/20 text-amber-500' : 
                      record.placement <= 3 ? 'bg-slate-800 text-slate-300' : 'text-slate-600'
                    }`}>
                      {record.placement}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-medium text-green-400">{record.reward > 0 ? `+${record.reward}` : '-'}</td>
                  <td className="p-4 font-mono text-slate-500 hover:text-white cursor-pointer transition-colors max-w-[120px] truncate">
                    {record.txHash}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

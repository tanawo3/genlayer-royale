import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Server, Shield, Zap } from 'lucide-react';

export default function SettingsView() {
  const [useHardwareAcc, setUseHardwareAcc] = useState(true);
  const [highPerformanceMode, setHighPerformanceMode] = useState(true);
  const [rpcEndpoint, setRpcEndpoint] = useState('https://mainnet.genlayer.network/rpc');
  
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Settings</h2>
        <p className="text-slate-400">Customizable security and performance preferences for your Genlayer Royale experience.</p>
      </div>

      <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center"><Zap className="w-5 h-5 mr-2 text-indigo-400" /> Client Performance</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white">High-Performance Rendering</div>
              <div className="text-xs text-slate-500">Enable 120Hz canvas refresh rates for competitive integrity.</div>
            </div>
            <button onClick={() => setHighPerformanceMode(!highPerformanceMode)}>
              {highPerformanceMode ? <ToggleRight className="w-8 h-8 text-indigo-500" /> : <ToggleLeft className="w-8 h-8 text-slate-600" />}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white">Hardware Acceleration (WebGL2)</div>
              <div className="text-xs text-slate-500">Offload physics and collision detection to the GPU.</div>
            </div>
            <button onClick={() => setUseHardwareAcc(!useHardwareAcc)}>
              {useHardwareAcc ? <ToggleRight className="w-8 h-8 text-indigo-500" /> : <ToggleLeft className="w-8 h-8 text-slate-600" />}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center"><Shield className="w-5 h-5 mr-2 text-indigo-400" /> Smart Contract & Network</h3>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Genlayer RPC Endpoint</label>
            <div className="flex space-x-2">
              <input 
                type="text" 
                value={rpcEndpoint}
                onChange={(e) => setRpcEndpoint(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 font-mono"
              />
              <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                Test Connection
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Use a private RPC URL for lower latency cross-shard asset transfers.</p>
          </div>
          
          <div className="pt-4 border-t border-slate-800">
            <h4 className="font-medium text-white mb-2">Automated Payouts</h4>
            <p className="text-sm text-slate-500 mb-4">Automatically sign transactions to withdraw winnings directly to your connected wallet after each match.</p>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-colors">
              Enable Auto-Payout via Smart Contract
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

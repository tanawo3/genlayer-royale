import React, { useState } from 'react';
import { WalletProvider } from './hooks/useWallet';
import Header from './components/Header';
import LobbiesView from './views/LobbiesView';
import UserProfileView from './views/UserProfileView';
import Leaderboard from './components/Leaderboard';

function AppContent() {
  const [currentView, setCurrentView] = useState<'lobby' | 'profile' | 'leaderboard'>('lobby');

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 font-sans selection:bg-indigo-500/30 flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#09090b] to-[#09090b] z-0" />
      <div className="relative z-10 flex flex-col h-full w-full flex-1">
        <Header currentView={currentView} setCurrentView={setCurrentView} />
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-2 flex flex-col">
          {currentView === 'lobby' && <LobbiesView />}
          {currentView === 'profile' && <UserProfileView onBack={() => setCurrentView('lobby')} />}
          {currentView === 'leaderboard' && (
            <div className="flex flex-col w-full h-[calc(100vh-100px)] pt-4 text-slate-100 font-sans">
              <div className="flex-1 relative rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md overflow-y-auto w-full">
                <Leaderboard onBack={() => setCurrentView('lobby')} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}

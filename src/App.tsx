import React, { useState, useEffect } from 'react';
import { WalletProvider } from './hooks/useWallet';
import Header from './components/Header';
import LobbiesView from './views/LobbiesView';
import UserProfileView from './views/UserProfileView';
import Leaderboard from './components/Leaderboard';
import WorldBosses from './components/WorldBosses';
import DisputeCourt from './components/DisputeCourt';
import AuditLogs from './components/AuditLogs';
import AdminPanel from './components/AdminPanel';
import { ReactLenis } from 'lenis/react';
import { Preloader } from './components/Preloader';
import { AnimatePresence } from 'motion/react';

export type ViewType = 'lobby' | 'profile' | 'leaderboard' | 'bosses' | 'disputes' | 'audit' | 'admin';

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>('lobby');
  const [loading, setLoading] = useState(true);

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && <Preloader onComplete={() => setLoading(false)} />}
      </AnimatePresence>
      
      {!loading && (
        <div className="min-h-screen bg-gen-bg text-gen-text font-sans selection:bg-gen-lime selection:text-gen-bg flex flex-col overflow-hidden relative">
          <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.02] via-[#050505] to-[#050505] z-0" />
          
          <div className="relative z-10 flex flex-col h-full w-full flex-1">
            <Header currentView={currentView} setCurrentView={setCurrentView} />
            
            <main className="flex-1 w-full mx-auto flex flex-col mt-4 md:mt-12 mb-4 px-4 md:px-8 min-h-0">
              {currentView === 'lobby' && <LobbiesView />}
              {currentView === 'profile' && <UserProfileView onBack={() => setCurrentView('lobby')} />}
              {currentView === 'leaderboard' && (
                <div className="flex flex-col w-full flex-1 min-h-0 pt-4 text-gen-text font-sans">
                  <div data-lenis-prevent="true" className="flex-1 relative border-2 border-white/10 bg-[#050505] overflow-y-auto w-full">
                    <Leaderboard onBack={() => setCurrentView('lobby')} />
                  </div>
                </div>
              )}
              {currentView === 'bosses' && (
                <div className="flex flex-col w-full flex-1 min-h-0 pt-4 text-gen-text font-sans">
                  <div data-lenis-prevent="true" className="flex-1 relative border-2 border-white/10 bg-[#050505] overflow-y-auto w-full p-4">
                    <WorldBosses />
                  </div>
                </div>
              )}
              {currentView === 'disputes' && (
                <div className="flex flex-col w-full flex-1 min-h-0 pt-4 text-gen-text font-sans">
                  <div data-lenis-prevent="true" className="flex-1 relative border-2 border-white/10 bg-[#050505] overflow-y-auto w-full p-4">
                    <DisputeCourt />
                  </div>
                </div>
              )}
              {currentView === 'audit' && (
                <div className="flex flex-col w-full flex-1 min-h-0 pt-4 text-gen-text font-sans">
                  <div data-lenis-prevent="true" className="flex-1 relative border-2 border-white/10 bg-[#050505] overflow-y-auto w-full p-4">
                    <AuditLogs />
                  </div>
                </div>
              )}
              {currentView === 'admin' && (
                <div className="flex flex-col w-full flex-1 min-h-0 pt-4 text-gen-text font-sans">
                  <div data-lenis-prevent="true" className="flex-1 relative border-2 border-red-500/20 bg-[#050505] overflow-y-auto w-full p-4">
                    <AdminPanel />
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      )}
    </>
  );
}

import { Toaster } from '@/components/ui/sonner';

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
      <Toaster />
    </WalletProvider>
  );
}

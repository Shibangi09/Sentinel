import React, { useState } from 'react';
import { DrowsinessDetector } from './components/DrowsinessDetector';
import { AlertTriangle, Eye, Activity } from 'lucide-react';

export default function App() {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 p-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Eye className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Sentinel
              </h1>
              <p className="text-xs text-slate-400">Driver Attention Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                <Activity className={`w-3 h-3 ${isActive ? 'animate-pulse' : ''}`} />
                {isActive ? 'SYSTEM ACTIVE' : 'STANDBY'}
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl">
           <DrowsinessDetector onActiveChange={setIsActive} />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-slate-600 text-xs border-t border-slate-800 bg-slate-950">
        <p>Powered by Google Gemini 2.5 Flash • Real-time Multimodal Analysis</p>
      </footer>
    </div>
  );
}
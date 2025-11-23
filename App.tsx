import React, { useState } from 'react';
import { PaperContent } from './components/PaperContent';
import { RobotSimulation } from './components/RobotSimulation';
import { ErrorChart, ParameterChart } from './components/Charts';
import { ControlConfig, SimulationState } from './types';
import { TrajectoryType } from './constants';
import { Play, Pause, RefreshCw, Box, Activity, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [config, setConfig] = useState<ControlConfig>({
    isAdaptive: false,
    hasLoad: false,
    trajectory: TrajectoryType.CIRCLE,
    isPlaying: true,
  });

  const [history, setHistory] = useState<SimulationState['history']>([]);

  const handleUpdate = (data: SimulationState['history'][0]) => {
    setHistory(prev => {
        const newHist = [...prev, data];
        if (newHist.length > 200) newHist.shift(); // Keep memory low
        return newHist;
    });
  };

  const togglePlay = () => setConfig(p => ({ ...p, isPlaying: !p.isPlaying }));
  const resetSim = () => {
    setHistory([]);
    // Toggle trajectory briefly to trigger reset effect in simulation
    const current = config.trajectory;
    setConfig(p => ({ ...p, trajectory: current === TrajectoryType.CIRCLE ? TrajectoryType.FIGURE_EIGHT : TrajectoryType.CIRCLE }));
    setTimeout(() => setConfig(p => ({ ...p, trajectory: current })), 10);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Left Panel: Research Paper Content */}
      <div className="w-1/3 hidden md:block border-r border-slate-200 bg-white p-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
         <PaperContent />
      </div>

      {/* Right Panel: Interactive Simulation */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Interactive Simulation Lab
            </h2>
            <div className="flex gap-2">
                 <button 
                    onClick={togglePlay}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                 >
                    {config.isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    {config.isPlaying ? 'Pause' : 'Resume'}
                 </button>
                 <button 
                    onClick={resetSim}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                 >
                    <RefreshCw size={16} />
                    Reset
                 </button>
            </div>
        </header>

        <main className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto w-full">
            
            {/* Simulation Canvas Area */}
            <div className="col-span-1 lg:col-span-2 space-y-4">
                <RobotSimulation config={config} onUpdate={handleUpdate} />
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-2">
                    <span>Model: Unicycle (Pioneer 3-DX)</span>
                    <span>Algorithm: Lyapunov-based Adaptive Control</span>
                </div>
            </div>

            {/* Controls Dashboard */}
            <div className="col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold border-b border-slate-100 pb-2">
                    <Settings size={18} />
                    <span>Control Parameters</span>
                </div>
                
                <div className="space-y-6">
                    {/* Trajectory Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reference Trajectory</label>
                        <div className="flex p-1 bg-slate-100 rounded-lg">
                            <button 
                                onClick={() => setConfig(p => ({...p, trajectory: TrajectoryType.CIRCLE}))}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${config.trajectory === TrajectoryType.CIRCLE ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                Circular (Fig 4)
                            </button>
                            <button 
                                onClick={() => setConfig(p => ({...p, trajectory: TrajectoryType.FIGURE_EIGHT}))}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${config.trajectory === TrajectoryType.FIGURE_EIGHT ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                Figure-8 (Fig 8)
                            </button>
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-2 gap-4">
                        <div 
                            onClick={() => setConfig(p => ({...p, hasLoad: !p.hasLoad}))}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center ${config.hasLoad ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                            <Box className={config.hasLoad ? 'text-red-600' : 'text-slate-400'} />
                            <div>
                                <div className={`font-bold text-sm ${config.hasLoad ? 'text-red-700' : 'text-slate-600'}`}>Load Transportation</div>
                                <div className="text-xs text-slate-500 mt-1">Simulates mass change (disturbances)</div>
                            </div>
                        </div>

                        <div 
                            onClick={() => setConfig(p => ({...p, isAdaptive: !p.isAdaptive}))}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center ${config.isAdaptive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                            <Activity className={config.isAdaptive ? 'text-emerald-600' : 'text-slate-400'} />
                            <div>
                                <div className={`font-bold text-sm ${config.isAdaptive ? 'text-emerald-700' : 'text-slate-600'}`}>Adaptive Controller</div>
                                <div className="text-xs text-slate-500 mt-1">Enables σ-modification updating law</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Data Visualizations */}
            <div className="col-span-1 space-y-4">
                 <ErrorChart data={history} />
                 <ParameterChart data={history} />
                 <div className="text-xs text-slate-400 italic mt-2">
                    *Charts update in real-time. Enable "Load" then "Adaptive" to see parameter convergence (similar to Fig. 6).
                 </div>
            </div>

        </main>
      </div>
    </div>
  );
};

export default App;
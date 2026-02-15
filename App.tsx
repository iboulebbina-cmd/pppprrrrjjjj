
import React, { useState, useEffect, useCallback } from 'react';
import { generateInitialHistory, generateSingleDataPoint } from './services/dataService';
import { getEnergyInsights } from './services/geminiService';
import { DashboardState, EnergyDataPoint } from './types';
import StatCard from './components/StatCard';
import { EnergyChart } from './components/Charts';

const App: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    history: generateInitialHistory(20),
    current: null,
    loading: true,
    aiInsights: "Analyzing your energy grid...",
    lastUpdate: new Date()
  });

  const [activeTab, setActiveTab] = useState<'house' | 'factory' | 'wind'>('house');

  const updateTelemetry = useCallback(async () => {
    const nextPoint = generateSingleDataPoint();
    
    setState(prev => {
      const newHistory = [...prev.history.slice(1), nextPoint];
      return {
        ...prev,
        history: newHistory,
        current: nextPoint,
        lastUpdate: new Date(),
        loading: false
      };
    });

    // Fetch AI insights periodically (every 30s to save tokens/rate limits)
    // For this dashboard, we trigger it on mount and every few updates
  }, []);

  useEffect(() => {
    updateTelemetry();
    const interval = setInterval(updateTelemetry, 5000); // UI update every 5s
    return () => clearInterval(interval);
  }, [updateTelemetry]);

  // Seperate effect for AI insights to avoid clogging telemetry
  useEffect(() => {
    const fetchAI = async () => {
      if (state.current) {
        const insights = await getEnergyInsights(state.current);
        setState(prev => ({ ...prev, aiInsights: insights }));
      }
    };
    
    fetchAI();
    const aiInterval = setInterval(fetchAI, 30000); // AI update every 30s
    return () => clearInterval(aiInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.current?.weather]); // Re-run if weather drastically changes

  const cur = state.current;

  if (!cur) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
        <p className="mt-4 text-slate-600 font-medium">Initializing EcoSmart Systems...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-12">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <i className="fas fa-leaf text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">EcoSmart Management</h1>
              <p className="text-xs text-slate-500 font-medium flex items-center">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></span>
                SYSTEM ACTIVE • {state.lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('house')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'house' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <i className="fas fa-home mr-2"></i> House
            </button>
            <button 
              onClick={() => setActiveTab('factory')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'factory' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <i className="fas fa-industry mr-2"></i> Factory
            </button>
            <button 
              onClick={() => setActiveTab('wind')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'wind' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <i className="fas fa-wind mr-2"></i> Wind
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Weather & AI Insight Bar */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-100 relative overflow-hidden">
             <i className={`fas ${cur.weather === 'Sunny' ? 'fa-sun' : cur.weather === 'Windy' ? 'fa-wind' : 'fa-cloud'} absolute -right-4 -top-4 text-8xl opacity-10`}></i>
             <div className="relative z-10">
               <p className="text-emerald-100 text-sm font-bold uppercase tracking-widest mb-1">Local Weather</p>
               <h2 className="text-4xl font-black mb-1">{cur.temperature}°C</h2>
               <p className="text-xl font-medium mb-4">{cur.weather}</p>
               <div className="flex items-center space-x-4 text-sm font-medium">
                  <span><i className="fas fa-droplet mr-1 opacity-70"></i> 45% Hum</span>
                  <span><i className="fas fa-wind mr-1 opacity-70"></i> {cur.windSpeed}m/s</span>
               </div>
             </div>
          </div>
          <div className="lg:col-span-2 bg-indigo-900 rounded-2xl p-6 text-indigo-50 shadow-lg relative overflow-hidden flex flex-col justify-center">
             <div className="flex items-start space-x-4">
                <div className="bg-indigo-500/30 p-3 rounded-xl">
                  <i className="fas fa-robot text-2xl text-indigo-300"></i>
                </div>
                <div>
                  <h3 className="text-indigo-200 text-sm font-bold uppercase tracking-widest mb-1">AI Smart Advisor</h3>
                  <p className="text-lg leading-relaxed font-medium italic">
                    "{state.aiInsights}"
                  </p>
                </div>
             </div>
          </div>
        </section>

        {/* Dynamic Metric Grid based on Tab */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeTab === 'house' && (
            <>
              <StatCard label="Battery Level" value={cur.houseBattery} unit="%" icon="fa-battery-three-quarters" color="bg-emerald-500" />
              <StatCard label="Solar Production" value={cur.housePV} unit="W" icon="fa-solar-panel" color="bg-amber-500" />
              <StatCard label="Grid Usage" value={cur.houseGrid} unit="W" icon="fa-bolt" color="bg-blue-500" />
              <StatCard label="Unit Cost" value={cur.houseCost} unit="$/kWh" icon="fa-dollar-sign" color="bg-rose-500" />
            </>
          )}
          {activeTab === 'factory' && (
            <>
              <StatCard label="Battery Level" value={cur.factoryBattery} unit="%" icon="fa-battery-full" color="bg-teal-600" />
              <StatCard label="Ind. Solar" value={cur.factoryPV} unit="W" icon="fa-solar-panel" color="bg-orange-600" />
              <StatCard label="Industrial Grid" value={cur.factoryGrid} unit="W" icon="fa-plug" color="bg-indigo-600" />
              <StatCard label="Comm. Rate" value={cur.factoryCost} unit="$/kWh" icon="fa-hand-holding-dollar" color="bg-red-600" />
            </>
          )}
          {activeTab === 'wind' && (
            <>
              <StatCard label="Generation" value={cur.windEnergy} unit="Wh" icon="fa-fan" color="bg-sky-500" />
              <StatCard label="Current Speed" value={cur.windSpeed} unit="m/s" icon="fa-gauge-high" color="bg-sky-700" />
              <StatCard label="House Draw" value={cur.houseGrid} unit="W" icon="fa-house-bolt" color="bg-slate-500" />
              <StatCard label="Factory Draw" value={cur.factoryGrid} unit="W" icon="fa-industry" color="bg-slate-700" />
            </>
          )}
        </section>

        {/* Main Visualization Area */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           {activeTab === 'house' && <EnergyChart data={state.history} title="Residential Energy Profile" type="house" />}
           {activeTab === 'factory' && <EnergyChart data={state.history} title="Factory Energy Profile" type="factory" />}
           {activeTab === 'wind' && <EnergyChart data={state.history} title="Wind Farm Analytics" type="wind" />}
        </section>

        {/* Footer Stats Table (Condensed) */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-700">Real-Time Data Feed</h3>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">STREAMING</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-slate-400 uppercase bg-slate-50/50">
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3">Battery</th>
                  <th className="px-6 py-3">Solar</th>
                  <th className="px-6 py-3">Grid</th>
                  <th className="px-6 py-3">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.history.slice(-5).reverse().map((point, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors text-sm text-slate-600">
                    <td className="px-6 py-3 font-medium">{point.time}</td>
                    <td className="px-6 py-3">
                      <span className="flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span> House
                      </span>
                    </td>
                    <td className="px-6 py-3">{point.houseBattery}%</td>
                    <td className="px-6 py-3 font-semibold text-amber-600">{point.housePV}W</td>
                    <td className="px-6 py-3 text-indigo-600">{point.houseGrid}W</td>
                    <td className="px-6 py-3 text-rose-600 font-bold">${point.houseCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
};

export default App;

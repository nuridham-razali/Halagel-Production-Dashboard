
import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { StorageService } from '../../services/storageService';
import { CATEGORIES, PROCESSES } from '../../constants';
import { 
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Line, ComposedChart, Cell
} from 'recharts';
import { 
  BarChart3, Filter, Calendar, TrendingUp, 
  ArrowUpRight, AlertTriangle
} from 'lucide-react';
import { getTodayISO } from '../../utils/dateUtils';

export const ProcessAnalytics: React.FC = () => {
  const { refreshKey, isDarkMode } = useDashboard();
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], 
    end: getTodayISO() 
  });
  const [selectedCategory, setSelectedCategory] = useState('All');

  const productionData = useMemo(() => StorageService.getProductionData(), [refreshKey]);

  const filteredData = useMemo(() => {
    return productionData.filter(d => {
      const matchCat = selectedCategory === 'All' || d.category === selectedCategory;
      const matchStart = !dateRange.start || d.date >= dateRange.start;
      const matchEnd = !dateRange.end || d.date <= dateRange.end;
      return matchCat && matchStart && matchEnd;
    });
  }, [productionData, dateRange, selectedCategory]);

  const processMetrics = useMemo(() => {
    const metrics: Record<string, { process: string, plan: number, actual: number, efficiency: number, manpower: number, intensity: number }> = {};
    PROCESSES.forEach(p => {
      metrics[p] = { process: p, plan: 0, actual: 0, efficiency: 0, manpower: 0, intensity: 0 };
    });

    filteredData.forEach(d => {
      if (metrics[d.process]) {
        metrics[d.process].plan += (d.planQuantity || 0);
        metrics[d.process].actual += (d.actualQuantity || 0);
        metrics[d.process].manpower += (d.manpower || 0);
      }
    });

    return Object.values(metrics).map(m => ({
      ...m,
      efficiency: m.plan > 0 ? Number(((m.actual / m.plan) * 100).toFixed(1)) : 0,
      intensity: m.manpower > 0 ? Number((m.actual / m.manpower).toFixed(1)) : 0
    })).sort((a, b) => b.efficiency - a.efficiency);
  }, [filteredData]);

  const aggregateMetrics = useMemo(() => {
    const totalPlan = processMetrics.reduce((s, m) => s + m.plan, 0);
    const totalActual = processMetrics.reduce((s, m) => s + m.actual, 0);
    const totalManpower = processMetrics.reduce((s, m) => s + m.manpower, 0);
    const avgEff = totalPlan > 0 ? (totalActual / totalPlan) * 100 : 0;
    return { totalPlan, totalActual, totalManpower, avgEff };
  }, [processMetrics]);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">Bottleneck Finder</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Bottleneck <span className="text-indigo-600">Analysis</span></h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-700">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="bg-transparent text-xs font-black text-slate-600 dark:text-slate-200 outline-none uppercase tracking-widest cursor-pointer">
              <option value="All">All Departments</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="bg-transparent text-[10px] font-black text-slate-600 dark:text-slate-200 outline-none uppercase" />
            <span className="text-slate-300 text-[10px] font-black">TO</span>
            <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="bg-transparent text-[10px] font-black text-slate-600 dark:text-slate-200 outline-none uppercase" />
          </div>
        </div>
      </div>

      {/* SCORECARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm group">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Average Success Rate</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-slate-800 dark:text-white font-mono">{aggregateMetrics.avgEff.toFixed(1)}%</h3>
                <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" /> Good
                </span>
            </div>
            <div className="mt-4 w-full h-1 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${aggregateMetrics.avgEff}%` }} />
            </div>
            <p className="text-[9px] text-slate-400 mt-2 italic">How much of our goal we actually finished.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm group">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Production Speed</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white font-mono">{aggregateMetrics.totalManpower > 0 ? (aggregateMetrics.totalActual / aggregateMetrics.totalManpower).toFixed(1) : 0}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Units Per Worker</p>
            <p className="text-[9px] text-slate-400 mt-1 italic">Shows how hard each person is working.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm group">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Workers Logged</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white font-mono">{aggregateMetrics.totalManpower.toLocaleString()}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Total Staff Effort</p>
            <p className="text-[9px] text-slate-400 mt-1 italic">Total count of staff assignments recorded.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm group">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items Left To Make</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white font-mono">{Math.max(0, aggregateMetrics.totalPlan - aggregateMetrics.totalActual).toLocaleString()}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Target Shortfall</p>
            <p className="text-[9px] text-slate-400 mt-1 italic">Units we planned but haven't finished yet.</p>
        </div>
      </div>

      {/* CHART SECTION - FULL WIDTH */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-xl border border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Success vs Goal Chart</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Comparing total units made against our targets</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase">Spot Red Bars to Find Bottlenecks</span>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={processMetrics} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
              <XAxis dataKey="process" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} domain={[0, 120]} />
              <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', fontSize: '12px', padding: '16px', fontWeight: 'bold' }} />
              <Bar yAxisId="left" dataKey="actual" name="Total Units Made" radius={[8, 8, 0, 0]} barSize={40}>
                  {processMetrics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.efficiency >= 90 ? '#4f46e5' : '#f43f5e'} />
                  ))}
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="efficiency" name="Success %" stroke="#f59e0b" strokeWidth={4} dot={{ fill: '#f59e0b', r: 5, stroke: '#fff' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 flex items-center gap-6 justify-center">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-600 rounded"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Total Units Made</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-fuchsia-500 rounded-full"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Success %</span>
            </div>
        </div>
      </div>

      {/* PROCESS TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Department Leaderboard</h3>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-gray-50 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-gray-100">Most Successful at top</span>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                  <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-gray-50/50 dark:bg-slate-900/50">
                          <th className="px-8 py-5">Factory Stage</th>
                          <th className="px-8 py-5">Total Units Made</th>
                          <th className="px-8 py-5">Success Rate</th>
                          <th className="px-8 py-5 text-right">Status</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                      {processMetrics.map((m) => (
                          <tr key={m.process} className="hover:bg-indigo-50/20 transition-colors">
                              <td className="px-8 py-6">
                                  <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{m.process}</span>
                              </td>
                              <td className="px-8 py-6">
                                  <div className="font-mono font-black text-slate-700 dark:text-slate-300">{m.actual.toLocaleString()} <span className="text-[9px] opacity-40">UNITS</span></div>
                              </td>
                              <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                      <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{m.efficiency}%</span>
                                      <div className="w-24 h-1 bg-gray-100 dark:bg-slate-700 rounded-full hidden sm:block">
                                          <div className={`h-full rounded-full transition-all duration-700 ${m.efficiency >= 90 ? 'bg-indigo-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(m.efficiency, 100)}%` }} />
                                      </div>
                                  </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                  <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                                      m.efficiency >= 95 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                      m.efficiency >= 85 ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                      'bg-rose-50 text-rose-600 border border-rose-100'
                                  }`}>
                                      {m.efficiency >= 95 ? 'Great' : m.efficiency >= 85 ? 'Healthy' : 'Needs Check'}
                                  </span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};


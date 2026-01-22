
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, ReferenceLine
} from 'recharts';
import { 
  TrendingDown, TrendingUp, AlertCircle, CheckCircle, Info, 
  Settings, LayoutDashboard, Share2, Activity, Wallet,
  Loader2, RefreshCcw, DollarSign, ArrowRight, MessageSquare, Send, X, User
} from 'lucide-react';
import { FinancialData, AnalysisResult, RiskLevel, ForecastPoint, ChatMessage } from './types';
import { INITIAL_FINANCIAL_DATA, MOCK_LIQUIDITY_OFFERS } from './constants';
import { analyzeLiquidity, getAdvisorResponse } from './services/geminiService';

const App: React.FC = () => {
  const [finData, setFinData] = useState<FinancialData>(INITIAL_FINANCIAL_DATA);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  
  // Advisor State
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm your Clear Finance Advisor. How can I help you optimize your cash flow today?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping]);

  const calculateForecast = useCallback((data: FinancialData) => {
    const points: ForecastPoint[] = [];
    let current = data.currentBalance;
    const today = new Date();

    for (let i = 0; i <= data.forecastDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      current += data.avgDailyRevenue;
      current -= (data.fixedExpenses / 30);
      
      points.push({
        day: i,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: Math.round(current),
      });
    }
    setForecast(points);
  }, []);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    calculateForecast(finData);
    const result = await analyzeLiquidity(finData);
    setAnalysis(result);
    setLoading(false);
  }, [finData, calculateForecast]);

  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage: ChatMessage = { role: 'user', content: inputValue };
    const newHistory = [...chatMessages, userMessage];
    setChatMessages(newHistory);
    setInputValue('');
    setIsTyping(true);

    const botResponse = await getAdvisorResponse(newHistory, finData, analysis);
    setChatMessages([...newHistory, { role: 'assistant', content: botResponse }]);
    setIsTyping(false);
  };

  const getRiskColor = (level: RiskLevel | undefined) => {
    switch (level) {
      case RiskLevel.GREEN: return 'text-green-600 bg-green-50 border-green-200';
      case RiskLevel.YELLOW: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case RiskLevel.RED: return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-x-hidden">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clear Finance</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">SME Liquidity Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsAdvisorOpen(!isAdvisorOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition font-semibold text-sm ${isAdvisorOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
          >
            <MessageSquare size={16} />
            AI Advisor
          </button>
          <button 
            onClick={runAnalysis}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm font-semibold text-sm"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}
            {loading ? 'Analyzing...' : 'Refresh'}
          </button>
          <div className="w-px h-6 bg-slate-200 mx-2 hidden md:block" />
          <button className="p-2 text-slate-400 hover:text-slate-600 hidden md:block">
            <Settings size={20} />
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Data Input & Risk Level */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Risk Card */}
          <div className={`p-6 rounded-3xl border-2 transition-all duration-500 ${getRiskColor(analysis?.riskLevel)}`}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-lg">Liquidity Status</h3>
              {analysis?.riskLevel === RiskLevel.GREEN && <CheckCircle className="text-green-500" />}
              {analysis?.riskLevel === RiskLevel.YELLOW && <Info className="text-yellow-500" />}
              {analysis?.riskLevel === RiskLevel.RED && <AlertCircle className="text-red-500" />}
            </div>
            <p className="text-3xl font-black mb-1">{analysis?.riskLevel || 'Analysing...'}</p>
            <p className="text-sm font-medium opacity-80">{analysis?.timeToShortage}</p>
            <div className="mt-6 pt-6 border-t border-current border-opacity-10">
               <p className="text-sm italic font-medium">"{analysis?.riskSummary}"</p>
            </div>
          </div>

          {/* Input Controls */}
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 space-y-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Settings size={18} className="text-indigo-600" />
              Financial Parameters
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Current Balance ($)', key: 'currentBalance' },
                { label: 'Avg Daily Revenue ($)', key: 'avgDailyRevenue' },
                { label: 'Fixed Monthly Expenses ($)', key: 'fixedExpenses' },
                { label: 'Receivables ($)', key: 'receivables' }
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{field.label}</label>
                  <input 
                    type="number"
                    value={finData[field.key as keyof FinancialData]}
                    onChange={(e) => setFinData({ ...finData, [field.key]: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Visuals & Recommendations */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Forecast Chart */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-100/20 border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Cash Flow Forecast</h3>
                <p className="text-slate-500 font-medium text-sm">Projected liquidity balance for the next {finData.forecastDays} days</p>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Balance</span>
                </div>
              </div>
            </div>
            
            <div className="h-[300px] md:h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecast}>
                  <defs>
                    <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}}
                    tickFormatter={(val) => `$${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '12px' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
                  />
                  <ReferenceLine y={0} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#4f46e5" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorBal)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl shadow-slate-900/20">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp size={24} className="text-indigo-400" />
                Actionable Strategy
              </h3>
              <div className="space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-50">
                    <Loader2 className="animate-spin mb-2" size={32} />
                    <p className="text-sm font-medium">Computing solutions...</p>
                  </div>
                ) : (
                  analysis?.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-4 items-start group">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-xs font-bold group-hover:bg-white/20 transition">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-slate-300 font-medium leading-relaxed">{rec}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Analysis Confidence</span>
                <span className="text-sm font-black text-indigo-400">{Math.round((analysis?.confidence || 0) * 100)}%</span>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Share2 size={24} className="text-indigo-500" />
                  Liquidity Pool
                </h3>
                <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md uppercase">Simulation</span>
              </div>
              
              <div className="space-y-3">
                {MOCK_LIQUIDITY_OFFERS.slice(0, 4).map((offer) => (
                  <div key={offer.id} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between hover:bg-slate-100 transition cursor-pointer group border border-transparent hover:border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${offer.type === 'EXCESS' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
                        {offer.type === 'EXCESS' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 leading-tight">{offer.businessType}</p>
                        <p className="text-[10px] font-medium text-slate-500">{offer.duration} days • {offer.type === 'EXCESS' ? 'Available' : 'Needed'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">${(offer.amount/1000).toFixed(1)}k</p>
                      <ArrowRight size={12} className="ml-auto text-slate-300 group-hover:text-slate-600 transition" />
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition shadow-lg shadow-slate-900/10">
                Join the Pool
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* AI Advisor Panel */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out border-l border-slate-200 flex flex-col ${isAdvisorOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">AI Advisor</h2>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Online & Ready</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsAdvisorOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-indigo-600'}`}>
                  {msg.role === 'user' ? <User size={14} /> : <Activity size={14} />}
                </div>
                <div className={`p-4 rounded-[1.5rem] text-sm shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                  <p className="leading-relaxed font-medium">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-indigo-600">
                  <Activity size={14} />
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-100">
          <div className="relative">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask for financial advice..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-5 pr-14 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition shadow-inner"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-center mt-3 text-slate-400 font-medium">Advisor uses real-time context from your data inputs.</p>
        </form>
      </div>

      {/* Floating Action Button (Mobile Advisor) */}
      {!isAdvisorOpen && (
        <button 
          onClick={() => setIsAdvisorOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition active:scale-95 lg:hidden z-40"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Overlay */}
      {isAdvisorOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 sm:hidden"
          onClick={() => setIsAdvisorOpen(false)}
        />
      )}

      <footer className="bg-white border-t border-slate-200 p-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 font-medium italic">
            Simulation Result – Not a Financial Commitment. Data processed by Gemini 3 Flash.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs font-bold text-slate-500 hover:text-indigo-600 uppercase tracking-wider transition">Privacy</a>
            <a href="#" className="text-xs font-bold text-slate-500 hover:text-indigo-600 uppercase tracking-wider transition">Terms</a>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-300">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              SECURE ENGINE
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

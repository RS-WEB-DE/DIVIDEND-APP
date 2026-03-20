import { useCallback, useEffect, useState } from "react";
import axios from "axios";
// Импортируем компоненты для графика
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

function App() {
  // --- 1. СОСТОЯНИЯ (STATES) ---
  const [ticker, setTicker] = useState("");
  const [price, setPrice] = useState("");
  const [dividend, setDividend] = useState("");
  const [stocks, setStocks] = useState([]);
  const [dividendDates, setDividendDates] = useState({});
  
  // Состояния для автодополнения
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  //const API_URL = "https://dividend-app-7fgd.onrender.com/api";
  // DEV: локальный бэкенд (vite dev server проксирует /api → http://localhost:5000)
  // PROD: Render / любой другой деплой
  const API_URL = import.meta.env.DEV
    ? "/api"
    : "https://dividend-app-7fgd.onrender.com/api";

  const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_KEY;

  // --- 2. ФУНКЦИИ ЗАГРУЗКИ (API) ---

  // Загрузка акций из твоей базы на Render
  const fetchStocks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/stocks`);
      setStocks(res.data);
    } catch (err) { console.error("Ошибка БД:", err); }
  }, [API_URL]);

  // Поиск похожих акций через Finnhub (для выпадающего списка)
  const searchStocks = async (query) => {
    if (!FINNHUB_KEY) return; // если нет ключа, не запрашиваем Finnhub
    if (query.length < 2) { setSuggestions([]); return; }
    try {
      const res = await axios.get(`https://finnhub.io/api/v1/search?q=${query}&token=${FINNHUB_KEY}`);
      // Фильтруем результаты, убираем лишние индексы (где есть точки)
      const results = res.data.result.filter(item => !item.symbol.includes('.'));
      setSuggestions(results.slice(0, 5));
      setShowDropdown(true);
    } catch (err) { console.error("Ошибка поиска:", err); }
  };

  // Получение даты дивиденда для карточки
  const getDividendDate = useCallback(async (symbol) => {
    if (!FINNHUB_KEY) return;
    if (dividendDates[symbol]) return;
    try {
      const res = await axios.get(`https://finnhub.io/api/v1/stock/dividend?symbol=${symbol}&token=${FINNHUB_KEY}`);
      const date = res.data?.[0]?.date || "TBD";
      setDividendDates(prev => ({ ...prev, [symbol]: date }));
    } catch (err) { console.error(err); }
  }, [FINNHUB_KEY, dividendDates]);

  // --- 3. ЭФФЕКТЫ (EFFECTS) ---

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  useEffect(() => {
    if (!FINNHUB_KEY) return;
    stocks.forEach(s => getDividendDate(s.ticker));
  }, [stocks, getDividendDate, FINNHUB_KEY]);

  // --- 4. ОБРАБОТЧИКИ СОБЫТИЙ ---

  const saveStock = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/save-stock`, {
      ticker: ticker.toUpperCase(),
      price: Number(price),
      dividend: Number(dividend),
    });
    setTicker(""); setPrice(""); setDividend("");
    fetchStocks();
  };

  const deleteStock = async (id) => {
    if (window.confirm("Удалить актив?")) {
      await axios.delete(`${API_URL}/stocks/${id}`);
      setStocks(stocks.filter((s) => s._id !== id));
    }
  };

  // --- 5. ВЫЧИСЛЕНИЯ ДЛЯ ДИЗАЙНА ---
  const totalValue = stocks.reduce((sum, s) => sum + s.price, 0);
  const annualDividend = stocks.reduce((sum, s) => sum + s.dividend, 0);
  const chartData = stocks.map(s => ({ name: s.ticker, value: s.price }));
  const COLORS = ["#10b981", "#3b82f6", "#f43f5e", "#8b5cf6", "#f59e0b"];

  const fetchStockData = async (symbol) => {
  const API_KEY = import.meta.env.VITE_FINNHUB_KEY;
  try {
    // 1. Запрос текущей цены (Quote)
    const quoteRes = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
    );
    
    // 2. Запрос основных показателей (Basic Financials) для дивидендов
    const metricRes = await axios.get(
      `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${API_KEY}`
    );

    // Подставляем данные в наши поля ввода (States)
    setPrice(quoteRes.data.c); // 'c' - это Current Price в Finnhub
    
    // Берем годовой дивиденд на акцию (dividendPerShareAnnual)
    const divPerShare = metricRes.data.metric.dividendPerShareAnnual || 0;
    setDividend(divPerShare);

    console.log(`Данные для ${symbol} получены: Цена ${quoteRes.data.c}, Див ${divPerShare}`);
  } catch (err) {
    console.error("Ошибка при получении авто-данных:", err);
  }
};

  return (
    <div className="min-h-screen text-slate-200 p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* ШАПКА И ГРАФИК */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-white">D<span className="text-emerald-500">.</span>IO</h1>
            <p className="text-slate-500 font-bold text-[10px] tracking-[0.5em] uppercase">Asset Intelligence</p>
          </div>

          <div className="h-[120px] w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-8">
            <div className="text-right">
              <p className="text-slate-500 text-[10px] font-black uppercase">Capital</p>
              <p className="text-3xl font-black text-white font-mono">${totalValue.toLocaleString()}</p>
            </div>

            <div className="text-right">
              <p className="text-slate-500 text-[10px] font-black uppercase">Annual Dividend</p>
              <p className="text-3xl font-black text-white font-mono">${annualDividend.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* УМНАЯ ФОРМА ВВОДА */}
        <div className="glass-card p-2 rounded-[2rem] mb-16 max-w-4xl mx-auto relative">
          <form onSubmit={saveStock} className="flex flex-wrap md:flex-nowrap gap-2">
            <div className="flex-1 relative">
              <input 
                className="w-full bg-transparent border-none p-4 outline-none font-bold placeholder:text-slate-600 uppercase" 
                placeholder="SYMBOL" value={ticker} 
                onChange={(e) => { setTicker(e.target.value); searchStocks(e.target.value); }} 
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                required 
              />
              {/* Выпадающий список поиска */}
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-slate-900 border border-white/10 rounded-2xl mt-2 overflow-hidden z-50 shadow-2xl backdrop-blur-xl">
                  {suggestions.map((item) => (
                    <div key={item.symbol} onClick={() => { 
      setTicker(item.symbol);      // Ставим тикер в поле
      fetchStockData(item.symbol); // МАГИЯ: Тянем цену и дивиденды!
      setShowDropdown(false);      // Закрываем список
    }}
                         className="p-4 hover:bg-emerald-500 hover:text-black cursor-pointer transition-colors flex justify-between">
                      <span className="font-black">{item.symbol}</span>
                      <span className="text-[10px] opacity-60 truncate ml-4">{item.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input className="flex-1 bg-transparent border-none p-4 outline-none font-bold placeholder:text-slate-600" 
                   type="number" step="any" placeholder="PRICE" value={price} onChange={(e)=>setPrice(e.target.value)} required />
            <input className="flex-1 bg-transparent border-none p-4 outline-none font-bold placeholder:text-slate-600" 
                   type="number" step="any" placeholder="DIVIDEND" value={dividend} onChange={(e)=>setDividend(e.target.value)} required />
            <button className="bg-white text-black font-black px-10 py-4 rounded-2xl hover:bg-emerald-500 transition-colors duration-500">
              DEPLOY
            </button>
          </form>
        </div>

        {/* СЕТКА АКТИВОВ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stocks.map(stock => {
            const yieldPct = ((stock.dividend / stock.price) * 100).toFixed(2);
            return (
              <div key={stock._id} className="glass-card glass-card-red p-8 rounded-[2.5rem] relative group cursor-crosshair">
                <div className="flex justify-between items-start mb-10">
                  <h3 className="text-4xl font-black tracking-tighter group-hover:text-rose-500 transition-colors uppercase italic">{stock.ticker}</h3>
                  <button onClick={() => deleteStock(stock._id)} className="text-slate-700 hover:text-rose-500 transition-all">✕</button>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest text-emerald-500">Next Payout</span>
                    <span className="text-sm font-black font-mono">{dividendDates[stock.ticker] || "..."}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Yield</span>
                    <span className="text-xl font-black font-mono text-emerald-400">{yieldPct}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-[2px] rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${Math.min(yieldPct * 5, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default App;
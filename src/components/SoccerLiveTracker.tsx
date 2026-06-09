import React, { useState, useEffect } from "react";
import { Team, Match } from "../types";
import { TeamFlag } from "./TeamFlag";
import { 
  Search, 
  RefreshCw, 
  Radio, 
  Tv, 
  CheckCircle, 
  TrendingUp, 
  Globe, 
  ArrowUpRight, 
  Lock, 
  Zap,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SoccerLiveTrackerProps {
  matches: Match[];
  onApplyOfficialScores: () => void;
  onClearScores: () => void;
  isLiveMode: boolean;
  onToggleLiveMode: (enable: boolean) => void;
  simulationNotice: string | null;
  onTickLive: () => void;
}

interface NewsItem {
  title: string;
  link: string;
  description: string;
  date: string;
  isLive: boolean;
}

export const SoccerLiveTracker: React.FC<SoccerLiveTrackerProps> = ({
  matches,
  onApplyOfficialScores,
  onClearScores,
  isLiveMode,
  onToggleLiveMode,
  simulationNotice,
  onTickLive,
}) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [syncAnimation, setSyncAnimation] = useState<boolean>(false);
  const [liveScores, setLiveScores] = useState<any[]>([]);
  const [loadingLiveScores, setLoadingLiveScores] = useState(true);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sports-hub/news");
      if (!res.ok) throw new Error("خطا در برقراری ارتباط با وب‌سرویس");
      const data = await res.json();
      if (data.success && data.news) {
        setNews(data.news);
      } else {
        throw new Error("داده ساختاریافته دریافت نشد");
      }
    } catch (err: any) {
      setError("امکان لود زنده اخبار در این لحظه وجود ندارد. لطفاً ارتباط خود را چک کنید.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveScores = async () => {
    setLoadingLiveScores(true);
    try {
      const res = await fetch("/api/sports-hub/livescore");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
           let extractedMatches: any[] = [];
           for (const league of json.data || []) {
               for (const dateObj of league.dates || []) {
                   for (const match of dateObj.matches || []) {
                       // limit to matches that are "status: 1" (playing) or generally limit the list
                       // We will just show all matches from the API, or top 5 if too many
                       extractedMatches.push({
                           ...match,
                           leagueTitle: league.title,
                           leagueLogo: league.logo,
                       });
                   }
               }
           }
           // if too many matches, maybe show 5
           setLiveScores(extractedMatches.filter(m => m.status === 1 || m.status === 2 || m.status === 3 || m.statusTitle).slice(0, 5));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLiveScores(false);
    }
  };

  useEffect(() => {
    fetchNews();
    fetchLiveScores();

    // Fetch news and scores every 1 hour as requested
    const interval = setInterval(() => {
      fetchNews();
      fetchLiveScores();
    }, 3600000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  const handleSyncClick = () => {
    setSyncAnimation(true);
    onApplyOfficialScores();
    setTimeout(() => {
      setSyncAnimation(false);
    }, 1200);
  };

  const filteredNews = news.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats from live matches
  return (
    <div className="space-y-6">
      {/* Top Welcome Title Grid */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-emerald-500/10 p-6 md:p-8 shadow-xl shadow-slate-950/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                نتایج زنده، اخبار و وضعیت صعود گروهی
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-100 font-sans tracking-tight">
              ردیاب رسمی مسابقات و اخبار زنده جام جهانی ۲۰۲۶
            </h2>
            <p className="text-slate-400 text-sm max-w-xl">
              ثبت پیش‌بینی‌های کارشناسی بر اساس آخرین آمار تیم‌ها، مصدومین و جدول‌های رسمی مسابقات فوتبال به همراه ردیابی لحظه‌ای دیدارهای زنده گروه ایران در آمریکا، کانادا و مکزیک.
            </p>
          </div>

          {isLiveMode && (
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                id="disable-live-tracker-btn"
                onClick={() => onToggleLiveMode(false)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-extrabold text-sm duration-150 hover:bg-rose-500/25 active:scale-95 cursor-pointer outline-none transition-all"
              >
                <Lock size={15} />
                <span>غیرفعال‌سازی قفل ردیاب رسمی</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Core Content Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* RIGHT SIDE: Operational Controls of Live Tracker */}
        <div className="lg:col-span-4 space-y-6">

          {/* Active Live Tracker Card during 2026 matches */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 space-y-4">
            <h3 className="text-sm font-black text-slate-300 flex items-center gap-2">
              <Radio size={15} className="text-pink-500 animate-pulse" />
              <span>پخش زنده</span>
            </h3>

            {loadingLiveScores ? (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <RefreshCw size={20} className="mx-auto text-slate-700 animate-spin" />
                <p className="text-xs font-bold text-slate-400">در حال دریافت نتایج زنده...</p>
              </div>
            ) : liveScores.length > 0 ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {liveScores.map((scoreMatch, index) => (
                  <div key={index} className="bg-slate-950/60 p-4 rounded-2xl border border-pink-500/10 text-center relative overflow-hidden">
                    {scoreMatch.status === 1 && (
                      <div className="absolute top-2 right-2 bg-pink-500/20 border border-pink-500/40 text-pink-300 font-extrabold text-[9px] px-1.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                        <Tv size={10} />
                        <span>زنده</span>
                      </div>
                    )}
                    <div className="space-y-2 mt-2">
                      <span className="font-mono text-[10px] text-slate-400 font-semibold bg-slate-900 px-2 py-1 rounded-lg">
                        {scoreMatch.leagueTitle}
                        {scoreMatch.time ? ` - ${scoreMatch.time}` : ""}
                        {scoreMatch.statusTitle ? ` - ${scoreMatch.statusTitle}` : ""}
                      </span>
                      
                      <div className="flex items-center justify-between gap-1 pt-3">
                        <div className="flex flex-col items-center gap-1 flex-1">
                          {scoreMatch.host?.logo && <img src={scoreMatch.host.logo} alt={scoreMatch.host.name} className="h-8 w-8 object-contain" />}
                          <span className="font-black text-[11px] text-slate-200 truncate max-w-[80px]">
                            {scoreMatch.host?.name}
                          </span>
                        </div>

                        <div className="flex flex-col items-center gap-0.5">
                           <div className="flex items-center gap-2 font-mono font-black text-lg text-slate-100">
                             <span>{scoreMatch.hostGoals !== null && scoreMatch.hostGoals !== undefined ? scoreMatch.hostGoals : "-"}</span>
                             <span className="text-slate-600">:</span>
                             <span>{scoreMatch.guestGoals !== null && scoreMatch.guestGoals !== undefined ? scoreMatch.guestGoals : "-"}</span>
                           </div>
                           {scoreMatch.status === 1 && <span className="text-[10px] text-pink-400 font-bold animate-pulse">در جریان</span>}
                        </div>

                        <div className="flex flex-col items-center gap-1 flex-1">
                          {scoreMatch.guest?.logo && <img src={scoreMatch.guest.logo} alt={scoreMatch.guest.name} className="h-8 w-8 object-contain" />}
                          <span className="font-black text-[11px] text-slate-200 truncate max-w-[80px]">
                            {scoreMatch.guest?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <Tv size={28} className="mx-auto text-slate-700" />
                <p className="text-xs font-bold">هیچ بازی زنده‌ای در جریان نیست</p>
              </div>
            )}

            {simulationNotice && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-pink-500/[0.02] border border-pink-500/15 text-pink-300/90 text-center font-bold text-[10px] leading-relaxed"
              >
                {simulationNotice}
              </motion.div>
            )}
          </div>

        </div>

        {/* LEFT SIDE: Direct News Desktop */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-5">
            
            {/* Filter and Search News Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <Globe size={18} className="text-emerald-400" />
                  <span>سرخط خبرها؛ رصدخانه دور مقدماتی جام جهانی ۲۰۲۶</span>
                </h3>
                <p className="text-xs text-slate-500">
                  اطلاعات، حواشی و گزارش فنی بازی‌های تیم ملی بلافاصله پس از بررسی کارشناسان رسمی مسابقات در پلتفرم بروز می‌شود.
                </p>
              </div>

              {/* Instant Search input */}
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                  <Search size={14} />
                </span>
                <input
                  id="search-news-input"
                  type="text"
                  placeholder="جستجو در مقالات و اخبار..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 duration-150 transition-all text-right"
                />
              </div>
            </div>

            {/* Loading / Error States OR Content */}
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="relative mx-auto h-10 w-10">
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20"></div>
                  <div className="absolute inset-0 rounded-full border-t-2 border-emerald-400 animate-spin"></div>
                </div>
                <p className="text-slate-400 font-bold text-xs animate-pulse">دریافت آخرین مقالات از منابع رسمی مسابقات...</p>
              </div>
            ) : error && filteredNews.length === 0 ? (
              <div className="border border-amber-500/10 bg-amber-500/[0.02] rounded-2xl p-6 text-center space-y-3">
                <Info className="mx-auto text-amber-500" size={24} />
                <p className="text-slate-300 font-bold text-xs leading-relaxed">{error}</p>
                <button
                  id="retry-fetch-news-btn"
                  onClick={fetchNews}
                  className="mx-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-black cursor-pointer"
                >
                  <RefreshCw size={10} />
                  <span>تلاش مجدد</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredNews.length > 0 ? (
                    filteredNews.map((item, idx) => (
                      <motion.div
                        id={`news-card-${idx}`}
                        key={idx}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.18, delay: idx * 0.05 }}
                        className="group bg-slate-950/40 p-4 rounded-2xl border border-white/5 hover:border-emerald-500/20 hover:bg-slate-950/80 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            {/* Title heading */}
                            <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5 leading-snug">
                              <span>{item.title}</span>
                            </h3>
                            
                            {/* Summary description */}
                            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                              {item.description}
                            </p>

                            {/* Info row */}
                            <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-500 font-bold">
                              <span>منبع: فید RSS سایت ورزش ۳ (بخش اخبار جام جهانی)</span>
                              <span>•</span>
                              <span>{item.date}</span>
                              <span>•</span>
                              <span className={`px-1.5 py-0.5 rounded ${
                                item.isLive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"
                              }`}>
                                {item.isLive ? "خبر آنلاین" : "نوتیفیکیشن جام جهانی"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-500 font-bold text-xs flex flex-col items-center justify-center space-y-4">
                      <p className="text-sm">در حال حاضر اخبار مرتبط با جام جهانی در خوراک RSS ورزش ۳ یافت نشد.</p>
                      {searchQuery && (
                        <button 
                          id="clear-news-search-btn"
                          onClick={() => setSearchQuery("")} 
                          className="text-emerald-400 hover:underline cursor-pointer font-bold text-[11px]"
                        >
                          پاکسازی فیلترهای جستجو
                        </button>
                      )}
                      <button
                        id="empty-retry-fetch-news-btn"
                        onClick={fetchNews}
                        className="mx-auto flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 text-xs font-black cursor-pointer hover:bg-slate-800 transition-colors"
                      >
                        <RefreshCw size={12} />
                        <span>بررسی مجدد فید اخبار</span>
                      </button>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Bottom Tip bar */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-start gap-2.5 text-xs text-slate-400">
              <span className="text-emerald-400 font-black">نکته فنی:</span>
              <p className="leading-relaxed font-bold">
                جهت پیش‌بینی دقیق‌تر با بالاترین راندمان، توصیه می‌کنیم آخرین مقالات و حواشی را از ورودی‌های خبری بالا مطالعه کرده و سپس نسبت به تخمین و پیاده‌سازی نتایج بازی‌ها اقدام فرمایید.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

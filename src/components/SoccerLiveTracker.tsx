import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Radio, 
  Tv, 
  RefreshCw, 
  Newspaper, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Sparkles, 
  Flame, 
  Trophy,
  ChevronLeft
} from "lucide-react";

interface MatchTeam {
  name: string;
  nameEn?: string;
  logo: string;
}

interface ScrapedMatch {
  status: number; // 1 = Live, 2 = Finished, 3 = Scheduled
  statusTitle: string;
  time: string;
  hostGoals: number | null;
  guestGoals: number | null;
  host: MatchTeam;
  guest: MatchTeam;
}

interface SoccerLiveTrackerProps {
  matches: any[];
  onApplyOfficialScores?: () => void;
  onClearScores?: () => void;
  isLiveMode?: boolean;
  onToggleLiveMode?: (val: boolean) => void;
  simulationNotice?: string;
  onTickLive?: () => void;
}

interface NewsItem {
  title: string;
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
  const [activeTab, setActiveTab] = useState<"scores" | "news">("scores");
  const [scrapedData, setScrapedData] = useState<any[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingScores, setLoadingScores] = useState<boolean>(false);
  const [loadingNews, setLoadingNews] = useState<boolean>(false);
  const [errorScores, setErrorScores] = useState<string | null>(null);
  const [errorNews, setErrorNews] = useState<string | null>(null);

  // Auto Persian digits helper
  const toPersianDigits = (str: string | number | null | undefined): string => {
    if (str === null || str === undefined) return "";
    const numStr = String(str);
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return numStr.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
  };

  const fetchLiveScores = async () => {
    setLoadingScores(true);
    setErrorScores(null);
    try {
      const res = await fetch("/api/sports-hub/livescore");
      if (!res.ok) throw new Error("خطا در دریافت اطلاعات زنده");
      const json = await res.json();
      if (json.success && json.data) {
        setScrapedData(json.data);
      } else {
        throw new Error("داده‌ای از سرور دریافت نشد");
      }
    } catch (err: any) {
      console.error(err);
      setErrorScores("امکان بارگذاری آنلاین نتایج زنده وجود ندارد. لطفاً ارتباط خود را بررسی کنید.");
    } finally {
      setLoadingScores(false);
    }
  };

  const fetchNews = async () => {
    setLoadingNews(true);
    setErrorNews(null);
    try {
      const res = await fetch("/api/sports-hub/news");
      if (!res.ok) throw new Error("خطا در دریافت آخرین اخبار ورزشی");
      const json = await res.json();
      if (json.success && json.news) {
        setNews(json.news);
      } else {
        throw new Error("اخباری یافت نشد");
      }
    } catch (err: any) {
      console.error(err);
      setErrorNews("بارگذاری اخبار جام جهانی با خطا مواجه شد.");
    } finally {
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    fetchLiveScores();
    fetchNews();
  }, []);

  return (
    <div id="soccer-live-tracker-module" className="bg-slate-900/80 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
      {/* Tracker Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 shadow-md shadow-red-950/30 animate-pulse">
            <Radio size={22} />
          </div>
          <div className="text-right">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 justify-start">
              <span>ردیاب هوشمند و پاتوق لحظه‌ای جام جهانی ۲۰۲۶</span>
              <span className="hidden sm:inline bg-red-500/15 text-red-400 border border-red-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                بروزرسانی زنده
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              پایش آنلاین نتایج، مسابقات در حال برگزاری و اخبار داغ فدراسیون جهانی فوتبال
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-white/5 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("scores")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "scores"
                ? "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-950/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Tv size={14} />
            <span>پخش و نتایج زنده</span>
          </button>
          <button
            onClick={() => setActiveTab("news")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "news"
                ? "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-950/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Newspaper size={14} />
            <span>اخبار داغ پورتال</span>
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {activeTab === "scores" && (
            <motion.div
              key="scores-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* Controls and Stats Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-xs text-emerald-400 font-bold">بستر متصل به سرور مرکزی نتایج برخط</span>
                </div>
                <button
                  onClick={fetchLiveScores}
                  disabled={loadingScores}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/5 transition-all text-right cursor-pointer"
                >
                  <RefreshCw size={13} className={loadingScores ? "animate-spin" : ""} />
                  <span>{loadingScores ? "بروزرسانی..." : "بروزرسانی فوری"}</span>
                </button>
              </div>

              {loadingScores ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                  <RefreshCw size={36} className="animate-spin text-red-500" />
                  <span className="text-xs font-bold animate-pulse">در حال فراخوانی جدول مسابقات جاری از LiveScore...</span>
                </div>
              ) : errorScores ? (
                <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                  <div className="text-right">
                    <p className="text-xs font-bold text-red-300">{errorScores}</p>
                    <p className="text-[10px] text-slate-400 mt-1">مشاهده آفلاین مسابقات شبیه‌ساز جام جهانی همچنان بدون وقفه از فید پیش‌فرض در دسترس است.</p>
                  </div>
                </div>
              ) : scrapedData.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  هیچ بازی زنده فعالی در این لحظه در دیتابیس جهانی به ثبت نرسیده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scrapedData.map((league, lIdx) => (
                    <div key={lIdx} className="col-span-1 md:col-span-2 space-y-3">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-1">
                        <Trophy size={14} className="text-amber-400" />
                        <h4 className="text-xs font-black text-slate-300">{league.title}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {league.dates?.flatMap((dateObj: any) =>
                          dateObj.matches?.map((scrapedMatch: ScrapedMatch, mIdx: number) => {
                            const isMatchLive = scrapedMatch.status === 1;
                            const isFinished = scrapedMatch.status === 2;

                            return (
                              <div
                                key={mIdx}
                                className={`p-4 rounded-xl transition-all duration-300 border backdrop-blur-md ${
                                  isMatchLive
                                    ? "bg-red-950/10 border-red-500/30 shadow-md shadow-red-950/20"
                                    : "bg-slate-950/40 border-white/5 hover:border-white/10"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  {isMatchLive ? (
                                    <span className="inline-flex items-center gap-1 bg-red-500/25 text-red-400 border border-red-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse font-mono">
                                      <span className="w-1 h-1 bg-red-500 rounded-full animate-ping"></span>
                                      {scrapedMatch.statusTitle}
                                    </span>
                                  ) : isFinished ? (
                                    <span className="bg-slate-800 text-slate-400 text-[9px] px-2 py-0.5 rounded-full font-bold">
                                      پایان بازی
                                    </span>
                                  ) : (
                                    <span className="bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 text-[9px] px-2 py-0.5 rounded-full font-bold font-mono">
                                      ساعت {scrapedMatch.time}
                                    </span>
                                  )}

                                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                    <Clock size={10} />
                                    <span>{dateObj.date}</span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                  {/* Team Host */}
                                  <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center p-1.5 overflow-hidden">
                                      {scrapedMatch.host.logo ? (
                                        <img
                                          src={scrapedMatch.host.logo}
                                          alt={scrapedMatch.host.name}
                                          className="w-full h-full object-contain rounded"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <span className="text-xs font-black text-slate-500">
                                          {scrapedMatch.host.name.substring(0, 2)}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs font-bold text-slate-200 text-center truncate w-full" title={scrapedMatch.host.name}>
                                      {scrapedMatch.host.name}
                                    </span>
                                  </div>

                                  {/* Score Box */}
                                  <div className="flex flex-col items-center justify-center px-2">
                                    <div className="flex items-center gap-2 py-1 px-3 bg-slate-950/90 border border-white/5 rounded-lg font-mono">
                                      <span className={`text-lg font-extrabold ${isMatchLive ? "text-red-400" : "text-white"}`}>
                                        {scrapedMatch.hostGoals !== null ? toPersianDigits(scrapedMatch.hostGoals) : "۰"}
                                      </span>
                                      <span className="text-slate-600">:</span>
                                      <span className={`text-lg font-extrabold ${isMatchLive ? "text-red-400" : "text-white"}`}>
                                        {scrapedMatch.guestGoals !== null ? toPersianDigits(scrapedMatch.guestGoals) : "۰"}
                                      </span>
                                    </div>
                                    {isMatchLive && (
                                      <span className="text-[9px] text-red-400 mt-1 animate-pulse font-bold">بخش زنده</span>
                                    )}
                                  </div>

                                  {/* Team Guest */}
                                  <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center p-1.5 overflow-hidden">
                                      {scrapedMatch.guest.logo ? (
                                        <img
                                          src={scrapedMatch.guest.logo}
                                          alt={scrapedMatch.guest.name}
                                          className="w-full h-full object-contain rounded"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <span className="text-xs font-black text-slate-500">
                                          {scrapedMatch.guest.name.substring(0, 2)}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs font-bold text-slate-200 text-center truncate w-full" title={scrapedMatch.guest.name}>
                                      {scrapedMatch.guest.name}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "news" && (
            <motion.div
              key="news-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Newspaper size={14} className="text-red-400 animate-pulse" />
                  <span className="font-bold">مرجع فید همگام با درگاه رسمی خبرگذاری‌های تایید شده فوتبال</span>
                </div>
                <button
                  onClick={fetchNews}
                  disabled={loadingNews}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/5 transition-all text-right cursor-pointer"
                >
                  <RefreshCw size={13} className={loadingNews ? "animate-spin" : ""} />
                  <span>{loadingNews ? "بارگذاری فید..." : "تازه سازی اخبار"}</span>
                </button>
              </div>

              {loadingNews ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                  <RefreshCw size={36} className="animate-spin text-red-500" />
                  <span className="text-xs font-bold animate-pulse">در حال فراخوانی جدیدترین کپسول‌های خبری...</span>
                </div>
              ) : errorNews ? (
                <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl text-right">
                  <p className="text-xs font-bold text-red-300">{errorNews}</p>
                </div>
              ) : news.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  خبری در حال حاضر یافت نشد.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {news.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="p-4 bg-slate-950/30 border border-white/5 rounded-xl hover:border-red-500/10 cursor-default group transition-all duration-300"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2.5">
                        <h4 className="text-sm font-extrabold text-slate-100 group-hover:text-red-400 transition-colors flex items-center gap-2 justify-start">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 group-hover:scale-125 transition-transform duration-300"></span>
                          <span>{item.title}</span>
                        </h4>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono whitespace-nowrap">
                          <Clock size={11} />
                          <span>{toPersianDigits(item.date)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        {item.description}
                      </p>
                      
                      <div className="mt-3 flex items-center justify-end">
                        <span className="text-[10px] text-slate-500 group-hover:text-red-400/80 font-bold flex items-center gap-1 transition-colors">
                          <span>بیشتر بخوانید</span>
                          <ChevronLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

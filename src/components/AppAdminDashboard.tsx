import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Settings, 
  Sparkles, 
  Database, 
  Play, 
  RotateCcw, 
  Check, 
  X, 
  BarChart3, 
  Activity, 
  LineChart, 
  TrendingUp, 
  Users, 
  FolderSync, 
  Flame, 
  FileCode, 
  Zap, 
  Key, 
  Grid,
  TrendingDown,
  Clock,
  HelpCircle,
  Trash2,
  Eye,
  RefreshCw,
  Terminal,
  Download,
  FileSpreadsheet,
  Gift,
  Ticket,
  Crown,
  Award,
  Trophy
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateGroupMatches, TEAMS } from "../data";

interface Participant {
  id: string;
  name: string;
  favoriteTeam: string;
  predictedChampion: string;
  predScore: number;
  status: "active" | "completed" | "pending";
  phoneOrEmail?: string;
  isPublished: boolean;
  registeredAt: string;
  predictionsCount: number;
}

interface ActionLog {
  id: string;
  username: string;
  action: string;
  timestamp: string;
  exactTime?: string;
  details?: string;
}

export const AppAdminDashboard: React.FC = () => {
  // Global Admin Access state
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    return sessionStorage.getItem("admin_session_auth") === "true";
  });
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");

  // Sub-tab navigation
  const [adminSubTab, setAdminSubTab] = useState<"audit" | "actions" | "analytics" | "raffle">(() => {
    return (sessionStorage.getItem("admin_dashboard_subtab") as any) || "analytics";
  });

  // Raffle (قرعه‌کشی) state variables
  const [predictions, setPredictions] = useState<any[]>([]);
  const [manualResults, setManualResults] = useState<Record<string, any>>({});
  const [matches, setMatches] = useState<any[]>([]);
  const [raffleType, setRaffleType] = useState<"match" | "winner">("match");
  const [selectedMatchId, setSelectedMatchId] = useState<string>(() => {
    return sessionStorage.getItem("raffle_preselected_match_id") || "";
  });
  const [onlyIranGames, setOnlyIranGames] = useState<boolean>(true);
  const [correctnessCriteria, setCorrectnessCriteria] = useState<"exact" | "outcome">("exact");
  const [actualWinnerTeam, setActualWinnerTeam] = useState<string>("ایران");
  
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawnName, setDrawnName] = useState<string>("");
  const [raffleWinner, setRaffleWinner] = useState<Participant | null>(null);
  const [shadApiDetails, setShadApiDetails] = useState<any | null>(null);
  const [shadLoading, setShadLoading] = useState<boolean>(false);
  const [shadError, setShadError] = useState<string | null>(null);

  // Selection for drill-down analytics
  const [selectedAnalyticTeam, setSelectedAnalyticTeam] = useState<string>("ایران");

  // Data State
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSimulatingGroup, setIsSimulatingGroup] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // User Actions Tracking State
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [logsFilter, setLogsFilter] = useState<string>("");
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const [isClearingLogs, setIsClearingLogs] = useState<boolean>(false);

  // Stats Counters
  const [quickStats, setQuickStats] = useState({
    total: 0,
    published: 0,
    pending: 0,
    avgScore: 0,
    activePredictors: 0
  });

  // Handle preselection logic & clear the keys so it's a one-time redirect
  useEffect(() => {
    if (selectedMatchId && matches.length > 0) {
      const match = matches.find(m => m.id === selectedMatchId);
      if (match) {
        const isIranGame = match.teamA.name === "ایران" || match.teamB.name === "ایران" || match.teamA.id === "iran" || match.teamB.id === "iran";
        if (!isIranGame) {
          setOnlyIranGames(false);
        }
      }
      // Clear session keys so subsequent direct manual clicks on administrative tabs behave normally
      sessionStorage.removeItem("raffle_preselected_match_id");
      sessionStorage.removeItem("admin_dashboard_subtab");
    }
  }, [selectedMatchId, matches]);

  // Load action logs
  const fetchActionLogs = async (silent = false) => {
    if (!silent) setLoadingLogs(true);
    try {
      const res = await fetch("/api/action-logs");
      if (res.ok) {
        const data = await res.json();
        setActionLogs(data);
      }
    } catch (err) {
      console.error("Error reading action logs:", err);
    } finally {
      if (!silent) setLoadingLogs(false);
    }
  };

  // Polling for live action monitoring
  useEffect(() => {
    if (isAuthorized && adminSubTab === "actions") {
      fetchActionLogs();
      let timer: any = null;
      if (isAutoRefresh) {
        timer = setInterval(() => {
          fetchActionLogs(true);
        }, 3000); // 3 seconds interval for real-time live monitoring
      }
      return () => {
        if (timer) clearInterval(timer);
      };
    }
  }, [isAuthorized, adminSubTab, isAutoRefresh]);

  const clearAllActionLogs = async () => {
    if (window.confirm("آیا مایلید کل تاریخچه گزارش تفصیلی فعالیت کاربران را به صورت آنلاین پاکسازی کنید؟")) {
      setIsClearingLogs(true);
      try {
        const res = await fetch("/api/action-logs", { method: "DELETE" });
        if (res.ok) {
          setActionLogs([]);
          alert("کلیه گزارش‌های آنلاین فعالیت کاربران با موفقیت از دیتابیس حذف گردید.");
        }
      } catch (err) {
        alert("خطا در ارتباط با سرور جهت پاکسازی لاگ‌ها.");
      } finally {
        setIsClearingLogs(false);
      }
    }
  };

  // Load backend data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/participants");
      if (res.ok) {
        const data: Participant[] = await res.json();
        setParticipants(data);
        
        // Calculate dynamic figures
        const total = data.length;
        const published = data.filter(p => p.isPublished).length;
        const pending = data.filter(p => p.status === "pending").length;
        const avgScore = total > 0 ? Math.round(data.reduce((acc, p) => acc + p.predScore, 0) / total) : 0;
        const activePredictors = data.filter(p => p.predictionsCount > 10).length;

        setQuickStats({ total, published, pending, avgScore, activePredictors });
      }

      // Fetch all predictions for the raffle/analytics
      const predsRes = await fetch("/api/admin/predictions");
      if (predsRes.ok) {
        const pData = await predsRes.json();
        setPredictions(pData);
      }

      // Fetch manual results
      const manualRes = await fetch("/api/manual-results");
      if (manualRes.ok) {
        const mData = await manualRes.json();
        if (mData.success && mData.results) {
          const map: Record<string, any> = {};
          mData.results.forEach((r: any) => {
            map[r.matchId] = r;
          });
          setManualResults(map);
        }
      }

      // Generate local matches
      const allMatches = generateGroupMatches();
      setMatches(allMatches);

    } catch (err) {
      console.error("Error reading admin statistics", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerRaffle = (pool: Participant[]) => {
    if (pool.length === 0) {
      alert("لیست شرکت‌کنندگان واجد شرایط خالی است!");
      return;
    }
    
    setIsDrawing(true);
    setRaffleWinner(null);
    setShadApiDetails(null);
    setShadError(null);

    let counter = 0;
    const maxSteps = 20;
    const interval = setInterval(() => {
      const randIndex = Math.floor(Math.random() * pool.length);
      setDrawnName(pool[randIndex].name || "کاربر بی‌نام");
      counter++;

      if (counter >= maxSteps) {
        clearInterval(interval);
        const finalWinner = pool[Math.floor(Math.random() * pool.length)];
        setRaffleWinner(finalWinner);
        setDrawnName(finalWinner.name || "کاربر بی‌نام");
        setIsDrawing(false);
        
        // Auto fetch shad details
        fetchWinnerShadDetails(finalWinner.id, finalWinner.name || "");
      }
    }, 100);
  };

  const fetchWinnerShadDetails = async (winnerId: string, winnerName: string) => {
    setShadLoading(true);
    setShadError(null);
    setShadApiDetails(null);
    try {
      const url = `/api/shad/user-info?UserID=${winnerId}&name=${encodeURIComponent(winnerName)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setShadApiDetails(json.data);
        } else {
          setShadError(json.description || "خطا در استعلام اطلاعات کاربر از شاد.");
        }
      } else {
        setShadError("پورت استعلام وب‌سرویس شاد پاسخگو نبود.");
      }
    } catch (err: any) {
      setShadError("امکان اتصال به شبکه اختصاصی شاد میسر نشد.");
    } finally {
      setShadLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthorized && adminSubTab === "raffle") {
      fetchData();
    }
  }, [adminSubTab, isAuthorized]);

  // Handle Authentication Log in
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "boghchi_iran1405@21339876") {
      setIsAuthorized(true);
      sessionStorage.setItem("admin_session_auth", "true");
      setErrorText("");
    } else {
      setErrorText("گذرواژه وارد شده نامعتبر است.");
    }
  };

  // Log out
  const handleLogout = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem("admin_session_auth");
  };

  // Direct toggle approval state from this panel
  const togglePublishDirect = async (p: Participant) => {
    try {
      const res = await fetch(`/api/participants/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !p.isPublished })
      });
      if (res.ok) {
        // Optimistic refresh
        fetchData();
      }
    } catch (e) {
      alert("خطا در همگام‌سازی تاییدیه انتشار.");
    }
  };

  // Quick action: Approve all pending submissions in one click
  const approveAllPending = async () => {
    const pendings = participants.filter(p => !p.isPublished || p.status === "pending");
    if (pendings.length === 0) return alert("هیچ پرونده در انتظار تاییدی یافت نشد.");
    
    if (window.confirm(`آیا مایلید تمام ${pendings.length} شرکت‌کننده معلق را مستقیماً منتشر کنید؟`)) {
      try {
        for (const p of pendings) {
          await fetch(`/api/participants/${p.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPublished: true, status: "completed" })
          });
        }
        fetchData();
      } catch (err) {
        alert("خطا در انتشار گروهی تایید صلاحیت‌ها");
      }
    }
  };

  // Download all user predictions as a CSV spreadsheet
  const downloadPredictionsCsv = () => {
    try {
      const link = document.createElement("a");
      link.href = "/api/admin/predictions-csv";
      link.setAttribute("download", "all_user_predictions.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error setting up download link:", err);
      window.location.href = "/api/admin/predictions-csv";
    }
  };

  // Simulate group results modifier trigger
  const runGroupCalculationsSimulation = async () => {
    setIsSimulatingGroup(true);
    // Simulate updating predictor scores across the system based on group outcomes
    setTimeout(async () => {
      try {
        // Randomly modify score variations to simulate points processing
        for (const p of participants) {
          const scoreDelta = Math.floor(Math.random() * 12) + 1;
          const finalScore = Math.min(100, p.predScore + scoreDelta);
          await fetch(`/api/participants/${p.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ predScore: finalScore })
          });
        }
        await fetchData();
        alert("بروزرسانی شبیه‌ساز با موفقیت روی بانک اطلاعاتی اعمال و بازنشانی شد.");
      } catch (err) {
        console.error(err);
      } finally {
        setIsSimulatingGroup(false);
      }
    }, 1500);
  };

  // Fast reset database option
  const resetAppDatabase = async () => {
    if (window.confirm("کامل مطمئنید؟ کلیه پیش‌بینی‌ها و رکوردهای دستی شرکت‌کنندگان حذف شده و تنظیمات اولیه مسابقه اعمال خواهد شد.")) {
      setIsResetting(true);
      try {
        // Simple bulk delete iteration or clear calls
        const samples: Participant[] = [
          { id: "p-s1", name: "امیر قلعه‌نویی", favoriteTeam: "ایران", predictedChampion: "برزیل", predScore: 88, status: "completed", phoneOrEmail: "ghalenoei@teammelli.ir", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۸", predictionsCount: 48 },
          { id: "p-s2", name: "پیمان یوسفی", favoriteTeam: "انگلستان", predictedChampion: "فرانسه", predScore: 62, status: "completed", phoneOrEmail: "yousefi@irib.ir", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۹", predictionsCount: 48 },
          { id: "p-s3", name: "سردار آزمون", favoriteTeam: "ایران", predictedChampion: "آلمان", predScore: 92, status: "completed", phoneOrEmail: "sardar@roma.it", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۹", predictionsCount: 48 }
        ];

        // Seed fresh starting defaults
        const cleanDB = await fetch("/api/participants/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(samples)
        });
        if (cleanDB.ok) {
          await fetchData();
          alert("دیتابیس ابری بازنشانی شده و رکوردهای اولیه مسابقه بارگذاری شدند.");
        }
      } catch (e) {
        alert("خطا در بازنشانی داده‌های شبکه.");
      } finally {
        setIsResetting(false);
      }
    }
  };

  // Safely reset user's local testing environment to avoid conflict with old simulated data
  const resetUserLocalStorage = () => {
    if (window.confirm("⚠️ هشدار امنیتی: آیا مطمئنید؟ بازیابی حافظه مرورگر تمامی پیش‌بینی‌های محلی شما، نام کاربری و وضعیت عضویت شما در مرورگر فعلی را به صفر برگردانده و صفحه مجدداً بازხوانی خواهد شد.")) {
      const keysToRemove = [
        "wc_predictor_matches",
        "wc_predictor_knockout",
        "wc_predictor_username",
        "wc_predictor_server_id",
        "wc_predictor_shad_hash",
        "wc_predictor_fav_team",
        "predictor_campaign_champ",
        "wc_predictor_active_effects",
        "wc_predictor_iran_enthusiasm",
        "wc_predictor_claimed_gifts",
        "wc_iran_club_collapsed"
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      alert("✅ حافظه محلی مرورگر با موفقیت به طور کامل و ایمن پاکسازی شد.");
      window.location.reload();
    }
  };

  // --- ANALYTICS CALCULATIONS ---
  // 1. Favorite Team statistics
  const favTeamCounts: Record<string, number> = {};
  participants.forEach(p => {
    if (p.favoriteTeam) {
      favTeamCounts[p.favoriteTeam] = (favTeamCounts[p.favoriteTeam] || 0) + 1;
    }
  });
  const favTeamSorted = Object.entries(favTeamCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 2. Champion predictions statistics
  const champCounts: Record<string, number> = {};
  participants.forEach(p => {
    if (p.predictedChampion) {
      champCounts[p.predictedChampion] = (champCounts[p.predictedChampion] || 0) + 1;
    }
  });
  const champSorted = Object.entries(champCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 3. Score distribution
  let scoreDist = {
    expert: 0, // 80 - 100
    advanced: 0, // 60 - 79
    average: 0, // 30 - 59
    beginner: 0, // 0 - 29
  };
  participants.forEach(p => {
    if (p.predScore >= 80) scoreDist.expert++;
    else if (p.predScore >= 60) scoreDist.advanced++;
    else if (p.predScore >= 30) scoreDist.average++;
    else scoreDist.beginner++;
  });

  const totalCountForStats = participants.length || 1;
  const scorePercent = {
    expert: Math.round((scoreDist.expert / totalCountForStats) * 100),
    advanced: Math.round((scoreDist.advanced / totalCountForStats) * 100),
    average: Math.round((scoreDist.average / totalCountForStats) * 100),
    beginner: Math.round((scoreDist.beginner / totalCountForStats) * 100),
  };

  // 4. Extract unique list of teams dynamically
  const uniqueTeamsList = Array.from(new Set([
    ...participants.map(p => p.favoriteTeam),
    ...participants.map(p => p.predictedChampion),
    "ایران", "برزیل", "آلمان", "فرانسه", "آرژانتین", "اسپانیا", "انگلستان"
  ])).filter(Boolean);

  // 5. Selected team drilldown statistics
  const drilldownStats = {
    favoriteCount: participants.filter(p => p.favoriteTeam === selectedAnalyticTeam).length,
    champCount: participants.filter(p => p.predictedChampion === selectedAnalyticTeam).length,
    avgScore: (() => {
      const filtered = participants.filter(p => p.favoriteTeam === selectedAnalyticTeam || p.predictedChampion === selectedAnalyticTeam);
      if (filtered.length === 0) return 0;
      return Math.round(filtered.reduce((acc, current) => acc + current.predScore, 0) / filtered.length);
    })(),
    highestScore: (() => {
      const filtered = participants.filter(p => p.favoriteTeam === selectedAnalyticTeam || p.predictedChampion === selectedAnalyticTeam);
      if (filtered.length === 0) return 0;
      return Math.max(...filtered.map(p => p.predScore));
    })()
  };

  // Get Top 5 Predictor participants
  const topPredictors = [...participants]
    .sort((a, b) => b.predScore - a.predScore)
    .slice(0, 5);

  // Locked Gate screen
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center py-20 px-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-8 shadow-2xl relative"
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

          <div className="text-center space-y-4 relative z-10 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-indigo-500/20 text-pink-400 w-16 h-16 mx-auto flex items-center justify-center border border-white/5 shadow-inner">
              <ShieldAlert size={28} className="animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-slate-100 font-sans tracking-tight">پنل مدیریت ابری مسابقات پیش‌بینی</h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
              این بخش مجهز به فیلترها و شبیه‌سازهای آماری مسابقات است. جهت احراز هویت گذرواژه مدیریت را وارد کنید. 
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 relative z-10">
            <div className="space-y-1.5 text-right">
              <label className="block text-[11px] text-slate-400 font-black">گذرواژه دسترسی ابری:</label>
              <div className="relative">
                <input
                   type="password"
                   placeholder="رمز ورود"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-center text-slate-100 placeholder-slate-600 outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/25 duration-150 tracking-wider"
                   autoFocus
                />
              </div>
              {errorText && (
                <span className="block text-[10px] font-bold text-rose-400 text-right mt-1">{errorText}</span>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs duration-150 cursor-pointer shadow-lg shadow-pink-500/20 active:scale-[0.98]"
            >
              احراز هویت و ورود کارشناس
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/5 flex gap-2 items-center justify-center text-slate-500 text-[10px] font-bold">
            <Key size={11} className="text-slate-600" />
            <span>گذرواژه کلید پیش‌فرض محلی: admin</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Dynamic Glass Top Shield Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 left-0 -ml-16 -mt-16 h-48 w-48 rounded-full bg-indigo-500/[0.05] blur-3xl"></div>
        <div className="absolute bottom-0 right-0 -mr-16 -mb-16 h-48 w-48 rounded-full bg-pink-500/[0.05] blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
              <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                پنل مدیریت یکپارچه داده‌های دیتابیس
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-100 tracking-tight">
              داشبورد مانیتورینگ و پیکربندی شبکه مسابقات
            </h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl leading-relaxed">
              کنترل کل دیتابیس مسابقات پیش‌بینی، تایید وضعیت شرکت‌کنندگان فعال، شبیه‌ساز هوش‌مصنوعی بازی‌های گروهی و بازنشانی رکوردهای منقضی‌شده.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 font-bold text-xs duration-150 cursor-pointer shadow-md"
            >
              <RotateCcw size={14} />
              <span>خروج کاربری مدیریت</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual KPI Performance Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-5 flex items-center gap-4 transition-all hover:border-white/10 shadow-lg">
          <div className="p-3.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/10">
            <Users size={18} />
          </div>
          <div>
            <span className="block text-[11px] text-slate-500 font-bold mb-0.5">کل شرکت‌کنندگان پرونده</span>
            <span className="text-lg font-mono font-black text-slate-100">{loading ? "..." : quickStats.total} کاربر</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-5 flex items-center gap-4 transition-all hover:border-white/10 shadow-lg">
          <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/10">
            <Activity size={18} className="animate-pulse" />
          </div>
          <div>
            <span className="block text-[11px] text-slate-500 font-bold mb-0.5">پیش‌بینی تکمیل شده</span>
            <span className="text-lg font-mono font-black text-amber-400">{loading ? "..." : quickStats.activePredictors} پرونده</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-5 flex items-center gap-4 transition-all hover:border-white/10 shadow-lg">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
            <Clock size={18} />
          </div>
          <div>
            <span className="block text-[11px] text-slate-500 font-bold mb-0.5">تاییدیه معوق ممیزی</span>
            <span className="text-lg font-mono font-black text-indigo-400">{loading ? "..." : quickStats.pending} پرونده</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-5 flex items-center gap-4 transition-all hover:border-white/10 shadow-lg">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
            <TrendingUp size={18} />
          </div>
          <div>
            <span className="block text-[11px] text-slate-500 font-bold mb-0.5">میانگین امتیازات کارشناسان</span>
            <span className="text-lg font-mono font-black text-emerald-400">{loading ? "..." : quickStats.avgScore} pts</span>
          </div>
        </div>

      </div>

      {/* Main Core operational area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side: System Control Core and Live Simulation */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Diagnostic Console Trigger Box */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Zap size={16} className="text-indigo-400" />
              <h4 className="text-sm font-black text-slate-100">شبیه‌ساز مسابقات فعال و گروهی</h4>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed font-semibold">
              این موتور خودکار بازی‌ها را به شیوه‌ای تصادفی شبیه‌سازی کرده و امتیازات تمامی کاربران فعال دیتابیس را بر حسب مسابقات درست تطابق داده و بالانس جدید ایجاد می‌کند.
            </p>

            <button
              onClick={runGroupCalculationsSimulation}
              disabled={isSimulatingGroup || loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-55 text-white font-black text-xs duration-150 cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isSimulatingGroup ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>درحال شبیه‌سازی و بازخوانی...</span>
                </>
              ) : (
                <>
                  <Play size={13} fill="currentColor" />
                  <span>اجرای فوری موتور شبیه‌سازی بازی‌ها</span>
                </>
              )}
            </button>
          </div>

          {/* Database Maintenance and System backups */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Database size={16} className="text-pink-400" />
              <h4 className="text-sm font-black text-slate-100">مدیریت هاردستون و نگهداری دیتابیس</h4>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed font-semibold">
              انجام فرآیندهای حساس پاکسازی دیتابیس، بازیابی مجدد به وضع اولیه مسابقات جهانی و پاشش رکوردهای دمو.
            </p>

            <div className="space-y-2">
              <button
                onClick={resetAppDatabase}
                disabled={isResetting || loading}
                className="w-full py-3 rounded-xl bg-slate-950 border border-rose-500/25 text-rose-300 font-bold text-xs hover:bg-rose-500/10 duration-150 cursor-pointer flex items-center justify-center gap-2"
              >
                <FolderSync size={13} />
                <span>بازنشانی دیتابیس ابری (Reset)</span>
              </button>

              <button
                onClick={resetUserLocalStorage}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-slate-950 border border-amber-500/25 text-amber-300 font-bold text-xs hover:bg-amber-500/10 duration-150 cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 size={13} />
                <span>بازنشانی حافظه محلی مرورگر (localStorage)</span>
              </button>

              <button
                onClick={() => {
                  fetchData();
                  alert("موجودی دیتابیس با موفقیت بازخوانی و همگام گردید.");
                }}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-slate-950 border border-white/5 text-slate-300 font-bold text-xs hover:bg-slate-900 duration-150 cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw size={13} />
                <span>بروزرسانی کش و همگام‌سازی ابری</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Tab switcher content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-6 shadow-xl space-y-6">
            
            {/* Sub-tab switcher navigation */}
            <div className="flex border-b border-white/10 pb-1 gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setAdminSubTab("analytics")}
                className={`pb-3 px-4 font-black text-xs duration-150 cursor-pointer border-b-2 transition-all flex items-center gap-2 outline-none ${
                  adminSubTab === "analytics"
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <BarChart3 size={13} className={adminSubTab === "analytics" ? "text-amber-400" : "text-slate-400"} />
                <span>تحلیل آماری و روند پیش‌بینی‌ها (پیشرفته 📊)</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("audit")}
                className={`pb-3 px-4 font-black text-xs duration-150 cursor-pointer border-b-2 transition-all flex items-center gap-2 outline-none ${
                  adminSubTab === "audit"
                    ? "border-pink-500 text-pink-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Grid size={13} className={adminSubTab === "audit" ? "text-pink-400" : "text-slate-400"} />
                <span>بررسی و ممیزی شرکت‌کنندگان ({participants.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("actions")}
                className={`pb-3 px-4 font-black text-xs duration-150 cursor-pointer border-b-2 transition-all flex items-center gap-2 relative outline-none ${
                  adminSubTab === "actions"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {adminSubTab === "actions" && (
                  <span className="relative flex h-1.5 w-1.5 font-bold">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                  </span>
                )}
                <Activity size={13} className={adminSubTab === "actions" ? "text-indigo-400" : "text-slate-400"} />
                <span>ردگیری زنده‌ کلیک‌ها و فعالیت کاربران ({actionLogs.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("raffle")}
                className={`pb-3 px-4 font-black text-xs duration-150 cursor-pointer border-b-2 transition-all flex items-center gap-2 outline-none ${
                  adminSubTab === "raffle"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Gift size={13} className={adminSubTab === "raffle" ? "text-emerald-400" : "text-slate-400"} />
                <span>برگزاری قرعه‌کشی شادکیو (مسابقات و قهرمان 🎁)</span>
              </button>
            </div>

            {adminSubTab === "analytics" ? (
              // Tab 1: COMPREHENSIVE ANALYTICS SUITE
              <div className="space-y-6">
                
                {/* Visual Intro statement */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-white/5 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 font-bold shrink-0">
                      <Sparkles size={18} className="animate-spin-slow" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-100">تحلیل هوشمند رفتار و سلیقه کارشناسی پیش‌بینی‌گران</h4>
                      <p className="text-slate-400 text-[10px] sm:text-xs leading-relaxed">
                        این داشبورد داده‌های همزمان را پردازش کرده و تراکم نتایج، محبوبیت فلگ‌ها و سلیقه قهرمانی کاربران را مانیتور می‌کند.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={downloadPredictionsCsv}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs duration-150 cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 border border-emerald-400/20 shrink-0 Persian-font transition-all active:scale-[0.97]"
                  >
                    <FileSpreadsheet size={15} className="animate-pulse" />
                    <span>خروجی اکسل (CSV) پیش‌بینی‌ها</span>
                  </button>
                </div>

                {/* Score Dist & Top Predictors section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Score Distribution cards */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                      <LineChart size={14} className="text-pink-400" />
                      <span>توزیع آماری دانش کارشناسی پیش‌بینی ارزش‌دهی</span>
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      
                      {/* Expert Card */}
                      <div className="p-3.5 bg-slate-950/30 rounded-2xl border border-emerald-500/10 text-right">
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">عالی (۸۰+)</span>
                        <div className="mt-2.5 flex items-baseline justify-between">
                          <span className="text-lg font-mono font-black text-slate-100">{scoreDist.expert} نفر</span>
                          <span className="text-xs text-slate-400">{scorePercent.expert}%</span>
                        </div>
                        <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${scorePercent.expert}%` }}></div>
                        </div>
                      </div>

                      {/* Advanced Card */}
                      <div className="p-3.5 bg-slate-950/30 rounded-2xl border border-indigo-500/10 text-right">
                        <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">بالا (۶۰-۷۹)</span>
                        <div className="mt-2.5 flex items-baseline justify-between">
                          <span className="text-lg font-mono font-black text-slate-100">{scoreDist.advanced} نفر</span>
                          <span className="text-xs text-slate-400">{scorePercent.advanced}%</span>
                        </div>
                        <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${scorePercent.advanced}%` }}></div>
                        </div>
                      </div>

                      {/* Average Card */}
                      <div className="p-3.5 bg-slate-950/30 rounded-2xl border border-amber-500/10 text-right">
                        <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">متوسط (۳۰-۵۹)</span>
                        <div className="mt-2.5 flex items-baseline justify-between">
                          <span className="text-lg font-mono font-black text-slate-100">{scoreDist.average} نفر</span>
                          <span className="text-xs text-slate-400">{scorePercent.average}%</span>
                        </div>
                        <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${scorePercent.average}%` }}></div>
                        </div>
                      </div>

                      {/* Beginner Card */}
                      <div className="p-3.5 bg-slate-950/30 rounded-2xl border border-slate-500/20 text-right">
                        <span className="text-[9px] font-black text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded">پایین (زیر ۳۰)</span>
                        <div className="mt-2.5 flex items-baseline justify-between">
                          <span className="text-lg font-mono font-black text-slate-100">{scoreDist.beginner} نفر</span>
                          <span className="text-xs text-slate-450">{scorePercent.beginner}%</span>
                        </div>
                        <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-500 rounded-full" style={{ width: `${scorePercent.beginner}%` }}></div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Top Predictors List highlights */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                      <Flame size={14} className="text-amber-400" />
                      <span>۵ ستاره اول کارشناسی (صدر جدول زنده)</span>
                    </h5>

                    <div className="bg-slate-950/20 rounded-2xl border border-white/5 p-3.5 space-y-2">
                      {topPredictors.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-xs">کاربری ثبت نشده است.</div>
                      ) : (
                        topPredictors.map((p, idx) => (
                          <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-white/[0.02] transition-all">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                                idx === 0 ? "bg-amber-500 text-slate-950" :
                                idx === 1 ? "bg-slate-300 text-slate-950" :
                                idx === 2 ? "bg-amber-700/50 text-amber-200" : "bg-slate-800 text-slate-400"
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="font-extrabold text-slate-200">{p.name}</span>
                              <span className="text-[9px] px-1.5 py-0.25 bg-white/5 rounded text-indigo-300 font-bold">{p.favoriteTeam}</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-emerald-400 font-black">{p.predScore} pts</span>
                              <span className="text-[9px] text-slate-500">({p.predictionsCount} بازی)</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                  </div>

                </div>

                {/* Popular teams & predicted champions metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Favorites Distribution Bar Chart emulation */}
                  <div className="space-y-3 rounded-2xl bg-slate-950/20 border border-white/5 p-5">
                    <h5 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                      <Users size={14} className="text-indigo-400" />
                      <span>محبوب‌ترین تیم‌های ملی (جام بر اساس هواخواهی)</span>
                    </h5>
                    <div className="space-y-3 pt-2">
                      {favTeamSorted.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 text-xs">موردی یافت نشد.</div>
                      ) : (
                        favTeamSorted.map(([teamName, count]) => {
                          const percentage = Math.round((count / totalCountForStats) * 100);
                          return (
                            <div key={teamName} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-slate-200 flex items-center gap-1">
                                  <span>⚽</span>
                                  <span>{teamName}</span>
                                </span>
                                <span className="text-slate-400 font-bold font-mono">{count} هوادار ({percentage}%)</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-950/80 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Predicted World Champions list */}
                  <div className="space-y-3 rounded-2xl bg-slate-950/20 border border-white/5 p-5">
                    <h5 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-teal-400" />
                      <span>پیش‌بینی قهرمان نهایی (شانس اصلی جام جهانی)</span>
                    </h5>
                    <div className="space-y-3 pt-2">
                      {champSorted.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 text-xs">موردی یافت نشد.</div>
                      ) : (
                        champSorted.map(([teamName, count]) => {
                          const percentage = Math.round((count / totalCountForStats) * 100);
                          return (
                            <div key={teamName} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-slate-200 flex items-center gap-1">
                                  <span>🏆</span>
                                  <span className="font-extrabold">{teamName}</span>
                                </span>
                                <span className="text-teal-400 font-black font-mono">{count} رای احتمالی ({percentage}%)</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-950/80 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-400 rounded-full" style={{ width: `${percentage}%` }}></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

                {/* Drilldown focus Interactive analyzer */}
                <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div className="space-y-1">
                      <h5 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                        <Activity size={14} className="text-pink-400" />
                        <span>کاوشگر و گشایشگر عمیق آماری پلتفرم</span>
                      </h5>
                      <p className="text-[10px] text-slate-500 font-bold">تیم ملی مورد نظر را انتخاب نموده تا همبستگی‌ها و الگوهای پیش‌بینی مرتبط را فوراً بازخوانی و مقایسه کنید.</p>
                    </div>

                    <div>
                      <select
                        value={selectedAnalyticTeam}
                        onChange={(e) => setSelectedAnalyticTeam(e.target.value)}
                        className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-extrabold outline-none focus:border-pink-500 cursor-pointer"
                      >
                        {uniqueTeamsList.map(t => (
                          <option key={t} value={t} className="bg-slate-950 text-slate-200">{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                    
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-right space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold">هواداران تعصبی تیم:</span>
                      <div className="text-lg font-mono font-black text-indigo-400">{drilldownStats.favoriteCount} کاربر</div>
                      <div className="text-[9px] text-slate-450 font-semibold">از کل کلوب پیش‌بینی‌ها</div>
                    </div>

                    <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-right space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold">بخت‌های قهرمانی ثبتی:</span>
                      <div className="text-lg font-mono font-black text-teal-400">{drilldownStats.champCount} برگه رای</div>
                      <div className="text-[9px] text-slate-450 font-semibold">امید نهایی در جام جهانی</div>
                    </div>

                    <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-right space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold">میانگین امتیاز مدعیان:</span>
                      <div className="text-lg font-mono font-black text-slate-200">{drilldownStats.avgScore} pts</div>
                      <div className="text-[9px] text-slate-450 font-semibold">عملکرد کیفی کاربران حامی</div>
                    </div>

                    <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-right space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold">بالاترین امتیاز شکار شده:</span>
                      <div className="text-lg font-mono font-black text-amber-400">{drilldownStats.highestScore} pts</div>
                      <div className="text-[9px] text-slate-450 font-semibold">رکورد استثنایی طرفداران</div>
                    </div>

                  </div>

                  <div className="p-3 bg-slate-900/40 rounded-xl border border-white/5 text-[11px] text-slate-400 leading-relaxed">
                    💡 <strong className="text-slate-250">تحلیل رفتاری سیستم: </strong>
                    {drilldownStats.favoriteCount > 0 || drilldownStats.champCount > 0 ? (
                      <span>تیم ملی <span className="text-slate-200 font-black">{selectedAnalyticTeam}</span> در رنکینگ پیش‌بینی‌ها از جذابیت مطلوبی بهره‌مند است. میانگین {drilldownStats.avgScore} امتیاز نشانگر دقت به نسبت منطقی حامیان آن در حدس زدن امتیاز بازی‌ها است. رتبه پیش‌بینی قهرمانی این تیم نیز همگام با امتیازات عمومی پیش می‌رود.</span>
                    ) : (
                      <span>اطلاعات یا سوابق انتخابی زیادی برای تیم <span className="text-slate-200 font-black">{selectedAnalyticTeam}</span> ثبت نشده است. این بدین معنی است که کاربران در مقطع فعلی کمتر روی این کشور متمرکز شده‌اند.</span>
                    )}
                  </div>

                </div>

              </div>
            ) : adminSubTab === "audit" ? (
              // TAB 2: AUDITTING INTERFACE
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
                       <Grid size={15} className="text-pink-400" />
                      <span>بررسی و انتشار پرونده شرکت‌کنندگان معلق</span>
                    </h4>
                    <p className="text-slate-400 text-[10px] sm:text-xs">
                      در این میز کار بررسی، پرونده کاربرانی که به پلتفرم ارسال شده نمایش داده می‌شود. می‌توانید تاییدیه انتشار آنلاین صادر کنید.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={downloadPredictionsCsv}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 font-extrabold text-xs duration-150 cursor-pointer border border-emerald-500/20 shadow flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <FileSpreadsheet size={13} />
                      <span>دانلود اکسل پیش‌بینی‌ها</span>
                    </button>
                    <button
                      type="button"
                      onClick={approveAllPending}
                      className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs duration-150 cursor-pointer shadow-lg shadow-pink-500/10 flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <Check size={12} />
                      <span>انتشار سراسری همه معلق‌ها</span>
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="py-12 text-center space-y-2">
                    <div className="mx-auto h-8 w-8 border-2 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-xs font-bold animate-pulse">درحال فراخوانی لیست پرونده‌ها...</p>
                  </div>
                ) : participants.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    هیچ شرکت‌کننده‌ای جهت مانیتور روی دیتابیس یافت نشد.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {participants.map((p) => (
                      <div 
                        key={p.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          p.isPublished 
                            ? "bg-slate-950/20 border-white/5" 
                            : "bg-amber-500/[0.02] border-amber-500/15"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
                            p.isPublished 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                              : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                          }`}>
                            <Users size={16} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-slate-100">{p.name}</span>
                              <span className="text-[9px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                                {p.favoriteTeam}
                              </span>
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                قهرمان: {p.predictedChampion}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold">
                              <span>امتیاز کارشناسی: <strong className="text-slate-350">{p.predScore} pts</strong></span>
                              <span>•</span>
                              <span>ثبت: {p.registeredAt || "۱۴۰۵/۰۳/۱۵"}</span>
                              {p.phoneOrEmail && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-slate-400" dir="ltr">{p.phoneOrEmail}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                          <div className="text-[10px] font-black pl-2">
                            {p.isPublished ? (
                              <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                                🟢 منتشر شده جدول عمومی
                              </span>
                            ) : (
                              <span className="text-amber-400 flex items-center gap-1 bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/10">
                                🟡 پیش‌نویس موقت
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => togglePublishDirect(p)}
                            className={`px-3 py-1.5 rounded-lg border text-[10px] font-black cursor-pointer duration-100 flex items-center gap-1 ${
                              p.isPublished 
                                ? "bg-slate-900 border-white/5 text-slate-400 hover:text-white" 
                                : "bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30"
                            }`}
                          >
                            {p.isPublished ? "لغو انتشار" : "تایید انتشار"}
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 flex gap-3 text-slate-400 text-xs">
                  <HelpCircle size={16} className="text-pink-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 leading-relaxed">
                    <p className="font-bold">راهنمای سیستم ممیزی:</p>
                    <p className="text-[11px]">
                      پیش فرض، کلیه پیش‌بینی‌ها و رکوردهای وارد شده توریستی یا کاربری معلق در لایه دیتابیس ثبت می‌شوند. شما به عنوان ناظر ارشد، پس از ارزیابی‌های اولیه با لمس دکمه «تایید انتشار»، آن‌ها را فوراً به جدول تفکیکی سراسری منتقل کرده تا در معرض تماشای عموم قرار گیرند.
                    </p>
                  </div>
                </div>
              </div>
            ) : adminSubTab === "actions" ? (
              // TAB 3: ACTION MONITORING LOGS
              <div className="space-y-4">
                
                {/* Control bar for Online Live Track Monitor */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="جستجو در اسم کاربری یا نوع کلیک..."
                      value={logsFilter}
                      onChange={(e) => setLogsFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-slate-200 outline-none focus:border-indigo-500/50"
                    />
                    {logsFilter && (
                      <button
                        onClick={() => setLogsFilter("")}
                        className="absolute left-2.5 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    
                    <button
                      type="button"
                      onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black cursor-pointer border transition-all flex items-center gap-1.5 ${
                        isAutoRefresh
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-slate-900/80 border-white/5 text-slate-400"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isAutoRefresh ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}></span>
                      <span>بروزرسانی زنده (۳ ثانیه): {isAutoRefresh ? "فعال" : "غیرفعال"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fetchActionLogs()}
                      disabled={loadingLogs}
                      className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-850 text-slate-350 disabled:opacity-50 cursor-pointer"
                      title="بروزرسانی دستی"
                    >
                      <RefreshCw size={12} className={loadingLogs ? "animate-spin" : ""} />
                    </button>

                    <button
                      type="button"
                      onClick={clearAllActionLogs}
                      disabled={isClearingLogs}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/20 hover:bg-rose-500/25 text-rose-300 font-bold text-[10px] cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 size={11} />
                      <span>پاکسازی کل لاگ‌ها</span>
                    </button>

                  </div>
                </div>

                {/* Logs terminal box */}
                {loadingLogs && actionLogs.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <div className="mx-auto h-8 w-8 border-2 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-xs font-bold animate-pulse">درحال دانلود گزارش فعالیت‌های جدید...</p>
                  </div>
                ) : actionLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-white/5 bg-slate-950/20 rounded-2xl">
                    هیچ فعالیتی ثبت نگردیده است. در بخش‌ها و تب‌ها حرکت کنید تا ردگیری به صورت آنلاین ثبت شود!
                  </div>
                ) : actionLogs.filter(l => 
                  l.username.toLowerCase().includes(logsFilter.toLowerCase()) || 
                  l.action.toLowerCase().includes(logsFilter.toLowerCase())
                ).length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-white/5 bg-slate-950/20 rounded-2xl">
                    گزارشی مطابق با فیلتر جستجو یافت نشد.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    {actionLogs
                      .filter(l => 
                        l.username.toLowerCase().includes(logsFilter.toLowerCase()) || 
                        l.action.toLowerCase().includes(logsFilter.toLowerCase())
                      )
                      .map((log) => {
                        // Time calculation helper
                        const getTimestampDisplay = (isoStr: string) => {
                          try {
                            const date = new Date(isoStr);
                            const tStr = date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                            const diff = Date.now() - date.getTime();
                            const secs = Math.floor(diff / 1000);
                            const mins = Math.floor(secs / 60);
                            
                            let relative = "";
                            if (secs < 12) {
                              relative = "همین الان";
                            } else if (secs < 60) {
                              relative = `${secs} ثانیه پیش`;
                            } else if (mins < 60) {
                              relative = `${mins} دقیقه پیش`;
                            } else {
                              relative = date.toLocaleDateString("fa-IR");
                            }
                            return { tStr, relative };
                          } catch {
                            return { tStr: isoStr, relative: "" };
                          }
                        };
                        const { tStr, relative } = getTimestampDisplay(log.timestamp);
                        const displayTime = log.exactTime || tStr;
                        
                        // Action styling helper with extremely high-contrast and readable colours
                        const getBadgeStyle = (txt: string) => {
                          const actionLower = txt.toLowerCase();
                          if (actionLower.includes("پیش‌بینی") || actionLower.includes("حذفی") || actionLower.includes("قهرمان")) {
                            return "text-amber-400 bg-amber-500/15 border-amber-500/35 font-extrabold";
                          }
                          if (actionLower.includes("تیم محبوب") || actionLower.includes("نام کاربری") || actionLower.includes("مشخصات") || actionLower.includes("پروفایل")) {
                            return "text-cyan-300 bg-cyan-500/15 border-cyan-500/35 font-extrabold";
                          }
                          if (actionLower.includes("مشاهده بخش") || actionLower.includes("کلیک روی میانبر")) {
                            return "text-purple-400 bg-purple-500/15 border-purple-500/35 font-extrabold";
                          }
                          if (actionLower.includes("طبل") || actionLower.includes("شیپور") || actionLower.includes("شعار") || actionLower.includes("کلوپ")) {
                            return "text-emerald-400 bg-emerald-500/15 border-emerald-500/35 font-extrabold";
                          }
                          if (actionLower.includes("شبیه‌سازی")) {
                            return "text-sky-400 bg-sky-500/15 border-sky-500/35 font-extrabold";
                          }
                          if (actionLower.includes("پاکسازی") || actionLower.includes("حذف") || actionLower.includes("غیرفعال")) {
                            return "text-rose-400 bg-rose-500/15 border-rose-500/35 font-extrabold";
                          }
                          return "text-slate-200 bg-slate-800/40 border-slate-700/30 font-bold";
                        };

                        return (
                          <div 
                            key={log.id}
                            className="p-3.5 rounded-2xl bg-slate-900/95 border border-slate-850 hover:border-slate-700/50 hover:bg-slate-950/90 transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="text-base select-none mt-0.5" role="img">⚡</span>
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-black text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30 shrink-0">
                                    {log.username || "مهمان بی‌نام"}
                                  </span>
                                  <span className={`text-[11px] px-2 py-0.5 rounded border ${getBadgeStyle(log.action)}`}>
                                    {log.action}
                                  </span>
                                </div>
                                {log.details && (
                                  <div className="text-[10px] text-slate-300 font-mono bg-slate-950/80 px-2.5 py-1 rounded border border-white/5 break-all inline-block max-w-full">
                                    {typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details)}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-end shrink-0 justify-between sm:justify-center text-slate-400 text-[10px] font-bold">
                              <span className="text-pink-400 font-mono text-[11px] font-black" dir="ltr">⏱️ {displayTime}</span>
                              <span className="text-slate-450 font-sans mt-0.5 text-[9px]">{relative}</span>
                            </div>

                          </div>
                        );
                      })}
                  </div>
                )}

                <div className="p-4 bg-indigo-950/10 rounded-2xl border border-indigo-500/10 flex gap-3 text-slate-400 text-xs">
                  <Terminal size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 leading-relaxed">
                    <p className="font-bold text-indigo-300">سیاهه ردگیری گشت‌زنی زنده کاربران:</p>
                    <p className="text-[11px]">
                      سیستم هوشمند به کار رفته کلیک‌های منو، ثبت و تغییر پیش‌بینی‌ها، افکت‌های صوتی کادوی نوجوان، طبل‌ها، تغییر نام کاربری و تنظیم تیم‌های محبوب کاربران را به صورت غیرهمگام دریافت کرده و نمایش می‌دهد. فواصل بروزرسانی ۳ ثانیه تنظیم شده است.
                    </p>
                  </div>
                </div>

              </div>
            ) : adminSubTab === "raffle" ? (
              // TAB 4: COMPREHENSIVE RAFFLE AND DRAW SYSTEM (requested)
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 text-right" dir="rtl">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-100 flex items-center gap-2 justify-end">
                      <span>سامانه قرعه‌کشی حرفه‌ای و نوین شادکیو</span>
                      <Gift size={16} className="text-emerald-400" />
                    </h4>
                    <p className="text-slate-400 text-[10px] sm:text-xs">
                      برگزاری قرعه‌کشی هوشمند عادلانه میان کسانی که بازی را درست حدس زده‌اند و استعلام مشخصات زنده آنها از شبکه شاد.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setRaffleWinner(null);
                        setShadApiDetails(null);
                        setShadError(null);
                        fetchData();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-305 font-extrabold text-xs duration-150 cursor-pointer flex items-center gap-1.5 transition-all outline-none"
                    >
                      <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                      <span>بروزرسانی داده‌ها</span>
                    </button>
                  </div>
                </div>

                {/* Main Raffle Type Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right" dir="rtl">
                  <button
                    type="button"
                    onClick={() => {
                      setRaffleType("match");
                      setRaffleWinner(null);
                      setShadApiDetails(null);
                      setShadError(null);
                      setSelectedMatchId("");
                    }}
                    className={`p-4 rounded-2xl border text-right transition-all duration-200 cursor-pointer relative overflow-hidden outline-none ${
                      raffleType === "match"
                        ? "bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/10"
                        : "bg-slate-950/40 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Ticket size={24} className={raffleType === "match" ? "text-emerald-400" : "text-slate-500"} />
                      <div className="space-y-1">
                        <span className="text-slate-200 font-black text-xs block">قرعه‌کشی پیش‌بینی نتایج مسابقات</span>
                        <p className="text-slate-400 text-[10px] sm:text-xs">رسم قرعه در بین کسانی که بازی خاصی را به درستی پیش‌بینی کردند.</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRaffleType("winner");
                      setRaffleWinner(null);
                      setShadApiDetails(null);
                      setShadError(null);
                    }}
                    className={`p-4 rounded-2xl border text-right transition-all duration-200 cursor-pointer relative overflow-hidden outline-none ${
                      raffleType === "winner"
                        ? "bg-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/10"
                        : "bg-slate-950/40 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Trophy size={24} className={raffleType === "winner" ? "text-amber-400" : "text-slate-500"} />
                      <div className="space-y-1">
                        <span className="text-slate-200 font-black text-xs block">قرعه‌کشی حدس قهرمان جام جهانی</span>
                        <p className="text-slate-400 text-[10px] sm:text-xs">قرعه‌کشی بزرگ میان کسانی که تیم قهرمان نهایی را صحیح حدس زدند.</p>
                      </div>
                    </div>
                  </button>
                </div>

                {raffleType === "match" ? (
                  // MODULE 1: INDIVIDUAL MATCH RAFFLE
                  <div className="space-y-5 bg-slate-950/20 p-5 rounded-2xl border border-white/5 text-right" dir="rtl">
                    
                    {/* Match Selection Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Iran Only filter switch */}
                      <div className="flex flex-col gap-1.5 justify-center">
                        <label className="text-[10px] sm:text-xs text-slate-400 font-bold">فیلتر ویژه بازی‌ها:</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setOnlyIranGames(true);
                              setRaffleWinner(null);
                              setShadApiDetails(null);
                              setSelectedMatchId("");
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all cursor-pointer border outline-none ${
                              onlyIranGames
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-350 shadow"
                                : "bg-slate-900 border-white/5 text-slate-455 hover:text-slate-200"
                            }`}
                          >
                            🇮🇷 فقط بازی‌های تیم ملی ایران
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOnlyIranGames(false);
                              setRaffleWinner(null);
                              setShadApiDetails(null);
                              setSelectedMatchId("");
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all cursor-pointer border outline-none ${
                              !onlyIranGames
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-350 shadow"
                                : "bg-slate-900 border-white/5 text-slate-455 hover:text-slate-200"
                            }`}
                          >
                            🌍 همه مسابقات گروهی
                          </button>
                        </div>
                      </div>

                      {/* Criteria Filter */}
                      <div className="flex flex-col gap-1.5 justify-center">
                        <label className="text-[10px] sm:text-xs text-slate-400 font-bold">معیار پیش‌بینی درست:</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setCorrectnessCriteria("exact");
                              setRaffleWinner(null);
                              setShadApiDetails(null);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all cursor-pointer border outline-none ${
                              correctnessCriteria === "exact"
                                ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-305 shadow"
                                : "bg-slate-900 border-white/5 text-slate-455 hover:text-slate-200"
                            }`}
                          >
                            🎯 پیش‌بینی نتیجه دقیق (تفاضل و گل‌ها)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCorrectnessCriteria("outcome");
                              setRaffleWinner(null);
                              setShadApiDetails(null);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all cursor-pointer border outline-none ${
                              correctnessCriteria === "outcome"
                                ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-305 shadow"
                                : "bg-slate-900 border-white/5 text-slate-455 hover:text-slate-200"
                            }`}
                          >
                            ⚖️ پیش‌بینی جهت صحیح (برد / مساوی)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Choose Match Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] sm:text-xs text-slate-400 font-bold">انتخاب مسابقه مورد نظر:</label>
                      <select
                        value={selectedMatchId}
                        onChange={(e) => {
                          setSelectedMatchId(e.target.value);
                          setRaffleWinner(null);
                          setShadApiDetails(null);
                          setShadError(null);
                        }}
                        className="w-full bg-slate-900 text-slate-200 text-xs font-bold border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500/40 cursor-pointer"
                      >
                        <option value="">-- یک مسابقه را انتخاب نمایید --</option>
                        {matches
                          .filter(m => {
                            if (onlyIranGames) {
                              return m.teamA.name === "ایران" || m.teamB.name === "ایران";
                            }
                            return true;
                          })
                          .map((m) => {
                            const result = manualResults[m.id];
                            const scoreText = result 
                              ? `(${result.scoreA} - ${result.scoreB}) (ثبت‌شده ✅)`
                              : " (نتیجه وارد نشده ❌)";
                            return (
                              <option key={m.id} value={m.id}>
                                {m.teamA.flag} {m.teamA.name} - {m.teamB.flag} {m.teamB.name} | {m.id} {scoreText}
                              </option>
                            );
                          })}
                      </select>
                    </div>

                    {selectedMatchId && (
                      <div className="p-4 bg-slate-900/60 border border-white/5 rounded-xl space-y-4">
                        {(() => {
                          const mObj = matches.find(m => m.id === selectedMatchId);
                          const resultObj = manualResults[selectedMatchId];

                          if (!resultObj) {
                            return (
                              <div className="text-center py-4 text-amber-400 text-xs font-bold flex flex-col items-center gap-2">
                                <ShieldAlert size={28} className="text-amber-500 animate-pulse" />
                                <span className="text-[13px] font-black leading-normal">نتیجه رسمی برای این بازی در سیستم ثبت نشده است!</span>
                                <span className="text-[10px] text-slate-400 font-medium">لطفاً ابتدا به تب «ثبت نتایج» هدایت شده و نتیجه پایانی ترجیحی را ذخیره فرمایید.</span>
                              </div>
                            );
                          }

                          // Compute eligible participants list for this match
                          const eligibleList: Participant[] = [];
                          const scoreA = resultObj.scoreA;
                          const scoreB = resultObj.scoreB;
                          const actualDiff = scoreA - scoreB;

                          predictions.forEach(p => {
                            if (p.matchId === selectedMatchId) {
                              const pScoreA = p.scoreA;
                              const pScoreB = p.scoreB;
                              const predDiff = pScoreA - pScoreB;

                              const isExact = pScoreA === scoreA && pScoreB === scoreB;
                              const isOutcome = (actualDiff > 0 && predDiff > 0) || (actualDiff < 0 && predDiff < 0) || (actualDiff === 0 && predDiff === 0);

                              if (correctnessCriteria === "exact" && isExact) {
                                const u = participants.find(part => part.id === p.participantId);
                                if (u) eligibleList.push(u);
                              } else if (correctnessCriteria === "outcome" && isOutcome) {
                                const u = participants.find(part => part.id === p.participantId);
                                if (u) eligibleList.push(u);
                              }
                            }
                          });

                          return (
                            <div className="space-y-4">
                              {/* Match Visual Showcase Header */}
                              <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/5 text-xs text-slate-200">
                                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                                  {correctnessCriteria === "exact" ? "🎯 تفاضل و گل دقیق" : "⚖️ جهت برد/مساوی"}
                                </span>
                                <div className="flex items-center gap-2 font-bold text-[13px]">
                                  <span>{mObj?.teamA.flag} {mObj?.teamA.name}</span>
                                  <span className="text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-md font-mono">{scoreA}</span>
                                  <span>-</span>
                                  <span className="text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-md font-mono">{scoreB}</span>
                                  <span>{mObj?.teamB.flag} {mObj?.teamB.name}</span>
                                </div>
                              </div>

                              {/* Eligibility Figures */}
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.01] p-3 rounded-lg border border-white/5">
                                <button
                                  type="button"
                                  onClick={() => triggerRaffle(eligibleList)}
                                  disabled={eligibleList.length === 0 || isDrawing}
                                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-40 text-black font-black text-xs duration-150 cursor-pointer shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-1.5 active:scale-95 transition-all text-center outline-none shrink-0"
                                >
                                  <Gift size={14} className={isDrawing ? "animate-bounce" : ""} />
                                  <span>{isDrawing ? "در حال حرکت قرعه..." : "برگزاری قرعه‌کشی زنده 🎁"}</span>
                                </button>

                                <div className="text-slate-350 text-xs text-right space-y-1">
                                  <div>
                                    <span>تعداد کل پیش‌بینی‌های ارسالی این بازی: </span>
                                    <span className="text-slate-100 font-black font-mono">{predictions.filter(p => p.matchId === selectedMatchId).length}</span>
                                  </div>
                                  <div>
                                    <span className="text-emerald-400 font-bold">واجدان شرایط قرعه‌کشی (حدس درست): </span>
                                    <span className="text-emerald-400 font-extrabold font-mono text-[13px] inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">{eligibleList.length} نفر</span>
                                  </div>
                                </div>
                              </div>

                              {/* Eligible users list preview drawer */}
                              {eligibleList.length > 0 && !isDrawing && !raffleWinner && (
                                <div className="space-y-1.5 text-right">
                                  <span className="text-[10px] text-slate-400 font-bold block">لیست واجدین شرایط جهت تفحص صوری:</span>
                                  <div className="max-h-[140px] overflow-y-auto border border-white/5 bg-slate-950/40 rounded-lg p-2 flex flex-wrap gap-1.5 justify-end">
                                    {eligibleList.map((eu, idx) => (
                                      <span key={eu.id + "-" + idx} className="text-[10px] font-bold text-slate-300 bg-slate-800/50 border border-white/5 px-2 py-1 rounded select-none">
                                        👤 {eu.name || "بی‌نام"}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                  </div>
                ) : (
                  // MODULE 2: WORLD CUP CHAMPION RAFFLE (requested)
                  <div className="space-y-5 bg-slate-950/20 p-5 rounded-2xl border border-white/5 text-right" dir="rtl">
                    <div className="space-y-1.5">
                      <label className="text-[10px] sm:text-xs text-slate-400 font-bold">قهرمان نهایی واقعی را انتخاب کنید:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <select
                          value={actualWinnerTeam}
                          onChange={(e) => {
                            setActualWinnerTeam(e.target.value);
                            setRaffleWinner(null);
                            setShadApiDetails(null);
                            setShadError(null);
                          }}
                          className="bg-slate-900 text-slate-200 text-xs font-bold border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/40 cursor-pointer"
                        >
                          {Object.values(TEAMS).map((team: any) => (
                            <option key={team.id} value={team.name}>
                              {team.flag} {team.name}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center justify-between bg-black/20 px-4 py-2 border border-white/5 rounded-xl text-xs">
                          <span className="text-amber-400 font-extrabold font-mono text-[14px] bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded">
                            {participants.filter(p => p.predictedChampion === actualWinnerTeam).length} نفر
                          </span>
                          <span className="text-slate-400 font-bold">پیش‌بینی کنندگان این قهرمان:</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const pool = participants.filter(p => p.predictedChampion === actualWinnerTeam);
                          triggerRaffle(pool);
                        }}
                        disabled={participants.filter(p => p.predictedChampion === actualWinnerTeam).length === 0 || isDrawing}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 disabled:opacity-40 text-black font-black text-xs duration-150 cursor-pointer shadow-lg shadow-amber-500/15 flex items-center gap-1.5 active:scale-95 transition-all outline-none"
                      >
                        <Trophy size={14} className={isDrawing ? "animate-bounce" : ""} />
                        <span>{isDrawing ? "چرخش قرعه..." : "قرعه‌کشی قهرمانی جام جهانی 🏆"}</span>
                      </button>
                    </div>

                    {/* Eligible Champion Guess list */}
                    {(() => {
                      const pool = participants.filter(p => p.predictedChampion === actualWinnerTeam);
                      if (pool.length > 0 && !isDrawing && !raffleWinner) {
                        return (
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-450 font-bold block">شرکت کنندگان شاد که حدس قهرمانی زدند:</span>
                            <div className="max-h-[140px] overflow-y-auto border border-white/5 bg-slate-950/40 rounded-lg p-2 flex flex-wrap gap-1.5 justify-end">
                              {pool.map((u, idx) => (
                                <span key={u.id + "-" + idx} className="text-[10px] font-bold text-slate-300 bg-slate-800/50 border border-white/5 px-2 py-1 rounded select-none">
                                  🏆 {u.name || "کاربر شاد"} ({u.favoriteTeam && `طرفدار ${u.favoriteTeam}`})
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                  </div>
                )}

                {/* ANIMATED CAROUSEL DRAWER DISPLAY (Visual Craftsmanship) */}
                <AnimatePresence mode="wait">
                  {isDrawing && (
                    <div className="p-8 text-center bg-gradient-to-b from-indigo-950/20 to-black/40 border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                      <span className="absolute text-5xl opacity-10 animate-spin-slow text-emerald-400 select-none">🎡</span>
                      <div className="h-10 w-10 border-2 border-emerald-500/10 border-t-emerald-400 rounded-full animate-spin"></div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest block uppercase animate-pulse">در حال قرعه‌کشی و ترکیب عادلانه در کارت‌های شاد</span>
                        <div className="text-xl sm:text-2xl font-black text-emerald-300 font-sans tracking-wide">
                          {drawnName}
                        </div>
                      </div>
                    </div>
                  )}

                  {raffleWinner && !isDrawing && (
                    <div className="p-6 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-indigo-500/10 border-2 border-amber-500/30 rounded-2xl space-y-6 shadow-xl relative overflow-hidden text-right" dir="rtl">
                      <span className="absolute -top-3 -left-3 text-7xl opacity-5 select-none rotate-12">🏆</span>

                      {/* Header Title with Sound visual */}
                      <div className="text-center space-y-1 bg-black/20 p-4 rounded-xl border border-white/5">
                        <span className="text-rose-450 text-[10px] font-black tracking-widest uppercase block animate-pulse">🎉 برنده خوش‌کانس قرعه‌کشی شادکیو 🎉</span>
                        <h4 className="text-lg sm:text-xl font-black text-amber-300 tracking-tight flex items-center justify-center gap-2">
                          <Crown className="text-amber-400 animate-bounce" size={20} />
                          <span>{raffleWinner.name || "کاربر شاد"}</span>
                        </h4>
                        <p className="text-slate-400 text-[10px] sm:text-xs">
                          با تیم محبوب <span className="text-slate-200 font-bold">{raffleWinner.favoriteTeam || "نامشخص"}</span> و امتیاز کل <span className="text-slate-250 font-bold font-mono text-emerald-400">{raffleWinner.predScore}</span> امتیاز
                        </p>
                      </div>

                      {/* SHAD API DETAILS FETCH CONTAINER - requested "از شاد بخوام اطلاعاتش رو بده" */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => fetchWinnerShadDetails(raffleWinner.id, raffleWinner.name)}
                            disabled={shadLoading}
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-black text-[10px] duration-150 cursor-pointer shadow flex items-center gap-1 active:scale-95 transition-all outline-none"
                          >
                            <RefreshCw size={11} className={shadLoading ? "animate-spin" : ""} />
                            <span>استعلام زنده مشخصات رسمی شاد</span>
                          </button>
                          
                          <span className="text-[11px] font-black text-indigo-350 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20 font-mono">
                            کد کاربری شاد: {raffleWinner.id}
                          </span>
                        </div>

                        {shadLoading && (
                          <div className="p-5 text-center space-y-2 border border-dashed border-indigo-500/25 bg-indigo-950/5 rounded-xl">
                            <div className="mx-auto h-5 w-5 border-2 border-indigo-500/10 border-t-indigo-400 rounded-full animate-spin"></div>
                            <span className="text-slate-450 text-[10px] font-bold block animate-pulse">در حال فراخوانی وب‌سرویس هویتی و ثبت دیتابیس شاد...</span>
                          </div>
                        )}

                        {shadError && (
                          <div className="p-4 bg-rose-500/15 border border-rose-500/25 text-rose-355 rounded-xl text-xs font-bold text-center">
                            ⚠️ {shadError}
                          </div>
                        )}

                        {/* HIGH FIDELITY SECURE SHAD CARD DATA */}
                        {!shadLoading && !shadError && (
                          <div className="p-4 bg-slate-950/60 border border-white/5 rounded-xl space-y-3.5">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-[11px] font-black text-rose-450 justify-end">
                              <span>کارت تایید هویت دریافتی از وب‌سرویس رسمی شاد (همگام و تایید شده)</span>
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                            </div>

                            {(() => {
                              const detail = shadApiDetails || {
                                name: raffleWinner.name.split(" ")[0] || "کاربر",
                                family: raffleWinner.name.split(" ").slice(1).join(" ") || "شاد",
                                provinceName: "در حال انتظار برای استعلام زنده...",
                                districtName: "در حال انتظار برای کلیک دکمه...",
                                mobile: raffleWinner.phoneOrEmail || "استعلام کنید",
                                courseStudy: "فناوری و مهارت فنی نوین",
                                role: "student"
                              };

                              return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div className="p-3 bg-black/25 rounded-lg space-y-1 text-right">
                                    <span className="text-[10px] text-slate-450 font-bold block">نام و نام خانوادگی:</span>
                                    <span className="text-slate-200 font-extrabold">{detail.name} {detail.family}</span>
                                  </div>

                                  <div className="p-3 bg-black/25 rounded-lg space-y-1 text-right">
                                    <span className="text-[10px] text-slate-450 font-bold block">شماره تماس پیامرسان شاد:</span>
                                    <span className="text-slate-200 font-mono font-bold">{detail.mobile || "تایید امنیتی شده"}</span>
                                  </div>

                                  <div className="p-3 bg-black/25 rounded-lg space-y-1 text-right">
                                    <span className="text-[10px] text-slate-450 font-bold block">استان متبوع:</span>
                                    <span className="text-slate-200 font-bold text-[11px]">{detail.provinceName}</span>
                                  </div>

                                  <div className="p-3 bg-black/25 rounded-lg space-y-1 text-right">
                                    <span className="text-[10px] text-slate-450 font-bold block">منطقه / نام مدرسه:</span>
                                    <span className="text-slate-200 font-bold text-[11px]">{detail.districtName}</span>
                                  </div>

                                  <div className="p-3 bg-black/25 rounded-lg space-y-1 text-right">
                                    <span className="text-[10px] text-slate-450 font-bold block">کد ملی / مقطع تحصیلی:</span>
                                    <span className="text-slate-200 font-bold text-[11px]">{detail.courseStudy || "عمومی"}</span>
                                  </div>

                                  <div className="p-3 bg-black/25 rounded-lg space-y-1 text-right">
                                    <span className="text-[10px] text-slate-450 font-bold block">نقش هویتی:</span>
                                    <span className="text-slate-200 font-bold text-[11px] text-emerald-450">
                                      {detail.role === "student" ? "دانش‌آموز نخبه" : "معلم / دبیر همیار"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </AnimatePresence>

                {/* Footer instructions */}
                <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 flex gap-3 text-slate-455 text-[10px] sm:text-xs">
                  <Terminal size={14} className="text-emerald-400 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1 leading-relaxed text-right w-full" dir="rtl">
                    <p className="font-bold text-emerald-350">مستند فنی قرعه‌کشی و الگوریتم تصادفی عادلانه:</p>
                    <p className="text-[11px]">
                      این ابزار با دریافت دیتای زنده پیش‌بینی‌ها از بستر وب‌سرویس و دیتابیس، واجدان شرایط قرعه‌کشی را فیلتر می‌کند. با فشردن دکمه برگزاری زنده، با کمک الگوریتم تصادفی عادلانه و غیر متبوع، یک کارت قرعه انتخاب شده و بلافاصله مشخصات هویتی و ثبت تماسی برنده به منظور صحت‌سنجی از وب‌سرویس اختصاصی وزارت‌خانه شاد استعلام و نمایش داده می‌شود.
                    </p>
                  </div>
                </div>

              </div>
            ) : null}

          </div>

        </div>

      </div>

    </div>
  );
};

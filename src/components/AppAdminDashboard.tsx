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
  Terminal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  const [adminSubTab, setAdminSubTab] = useState<"audit" | "actions" | "analytics">("analytics");

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
    } catch (err) {
      console.error("Error reading admin statistics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [isAuthorized]);

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
            </div>

            {adminSubTab === "analytics" ? (
              // Tab 1: COMPREHENSIVE ANALYTICS SUITE
              <div className="space-y-6">
                
                {/* Visual Intro statement */}
                <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-white/5 p-4 rounded-2xl">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 font-bold">
                    <Sparkles size={18} className="animate-spin-slow" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-100">تحلیل هوشمند رفتار و سلیقه کارشناسی پیش‌بینی‌گران</h4>
                    <p className="text-slate-400 text-[10px] sm:text-xs leading-relaxed">
                      این داشبورد داده‌های همزمان را پردازش کرده و تراکم نتایج، محبوبیت فلگ‌ها و سلیقه قهرمانی کاربران را مانیتور می‌کند.
                    </p>
                  </div>
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

                  <div>
                    <button
                      onClick={approveAllPending}
                      className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs duration-150 cursor-pointer shadow-lg shadow-pink-500/10 flex items-center gap-1"
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
            ) : (
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
                        
                        // Action styling helper
                        const getBadgeStyle = (txt: string) => {
                          if (txt.includes("پیش‌بینی") || txt.includes("حذفی")) {
                            return "text-amber-350 bg-amber-500/10 border-amber-500/20";
                          }
                          if (txt.includes("تیم محبوب") || txt.includes("نام کاربری")) {
                            return "text-sky-300 bg-sky-500/10 border-sky-500/20";
                          }
                          if (txt.includes("مشاهده بخش")) {
                            return "text-indigo-300 bg-indigo-500/10 border-indigo-500/20";
                          }
                          if (txt.includes("طبل") || txt.includes("شیپور")) {
                            return "text-green-300 bg-green-500/10 border-green-500/20";
                          }
                          return "text-slate-300 bg-slate-850 border-white/5";
                        };

                        return (
                          <div 
                            key={log.id}
                            className="p-3 rounded-2xl bg-slate-950/40 border border-white/5 hover:bg-slate-950/70 transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="text-base select-none mt-0.5" role="img">⚡</span>
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-black text-indigo-300 bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-500/10 shrink-0">
                                    {log.username || "مهمان بی‌نام"}
                                  </span>
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getBadgeStyle(log.action)}`}>
                                    {log.action}
                                  </span>
                                </div>
                                {log.details && (
                                  <div className="text-[10px] text-slate-450 font-mono bg-slate-950/80 px-2 py-1 rounded border border-white/5 break-all inline-block max-w-full">
                                    {typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details)}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-end shrink-0 justify-between sm:justify-center text-slate-500 text-[10px] font-bold">
                              <span className="text-indigo-400 font-mono" dir="ltr">{tStr}</span>
                              <span className="text-slate-450 font-sans mt-0.5">{relative}</span>
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
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

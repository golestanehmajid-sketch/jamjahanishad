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
  HelpCircle
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

export const AppAdminDashboard: React.FC = () => {
  // Global Admin Access state
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    return sessionStorage.getItem("admin_session_auth") === "true";
  });
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");

  // Data State
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSimulatingGroup, setIsSimulatingGroup] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Stats Counters
  const [quickStats, setQuickStats] = useState({
    total: 0,
    published: 0,
    pending: 0,
    avgScore: 0,
    activePredictors: 0
  });

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
    if (password === "admin" || password === "1234") {
      setIsAuthorized(true);
      sessionStorage.setItem("admin_session_auth", "true");
      setErrorText("");
    } else {
      setErrorText("گذرواژه وارد شده نامعتبر است. (پیش‌فرض: admin یا 1234)");
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
                  placeholder="رمز ورود (admin یا 1234)"
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
                onClick={() => {
                  fetchData();
                  alert("موجودی دیتابیس با موفقیت بازخوانی و همگام گردید.");
                }}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-slate-950 border border-white/5 text-slate-300 font-bold text-xs hover:bg-slate-900 duration-150 cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw size={13} />
                <span>بروزرسانی کش و همگام‌سازی لحظه‌ای</span>
              </button>
            </div>
          </div>

          {/* System status details */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-6 space-y-3.5 shadow-xl text-slate-400 text-xs">
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-3 mb-2">
              <FileCode size={15} className="text-amber-400" />
              <h4 className="text-sm font-black text-slate-100">پیکربندی بستر ارتباطی ابری</h4>
            </div>
            
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span>وضعیت اتصال به درگاه دیتابیس:</span>
              <span className="text-emerald-400 flex items-center gap-1">🟢 متصل زنده</span>
            </div>

            <div className="flex justify-between items-center text-[11px] font-bold">
              <span>زمان رسمی همگام‌ساز سرور:</span>
              <span className="text-indigo-400 font-mono">2026-06-07 UTC</span>
            </div>

            <div className="flex justify-between items-center text-[11px] font-bold">
              <span>آخرین پورت کانال شبکه:</span>
              <span className="text-slate-200 font-mono">PORT 3000</span>
            </div>
          </div>

        </div>

        {/* Right Side: Participant Approval Bench and Quick Publishing Control */}
        <div className="space-y-6 lg:col-span-2">
          
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-6 shadow-xl space-y-6">
            
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

        </div>

      </div>

    </div>
  );
};

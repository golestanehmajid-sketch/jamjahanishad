import React, { useState, useEffect, useMemo } from "react";
import { 
  ShieldAlert, 
  Key, 
  Trophy, 
  Check, 
  X, 
  Search, 
  Filter, 
  RefreshCw, 
  Zap, 
  Lock, 
  AlertTriangle, 
  Plus, 
  Minus,
  CheckCircle2,
  Tv,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  Award,
  Users,
  CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateGroupMatches, TEAMS, GROUPS, getMatchKickoffDate, getMatchDay } from "../data";
import { TeamFlag } from "./TeamFlag";
import { calculateMatchPoints } from "../utils/scoring";

interface ManualResult {
  matchId: string;
  scoreA: number;
  scoreB: number;
  isOfficial: boolean;
  isLive: boolean;
  minute: number;
  updatedAt?: string;
}

export const ResultsAdminDashboard: React.FC<{ setActiveTab?: (tab: any) => void }> = ({ setActiveTab }) => {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    return sessionStorage.getItem("results_admin_auth") === "true";
  });
  const [errorText, setErrorText] = useState("");
  
  const [filterIranOnly, setFilterIranOnly] = useState<boolean>(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  
  // Matches & Manual overrides state
  const [groupMatches, setGroupMatches] = useState<any[]>([]);
  const [manualOverrideMap, setManualOverrideMap] = useState<Record<string, ManualResult>>({});
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRound, setFilterRound] = useState<string>("all"); // "all", "1", "2", "3"
  const [filterGroup, setFilterGroup] = useState<string>("all"); // "all", "A", "B", etc.
  const [filterOverrideStatus, setFilterOverrideStatus] = useState<string>("all"); // "all", "manual", "not_entered"

  // Tabs & Predictions Stats state variables
  const [activeSubTab, setActiveSubTab] = useState<"results" | "predictions-stats">("results");
  const [statsSearchTerm, setStatsSearchTerm] = useState("");
  const [statsSortBy, setStatsSortBy] = useState<"points" | "exact" | "correct" | "predictions">("points");
  const [statsFavoriteTeam, setStatsFavoriteTeam] = useState("all");
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});

  // Quick results input states for each match (temporary state for form inputs)
  const [inputScores, setInputScores] = useState<Record<string, { scoreA: number; scoreB: number; isOfficial: boolean; isLive: boolean; minute: number }>>({});

  const ADMIN_PASSWORD_HASH = "natijeh1405";

  // Load all matches and manual results
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Generate local default list of matches from groups
      const allMatches = generateGroupMatches();
      setGroupMatches(allMatches);

      // Initialize inputs using matched defaults or current state
      const initialInputs: Record<string, any> = {};
      allMatches.forEach(m => {
        initialInputs[m.id] = {
          scoreA: 0,
          scoreB: 0,
          isOfficial: false,
          isLive: false,
          minute: 90
        };
      });

      // 2. Fetch manual overrides from server
      const res = await fetch("/api/manual-results");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.results) {
          const map: Record<string, ManualResult> = {};
          json.results.forEach((r: ManualResult) => {
            map[r.matchId] = r;
            // overlay on inputs if overridden
            initialInputs[r.matchId] = {
              scoreA: r.scoreA,
              scoreB: r.scoreB,
              isOfficial: r.isOfficial,
              isLive: r.isLive,
              minute: r.minute
            };
          });
          setManualOverrideMap(map);
        }
      }
      
      // 3. Fetch participants and predictions for raffle stats
      try {
        const pRes = await fetch("/api/participants");
        if (pRes.ok) {
          const pData = await pRes.json();
          setParticipants(pData);
        }
        const predRes = await fetch("/api/admin/predictions");
        if (predRes.ok) {
          const predData = await predRes.json();
          setPredictions(predData);
        }
      } catch (err) {
        console.warn("Unable to fetch participants/predictions for results dashboard raffle statistics:", err);
      }
      
      setInputScores(initialInputs);
    } catch (e) {
      console.error("Error loading matches & overrides:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadData();
    }
  }, [isAuthorized]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD_HASH) {
      setIsAuthorized(true);
      sessionStorage.setItem("results_admin_auth", "true");
      setErrorText("");
    } else {
      setErrorText("رمز عبور وارد شده نادرست است!");
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem("results_admin_auth");
    setPassword("");
  };

  // Score modification helpers for inputs
  const adjustScore = (matchId: string, team: "A" | "B", qty: number) => {
    setInputScores(prev => {
      const current = prev[matchId] || { scoreA: 0, scoreB: 0, isOfficial: false, isLive: false, minute: 90 };
      if (team === "A") {
        return {
          ...prev,
          [matchId]: { ...current, scoreA: Math.max(0, current.scoreA + qty) }
        };
      } else {
        return {
          ...prev,
          [matchId]: { ...current, scoreB: Math.max(0, current.scoreB + qty) }
        };
      }
    });
  };

  const adjustMinute = (matchId: string, qty: number) => {
    setInputScores(prev => {
      const current = prev[matchId] || { scoreA: 0, scoreB: 0, isOfficial: false, isLive: false, minute: 90 };
      return {
        ...prev,
        [matchId]: { ...current, minute: Math.max(1, Math.min(120, current.minute + qty)) }
      };
    });
  };

  const toggleToggleField = (matchId: string, field: "isOfficial" | "isLive") => {
    setInputScores(prev => {
      const current = prev[matchId] || { scoreA: 0, scoreB: 0, isOfficial: false, isLive: false, minute: 90 };
      const updated = { ...current };
      if (field === "isOfficial") {
        updated.isOfficial = !current.isOfficial;
        if (updated.isOfficial) updated.isLive = false; // complete match is never live
      } else {
        updated.isLive = !current.isLive;
        if (updated.isLive) updated.isOfficial = false; // live match is never final
      }
      return {
        ...prev,
        [matchId]: updated
      };
    });
  };

  // Submit manual result to backend
  const handleSaveResult = async (match: any) => {
    const input = inputScores[match.id];
    if (!input) return;

    setSubmittingId(match.id);
    try {
      const payload = {
        matchId: match.id,
        scoreA: input.scoreA,
        scoreB: input.scoreB,
        isOfficial: input.isOfficial,
        isLive: input.isLive,
        minute: input.minute,
        teamA: {
          id: match.teamA.id,
          name: match.teamA.name,
          flag: match.teamA.flag || ""
        },
        teamB: {
          id: match.teamB.id,
          name: match.teamB.name,
          flag: match.teamB.flag || ""
        }
      };

      const res = await fetch("/api/manual-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-results-password": ADMIN_PASSWORD_HASH
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.item) {
          setManualOverrideMap(prev => ({
            ...prev,
            [match.id]: json.item
          }));
          triggerStatusAlert("🟢 نتیجه بازی با موفقیت در بانک لایو سرور ثبت شد!");
        } else {
          triggerStatusAlert("❌ بروز خطا در ذخیره اطلاعات.");
        }
      } else {
        triggerStatusAlert("❌ رمز عبور یا شناسه اتصال به سرور نامعتبر است.");
      }
    } catch (e) {
      console.error(e);
      triggerStatusAlert("❌ عدم امکان اتصال به سرور مرکزی.");
    } finally {
      setSubmittingId(null);
    }
  };

  // Remove manual result override
  const handleRemoveOverride = async (matchId: string) => {
    if (!window.confirm("آیا مایلید تمام نتایج وارد شده دستی برای این مسابقه را حذف کنید تا مجدد از روی نتایج جهانی هماهنگ شود؟")) {
      return;
    }

    setSubmittingId(matchId);
    try {
      const res = await fetch(`/api/manual-results/${matchId}`, {
        method: "DELETE",
        headers: {
          "x-results-password": ADMIN_PASSWORD_HASH
        }
      });

      if (res.ok) {
        setManualOverrideMap(prev => {
          const updated = { ...prev };
          delete updated[matchId];
          return updated;
        });

        // Reset inputs to 0
        setInputScores(prev => ({
          ...prev,
          [matchId]: { scoreA: 0, scoreB: 0, isOfficial: false, isLive: false, minute: 90 }
        }));

        triggerStatusAlert("🧹 نتیجه دستی با موفقیت غیرفعال شد.");
      } else {
        triggerStatusAlert("❌ خطا در لغو نتیجه دستی.");
      }
    } catch (e) {
      console.error(e);
      triggerStatusAlert("❌ خطا در اجرای دستور پاکسازی.");
    } finally {
      setSubmittingId(null);
    }
  };

  const triggerStatusAlert = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(curr => curr === msg ? null : curr);
    }, 4000);
  };

  // Convert numbers to Persian representation
  const toPersianDigits = (num: number | string) => {
    const id = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/[0-9]/g, (w) => id[+w]);
  };

  // Round classifier based on dates (Round 1: 13-18, Round 2: 18-24, Round 3: 24-28 June)
  const getRoundNumber = (matchId: string): string => {
    const kickoff = getMatchKickoffDate(matchId);
    const day = kickoff.getDate(); // UTC or Tehran date (June 2026)
    if (day <= 18) return "1";
    if (day <= 24) return "2";
    return "3";
  };

  // Filtered Matches
  const filteredMatches = useMemo(() => {
    return groupMatches.filter(m => {
      // 1. Search term match
      const searchable = `${m.teamA.name} ${m.teamB.name} ${m.group}`.toLowerCase();
      if (searchTerm && !searchable.includes(searchTerm.toLowerCase())) {
        return false;
      }

      // 2. Round filter
      const round = getRoundNumber(m.id);
      if (filterRound !== "all" && round !== filterRound) {
        return false;
      }

      // 3. Group filter
      if (filterGroup !== "all" && m.group !== filterGroup) {
        return false;
      }

      // 4. Override status filter
      const hasOverride = !!manualOverrideMap[m.id];
      if (filterOverrideStatus === "manual" && !hasOverride) return false;
      if (filterOverrideStatus === "not_entered" && hasOverride) return false;

      // 5. Special Iran National Team filter
      if (filterIranOnly) {
        const isIranGame = m.teamA.name === "ایران" || m.teamB.name === "ایران" || m.teamA.id === "iran" || m.teamB.id === "iran";
        if (!isIranGame) return false;
      }

      return true;
    }).sort((a, b) => getMatchKickoffDate(a.id).getTime() - getMatchKickoffDate(b.id).getTime());
  }, [groupMatches, manualOverrideMap, searchTerm, filterRound, filterGroup, filterOverrideStatus, filterIranOnly]);

  // Compute detailed statistics per user
  const userStatsList = useMemo(() => {
    return participants.map(user => {
      const userPreds = predictions.filter(p => p.participantId === user.id);
      
      let exactCount = 0;
      let outcomeCount = 0;
      let totalPointsComputed = 0;
      
      userPreds.forEach(pred => {
        const actual = manualOverrideMap[pred.matchId];
        if (actual && actual.isOfficial) {
          const score = calculateMatchPoints(
            { scoreA: Number(pred.scoreA), scoreB: Number(pred.scoreB) },
            { scoreA: Number(actual.scoreA), scoreB: Number(actual.scoreB) },
            !pred.matchId.startsWith("G-")
          );
          
          if (score > 0) {
            const isKnockout = !pred.matchId.startsWith("G-");
            const exactScoreVal = isKnockout ? 7 : 5;
            if (score === exactScoreVal) {
              exactCount++;
            } else {
              outcomeCount++;
            }
            totalPointsComputed += score;
          }
        }
      });

      const totalCorrect = exactCount + outcomeCount;
      const accuracy = userPreds.length > 0 ? Math.round((totalCorrect / userPreds.length) * 100) : 0;

      return {
        ...user,
        exactCount,
        outcomeCount,
        totalCorrect,
        accuracy,
        totalPointsComputed,
        predictions: userPreds
      };
    });
  }, [participants, predictions, manualOverrideMap]);

  // Filter and sort stats based on selection
  const filteredAndSortedStats = useMemo(() => {
    return userStatsList.filter(user => {
      const text = `${user.name} ${user.phoneOrEmail || ""} ${user.favoriteTeam || ""}`.toLowerCase();
      if (statsSearchTerm && !text.includes(statsSearchTerm.toLowerCase())) {
        return false;
      }
      if (statsFavoriteTeam !== "all" && user.favoriteTeam !== statsFavoriteTeam) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (statsSortBy === "points") {
        return b.predScore - a.predScore;
      }
      if (statsSortBy === "exact") {
        return b.exactCount - a.exactCount;
      }
      if (statsSortBy === "correct") {
        return b.totalCorrect - a.totalCorrect;
      }
      if (statsSortBy === "predictions") {
        return (b.predictionsCount || 0) - (a.predictionsCount || 0);
      }
      return 0;
    });
  }, [userStatsList, statsSearchTerm, statsFavoriteTeam, statsSortBy]);

  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 py-12" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900/90 border border-purple-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
        >
          {/* Top glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600/25 to-pink-600/25 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg mb-2">
              <ShieldAlert size={32} />
            </div>
            
            <h1 className="text-xl font-black text-slate-100 Persian-font">ورود به پنل ناظر مسابقات (ادمین دوم)</h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs uppercase Persian-font mb-4">
              ثبت دستی و زنده نتایج بازی‌های جام جهانی ۲۰۲۶ به همراه کنترل کامل لحظه‌ای (مخصوص ثبت نتایج فیفا به وقت ایران)
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block pr-1 Persian-font">رمز عبور اختصاصی پنل نتایج:</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••"
                  className="w-full h-12 rounded-xl bg-slate-950 border border-white/10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 text-center font-mono placeholder:text-slate-700 outline-none transition-all pr-10 text-white"
                />
                <Key className="absolute right-3.5 top-3.5 text-slate-600" size={16} />
              </div>
            </div>

            {errorText && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-950/30 border border-red-500/20 text-red-400 text-xs rounded-xl font-bold flex items-center gap-2 Persian-font"
              >
                <AlertTriangle size={14} className="shrink-0" />
                <span>{errorText}</span>
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 active:scale-[0.98] text-white font-black text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30"
            >
              <Tv size={16} />
              <span>تایید هویت و ورود به سیستم</span>
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-right p-4 sm:p-6 pb-24" dir="rtl">
      {/* Dynamic status float notification */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-4 right-4 max-w-md mx-auto z-50 p-4 bg-slate-900 border border-purple-500 text-purple-300 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl font-bold Persian-font"
          >
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm">{statusMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Area */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 select-none relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-4 text-right">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Tv size={26} />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-100 Persian-font">مدیریت لایو و ثبت دستی نتایج (ادمین دوم)</h1>
              <p className="text-xs text-slate-400 mt-1 Persian-font">
                با درج دستی نتایج، پیش‌بینی‌ها به‌صورت اتوماتیک برای کاربرانی که بازی مربوطه شروع شده قفل شده و امتیازات همزمان آپدیت می‌شود.
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={loadData}
              disabled={loading}
              className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 active:scale-95 duration-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer Persian-font"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>بروزرسانی مسابقات</span>
            </button>
            <button
              onClick={handleLogout}
              className="h-10 px-4 rounded-xl bg-red-950/20 border border-red-500/20 hover:bg-red-950/40 text-red-400 active:scale-95 duration-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer Persian-font"
            >
              <X size={14} />
              <span>خروج از پنل</span>
            </button>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex border-b border-white/10 gap-2 select-none Persian-font">
          <button
            onClick={() => setActiveSubTab("results")}
            className={`pb-3 px-4 text-xs sm:text-sm font-black transition-all ${
              activeSubTab === "results"
                ? "border-b-2 border-purple-500 text-purple-400 font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📋 ثبت و ویرایش نتایج زنده/نهایی
          </button>
          <button
            onClick={() => setActiveSubTab("predictions-stats")}
            className={`pb-3 px-4 text-xs sm:text-sm font-black transition-all relative ${
              activeSubTab === "predictions-stats"
                ? "border-b-2 border-purple-500 text-purple-400 font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📊 آمار دقیق پیش‌بینی‌های کاربران
            <span className="absolute -top-1 -left-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
          </button>
        </div>

        {activeSubTab === "results" ? (
          <>
            {/* Dynamic Analytics Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl select-none">
            <div className="text-[11px] font-bold text-slate-500 Persian-font">کل مسابقات گروهی</div>
            <div className="text-2xl font-black text-slate-100 mt-1.5 font-mono">{toPersianDigits(72)}</div>
          </div>
          <div className="bg-slate-900 border border-purple-500/10 p-4 rounded-2xl select-none">
            <div className="text-[11px] font-bold text-purple-400 Persian-font">بازی‌های دارای ثبت دستی</div>
            <div className="text-2xl font-black text-purple-300 mt-1.5 font-mono">
              {toPersianDigits(Object.keys(manualOverrideMap).length)}
            </div>
          </div>
          <div className="bg-slate-900 border border-emerald-500/10 p-4 rounded-2xl select-none">
            <div className="text-[11px] font-bold text-emerald-400 Persian-font">بازی‌های به اتمام رسیده (رسمی)</div>
            <div className="text-2xl font-black text-emerald-300 mt-1.5 font-mono">
              {toPersianDigits(Object.values(manualOverrideMap).filter((x: ManualResult) => x.isOfficial).length)}
            </div>
          </div>
          <div className="bg-slate-900 border border-red-500/10 p-4 rounded-2xl select-none">
            <div className="text-[11px] font-bold text-red-400 Persian-font">بازی‌های زنده ثبت شده (Live)</div>
            <div className="text-2xl font-black text-red-300 mt-1.5 font-mono">
              {toPersianDigits(Object.values(manualOverrideMap).filter((x: ManualResult) => x.isLive).length)}
            </div>
          </div>
        </div>

        {/* Search & Filters Controls Box */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-4">
          
          {/* Smart Iran Team Filter Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-emerald-500/10">
            <div className="flex flex-col text-right w-full sm:w-auto">
              <span className="text-xs font-black text-emerald-400 Persian-font">فیلتر هوشمند شادکیو 🇮🇷</span>
              <span className="text-[10px] text-slate-400 mt-0.5 leading-relaxed Persian-font">مشاهدۀ اختصاصی بازی‌های ایران، تعداد پیش‌بینی‌های صحیح و انتقال مستقیم به قرعه‌کشی شاد</span>
            </div>
            
            <button
              type="button"
              onClick={() => setFilterIranOnly(prev => !prev)}
              className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border outline-none flex items-center justify-center gap-2 ${
                filterIranOnly
                  ? "bg-emerald-500/20 border-emerald-500/55 text-emerald-350 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/20 animate-pulse"
                  : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <span className="text-[14px]">🇮🇷</span>
              <span className="Persian-font">نمایش فقط بازی‌های تیم ملی ایران ({groupMatches.filter(m => m.teamA.name === "ایران" || m.teamB.name === "ایران").length} بازی)</span>
              {filterIranOnly && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجوی مسابقه با نام تیم (مثال: ایران، سوئیس...) یا گروه..."
                className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl pr-10 pl-4 text-xs font-bold text-slate-200 outline-none focus:border-purple-500 transition-all text-right Persian-font"
              />
              <Search className="absolute right-3.5 top-3.5 text-slate-500" size={15} />
            </div>

            {/* Quick Actions / Reset search helper */}
            {(searchTerm || filterRound !== "all" || filterGroup !== "all" || filterOverrideStatus !== "all" || filterIranOnly) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterRound("all");
                  setFilterGroup("all");
                  setFilterOverrideStatus("all");
                  setFilterIranOnly(false);
                }}
                className="h-11 px-4 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-white/5 hover:bg-slate-700 transition-colors cursor-pointer Persian-font"
              >
                اصلاح و حذف فیلترها
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-white/5">
            {/* Round filter */}
            <div className="space-y-1.5 text-right">
              <label className="text-[10px] text-slate-500 font-bold block Persian-font">مرحله مسابقات دور مقدماتی:</label>
              <select
                value={filterRound}
                onChange={(e) => setFilterRound(e.target.value)}
                className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs font-bold text-slate-300 outline-none Persian-font"
              >
                <option value="all">فارغ از دور بازی (کل ۷۲ مسابقه)</option>
                <option value="1">دور اول (روزهای ۱ تا ۴)</option>
                <option value="2">دور دوم (روزهای ۵ تا ۸)</option>
                <option value="3">دور سوم (روزهای ۹ تا ۱۲)</option>
              </select>
            </div>

            {/* Group Filter */}
            <div className="space-y-1.5 text-right">
              <label className="text-[10px] text-slate-500 font-bold block Persian-font">فیلتر گروه اختصاصی:</label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs font-bold text-slate-300 outline-none Persian-font"
              >
                <option value="all">تمامی گروه‌ها (A تا L)</option>
                {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].map(g => (
                  <option key={g} value={g}>گروه {g}</option>
                ))}
              </select>
            </div>

            {/* Override status */}
            <div className="space-y-1.5 text-right">
              <label className="text-[10px] text-slate-500 font-bold block Persian-font">وضعیت ثبت دستی نتایج:</label>
              <select
                value={filterOverrideStatus}
                onChange={(e) => setFilterOverrideStatus(e.target.value)}
                className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs font-bold text-slate-300 outline-none Persian-font"
              >
                <option value="all">کل مسابقات</option>
                <option value="manual">فقط درایورهای دستی ثبت شده</option>
                <option value="not_entered">فقط بازی‌های بدون ثبت دستی</option>
              </select>
            </div>
          </div>
        </div>

        {/* Matches lists count information */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-500 Persian-font">
            نمایش {toPersianDigits(filteredMatches.length)} بازی از کل مسابقات مقدماتی گروهی
          </span>
        </div>

        {/* MAIN LIST OF CARDS */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="animate-spin text-purple-400" size={32} />
            <p className="text-sm font-bold text-slate-400 Persian-font">در حال دریافت لیست بازی‌ها و وضعیت پنل...</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-12 text-center text-slate-500 select-none">
            <Trophy className="mx-auto text-slate-700 mb-3" size={40} />
            <p className="text-sm font-bold Persian-font">هیچ مسابقه‌ای طبق فیلترهای بالا یافت نشد!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map(m => {
              const input = inputScores[m.id] || { scoreA: 0, scoreB: 0, isOfficial: false, isLive: false, minute: 90 };
              const override = manualOverrideMap[m.id];
              const isSubmitting = submittingId === m.id;
              
              const kickoff = getMatchKickoffDate(m.id);
              // Format Kickoff cleanly
              const kickoffStr = (() => {
                try {
                  const datePart = kickoff.toLocaleDateString("fa-IR", { month: "long", day: "numeric" });
                  const timePart = kickoff.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
                  return `${datePart} - ساعت ${timePart}`;
                } catch (err) {
                  return "";
                }
              })();

              const isStarted = new Date() >= kickoff;

              return (
                <div 
                  key={m.id}
                  className={`border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 relative transition-all duration-300 ${
                    override 
                      ? override.isOfficial 
                        ? "border-emerald-500/30 bg-gradient-to-br from-slate-900 via-emerald-950/10 to-slate-900"
                        : "border-red-500/30 bg-gradient-to-br from-slate-900 via-red-950/5 to-slate-900"
                      : "border-white/10 bg-slate-900/40"
                  }`}
                >
                  {/* Top Header Row within Card */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-slate-950/50 border border-white/5 px-2 py-0.5 rounded-full text-slate-400">
                        {m.id}
                      </span>
                      <span className="text-[10.5px] font-bold text-purple-400 bg-purple-500/5 px-2.5 py-0.5 rounded-full border border-purple-500/10 block font-sans">
                        گروه {m.group}
                      </span>
                      {kickoffStr && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-950/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock size={10} />
                          {kickoffStr}
                        </span>
                      )}
                    </div>

                    <div>
                      {override ? (
                        override.isOfficial ? (
                          <span className="text-[9.5px] font-black font-sans text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                            ✓ ثبت نهایی رسمی
                          </span>
                        ) : override.isLive ? (
                          <span className="text-[9.5px] font-black font-sans text-red-400 bg-red-500/15 border border-red-500/20 px-2.5 py-0.5 rounded-full animate-pulse">
                            ● ثبت شده زنده (دقیقه {override.minute}')
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                            ثبت دستی برنامه
                          </span>
                        )
                      ) : (
                        <span className="text-[9.5px] font-bold text-slate-500 bg-slate-950/40 px-2 py-0.5 rounded-full">
                          {isStarted ? "🔒 مسابقه آغاز شده" : "⏳ در انتظار مسابقه"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Core Match Interactive Scoreboard Row */}
                  <div className="flex items-center justify-between gap-1 py-1 selection:hidden select-none">
                    
                    {/* Team A Details column */}
                    <div className="flex items-center gap-2.5 w-5/12 justify-start">
                      <TeamFlag 
                        team={m.teamA} 
                        className="w-8 h-5.5 rounded border border-white/10 object-cover shrink-0" 
                      />
                      <span className="text-xs sm:text-sm font-extrabold text-slate-200 truncate">{m.teamA.name}</span>
                    </div>

                    {/* Score inputs panel with +/- buttons */}
                    <div className="flex items-center gap-1.5 justify-center w-2/12 shrink-0">
                      
                      {/* Score A input group */}
                      <div className="flex flex-col items-center gap-1">
                        <button 
                          type="button"
                          onClick={() => adjustScore(m.id, "A", 1)}
                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center active:scale-90"
                        >
                          <Plus size={12} />
                        </button>
                        <span className="text-lg font-black font-mono text-cyan-400 w-6 text-center">
                          {input.scoreA}
                        </span>
                        <button 
                          type="button"
                          onClick={() => adjustScore(m.id, "A", -1)}
                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center active:scale-90"
                        >
                          <Minus size={12} />
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-600 font-bold px-1 font-mono">Vs</span>

                      {/* Score B input group */}
                      <div className="flex flex-col items-center gap-1">
                        <button 
                          type="button"
                          onClick={() => adjustScore(m.id, "B", 1)}
                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center active:scale-90"
                        >
                          <Plus size={12} />
                        </button>
                        <span className="text-lg font-black font-mono text-cyan-400 w-6 text-center">
                          {input.scoreB}
                        </span>
                        <button 
                          type="button"
                          onClick={() => adjustScore(m.id, "B", -1)}
                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center active:scale-90"
                        >
                          <Minus size={12} />
                        </button>
                      </div>

                    </div>

                    {/* Team B Details column */}
                    <div className="flex items-center gap-2.5 w-5/12 justify-end text-left flex-row-reverse sm:flex-row">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-200 truncate text-left sm:text-right">{m.teamB.name}</span>
                      <TeamFlag 
                        team={m.teamB} 
                        className="w-8 h-5.5 rounded border border-white/10 object-cover shrink-0" 
                      />
                    </div>

                  </div>

                  {/* Settings toggles for live actions */}
                  <div className="bg-slate-950/30 border border-white/5 p-3 rounded-xl flex flex-col gap-2.5">
                    
                    {/* Switch toggles row */}
                    <div className="flex items-center justify-between gap-4 text-xs select-none">
                      
                      {/* Official Finish Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleToggleField(m.id, "isOfficial")}
                        className={`flexItemsCenter gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all text-[11px] flex items-center ${
                          input.isOfficial
                            ? "bg-emerald-600/15 border-emerald-500/45 text-emerald-400 font-black shadow-sm"
                            : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                        }`}
                      >
                        <CheckCircle2 size={12} />
                        <span>بازی پایان یافته (رسمی)</span>
                      </button>

                      {/* Live Match Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleToggleField(m.id, "isLive")}
                        className={`flexItemsCenter gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all text-[11px] flex items-center ${
                          input.isLive
                            ? "bg-red-600/15 border-red-500/40 text-red-400 font-black shadow-sm animate-pulse"
                            : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${input.isLive ? "bg-red-500" : "bg-slate-500"}`} />
                        <span>بازی در حال برگزاری (زنده)</span>
                      </button>

                    </div>

                    {/* Minute adjuster - only shown if isLive is checked */}
                    {input.isLive && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="border-t border-white/5 pt-2 mt-1 flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-400 font-bold Persian-font">تنظیم دقیقه بازی:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => adjustMinute(m.id, -1)}
                            className="w-7 h-7 bg-slate-900 border border-white/5 rounded flex items-center justify-center text-slate-400 hover:text-white"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="font-mono text-cyan-400 px-1 font-bold">دقیقه {toPersianDigits(input.minute)}</span>
                          <button
                            type="button"
                            onClick={() => adjustMinute(m.id, 1)}
                            className="w-7 h-7 bg-slate-900 border border-white/5 rounded flex items-center justify-center text-slate-400 hover:text-white"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </motion.div>
                    )}

                  </div>

                  {/* Participant Prediction Stats and Direct Raffle Switch button */}
                  {(() => {
                    // Calculate statistics for this match
                    const matchPredictions = predictions.filter((p: any) => p.matchId === m.id);
                    const totalPredictionsCount = matchPredictions.length;

                    // Extract actual score
                    const actScoreA = override ? override.scoreA : (m.isOfficial ? m.scoreA : null);
                    const actScoreB = override ? override.scoreB : (m.isOfficial ? m.scoreB : null);

                    let exactMatchWinners = 0;
                    let outcomeMatchWinners = 0;

                    if (actScoreA !== null && actScoreB !== null) {
                      const actualDiff = actScoreA - actScoreB;
                      matchPredictions.forEach((p: any) => {
                        const pScoreA = p.scoreA;
                        const pScoreB = p.scoreB;
                        if (typeof pScoreA === "number" && typeof pScoreB === "number") {
                          const predDiff = pScoreA - pScoreB;
                          const isExactVal = pScoreA === actScoreA && pScoreB === actScoreB;
                          const isOutcomeVal = (actualDiff > 0 && predDiff > 0) || (actualDiff < 0 && predDiff < 0) || (actualDiff === 0 && predDiff === 0);

                          if (isExactVal) exactMatchWinners++;
                          if (isOutcomeVal) outcomeMatchWinners++;
                        }
                      });
                    }

                    return (
                      <div className="bg-slate-950/45 p-3 rounded-xl border border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-bold Persian-font">پیش‌بینی‌های ثبت شده کاربران:</span>
                          <span className="font-mono text-cyan-400 font-black">{toPersianDigits(totalPredictionsCount)} پیش‌بینی</span>
                        </div>

                        {actScoreA !== null && actScoreB !== null && (
                          <div className="space-y-1 pt-1.5 border-t border-white/5 text-[11px]">
                            <div className="flex items-center justify-between text-emerald-400 font-bold">
                              <span className="Persian-font">برندگان حدس دقیق نتیجه ({toPersianDigits(actScoreA)}-{toPersianDigits(actScoreB)}):</span>
                              <span className="font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{toPersianDigits(exactMatchWinners)} نفر</span>
                            </div>
                            <div className="flex items-center justify-between text-indigo-400 font-bold">
                              <span className="Persian-font">برندگان حدس جهت بازی (برد/مساوی):</span>
                              <span className="font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{toPersianDigits(outcomeMatchWinners)} نفر</span>
                            </div>
                          </div>
                        )}

                        {setActiveTab && (
                          <button
                            type="button"
                            onClick={() => {
                              sessionStorage.setItem("raffle_preselected_match_id", m.id);
                              sessionStorage.setItem("admin_dashboard_subtab", "raffle");
                              setActiveTab("adminDashboard");
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="w-full h-8 mt-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-350 border border-emerald-500/25 active:scale-95 duration-100 rounded-lg text-[10.5px] font-black cursor-pointer flex items-center justify-center gap-1.5 transition-all outline-none Persian-font"
                          >
                            <span>ورود مستقیم به قرعه‌کشی این مسابقه 🎁🎡</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* Actions Bar Footer on Card */}
                  <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-xs">
                    
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSaveResult(m)}
                      className="flex-1 h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 disabled:opacity-50 text-white font-black rounded-xl cursor-pointer active:scale-95 duration-100 flex items-center justify-center gap-1.5 transition-all text-[11.5px] Persian-font"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="animate-spin" size={12} />
                      ) : (
                        <Check size={13} />
                      )}
                      <span>ذخیره دستی و لایو</span>
                    </button>

                    {override && (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleRemoveOverride(m.id)}
                        className="w-10 h-10 bg-slate-950 border border-red-500/20 hover:bg-neutral-950 hover:border-red-500/30 text-rose-400 flex items-center justify-center rounded-xl cursor-pointer active:scale-95"
                        title="حذف و بازگشت به نتایج رسمی جهانی"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}
          </>
        ) : (
          /* predictions-stats rendering */
          <div className="space-y-6">
            {/* Stats Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl select-none">
                <div className="text-[11px] font-bold text-slate-500 Persian-font">تعداد شرکت‌کنندگان</div>
                <div className="text-2xl font-black text-slate-100 mt-1.5 font-mono">{toPersianDigits(participants.length)} نفر</div>
              </div>
              <div className="bg-slate-900 border border-purple-500/10 p-4 rounded-2xl select-none">
                <div className="text-[11px] font-bold text-purple-400 Persian-font">کل پیش‌بینی‌های ثبت‌شده</div>
                <div className="text-2xl font-black text-purple-300 mt-1.5 font-mono">
                  {toPersianDigits(predictions.length)} پیش‌بینی
                </div>
              </div>
              <div className="bg-slate-900 border border-emerald-500/10 p-4 rounded-2xl select-none">
                <div className="text-[11px] font-bold text-emerald-400 Persian-font">بازی‌های خاتمه یافته رسمی</div>
                <div className="text-2xl font-black text-emerald-300 mt-1.5 font-mono">
                  {toPersianDigits(Object.values(manualOverrideMap).filter((x: any) => x.isOfficial).length)} مسابقه
                </div>
              </div>
              <div className="bg-slate-900 border border-amber-500/10 p-4 rounded-2xl select-none">
                <div className="text-[11px] font-bold text-amber-400 Persian-font">میانگین امتیاز کل</div>
                <div className="text-2xl font-black text-amber-300 mt-1.5 font-mono">
                  {toPersianDigits(participants.length > 0 ? Math.round(participants.reduce((acc, curr) => acc + (curr.predScore || 0), 0) / participants.length) : 0)} امتیاز
                </div>
              </div>
            </div>

            {/* Smart search & sorting controls */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search Term */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={statsSearchTerm}
                    onChange={(e) => setStatsSearchTerm(e.target.value)}
                    placeholder="جستجوی نام کاربر، ایمیل/موبایل یا تیم محبوب..."
                    className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl pr-10 pl-4 text-xs font-bold text-slate-200 outline-none focus:border-purple-500 transition-all text-right Persian-font"
                  />
                  <Search className="absolute right-3.5 top-3.5 text-slate-500" size={15} />
                </div>

                {/* Favorite Team Filter */}
                <div className="space-y-1.5 text-right w-full md:w-56">
                  <select
                    value={statsFavoriteTeam}
                    onChange={(e) => setStatsFavoriteTeam(e.target.value)}
                    className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs font-bold text-slate-300 outline-none Persian-font border-r-8 border-transparent"
                  >
                    <option value="all">فیلتر بر اساس تیم محبوب (همه)</option>
                    {Array.from(new Set(participants.map(p => p.favoriteTeam).filter(Boolean))).map((t: any) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Preference Selector */}
                <div className="space-y-1.5 text-right w-full md:w-56">
                  <select
                    value={statsSortBy}
                    onChange={(e) => setStatsSortBy(e.target.value as any)}
                    className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs font-bold text-slate-300 outline-none Persian-font border-r-8 border-transparent"
                  >
                    <option value="points">مرتب‌سازی: امتیاز کل (پیش‌فرض)</option>
                    <option value="correct">مرتب‌سازی: مجموع پیش‌بینی‌های درست</option>
                    <option value="exact">مرتب‌سازی: تعداد حدس تفاضل/نتیجه دقیق</option>
                    <option value="predictions">مرتب‌سازی: بیشترین پیش‌بینی ارسالی</option>
                  </select>
                </div>
              </div>
            </div>

            {/* User leaderboard stats listing */}
            <div className="space-y-3">
              {filteredAndSortedStats.length === 0 ? (
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-12 text-center text-slate-500">
                  <Users className="mx-auto text-slate-700 mb-3" size={40} />
                  <p className="text-sm font-bold Persian-font">هیچ کاربری با مشخصات وارد شده یافت نشد!</p>
                </div>
              ) : (
                filteredAndSortedStats.map((u, index) => {
                  const isExpanded = !!expandedUsers[u.id];
                  const settledMatchesCount = Object.values(manualOverrideMap).filter((x: any) => x.isOfficial).length;

                  return (
                    <div 
                      key={u.id}
                      className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300"
                    >
                      {/* Main user summary row */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-right w-full sm:w-auto">
                          {/* Rank number badge */}
                          <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center font-mono text-xs font-bold text-slate-400 shrink-0 border border-white/5">
                            {toPersianDigits(index + 1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-100 text-sm Persian-font">{u.name}</span>
                              {u.favoriteTeam && (
                                <span className="bg-slate-950/80 px-2 py-0.5 rounded-full text-[10px] text-slate-400 font-bold border border-white/5 Persian-font">
                                  تیم محبوب: {u.favoriteTeam}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 font-mono block mt-0.5">{u.phoneOrEmail || "بدون مشخصه تماس"}</span>
                          </div>
                        </div>

                        {/* Mid statistics counters */}
                        <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full sm:w-auto text-center">
                          <div className="bg-slate-950/40 p-2 rounded-xl border border-white/5 min-w-[70px]">
                            <span className="block text-[9px] text-slate-500 font-bold Persian-font">پیش‌بینی ثبت‌شده</span>
                            <span className="text-xs font-black font-mono text-cyan-400 mt-0.5 block">
                              {toPersianDigits(u.predictionsCount || u.predictions.length)} / {toPersianDigits(48)}
                            </span>
                          </div>
                          <div className="bg-slate-950/40 p-2 rounded-xl border border-white/5 min-w-[70px]">
                            <span className="block text-[9px] text-slate-500 font-bold Persian-font">حدس دقیق</span>
                            <span className="text-xs font-black font-mono text-emerald-400 mt-0.5 block">
                              {toPersianDigits(u.exactCount)}
                            </span>
                          </div>
                          <div className="bg-slate-950/40 p-2 rounded-xl border border-white/5 min-w-[70px]">
                            <span className="block text-[9px] text-slate-500 font-bold Persian-font">حدس جهت درست</span>
                            <span className="text-xs font-black font-mono text-indigo-400 mt-0.5 block">
                              {toPersianDigits(u.outcomeCount)}
                            </span>
                          </div>
                          <div className="bg-slate-950/40 p-2 rounded-xl border border-white/5 min-w-[70px]">
                            <span className="block text-[9px] text-slate-500 font-bold Persian-font">امتیاز جدول</span>
                            <span className="text-xs font-black font-mono text-amber-400 mt-0.5 block">
                              {toPersianDigits(u.predScore)} pt
                            </span>
                          </div>
                        </div>

                        {/* Expand actions */}
                        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                          <button
                            type="button"
                            onClick={() => setExpandedUsers(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                            className={`flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                              isExpanded 
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5"
                            }`}
                          >
                            <span>{isExpanded ? "بستن ریز پیش‌بینی‌ها" : "عملکرد و برگه پیش‌بینی"}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Collapsible Expanded predictions breakdown */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-slate-950/50 border-t border-white/10 p-4 sm:p-5 space-y-3 font-sans"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                              <h4 className="text-xs font-black text-slate-300 Persian-font flex items-center gap-1.5">
                                <Award size={14} className="text-purple-400" />
                                <span>برگه پیش‌بینی کارشناسی شده {u.name} (بر اساس بازی‌هایی پایان‌یافته):</span>
                              </h4>
                              <span className="text-[10px] text-slate-500 Persian-font">
                                عملکرد روی {toPersianDigits(settledMatchesCount)} بازی پایان یافته
                              </span>
                            </div>

                            {settledMatchesCount === 0 ? (
                              <p className="text-xs text-slate-500 text-center py-4 Persian-font">
                                هنوز هیچ بازی در بخش ادمین به اتمام نرسیده است. پس از ثبت دستی نتایج، جزئیات پیش‌بینی در اینجا قرار می‌گیرد.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                                {Object.values(manualOverrideMap)
                                  .filter((m: any) => m.isOfficial)
                                  .map((officialMatch: any) => {
                                    const pred = u.predictions.find((p: any) => p.matchId === officialMatch.matchId);
                                    
                                    let pointsAwarded = 0;
                                    let statusType: "exact" | "outcome" | "wrong" = "wrong";

                                    if (pred) {
                                      pointsAwarded = calculateMatchPoints(
                                        { scoreA: Number(pred.scoreA), scoreB: Number(pred.scoreB) },
                                        { scoreA: Number(officialMatch.scoreA), scoreB: Number(officialMatch.scoreB) },
                                        !officialMatch.matchId.startsWith("G-")
                                      );

                                      if (pointsAwarded > 0) {
                                        const isKnockout = !officialMatch.matchId.startsWith("G-");
                                        const exactScoreVal = isKnockout ? 7 : 5;
                                        statusType = pointsAwarded === exactScoreVal ? "exact" : "outcome";
                                      }
                                    }

                                    return (
                                      <div 
                                        key={officialMatch.matchId}
                                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                                          statusType === "exact"
                                            ? "bg-emerald-950/15 border-emerald-500/20"
                                            : statusType === "outcome"
                                              ? "bg-indigo-950/15 border-indigo-500/20"
                                              : "bg-slate-900 border-white/5"
                                        }`}
                                      >
                                        <div className="text-right space-y-1">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] bg-slate-900 border border-white/5 px-1.5 py-0.5 rounded text-slate-400 font-mono">{officialMatch.matchId}</span>
                                            <span className="font-bold text-slate-200 Persian-font">{officialMatch.teamA.name} vs {officialMatch.teamB.name}</span>
                                          </div>
                                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                            <span>نتیجه واقعی:</span>
                                            <span className="font-bold text-slate-400 font-mono">{toPersianDigits(officialMatch.scoreA)} - {toPersianDigits(officialMatch.scoreB)}</span>
                                          </div>
                                        </div>

                                        <div className="text-left flex flex-col items-end gap-1 shrink-0">
                                          {pred ? (
                                            <>
                                              <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-slate-400 Persian-font">پیش‌بینی:</span>
                                                <span className="font-black text-cyan-400 font-mono bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-500/10">
                                                  {toPersianDigits(pred.scoreA)} - {toPersianDigits(pred.scoreB)}
                                                </span>
                                              </div>
                                              
                                              {statusType === "exact" && (
                                                <span className="text-[9.5px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5 Persian-font">
                                                  <CheckCircle size={10} />
                                                  <span>نتیجه دقیق (+{toPersianDigits(pointsAwarded)} امتیاز)</span>
                                                </span>
                                              )}
                                              {statusType === "outcome" && (
                                                <span className="text-[9.5px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 flex items-center gap-0.5 Persian-font">
                                                  <CheckCircle size={10} />
                                                  <span>جهت درست (+{toPersianDigits(pointsAwarded)} امتیاز)</span>
                                                </span>
                                              )}
                                              {statusType === "wrong" && (
                                                <span className="text-[9.5px] font-bold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-white/5 Persian-font">
                                                  نادرست (۰ امتیاز)
                                                </span>
                                              )}
                                            </>
                                          ) : (
                                            <span className="text-[10px] text-rose-450 bg-rose-500/5 px-2 py-1 rounded border border-rose-500/10 Persian-font font-bold">
                                              ثبت نشده (۰ امتیاز)
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

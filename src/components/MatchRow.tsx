/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Match, Team } from "../types";
import { Dices, Plus, Minus, RotateCcw, X, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TeamFlag } from "./TeamFlag";
import { getMatchKickoffDate, getMatchDisplayStatus } from "../data";

interface MatchRowProps {
  match: Match;
  onScoreChange: (matchId: string, scoreA: number | null, scoreB: number | null) => void;
  onSimulate: (matchId: string) => void;
  displayDay?: boolean;
}

export const MatchRow: React.FC<MatchRowProps> = ({ match, onScoreChange, onSimulate, displayDay }) => {
  const { teamA, teamB, scoreA, scoreB, id } = match;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showSavedPulse, setShowSavedPulse] = useState(false);
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const kickoff = getMatchKickoffDate(id);
  const status = React.useMemo(
    () => getMatchDisplayStatus(id, match, now),
    [id, match, now]
  );
  const { isLocked, showOfficial, showLive, showFinished, showHalftime, minute } = status;

  const kickoffShamsiDate = React.useMemo(() => {
    try {
      const datePart = kickoff.toLocaleDateString("fa-IR", { month: "long", day: "numeric" });
      const timePart = kickoff.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
      return `${datePart} - ساعت ${timePart}`;
    } catch (e) {
      return "";
    }
  }, [kickoff]);


  React.useEffect(() => {
    if (showSavedPulse) {
      const timer = setTimeout(() => {
        setShowSavedPulse(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showSavedPulse]);

  // Helper to determine match day
  const getMatchDayNumber = (matchId: string): number => {
    const parts = matchId.split("-");
    if (parts.length < 3 || parts[0] !== "G") return 1;
    const gId = parts[1];
    const mIndex = parseInt(parts[2], 10);
    const groupsOrder = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    const gIdx = groupsOrder.indexOf(gId);
    if (gIdx === -1) return 1;
    const cluster = Math.floor(gIdx / 3);
    let phase = 0;
    if (mIndex === 1 || mIndex === 2) phase = 0;
    else if (mIndex === 3 || mIndex === 4) phase = 1;
    else phase = 2;
    return (phase * 4) + cluster + 1;
  };

  const toPersianDigits = (str: string | number | null | undefined): string => {
    if (str === null || str === undefined) return "";
    const numStr = String(str);
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return numStr.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
  };

  const handleIncrement = (type: "A" | "B") => {
    if (isLocked) return;
    const currentA = scoreA === null ? 0 : scoreA;
    const currentB = scoreB === null ? 0 : scoreB;
    if (type === "A") {
      onScoreChange(id, Math.min(9, currentA + 1), currentB);
    } else {
      onScoreChange(id, currentA, Math.min(9, currentB + 1));
    }
    setShowSavedPulse(true);
  };

  const handleDecrement = (type: "A" | "B") => {
    if (isLocked) return;
    const currentA = scoreA === null ? 0 : scoreA;
    const currentB = scoreB === null ? 0 : scoreB;
    if (type === "A") {
      onScoreChange(id, Math.max(0, currentA - 1), currentB);
    } else {
      onScoreChange(id, currentA, Math.max(0, currentB - 1));
    }
    setShowSavedPulse(true);
  };

  const handleSimulate = () => {
    if (isLocked) return;
    onSimulate(id);
    setShowSavedPulse(true);
  };

  const handleClearScore = () => {
    if (isLocked) return;
    onScoreChange(id, null, null);
  };

  const hasScore = scoreA !== null && scoreB !== null;

  return (
    <>
      <motion.div
        id={`match-card-${id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`relative bg-slate-900/80 backdrop-blur-md border rounded-2xl p-4 sm:p-5 flex flex-col items-stretch gap-4 transition-all duration-300 shadow-lg shadow-slate-950/45 ${
          showOfficial 
            ? "border-emerald-500/20 bg-gradient-to-br from-slate-900 via-emerald-950/5 to-slate-900" 
            : showLive || showHalftime
            ? "border-red-500/30 bg-gradient-to-br from-slate-900 via-red-950/10 to-slate-900 shadow-red-950/10" 
            : showSavedPulse
            ? "border-emerald-500/80 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 shadow-emerald-500/30 ring-2 ring-emerald-500/20 animate-pulse duration-1000"
            : "border-white/10 hover:border-purple-500/50 hover:shadow-purple-500/5"
        }`}
      >
        {/* Top Details Header of Match (Unified for mobile & desktop) */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-black text-slate-400 bg-slate-950/50 border border-white/5 px-2.5 py-0.5 rounded-full font-mono">
              {displayDay ? `روز ${toPersianDigits(getMatchDayNumber(id))} گروهی` : `گروه ${id.split("-")[1]}`}
            </span>
            {kickoffShamsiDate && (
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold bg-slate-950/20 border border-white/5 px-2 py-0.5 rounded-full font-sans">
                {kickoffShamsiDate}
              </span>
            )}
          </div>

          {/* Status indicator / live / official */}
          <div className="flex items-center gap-1.5">
            {showOfficial ? (
              <span className="bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-400 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 select-none">
                🔒 نتیجه رسمی فیفا
              </span>
            ) : showLive ? (
              <span className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 text-[10px] text-red-400 font-bold px-2 py-0.5 rounded-full animate-pulse select-none font-mono">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                زنده - دقیقه {toPersianDigits(minute ?? 1)}'
              </span>
            ) : showHalftime ? (
              <span className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded-full select-none font-mono">
                ⏸ استراحت بین دو نیمه
              </span>
            ) : showFinished ? (
              <span className="bg-slate-700/80 border border-white/10 text-[10px] text-slate-300 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 select-none">
                🏁 پایان بازی
              </span>
            ) : (
              <span className="text-[9.5px] text-slate-500 font-bold select-none">فاز مقدماتی گروهی</span>
            )}
          </div>
        </div>

        {/* 📱📱 1. MOBILE RESPONSIVE LAYOUT (Highly optimized stacked layout with drawer) */}
        <div className="block sm:hidden flex-col gap-4">
          <div 
            id={`mobile-touch-selector-${id}`}
            onClick={() => {
              if (!isLocked) {
                setIsDrawerOpen(true);
              }
            }}
            className={`flex items-center justify-between bg-slate-950/40 p-3.5 rounded-xl border border-white/5 active:bg-slate-950/60 transition-all ${
              !isLocked ? "cursor-pointer hover:border-purple-500/30" : "cursor-not-allowed opacity-80"
            }`}
          >
            {/* Team stack list left side */}
            <div className="flex flex-col gap-3.5 flex-1 select-none text-right">
              <div className="flex items-center gap-2.5">
                <TeamFlag team={teamA} className="w-8 h-5 rounded shadow-sm border border-white/10 object-cover shrink-0" />
                <span className="text-sm font-extrabold text-slate-100">{teamA.name}</span>
                <span className="text-[10px] text-slate-500 mr-auto font-mono">قدرت: {toPersianDigits(teamA.strength)}٪</span>
              </div>
              <div className="flex items-center gap-2.5">
                <TeamFlag team={teamB} className="w-8 h-5 rounded shadow-sm border border-white/10 object-cover shrink-0" />
                <span className="text-sm font-extrabold text-slate-100">{teamB.name}</span>
                <span className="text-[10px] text-slate-500 mr-auto font-mono">قدرت: {toPersianDigits(teamB.strength)}٪</span>
              </div>
            </div>

            {/* Score box display that users tap to edit score */}
            <div className="flex flex-col items-center justify-center bg-slate-900 border border-purple-500/25 px-5 py-3 rounded-xl shadow-inner select-none font-mono min-w-[76px] text-center ml-2.5">
              <div className="flex items-center gap-1.5 justify-center">
                <span className={`text-xl font-extrabold ${showOfficial ? "text-emerald-400" : scorerColor(scoreA)}`}>
                  {scoreA !== null ? toPersianDigits(scoreA) : "—"}
                </span>
                <span className="text-slate-600 font-black">:</span>
                <span className={`text-xl font-extrabold ${showOfficial ? "text-emerald-400" : scorerColor(scoreB)}`}>
                  {scoreB !== null ? toPersianDigits(scoreB) : "—"}
                </span>
              </div>
              {!isLocked ? (
                <span className="text-[9.5px] text-purple-400 mt-1 font-bold Persian-font flex items-center gap-0.5 justify-center">
                  <Edit3 size={9} />
                  <span>ثبت امتیاز</span>
                </span>
              ) : (
                <span className="text-[9.5px] text-slate-500 mt-1 font-bold Persian-font flex items-center gap-0.5 justify-center">
                  🔒 قفل شده
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 💻💻 2. DESKTOP TRADITIONAL LAYOUT (inline grid styling) */}
        <div className="hidden sm:flex flex-row items-center justify-between gap-4 sm:gap-6">
          
          {/* Team A Info Column */}
          <div className="flex flex-row sm:flex-row items-center gap-3 w-full sm:w-5/12 justify-start select-none">
            <div className="shrink-0">
              <TeamFlag team={teamA} className="w-11 h-7.5 rounded shadow-sm border border-white/15 object-cover" />
            </div>
            <div className="text-right leading-tight">
              <div className="font-extrabold text-slate-100 text-sm sm:text-base tracking-tight">
                {teamA.name}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                شاخص قدرت تیمی: {toPersianDigits(teamA.strength)}٪
              </div>
            </div>
          </div>

          {/* Score Selector inline (Desktop option) */}
          <div className="flex flex-col items-center justify-center gap-2 py-2 w-full sm:w-auto shrink-0">
            <div className="flex items-center justify-center gap-3 bg-slate-950/80 border border-white/5 shadow-inner p-2 rounded-2xl">
              
              {/* Control A: Decrement, Score A, Increment */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleDecrement("A")}
                  className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-red-400 hover:border-red-500/30 hover:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95 disabled:pointer-events-none disabled:opacity-25 transition-all font-bold"
                  title="کاهش گل میزبان"
                >
                  <Minus size={16} />
                </button>
                
                <span className={`text-2xl sm:text-3xl font-black font-mono w-10 text-center select-none ${
                  showOfficial 
                    ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                    : scorerColor(scoreA)
                }`}>
                  {scoreA !== null ? toPersianDigits(scoreA) : "-"}
                </span>
                
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleIncrement("A")}
                  className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-purple-400 hover:border-purple-500/30 hover:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95 disabled:pointer-events-none disabled:opacity-25 transition-all font-bold"
                  title="افزایش گل میزبان"
                >
                  <Plus size={16} />
                </button>
              </div>

              <span className="text-slate-600 font-extrabold text-[10px] px-1 select-none font-mono tracking-widest">VS</span>

              {/* Control B: Decrement, Score B, Increment */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleDecrement("B")}
                  className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-red-400 hover:border-red-500/30 hover:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95 disabled:pointer-events-none disabled:opacity-25 transition-all font-bold"
                  title="کاهش گل مهمان"
                >
                  <Minus size={16} />
                </button>
                
                <span className={`text-2xl sm:text-3xl font-black font-mono w-10 text-center select-none ${
                  showOfficial 
                    ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                    : scorerColor(scoreB)
                }`}>
                  {scoreB !== null ? toPersianDigits(scoreB) : "-"}
                </span>
                
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleIncrement("B")}
                  className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-purple-400 hover:border-purple-500/30 hover:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95 disabled:pointer-events-none disabled:opacity-25 transition-all font-bold"
                  title="افزایش گل مهمان"
                >
                  <Plus size={16} />
                </button>
              </div>
              
            </div>
          </div>

          {/* Team B Info Column */}
          <div className="flex flex-row-reverse sm:flex-row items-center gap-3 w-full sm:w-5/12 justify-start sm:justify-end select-none">
            <div className="text-left sm:text-left leading-tight flex-1 sm:flex-initial">
              <div className="font-extrabold text-slate-100 text-sm sm:text-base tracking-tight sm:text-left">
                {teamB.name}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 sm:text-left">
                شاخص قدرت تیمی: {toPersianDigits(teamB.strength)}٪
              </div>
            </div>
            <div className="shrink-0">
              <TeamFlag team={teamB} className="w-11 h-7.5 rounded shadow-sm border border-white/15 object-cover" />
            </div>
          </div>

        </div>

        {/* Match quick actions layout */}
        <div className="flex items-center justify-between border-t border-white/5 pt-2.5 mt-1">
          {/* Helper label */}
          <span className={`text-[10px] Persian-font select-none transition-colors duration-300 ${showSavedPulse ? "text-emerald-400 font-bold flex items-center gap-1" : "text-slate-500"}`}>
            {showSavedPulse ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>✓ پیش‌بینی با موفقیت ثبت شد</span>
              </>
            ) : hasScore ? (
              "پیش‌بینی شما ثبت شده است."
            ) : (
              "در انتظار پیش‌بینی مسابقه..."
            )}
          </span>

          {/* Quick simulation / reset buttons */}
          <div className="flex items-center gap-2">
            {hasScore && !isLocked && (
              <button
                type="button"
                onClick={handleClearScore}
                className="px-3.5 py-2 sm:py-1.5 rounded-xl bg-slate-800/60 text-pink-400 hover:text-pink-300 border border-white/5 hover:border-pink-500/25 duration-150 cursor-pointer text-[11px] font-bold flex items-center gap-1"
              >
                <RotateCcw size={12} />
                <span>پاک‌کردن</span>
              </button>
            )}

            {!isLocked ? (
              <button
                type="button"
                onClick={handleSimulate}
                className="px-4 py-2 bg-gradient-to-tr from-purple-600/10 to-pink-600/10 hover:from-purple-600/20 hover:to-pink-600/20 text-purple-300 hover:text-pink-300 border border-purple-500/20 hover:border-pink-500/40 text-[11.5px] sm:text-xs font-bold rounded-xl flex items-center gap-1 active:scale-95 duration-150 transition-all cursor-pointer Persian-font"
                title="شبیه‌سازی عادلانه نتیجه با هوش مصنوعی"
              >
                <Dices size={12} />
                <span>شبیه‌سازی هوشمند</span>
              </button>
            ) : (
              <span className="text-[10.5px] text-slate-500 select-none font-bold Persian-font">
                🔒 شروع مسابقه (پیش‌بینی قفل شده)
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* 🔮 BEAUTIFUL MOBILE PANEL/DRAWER/SHEET FOR PREDICTION COMFORT */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Dark glass overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              style={{ contentVisibility: "auto" }}
            />

            {/* Custom Bottom Sheet Drawer with drag feedback styling */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 27, stiffness: 240 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950 border-t border-purple-500/20 rounded-t-[2.5rem] p-6 shadow-2xl z-50 flex flex-col gap-5 text-right font-sans"
              dir="rtl"
            >
              {/* Drawer grab line */}
              <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-1 shrink-0" />

              {/* Head info summary */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="text-right">
                  <h3 className="text-sm font-black text-slate-200">ثبت پیش‌بینی کارشناسی</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 Persian-font">ثبت گل‌ها با انگشت دست (مخصوص گوشی‌های موبایل)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors active:scale-95"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Central interactive scoreboard */}
              <div className="p-4 bg-slate-900/60 border border-white/5 rounded-3xl flex flex-col gap-5">
                
                {/* Team 1 Score controls */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <TeamFlag team={teamA} className="w-9 h-6 border border-white/10 rounded shadow-sm object-cover shrink-0" />
                    <span className="text-sm font-black text-slate-100">{teamA.name}</span>
                  </div>

                  {/* Gigantic buttons optimized for touch targets >= 48px */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleDecrement("A")}
                      className="w-12 h-12 rounded-xl bg-slate-950 border border-white/10 text-slate-300 active:scale-95 flex items-center justify-center transition-all cursor-pointer select-none font-bold text-lg hover:border-red-500/20 disabled:opacity-20"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-8 text-center text-xl font-extrabold font-mono text-cyan-400 select-none">
                      {scoreA !== null ? toPersianDigits(scoreA) : toPersianDigits(0)}
                    </span>
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleIncrement("A")}
                      className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white active:scale-95 flex items-center justify-center transition-all cursor-pointer select-none font-bold text-lg shadow-md shadow-purple-900/20 disabled:opacity-20"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-900 my-0.5 justify-center flex items-center relative">
                  <span className="bg-slate-950 px-2.5 py-0.5 rounded-full border border-white/5 text-[9px] text-slate-500 font-mono select-none -translate-y-3">VS</span>
                </div>

                {/* Team 2 Score controls */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <TeamFlag team={teamB} className="w-9 h-6 border border-white/10 rounded shadow-sm object-cover shrink-0" />
                    <span className="text-sm font-black text-slate-100">{teamB.name}</span>
                  </div>

                  {/* Gigantic buttons optimized for touch targets >= 48px */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleDecrement("B")}
                      className="w-12 h-12 rounded-xl bg-slate-950 border border-white/10 text-slate-300 active:scale-95 flex items-center justify-center transition-all cursor-pointer select-none font-bold text-lg hover:border-red-500/20 disabled:opacity-20"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-8 text-center text-xl font-extrabold font-mono text-cyan-400 select-none">
                      {scoreB !== null ? toPersianDigits(scoreB) : toPersianDigits(0)}
                    </span>
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleIncrement("B")}
                      className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white active:scale-95 flex items-center justify-center transition-all cursor-pointer select-none font-bold text-lg shadow-md shadow-purple-900/20 disabled:opacity-20"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

              </div>

              {/* Controls inside drawer footer */}
              <div className="flex items-center gap-3 justify-end mt-1">
                {hasScore && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClearScore();
                      setIsDrawerOpen(false);
                    }}
                    className="px-4 py-3 bg-slate-900 border border-white/5 hover:border-pink-500/25 text-pink-400 font-bold text-xs rounded-xl flex items-center gap-1.5 duration-150 cursor-pointer transition-colors"
                  >
                    <RotateCcw size={13} />
                    <span>حذف</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSimulate}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 text-purple-300 hover:text-pink-300 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 duration-150 cursor-pointer active:scale-95"
                >
                  <Dices size={13} />
                  <span>شبیه‌سازی</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setShowSavedPulse(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all duration-150 shadow-md shadow-emerald-950/40"
                >
                  ذخیره و تایید
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// Helper style decider
function scorerColor(score: number | null): string {
  if (score === null) return "text-slate-500";
  return "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]";
}

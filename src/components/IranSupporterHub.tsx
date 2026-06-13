/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Team, Match } from "../types";
import { TeamFlag } from "./TeamFlag";
import { Heart, Sparkles, Volume2, Flame, Award, Zap, Plus, Minus, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { trackUserAction } from "../utils/tracker";

interface IranSupporterHubProps {
  iranTeam: Team;
  groupMatches: Match[];
  onScoreChange: (matchId: string, scoreA: number | null, scoreB: number | null) => void;
  userName: string;
  enthusiasm: number;
  onEnthusiasmChange: (value: number) => void;
}

export const IranSupporterHub: React.FC<IranSupporterHubProps> = ({
  iranTeam,
  groupMatches,
  onScoreChange,
  userName,
  enthusiasm,
  onEnthusiasmChange,
}) => {
  const [selectedChant, setSelectedChant] = useState<number>(0);
  const [hornActive, setHornActive] = useState(false);
  const [drumActive, setDrumActive] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("wc_iran_club_collapsed") === "true";
  });

  const handleToggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem("wc_iran_club_collapsed", String(nextVal));
    trackUserAction(`کلوپ هوادارای ایران ${nextVal ? "بسته" : "باز"} شد`);
  };

  // Specific Iran Matches
  const iranMatches = groupMatches.filter(
    (m) => m.teamA.id === "iran" || m.teamB.id === "iran"
  );

  // Supporter Slogans / Chants
  const chants = [
    { text: "تا پای جان، برای ایران! 🇮🇷🦁", desc: "شعار حماسی و محبوب ملی‌پوشان" },
    { text: "ایران چیکارش می‌کنه؟ نصفش می‌کنه! ⚽💥", desc: "کری‌خوانی طنز استادیومی" },
    { text: "حمله حمله! تیم ایران، گل بزن قهرمان! 🥁🔥", desc: "سرود خاطره‌انگیز سکوها" },
    { text: "یوز ایرانی بجنگ، کل دنیا به تو خیره شده! ⭐✨", desc: "روحیه تهاجمی هواداران" }
  ];

  const handleNextChant = () => {
    const nextIdx = (selectedChant + 1) % chants.length;
    setSelectedChant(nextIdx);
    trackUserAction(`تغییر شعار حماسی به: ${chants[nextIdx].text}`);
  };

  // Synthesize stadium drum using Web Audio API
  const playStadiumDrum = () => {
    onEnthusiasmChange(Math.min(enthusiasm + 5, 100));
    setDrumActive(true);
    setTimeout(() => setDrumActive(false), 150);
    trackUserAction("نواختن طبل هواداری 🥁");

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.frequency.setValueAtTime(120, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      
      gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Web Audio block or unsupported.", e);
    }
  };

  // Synthesize stadium horn (vuvuzela) using Web Audio API
  const playStadiumHorn = () => {
    onEnthusiasmChange(Math.min(enthusiasm + 8, 100));
    setHornActive(true);
    setTimeout(() => setHornActive(false), 250);
    trackUserAction("به صدا درآوردن شیپور 🎺");

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.type = "sawtooth";
      osc2.type = "sawtooth";
      
      osc1.frequency.setValueAtTime(225, audioCtx.currentTime);
      osc2.frequency.setValueAtTime(228, audioCtx.currentTime);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.7);
      
      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.7);
      osc2.stop(audioCtx.currentTime + 0.7);
    } catch (e) {
      console.warn("Web Audio block or unsupported.", e);
    }
  };

  const getWinChance = (opponentRating: number) => {
    const iranRating = 77;
    const total = iranRating + opponentRating;
    return Math.round((iranRating / total) * 100);
  };

  // Helper for Persian numerals
  const toFa = (num: number | string): string => {
    const idDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/[0-9]/g, (w) => idDigits[+w]);
  };

  return (
    <div 
      id="iran-supporter-card" 
      className="bg-gradient-to-br from-slate-900/90 via-emerald-950/15 to-slate-900/95 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 shadow-lg shadow-emerald-950/10 transition-all duration-300 relative overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-24 h-[2px] bg-gradient-to-r from-green-500 via-white to-red-500 rounded-full" />
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-green-500/5 rounded-full filter blur-xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Heart size={15} className="fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-100 Persian-font">کلوپ هواداران یوزهای ایرانی 🇮🇷</h3>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 hidden xs:inline">بخش نوجوانان</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-none mt-1 hidden sm:block">پیش‌بینی بازی‌های سرنوشت‌ساز و شور و هیجان استادیوم</p>
          </div>
        </div>

        {/* Right Header Side: Info, Excitement and Collapse toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/20 px-2 py-1 rounded-lg">
            <span className="text-[9px] text-emerald-400 font-bold hidden xs:inline">هیجان:</span>
            <span className="text-[10px] font-black text-emerald-300 font-mono">٪{toFa(enthusiasm)}</span>
          </div>

          <button
            type="button"
            onClick={handleToggleCollapse}
            className="p-1 px-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-white/5 cursor-pointer active:scale-95 transition-all flex items-center gap-1"
          >
            <span className="text-[10px] font-bold hidden xs:inline">{isCollapsed ? "جزئیات کلوپ" : "جمع‌کردن کلوپ"}</span>
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Interactive Body */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 pt-4 border-t border-white/5 items-stretch">
              
              {/* Column 1: Cheering Instruments and Chant display (Occupies 5 cols) */}
              <div className="md:col-span-5 flex flex-col justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <Volume2 size={12} className="animate-bounce" />
                    <span>تولید صدای استادیوم و شعار حماسی</span>
                  </span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    با زدن روی طبل یا شیپور، هیجان تیم ملی را بالا ببرید و شعار فعال را تغییر دهید:
                  </p>
                </div>

                {/* Instrument controls */}
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    onClick={playStadiumDrum}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-[10.5px] font-bold cursor-pointer transition-all select-none ${
                      drumActive
                        ? "bg-amber-500 border-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                        : "bg-slate-900 hover:bg-slate-850 text-slate-300 border-white/5"
                    }`}
                  >
                    <span>🥁</span>
                    <span>طبل حماسی</span>
                  </motion.button>

                  <motion.button
                    onClick={playStadiumHorn}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-[10.5px] font-bold cursor-pointer transition-all select-none ${
                      hornActive
                        ? "bg-green-500 border-green-400 text-slate-950 shadow-md shadow-green-500/20"
                        : "bg-slate-900 hover:bg-slate-850 text-slate-300 border-white/5"
                    }`}
                  >
                    <span>🎺</span>
                    <span>شیپور قهرمانی</span>
                  </motion.button>
                </div>

                {/* Sparkle interactive Chant selector bubble */}
                <div 
                  onClick={handleNextChant}
                  className="bg-slate-900/40 hover:bg-slate-900/70 p-2.5 rounded-lg border border-white/5 cursor-pointer text-center group transition-all"
                  title="کلیک کنید تا شعار عوض شود"
                >
                  <p className="text-[11px] font-black text-amber-300 leading-snug group-hover:scale-105 duration-150 transition-transform">
                    {chants[selectedChant].text}
                  </p>
                  <span className="text-[8.5px] text-slate-400 mt-1 block">
                    {chants[selectedChant].desc} (ضربه‌بزنید 🔄)
                  </span>
                </div>

                {/* Excitement Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                    <span className="flex items-center gap-0.5"><Flame size={10} className="text-red-400" /> بمب شور و هیجان نوجوانان</span>
                    <span>{enthusiasm < 50 ? "سرد 💤" : enthusiasm < 80 ? "پرانرژی 🔥" : "استادیوم در حال انفجار! ⚡"}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${enthusiasm}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Column 2: Iran Spotlight Match Cards and Dynamic Standings (Occupies 7 cols) */}
              <div className="md:col-span-7 flex flex-col justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1 Persian-font">
                    <Sparkles size={11} className="text-amber-400" />
                    <span>پیش‌بینی ۳ بازی سرنوشت‌ساز ایران</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-none">تغییر نمرات مستقیماً شانس صعود و رتبه ایران را تحلیل می‌کند:</p>
                </div>

                {/* Custom Compact Match Grid */}
                <div className="grid grid-cols-1 gap-2">
                  {iranMatches.map((m) => {
                    const isTeamA_Iran = m.teamA.id === "iran";
                    const opponent = isTeamA_Iran ? m.teamB : m.teamA;
                    const winChance = getWinChance(opponent.strength);

                    const iranScore = isTeamA_Iran ? m.scoreA : m.scoreB;
                    const oppScore = isTeamA_Iran ? m.scoreB : m.scoreA;

                    const handleAdjustIran = (diff: number) => {
                      if (m.isLive || m.isOfficial) return;
                      const currentIran = iranScore !== null ? iranScore : 0;
                      const newVal = Math.min(9, Math.max(0, currentIran + diff));
                      if (isTeamA_Iran) {
                        onScoreChange(m.id, newVal, m.scoreB);
                      } else {
                        onScoreChange(m.id, m.scoreA, newVal);
                      }
                    };

                    const handleAdjustOpp = (diff: number) => {
                      if (m.isLive || m.isOfficial) return;
                      const currentOpp = oppScore !== null ? oppScore : 0;
                      const newVal = Math.min(9, Math.max(0, currentOpp + diff));
                      if (isTeamA_Iran) {
                        onScoreChange(m.id, m.scoreA, newVal);
                      } else {
                        onScoreChange(m.id, newVal, m.scoreB);
                      }
                    };

                    return (
                      <div 
                        key={m.id} 
                        className="bg-slate-900/70 p-3 rounded-xl border border-white/5 flex flex-col gap-2 hover:border-emerald-500/20 dynamic-glow animate-fade-in"
                      >
                        {/* Match Title/Info Row */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/5 pb-1.5 select-none">
                          <span className="font-bold flex items-center gap-1 text-emerald-400">
                            <span>🦁 بازی {toFa(m.id.includes("1") || m.id.includes("newzealand") ? "اول" : m.id.includes("egypt") ? "دوم" : "سوم")} ایران در گروه G</span>
                          </span>
                          <span className="font-bold text-[9.5px] text-slate-300 bg-slate-950/60 px-1.5 py-0.5 rounded border border-white/5">
                            شانس برد ایران: %{toFa(winChance)}
                          </span>
                        </div>

                        {/* Teams and Scores interactive layout */}
                        <div className="grid grid-cols-11 items-center gap-1 sm:gap-2 pt-0.5">
                          
                          {/* Right side: IRAN (RTL priority alignment for Persian viewers) */}
                          <div className="col-span-5 flex items-center gap-1.5 justify-end">
                            <span className="text-[11px] font-black text-emerald-400 Persian-font">ایران</span>
                            <TeamFlag team={iranTeam} className="w-5 h-3.5 shadow-sm rounded-sm shrink-0" />
                            
                            {/* Controller for Iran */}
                            <div className={`flex items-center bg-slate-950 px-1.5 py-0.5 rounded-md border border-emerald-500/30 gap-1.5 shrink-0 ${m.isLive || m.isOfficial ? "opacity-60" : ""}`}>
                              <button
                                type="button"
                                disabled={m.isLive || m.isOfficial}
                                onClick={() => handleAdjustIran(-1)}
                                className="w-4.5 h-4.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 border border-white/5 flex items-center justify-center cursor-pointer active:scale-90 text-[9px] disabled:opacity-20 disabled:pointer-events-none"
                                title="کاهش گل ایران"
                              >
                                <Minus size={8} strokeWidth={3} />
                              </button>
                              <span className="text-[11px] font-black text-emerald-300 w-3 text-center">
                                {toFa(iranScore !== null ? iranScore : 0)}
                              </span>
                              <button
                                type="button"
                                disabled={m.isLive || m.isOfficial}
                                onClick={() => handleAdjustIran(1)}
                                className="w-4.5 h-4.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 border border-white/5 flex items-center justify-center cursor-pointer active:scale-90 text-[9px] disabled:opacity-20 disabled:pointer-events-none"
                                title="افزایش گل ایران"
                              >
                                <Plus size={8} strokeWidth={3} />
                              </button>
                            </div>
                          </div>

                          {/* Center separator badge */}
                          <div className="col-span-1 flex flex-col items-center justify-center text-center">
                            <span className="text-[9.5px] font-extrabold text-slate-500 select-none">vs</span>
                          </div>

                          {/* Left side: Opponent Team */}
                          <div className="col-span-5 flex items-center gap-1.5 justify-start flex-row-reverse">
                            <span className="text-[11px] font-black text-slate-300 text-right truncate max-w-[65px] sm:max-w-[100px] leading-none Persian-font">{opponent.name}</span>
                            <TeamFlag team={opponent} className="w-5 h-3.5 shadow-sm rounded-sm shrink-0" />

                            {/* Controller for Opponent */}
                            <div className={`flex items-center bg-slate-950 px-1.5 py-0.5 rounded-md border border-red-500/30 gap-1.5 shrink-0 ${m.isLive || m.isOfficial ? "opacity-60" : ""}`}>
                              <button
                                type="button"
                                disabled={m.isLive || m.isOfficial}
                                onClick={() => handleAdjustOpp(-1)}
                                className="w-4.5 h-4.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 border border-white/5 flex items-center justify-center cursor-pointer active:scale-90 text-[9px] disabled:opacity-20 disabled:pointer-events-none"
                                title={`کاهش گل ${opponent.name}`}
                              >
                                <Minus size={8} strokeWidth={3} />
                              </button>
                              <span className="text-[11px] font-black text-red-300 w-3 text-center">
                                {toFa(oppScore !== null ? oppScore : 0)}
                              </span>
                              <button
                                type="button"
                                disabled={m.isLive || m.isOfficial}
                                onClick={() => handleAdjustOpp(1)}
                                className="w-4.5 h-4.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 border border-white/5 flex items-center justify-center cursor-pointer active:scale-90 text-[9px] disabled:opacity-20 disabled:pointer-events-none"
                                title={`افزایش گل ${opponent.name}`}
                              >
                                <Plus size={8} strokeWidth={3} />
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Compact Standings summary section */}
                {(() => {
                  const groupGMatches = groupMatches.filter(
                    (m) =>
                      (m.teamA.id === "iran" || m.teamA.id === "belgium" || m.teamA.id === "egypt" || m.teamA.id === "newzealand") &&
                      (m.teamB.id === "iran" || m.teamB.id === "belgium" || m.teamB.id === "egypt" || m.teamB.id === "newzealand")
                  );

                  const teamsG = ["iran", "belgium", "egypt", "newzealand"];
                  const points: Record<string, number> = { iran: 0, belgium: 0, egypt: 0, newzealand: 0 };
                  const gd: Record<string, number> = { iran: 0, belgium: 0, egypt: 0, newzealand: 0 };
                  const gf: Record<string, number> = { iran: 0, belgium: 0, egypt: 0, newzealand: 0 };
                  let playedCount = 0;

                  groupGMatches.forEach((m) => {
                    if (m.scoreA !== null && m.scoreB !== null) {
                      const idA = m.teamA.id;
                      const idB = m.teamB.id;

                      if (idA === "iran" || idB === "iran") {
                        playedCount++;
                      }

                      gf[idA] = (gf[idA] || 0) + m.scoreA;
                      gf[idB] = (gf[idB] || 0) + m.scoreB;
                      gd[idA] = (gd[idA] || 0) + (m.scoreA - m.scoreB);
                      gd[idB] = (gd[idB] || 0) + (m.scoreB - m.scoreA);

                      if (m.scoreA > m.scoreB) {
                        points[idA] = (points[idA] || 0) + 3;
                      } else if (m.scoreA < m.scoreB) {
                        points[idB] = (points[idB] || 0) + 3;
                      } else {
                        points[idA] = (points[idA] || 0) + 1;
                        points[idB] = (points[idB] || 0) + 1;
                      }
                    }
                  });

                  const sorted = [...teamsG].sort((a, b) => {
                    const ptsDiff = (points[b] || 0) - (points[a] || 0);
                    if (ptsDiff !== 0) return ptsDiff;
                    const gdDiff = (gd[b] || 0) - (gd[a] || 0);
                    if (gdDiff !== 0) return gdDiff;
                    return (gf[b] || 0) - (gf[a] || 0);
                  });

                  const iranRank = sorted.indexOf("iran") + 1;
                  const pts = points.iran || 0;
                  const iranGd = gd.iran || 0;
                  let pct = 35;
                  let label = "در انتظار ثبت پیش‌بینی بازی‌ها";

                  if (playedCount > 0) {
                    if (pts >= 7) {
                      pct = 100;
                      label = "صعود قطعی";
                    } else if (pts === 6) {
                      pct = 95;
                      label = "صعود بسیار محتمل";
                    } else if (pts === 5) {
                      pct = 85;
                      label = "شانس صعود بالا";
                    } else if (pts === 4) {
                      if (iranGd > 0) {
                        pct = 75;
                        label = "صعود امیدوارکننده";
                      } else if (iranGd === 0) {
                        pct = 60;
                        label = "صعود لب‌مرزی";
                      } else {
                        pct = 45;
                        label = "نیاز به تفاضل گل";
                      }
                    } else if (pts === 3) {
                      if (iranGd > 0) {
                        pct = 35;
                        label = "شانس کم صعود";
                      } else {
                        pct = 20;
                        label = "احتمال پایین";
                      }
                    } else if (pts === 2) {
                      pct = 10;
                      label = "احتمال ناچیز";
                    } else if (pts === 1) {
                      pct = 2;
                      label = "در آستانه حذف";
                    } else {
                      pct = 0;
                      label = "حذف قطعی";
                    }
                  }

                  return (
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-emerald-500/10 flex flex-col xs:flex-row xs:items-center justify-between gap-2.5">
                      {/* Left: Mini-stats */}
                      <div className="flex items-center gap-1.5">
                        <Zap size={11} className="text-yellow-400 animate-pulse" />
                        <span className="text-[10px] text-slate-300 font-bold">وضعیت گروه G:</span>
                        <div className="flex items-center gap-2 font-mono text-[9.5px]">
                          <span className="bg-slate-900 px-1 py-0.5 rounded text-blue-300 border border-white/5">رتبه {toFa(iranRank)}</span>
                          <span className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300 border border-white/5">امتیاز {toFa(pts)}</span>
                          <span className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300 border border-white/5">تفاضل {iranGd > 0 ? "+" : ""}{toFa(iranGd)}</span>
                        </div>
                      </div>

                      {/* Right: Percent progress capsule */}
                      <div className="flex items-center gap-1.5 xs:min-w-[120px] justify-between xs:justify-end">
                        <span className="text-[9px] text-slate-500 font-bold">شانس صعود:</span>
                        <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-white/5">
                          <span className={`text-[10px] font-black ${pct >= 75 ? "text-emerald-400" : pct >= 45 ? "text-yellow-400" : "text-red-400"}`}>
                            ٪{toFa(pct)}
                          </span>
                          <span className="text-[8.5px] text-slate-400 font-bold">({label})</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

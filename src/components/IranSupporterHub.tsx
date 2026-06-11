/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Team, Match } from "../types";
import { TeamFlag } from "./TeamFlag";
import { Heart, Sparkles, Volume2, Flame, Award, Lightbulb, Zap } from "lucide-react";
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
  const [showSupporterCard, setShowSupporterCard] = useState(true);

  // Specific Iran Matches
  const iranMatches = groupMatches.filter(
    (m) => m.teamA.id === "iran" || m.teamB.id === "iran"
  );

  // Supporter Slogans / Chants
  const chants = [
    { text: "تا پای جان، برای ایران! 🇮🇷🦁", desc: "شعار حماسی و محبوب ملی‌پوشان" },
    { text: "ایران چیکارش می‌کنه؟ سوراخ سوراخش می‌کنه! ⚽💥", desc: "کری‌خوانی طنز و باانرژی استادیومی" },
    { text: "حمله حمله! تیم ایران، گل بزن قهرمان! 🥁🔥", desc: "سرود خاطره‌انگیز سکوها" },
    { text: "یوز ایرانی بجنگ، کل دنیا به تو خیره شده! ⭐✨", desc: "روحیه تهاجمی و حماسی نوجوانان" }
  ];

  // Synthesize stadium drum using Web Audio API
  const playStadiumDrum = () => {
    onEnthusiasmChange(Math.min(enthusiasm + 5, 100));
    setDrumActive(true);
    setTimeout(() => setDrumActive(false), 150);
    trackUserAction("نواختن طبل هواداری در کلوپ یوزپلنگ‌ها 🥁");

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // We need a low-freq kick/drum
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
      console.warn("Web Audio is restricted/blocked or unsupported.", e);
    }
  };

  // Synthesize stadium horn (vuvuzela) using Web Audio API
  const playStadiumHorn = () => {
    onEnthusiasmChange(Math.min(enthusiasm + 8, 100));
    setHornActive(true);
    setTimeout(() => setHornActive(false), 250);
    trackUserAction("به صدا درآوردن شیپور قهرمانی در کلوپ یوزپلنگ‌ها 🎺");

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.type = "sawtooth";
      osc2.type = "sawtooth";
      
      // detuned fat horn notes
      osc1.frequency.setValueAtTime(225, audioCtx.currentTime);
      osc2.frequency.setValueAtTime(228, audioCtx.currentTime);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.7);
      
      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.7);
      osc2.stop(audioCtx.currentTime + 0.7);
    } catch (e) {
      console.warn("Web Audio blocked or unsupported.", e);
    }
  };

  // Trigger win chance probability calculation based on ratings
  const getWinChance = (opponentRating: number) => {
    const iranRating = 77; // from data
    const total = iranRating + opponentRating;
    return Math.round((iranRating / total) * 100);
  };

  return (
    <div id="iran-supporter-card" className="bg-gradient-to-br from-slate-900 via-emerald-950/25 to-slate-900 border border-emerald-500/20 rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-950/10 transition-all relative overflow-hidden">
      {/* Background Flag Colors Glow */}
      <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-r from-green-500 via-white to-red-500 rounded-full" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/5 rounded-full filter blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-500/5 rounded-full filter blur-2xl pointer-events-none" />

      {/* Title block */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-green-500 via-emerald-600 to-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 animate-pulse">
            <Heart size={20} className="fill-white" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">بخش ویژه نوجوانان هوادار</span>
            <h3 className="text-base font-black text-slate-100 flex items-center gap-2 mt-0.5">
              <span>کلوپ هوادارای یوزپلنگ‌های ایرانی</span>
              <span className="text-sm">🇮🇷🔥</span>
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400 font-bold hidden sm:inline">سطح هیجان استادیوم:</span>
          <span className="font-mono text-xs font-black bg-emerald-950/80 text-emerald-400 px-2.5 py-1 rounded-xl border border-emerald-500/30 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
            %{enthusiasm}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Interactive Cheering Tools */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4 bg-slate-950/50 p-4 rounded-2xl border border-white/5">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Volume2 size={13} className="text-emerald-400 animate-bounce" />
              <span>شیپور و طبل استادیوم آزادی</span>
            </h4>
            <p className="text-[10.5px] text-slate-400 leading-relaxed font-medium">
              با فشردن شیپور یا طبل، در فضای استادیوم برای {userName} صدا تولید کن و سطح شور و هیجان تیم ملی را بالا ببر!
            </p>
          </div>

          {/* Sound instruments buttons */}
          <div className="flex items-center gap-2.5">
            <motion.button
              id="drum-btn"
              onClick={playStadiumDrum}
              whileTap={{ scale: 0.93 }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-xl border cursor-pointer duration-100 outline-none select-none ${
                drumActive
                  ? "bg-amber-500 border-amber-400 text-slate-950 scale-95 shadow-lg shadow-amber-500/20"
                  : "bg-slate-900 hover:bg-slate-850 text-slate-200 border-white/5"
              }`}
            >
              <span className="text-2xl">🥁</span>
              <span className="text-[10px] font-bold">طبل هواداری</span>
            </motion.button>

            <motion.button
              id="horn-btn"
              onClick={playStadiumHorn}
              whileTap={{ scale: 0.93 }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-xl border cursor-pointer duration-100 outline-none select-none ${
                hornActive
                  ? "bg-green-500 border-green-400 text-slate-950 scale-95 shadow-lg shadow-green-500/20"
                  : "bg-slate-900 hover:bg-slate-850 text-slate-200 border-white/5"
              }`}
            >
              <span className="text-2xl">🎺</span>
              <span className="text-[10px] font-bold">شیپور قهرمانی</span>
            </motion.button>
          </div>

          {/* Enthusiastic visual progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
              <span className="flex items-center gap-0.5"><Flame size={10} className="text-red-400" /> بمب هیجان ملی</span>
              <span>
                {enthusiasm < 50 ? "💤 سرد" : enthusiasm < 80 ? "🔥 گرم و پر انرژی" : "⚡ استادیوم در حال انفجار!"}
              </span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${enthusiasm}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center Chants Hub */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4 bg-slate-950/50 p-4 rounded-2xl border border-white/5">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Award size={13} className="text-yellow-400" />
              <span>فریاد شعارهای حماسی نوجوانان</span>
            </h4>
            <p className="text-[10.5px] text-slate-400 leading-relaxed font-medium">
              شعار هواداری خود را برای تقویت روحیه انتخاب کن تا در سردر کمپ بدرخشد:
            </p>
          </div>

          {/* Chant Slides */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 min-h-16 flex flex-col justify-center items-center text-center">
            <motion.div
              key={selectedChant}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-1"
            >
              <p className="text-xs font-black text-amber-300 select-all leading-relaxed font-mono">
                {chants[selectedChant].text}
              </p>
              <p className="text-[9px] text-slate-400 font-medium">
                ({chants[selectedChant].desc})
              </p>
            </motion.div>
          </div>

          {/* Selector dots */}
          <div className="flex items-center justify-center gap-1.5 py-0.5">
            {chants.map((_, idx) => (
              <button
                id={`chant-dot-${idx}`}
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedChant(idx);
                  trackUserAction(`تغییر شعار حماسی سردر کمپ به: ${chants[idx].text}`);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  selectedChant === idx
                    ? "bg-gradient-to-tr from-green-500 to-emerald-400 scale-125 shadow-md shadow-emerald-500/25"
                    : "bg-slate-800 hover:bg-slate-700"
                }`}
                title={`شعار ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right Iran Match Spotlight & Interactive quick inputs */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-3 bg-slate-950/50 p-4 rounded-2xl border border-white/5">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Sparkles size={13} className="text-green-400 animate-spin-slow" />
              <span>پیش‌بینی ۳ بازی سرنوشت‌ساز ایران</span>
            </h4>
            <p className="text-[10px] text-slate-400 leading-snug">
              نمرات بازی‌های ایران را وارد کن و شانس صعود را مستقیماً بسنج.
            </p>
          </div>

          {/* Iran Matches Mini List */}
          <div id="iran-mini-matches" className="space-y-2">
            {iranMatches.map((m) => {
              const isTeamA_Iran = m.teamA.id === "iran";
              const opponent = isTeamA_Iran ? m.teamB : m.teamA;
              const winChance = getWinChance(opponent.strength);

              return (
                <div
                  id={`spotlight-match-${m.id}`}
                  key={m.id}
                  className="bg-slate-900/80 p-2 rounded-xl border border-white/5 flex items-center justify-between gap-1.5 hover:border-emerald-500/20 duration-150 transition-all"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-300">ایران</span>
                    <TeamFlag team={opponent} className="w-5.5 h-3.5" />
                    <span className="text-[10px] font-bold text-slate-400">({opponent.name})</span>
                  </div>

                  {/* Rating-based Odds bar indicator */}
                  <div className="hidden xs:flex flex-col items-end gap-0.5 leading-none">
                    <span className="text-[8.5px] font-black text-emerald-400">شانس برد: %{winChance}</span>
                    <div className="w-14 bg-slate-950 h-1 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${winChance}%` }} />
                    </div>
                  </div>

                  {/* Fast input score fields */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-white/5">
                    <input
                      id={`score-iran-${m.id}`}
                      type="number"
                      min={0}
                      max={9}
                      placeholder="۰"
                      value={isTeamA_Iran ? (m.scoreA !== null ? m.scoreA : "") : (m.scoreB !== null ? m.scoreB : "")}
                      onChange={(e) => {
                        const val = e.target.value === "" ? null : Math.max(0, parseInt(e.target.value) || 0);
                        if (isTeamA_Iran) {
                          onScoreChange(m.id, val, m.scoreB);
                        } else {
                          onScoreChange(m.id, m.scoreA, val);
                        }
                      }}
                      className="w-5 h-5 bg-slate-900 border border-white/5 text-center text-xs font-black rounded text-green-300 focus:outline-none focus:border-green-500"
                      title="گل‌های زده ایران"
                    />
                    <span className="text-[9px] text-slate-600 select-none font-bold">:</span>
                    <input
                      id={`score-opp-${m.id}`}
                      type="number"
                      min={0}
                      max={9}
                      placeholder="۰"
                      value={isTeamA_Iran ? (m.scoreB !== null ? m.scoreB : "") : (m.scoreA !== null ? m.scoreA : "")}
                      onChange={(e) => {
                        const val = e.target.value === "" ? null : Math.max(0, parseInt(e.target.value) || 0);
                        if (isTeamA_Iran) {
                          onScoreChange(m.id, m.scoreA, val);
                        } else {
                          onScoreChange(m.id, val, m.scoreB);
                        }
                      }}
                      className="w-5 h-5 bg-slate-900 border border-white/5 text-center text-xs font-black rounded text-red-300 focus:outline-none focus:border-red-500"
                      title="گل‌های زده حریف"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

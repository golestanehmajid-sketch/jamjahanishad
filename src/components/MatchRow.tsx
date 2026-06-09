/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Match, Team } from "../types";
import { Dices, Plus, Minus } from "lucide-react";
import { motion } from "motion/react";
import { TeamFlag } from "./TeamFlag";

interface MatchRowProps {
  match: Match;
  onScoreChange: (matchId: string, scoreA: number | null, scoreB: number | null) => void;
  onSimulate: (matchId: string) => void;
}

export const MatchRow: React.FC<MatchRowProps> = ({ match, onScoreChange, onSimulate }) => {
  const { teamA, teamB, scoreA, scoreB, id, isOfficial, isLive, minute } = match;

  const handleIncrement = (type: "A" | "B") => {
    if (isOfficial || isLive) return;
    const currentA = scoreA === null ? 0 : scoreA;
    const currentB = scoreB === null ? 0 : scoreB;
    if (type === "A") {
      onScoreChange(id, Math.min(9, currentA + 1), currentB);
    } else {
      onScoreChange(id, currentA, Math.min(9, currentB + 1));
    }
  };

  const handleDecrement = (type: "A" | "B") => {
    if (isOfficial || isLive) return;
    const currentA = scoreA === null ? 0 : scoreA;
    const currentB = scoreB === null ? 0 : scoreB;
    if (type === "A") {
      onScoreChange(id, Math.max(0, currentA - 1), currentB);
    } else {
      onScoreChange(id, currentA, Math.max(0, currentB - 1));
    }
  };

  const handleClearScore = () => {
    if (isOfficial || isLive) return;
    onScoreChange(id, null, null);
  };

  return (
    <motion.div
      id={`match-card-${id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative bg-slate-900/80 backdrop-blur-md border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 shadow-lg shadow-slate-950/45 ${
        isOfficial 
          ? "border-emerald-500/20 bg-gradient-to-br from-slate-900 via-emerald-950/5 to-slate-900" 
          : isLive 
          ? "border-red-500/30 bg-gradient-to-br from-slate-900 via-red-950/10 to-slate-900 shadow-red-950/10" 
          : "border-white/10 hover:border-purple-500/50 hover:shadow-purple-500/5 hover:shadow-2xl"
      }`}
    >
      {/* Top absolute status ribbon */}
      {(isOfficial || isLive) && (
        <div className="absolute top-2 left-3 flex items-center gap-1.5 z-10">
          {isLive ? (
            <span className="flex items-center gap-1 bg-red-500/25 border border-red-500/30 text-[10px] text-red-400 font-bold px-2 py-0.5 rounded-full animate-pulse select-none font-mono">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
              زنده - دقیقه {minute || "۸۴"}'
            </span>
          ) : (
            <span className="bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-400 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 select-none">
              🔒 نتیجه رسمی فیفا
            </span>
          )}
        </div>
      )}

      {/* Team A Info */}
      <div id={`teama-sec-${id}`} className="flex items-center gap-3 w-full sm:w-2/5 justify-start">
        <TeamFlag team={teamA} className="w-10 h-6.5 hover:scale-110 duration-200 shadow-md filter drop-shadow" />
        <div className="text-right">
          <div className="font-semibold text-slate-100 text-lg tracking-tight select-none">
            {teamA.name}
          </div>
          <div className="text-xs text-slate-400 font-mono tracking-wider">
            قدرت: {teamA.strength}%
          </div>
        </div>
      </div>

      {/* Prediction score selector */}
      <div id={`score-sec-${id}`} className="flex flex-col items-center justify-center gap-1.5 min-w-[200px]">
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition ${
          isOfficial 
            ? "bg-slate-950/60 border-emerald-500/15" 
            : "bg-slate-950/90 border-white/5"
        }`}>
          {/* Team A controls */}
          <div className="flex items-center gap-1">
            <button
              id={`decrement-a-${id}`}
              disabled={isOfficial || isLive}
              onClick={() => handleDecrement("A")}
              className="p-1 rounded-lg bg-slate-900 hover:bg-red-500/20 hover:text-red-400 text-slate-400 border border-slate-700/60 hover:border-red-500/30 transition-all text-xs outline-none cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
              title="کاهش گل میزبان"
            >
              <Minus size={14} />
            </button>
            <span className={`text-2xl font-bold font-mono w-8 text-center select-none ${isOfficial ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"}`}>
              {scoreA !== null ? scoreA : "-"}
            </span>
            <button
              id={`increment-a-${id}`}
              disabled={isOfficial || isLive}
              onClick={() => handleIncrement("A")}
              className="p-1 rounded-lg bg-slate-900 hover:bg-purple-500/20 hover:text-purple-400 text-slate-400 border border-slate-700/60 hover:border-purple-500/30 transition-all text-xs outline-none cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
              title="افزایش گل میزبان"
            >
              <Plus size={14} />
            </button>
          </div>

          <span className="text-slate-500 text-xs font-bold font-mono px-1 select-none">VS</span>

          {/* Team B controls */}
          <div className="flex items-center gap-1">
            <button
              id={`decrement-b-${id}`}
              disabled={isOfficial || isLive}
              onClick={() => handleDecrement("B")}
              className="p-1 rounded-lg bg-slate-900 hover:bg-red-500/20 hover:text-red-400 text-slate-400 border border-slate-700/60 hover:border-red-500/30 transition-all text-xs outline-none cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
              title="کاهش گل مهمان"
            >
              <Minus size={14} />
            </button>
            <span className={`text-2xl font-bold font-mono w-8 text-center select-none ${isOfficial ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"}`}>
              {scoreB !== null ? scoreB : "-"}
            </span>
            <button
              id={`increment-b-${id}`}
              disabled={isOfficial || isLive}
              onClick={() => handleIncrement("B")}
              className="p-1 rounded-lg bg-slate-900 hover:bg-purple-500/20 hover:text-purple-400 text-slate-400 border border-slate-700/60 hover:border-purple-500/30 transition-all text-xs outline-none cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
              title="افزایش گل مهمان"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Clear prediction */}
        {scoreA !== null && scoreB !== null && !isOfficial && !isLive && (
          <button
            id={`clear-pred-${id}`}
            onClick={handleClearScore}
            className="text-[10px] text-slate-400 hover:text-pink-400 underline cursor-pointer duration-200 animate-fade-in"
          >
            حذف این پیش‌بینی
          </button>
        )}
      </div>

      {/* Team B Info / Random simulate */}
      <div id={`teamb-sec-${id}`} className="flex sm:flex-row-reverse items-center justify-end sm:justify-start gap-4 w-full sm:w-2/5 text-right sm:text-left">
        <TeamFlag team={teamB} className="w-10 h-6.5 hover:scale-110 duration-200 shadow-md filter drop-shadow select-none" />
        <div className="flex-1 sm:text-left">
          <div className="font-semibold text-slate-100 text-lg tracking-tight select-none">
            {teamB.name}
          </div>
          <div className="text-xs text-slate-400 font-mono tracking-wider">
            قدرت: {teamB.strength}%
          </div>
        </div>

        {/* Simulation roll button */}
        {!isOfficial && !isLive ? (
          <button
            id={`sim-button-${id}`}
            onClick={() => onSimulate(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-purple-300 hover:text-pink-300 border border-purple-500/20 hover:border-pink-500/40 text-xs font-semibold cursor-pointer active:scale-95 duration-200 outline-none select-none Persian-font"
            title="شبیه‌سازی خودکار بر اساس قدرت تیم‌ها"
          >
            <Dices size={14} />
            <span>شبیه‌سازی</span>
          </button>
        ) : (
          <div className="text-[11px] text-slate-500 flex items-center gap-1 select-none font-semibold font-sans">
            قفل شده 🛡️
          </div>
        )}
      </div>
    </motion.div>
  );
};

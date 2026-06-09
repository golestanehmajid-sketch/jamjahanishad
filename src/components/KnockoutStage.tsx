/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Team } from "../types";
import { Plus, Minus, Trophy, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TeamFlag } from "./TeamFlag";

interface KnockoutStateItem {
  scoreA: number | null;
  scoreB: number | null;
  winnerId?: string;
}

interface KnockoutStageProps {
  qualifiers: Record<string, { winner: Team; runnerUp: Team; third: Team }>; // Group A to L qualifiers derived from current standings
  bestThirds: Team[];
  predictions: Record<string, KnockoutStateItem>;
  onPredictionChange: (matchId: string, item: KnockoutStateItem) => void;
}

const STAGES = [
  { id: "R32", name: "یک‌سی‌ودوم نهایی", matchesCount: 16 },
  { id: "R16", name: "یک‌هشتم نهایی", matchesCount: 8 },
  { id: "QF", name: "یک‌چهارم نهایی", matchesCount: 4 },
  { id: "SF", name: "نیمه‌نهایی", matchesCount: 2 },
  { id: "FINAL", name: "فینال و رده‌بندی", matchesCount: 2 },
];

export const KnockoutStage: React.FC<KnockoutStageProps> = ({
  qualifiers,
  bestThirds,
  predictions,
  onPredictionChange,
}) => {
  const [activeStageId, setActiveStageId] = useState<string>("R32");

  // Helper to safely get qualifier by rank
  const getQualifier = (groupId: string, rank: 1 | 2): Team => {
    const q = qualifiers[groupId];
    if (q) {
      return rank === 1 ? q.winner : q.runnerUp;
    }
    // Fallback Mock Team
    return {
      id: `placeholder-${groupId}-${rank}`,
      name: `${rank === 1 ? "صدر" : "تیم دوم"} گروه ${groupId}`,
      nameEn: `${groupId}${rank}`,
      flag: "⚽",
      strength: 75,
    };
  };

  const getBestThirdQualifier = (rank: number): Team => {
    if (bestThirds && bestThirds[rank - 1]) {
      return bestThirds[rank - 1];
    }
    return {
      id: `placeholder-third-${rank}`,
      name: `تیم سوم برتر رتبه ${rank}`,
      nameEn: `3rd_${rank}`,
      flag: "⚽",
      strength: 72,
    };
  };

  // Resolve winner of a previous match
  const getWinnerOfMatch = (matchId: string, fallbackName: string): Team => {
    const pred = predictions[matchId];
    if (!pred || pred.scoreA === null || pred.scoreB === null) {
      return {
        id: `fallback-${matchId}`,
        name: `برنده ${fallbackName}`,
        nameEn: matchId,
        flag: "⚽",
        strength: 75,
      };
    }

    const { scoreA, scoreB, winnerId } = pred;

    // We need to resolve actual team objects assigned to the matchup
    const teams = getMatchupTeams(matchId);
    if (!teams) {
      return {
        id: `fallback-${matchId}`,
        name: `برنده ${fallbackName}`,
        nameEn: matchId,
        flag: "⚽",
        strength: 75,
      };
    }

    if (scoreA > scoreB) return teams.teamA;
    if (scoreB > scoreA) return teams.teamB;

    // Draw -> Check selected penalty winner
    if (winnerId) {
      return winnerId === teams.teamA.id ? teams.teamA : teams.teamB;
    }

    // Default to Team A as safeguard if they haven't chosen yet
    return teams.teamA;
  };

  // Resolve loser of a previous match
  const getLoserOfMatch = (matchId: string, fallbackName: string): Team => {
    const pred = predictions[matchId];
    if (!pred || pred.scoreA === null || pred.scoreB === null) {
      return {
        id: `fallback-loser-${matchId}`,
        name: `بازنده ${fallbackName}`,
        nameEn: matchId + "_loser",
        flag: "⚽",
        strength: 75,
      };
    }

    const { scoreA, scoreB, winnerId } = pred;
    const teams = getMatchupTeams(matchId);
    if (!teams) {
      return {
        id: `fallback-loser-${matchId}`,
        name: `بازنده ${fallbackName}`,
        nameEn: matchId + "_loser",
        flag: "⚽",
        strength: 75,
      };
    }

    const winningTeamId = scoreA > scoreB ? teams.teamA.id : (scoreB > scoreA ? teams.teamB.id : winnerId);
    return winningTeamId === teams.teamA.id ? teams.teamB : teams.teamA;
  };

  // Resolve team mappings for ALL matches
  const getMatchupTeams = (matchId: string): { teamA: Team; teamB: Team } | null => {
    // 1. ROUND OF 32 MATCHUPS
    // Winners play the 8 best 3rd placed teams:
    if (matchId === "R32_1") return { teamA: getQualifier("A", 1), teamB: getBestThirdQualifier(1) };
    if (matchId === "R32_2") return { teamA: getQualifier("B", 1), teamB: getBestThirdQualifier(2) };
    if (matchId === "R32_3") return { teamA: getQualifier("C", 1), teamB: getBestThirdQualifier(3) };
    if (matchId === "R32_4") return { teamA: getQualifier("D", 1), teamB: getBestThirdQualifier(4) };
    if (matchId === "R32_5") return { teamA: getQualifier("E", 1), teamB: getBestThirdQualifier(5) };
    if (matchId === "R32_6") return { teamA: getQualifier("F", 1), teamB: getBestThirdQualifier(6) };
    if (matchId === "R32_7") return { teamA: getQualifier("G", 1), teamB: getBestThirdQualifier(7) };
    if (matchId === "R32_8") return { teamA: getQualifier("H", 1), teamB: getBestThirdQualifier(8) };

    // Winners play Runners-up of I, J, K, L:
    if (matchId === "R32_9") return { teamA: getQualifier("I", 1), teamB: getQualifier("J", 2) };
    if (matchId === "R32_10") return { teamA: getQualifier("J", 1), teamB: getQualifier("I", 2) };
    if (matchId === "R32_11") return { teamA: getQualifier("K", 1), teamB: getQualifier("L", 2) };
    if (matchId === "R32_12") return { teamA: getQualifier("L", 1), teamB: getQualifier("K", 2) };

    // Runners-up of A, B, C, D, E, F, G, H play each other:
    if (matchId === "R32_13") return { teamA: getQualifier("A", 2), teamB: getQualifier("B", 2) };
    if (matchId === "R32_14") return { teamA: getQualifier("C", 2), teamB: getQualifier("D", 2) };
    if (matchId === "R32_15") return { teamA: getQualifier("E", 2), teamB: getQualifier("F", 2) };
    if (matchId === "R32_16") return { teamA: getQualifier("G", 2), teamB: getQualifier("H", 2) };

    // 2. ROUND OF 16 MATCHUPS
    if (matchId === "R16_1") return { teamA: getWinnerOfMatch("R32_1", "یک‌سی‌ودوم ۱"), teamB: getWinnerOfMatch("R32_2", "یک‌سی‌ودوم ۲") };
    if (matchId === "R16_2") return { teamA: getWinnerOfMatch("R32_3", "یک‌سی‌ودوم ۳"), teamB: getWinnerOfMatch("R32_4", "یک‌سی‌ودوم ۴") };
    if (matchId === "R16_3") return { teamA: getWinnerOfMatch("R32_5", "یک‌سی‌ودوم ۵"), teamB: getWinnerOfMatch("R32_6", "یک‌سی‌ودوم ۶") };
    if (matchId === "R16_4") return { teamA: getWinnerOfMatch("R32_7", "یک‌سی‌ودوم ۷"), teamB: getWinnerOfMatch("R32_8", "یک‌سی‌ودوم ۸") };
    if (matchId === "R16_5") return { teamA: getWinnerOfMatch("R32_9", "یک‌سی‌ودوم ۹"), teamB: getWinnerOfMatch("R32_10", "یک‌سی‌ودوم ۱۰") };
    if (matchId === "R16_6") return { teamA: getWinnerOfMatch("R32_11", "یک‌سی‌ودوم ۱۱"), teamB: getWinnerOfMatch("R32_12", "یک‌سی‌ودوم ۱۲") };
    if (matchId === "R16_7") return { teamA: getWinnerOfMatch("R32_13", "یک‌سی‌ودوم ۱۳"), teamB: getWinnerOfMatch("R32_14", "یک‌سی‌ودوم ۱۴") };
    if (matchId === "R16_8") return { teamA: getWinnerOfMatch("R32_15", "یک‌سی‌ودوم ۱۵"), teamB: getWinnerOfMatch("R32_16", "یک‌سی‌ودوم ۱۶") };

    // 3. QUARTERFINALS MATCHUPS
    if (matchId === "QF_1") return { teamA: getWinnerOfMatch("R16_1", "بازی ۱ یک‌هشتم"), teamB: getWinnerOfMatch("R16_2", "بازی ۲ یک‌هشتم") };
    if (matchId === "QF_2") return { teamA: getWinnerOfMatch("R16_3", "بازی ۳ یک‌هشتم"), teamB: getWinnerOfMatch("R16_4", "بازی ۴ یک‌هشتم") };
    if (matchId === "QF_3") return { teamA: getWinnerOfMatch("R16_5", "بازی ۵ یک‌هشتم"), teamB: getWinnerOfMatch("R16_6", "بازی ۶ یک‌هشتم") };
    if (matchId === "QF_4") return { teamA: getWinnerOfMatch("R16_7", "بازی ۷ یک‌هشتم"), teamB: getWinnerOfMatch("R16_8", "بازی ۸ یک‌هشتم") };

    // 4. SEMIFINALS MATCHUPS
    if (matchId === "SF_1") return { teamA: getWinnerOfMatch("QF_1", "بازی ۱ یک‌چهارم"), teamB: getWinnerOfMatch("QF_2", "بازی ۲ یک‌چهارم") };
    if (matchId === "SF_2") return { teamA: getWinnerOfMatch("QF_3", "بازی ۳ یک‌چهارم"), teamB: getWinnerOfMatch("QF_4", "بازی ۴ یک‌چهارم") };

    // 5. FINAL MATCHUPS
    if (matchId === "FINAL_1") return { teamA: getLoserOfMatch("SF_1", "بازنده ۱ نیمه‌نهایی"), teamB: getLoserOfMatch("SF_2", "بازنده ۲ نیمه‌نهایی") };
    if (matchId === "FINAL_2") return { teamA: getWinnerOfMatch("SF_1", "برنده ۱ نیمه‌نهایی"), teamB: getWinnerOfMatch("SF_2", "برنده ۲ نیمه‌نهایی") };

    return null;
  };

  const handleScoreChange = (matchId: string, updatedScoreA: number | null, updatedScoreB: number | null, winnerId?: string) => {
    const current = predictions[matchId] || { scoreA: null, scoreB: null };
    let finalWinnerId = winnerId;

    // Auto assign binary winners on scores if not a draw
    if (updatedScoreA !== null && updatedScoreB !== null) {
      const teams = getMatchupTeams(matchId);
      if (teams) {
        if (updatedScoreA > updatedScoreB) {
          finalWinnerId = teams.teamA.id;
        } else if (updatedScoreB > updatedScoreA) {
          finalWinnerId = teams.teamB.id;
        } else if (updatedScoreA === updatedScoreB && !winnerId) {
          // If draw and no winner chosen yet, keep current or default to team A
          finalWinnerId = current.winnerId || teams.teamA.id;
        }
      }
    }

    onPredictionChange(matchId, {
      scoreA: updatedScoreA,
      scoreB: updatedScoreB,
      winnerId: finalWinnerId,
    });
  };

  const handleSelectWinnerOnDraw = (matchId: string, teamId: string) => {
    const current = predictions[matchId];
    if (current && current.scoreA !== null && current.scoreB !== null) {
      onPredictionChange(matchId, {
        ...current,
        winnerId: teamId,
      });
    }
  };

  // Compile active stage matches to render
  const renderMatchesForActiveStage = () => {
    const activeStage = STAGES.find((s) => s.id === activeStageId);
    if (!activeStage) return null;

    const matchesList: { id: string; label: string }[] = [];
    for (let i = 1; i <= activeStage.matchesCount; i++) {
      let customLabel = `مسابقه شماره ${i}`;
      if (activeStageId === "FINAL") {
        if (i === 1) customLabel = "بازی رده‌بندی (تعیین رتبه سوم و چهارم)";
        if (i === 2) customLabel = "مسابقه فینال بزرگ قهرمانی جهان 🏆";
      } else if (activeStageId === "SF") {
        customLabel = `بازی نیمه‌نهایی شماره ${i}`;
      } else if (activeStageId === "QF") {
        customLabel = `بازی یک‌چهارم نهایی شماره ${i}`;
      } else if (activeStageId === "R16") {
        customLabel = `بازی یک‌هشتم نهایی شماره ${i}`;
      } else if (activeStageId === "R32") {
        customLabel = `بازی یک‌سی‌ودوم نهایی شماره ${i}`;
      }
      matchesList.push({
        id: `${activeStageId}_${i}`,
        label: customLabel,
      });
    }

    return (
      <div id={`knockout-matches-grid-${activeStageId}`} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {matchesList.map((matchItem) => {
          const matchup = getMatchupTeams(matchItem.id);
          const pred = predictions[matchItem.id] || { scoreA: null, scoreB: null };

          if (!matchup) return null;

          const isPlaceholderA = matchup.teamA.id.startsWith("placeholder") || matchup.teamA.id.startsWith("fallback");
          const isPlaceholderB = matchup.teamB.id.startsWith("placeholder") || matchup.teamB.id.startsWith("fallback");
          const scoreA = pred.scoreA;
          const scoreB = pred.scoreB;
          const isDraw = scoreA !== null && scoreB !== null && scoreA === scoreB;

          return (
            <motion.div
              id={`ko-card-${matchItem.id}`}
              key={matchItem.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-xl flex flex-col justify-between hover:border-purple-500/40 hover:shadow-purple-500/5 duration-300"
            >
              {/* Match header */}
              <div id={`ko-header-${matchItem.id}`} className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-white/5 pb-2 mb-3">
                <span className="bg-slate-950 px-2 py-0.5 rounded-md font-mono border border-white/5">{matchItem.id}</span>
                <span>{matchItem.label}</span>
              </div>

              {/* Contestants */}
              <div id={`ko-teams-${matchItem.id}`} className="flex flex-col gap-3">
                {/* Team A */}
                <div
                  id={`ko-teama-${matchItem.id}`}
                  className={`flex items-center justify-between p-2 rounded-xl transition ${
                    pred.scoreA !== null && pred.scoreB !== null && pred.winnerId === matchup.teamA.id
                      ? "bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent border border-pink-500/30 text-pink-300 shadow shadow-pink-950/20"
                      : "border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TeamFlag team={matchup.teamA} className="w-8 h-5.5 hover:scale-110 duration-200 shadow-sm filter drop-shadow" />
                    <div>
                      <span className={`font-semibold  ${isPlaceholderA ? "text-slate-500 italic text-xs" : "text-slate-200"}`}>
                        {matchup.teamA.name}
                      </span>
                      {!isPlaceholderA && (
                        <div className="text-[9px] text-slate-400 font-mono">قدرت: {matchup.teamA.strength}%</div>
                      )}
                    </div>
                  </div>

                  {/* Score inputs */}
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`dec-ko-a-${matchItem.id}`}
                      disabled={isPlaceholderA || isPlaceholderB}
                      onClick={() => handleScoreChange(matchItem.id, Math.max(0, (scoreA || 0) - 1), scoreB || 0)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-purple-500/30 text-slate-300 disabled:opacity-30 disabled:pointer-events-none text-xs cursor-pointer"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="font-mono text-xl font-bold text-center w-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                      {scoreA !== null ? scoreA : "-"}
                    </span>
                    <button
                      id={`inc-ko-a-${matchItem.id}`}
                      disabled={isPlaceholderA || isPlaceholderB}
                      onClick={() => handleScoreChange(matchItem.id, Math.min(9, (scoreA || 0) + 1), scoreB || 0)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-purple-500/30 text-slate-300 disabled:opacity-30 disabled:pointer-events-none text-xs cursor-pointer"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>

                {/* Team B */}
                <div
                  id={`ko-teamb-${matchItem.id}`}
                  className={`flex items-center justify-between p-2 rounded-xl transition ${
                    pred.scoreA !== null && pred.scoreB !== null && pred.winnerId === matchup.teamB.id
                      ? "bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent border border-pink-500/30 text-pink-300 shadow shadow-pink-950/20"
                      : "border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TeamFlag team={matchup.teamB} className="w-8 h-5.5 hover:scale-110 duration-200 shadow-sm filter drop-shadow" />
                    <div>
                      <span className={`font-semibold ${isPlaceholderB ? "text-slate-500 italic text-xs" : "text-slate-200"}`}>
                        {matchup.teamB.name}
                      </span>
                      {!isPlaceholderB && (
                        <div className="text-[9px] text-slate-400 font-mono">قدرت: {matchup.teamB.strength}%</div>
                      )}
                    </div>
                  </div>

                  {/* Score inputs */}
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`dec-ko-b-${matchItem.id}`}
                      disabled={isPlaceholderA || isPlaceholderB}
                      onClick={() => handleScoreChange(matchItem.id, scoreA || 0, Math.max(0, (scoreB || 0) - 1))}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-purple-500/30 text-slate-300 disabled:opacity-30 disabled:pointer-events-none text-xs cursor-pointer"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="font-mono text-xl font-bold text-center w-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                      {scoreB !== null ? scoreB : "-"}
                    </span>
                    <button
                      id={`inc-ko-b-${matchItem.id}`}
                      disabled={isPlaceholderA || isPlaceholderB}
                      onClick={() => handleScoreChange(matchItem.id, scoreA || 0, Math.min(9, (scoreB || 0) + 1))}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-purple-500/30 text-slate-300 disabled:opacity-30 disabled:pointer-events-none text-xs cursor-pointer"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Draw / Penalty resolver */}
              {scoreA !== null && scoreB !== null && scoreA === scoreB && (
                <div id={`ko-penalty-${matchItem.id}`} className="mt-3 pt-3 border-t border-white/5 bg-slate-950/40 p-2 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[11px] text-pink-400 font-semibold flex items-center gap-1 justify-center Persian-font leading-none">
                    <Trophy size={11} className="text-yellow-400 animate-pulse" />
                    مساوی در زمان قانونی! برنده پنالتی‌ها کیست؟
                  </span>
                  <div className="flex justify-center gap-2 mt-1">
                    <button
                      id={`pan-seta-${matchItem.id}`}
                      onClick={() => handleSelectWinnerOnDraw(matchItem.id, matchup.teamA.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1 duration-150 cursor-pointer ${
                        pred.winnerId === matchup.teamA.id
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          : "bg-slate-900 text-slate-400 border-white/5 hover:bg-slate-800"
                      }`}
                    >
                      {pred.winnerId === matchup.teamA.id && <Check size={10} />}
                      {matchup.teamA.name}
                    </button>
                    <button
                      id={`pan-setb-${matchItem.id}`}
                      onClick={() => handleSelectWinnerOnDraw(matchItem.id, matchup.teamB.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1 duration-150 cursor-pointer ${
                        pred.winnerId === matchup.teamB.id
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          : "bg-slate-900 text-slate-400 border-white/5 hover:bg-slate-800"
                      }`}
                    >
                      {pred.winnerId === matchup.teamB.id && <Check size={10} />}
                      {matchup.teamB.name}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Champion visualization card at the top/center of final stage
  const championshipCelebration = () => {
    const finalWinner = getWinnerOfMatch("FINAL_2", "قهرمان نهایی");
    const finalPred = predictions["FINAL_2"];

    if (!finalPred || finalPred.scoreA === null || finalPred.scoreB === null) {
      return null;
    }

    const isWinnerPlaceholder = finalWinner.id.startsWith("fallback") || finalWinner.id.startsWith("placeholder");

    if (isWinnerPlaceholder) return null;

    return (
      <motion.div
        id="championship-podium"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8 p-6 bg-gradient-to-r from-amber-500/15 via-yellow-500/25 to-pink-500/15 border-2 border-yellow-500/40 rounded-3xl flex flex-col items-center justify-center text-center shadow-lg shadow-purple-950/20"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 4, repeatDelay: 1 }}
          className="bg-amber-500/25 p-4 rounded-full border border-yellow-500/40 mb-3 shadow shadow-yellow-500/20"
        >
          <Trophy size={48} className="text-yellow-400" />
        </motion.div>
        <span className="text-[10px] text-yellow-300 tracking-widest font-black uppercase flex items-center gap-1 select-none">
          <Sparkles size={11} className="text-pink-400" /> قهرمان نهایی انتخابی شما <Sparkles size={11} className="text-pink-400" />
        </span>
        <h2 className="text-3xl font-extrabold text-white mt-1.5 flex items-center gap-2 select-none">
          <TeamFlag team={finalWinner} className="w-14 h-9 hover:scale-110 duration-200 shadow-lg filter drop-shadow select-none" />
          <span className="bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">{finalWinner.name}</span>
        </h2>
        <p className="text-slate-200 text-xs sm:text-sm max-w-md mt-2 Persian-font leading-relaxed">
          تبریک! نوجوان گرامی، شما مسیر مسابقات جام جهانی را تا انتها پیش‌بینی کردید و تیم{" "}
          <strong className="text-pink-400">{finalWinner.name}</strong> را به عنوان مالک جام طلایی شبیه‌سازی کردید!
        </p>
      </motion.div>
    );
  };

  return (
    <div id="knockout-stage-container" className="flex flex-col gap-6">
      {/* Visual podium for champion */}
      {activeStageId === "FINAL" && championshipCelebration()}

      {/* Modern Stage Selector Menu - styled beautifully for teenagers */}
      <div id="knockout-nav-tabs" className="flex flex-wrap items-center justify-center gap-2 bg-slate-900/60 p-2 rounded-2xl border border-white/5 shadow-inner">
        {STAGES.map((s) => (
          <button
            id={`tab-ko-${s.id}`}
            key={s.id}
            onClick={() => setActiveStageId(s.id)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm duration-200 flex items-center gap-2 cursor-pointer outline-none transition-all ${
              activeStageId === s.id
                ? "bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 font-black scale-102"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            {s.id === "FINAL" && <Trophy size={14} className="text-yellow-400" />}
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* Guide text */}
      <div id="ko-stage-guide" className="bg-slate-900/40 rounded-xl px-4 py-3 border border-white/5 text-xs text-slate-400 Persian-font leading-relaxed flex items-center gap-2 shadow-sm">
        <span className="w-1.5 h-1.5 bg-pink-500 rounded-full flex-shrink-0 animate-ping"></span>
        <span>
          مرحله حذفی با توجه به رتبه‌های انتخابی شما در مرحله گروهی به‌صورت خودکار به‌روز و پر می‌شود. برای تکمیل هر بازی، کافیست امتیاز پیش‌بینی را وارد فرمایید.
        </span>
      </div>

      {/* Active Stage Matches */}
      <AnimatePresence mode="wait">
        <motion.div
          id={`ko-matchlist-${activeStageId}`}
          key={activeStageId}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
        >
          {renderMatchesForActiveStage()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

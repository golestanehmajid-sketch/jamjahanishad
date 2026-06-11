/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { GroupStanding, Team } from "../types";
import { TEAMS } from "../data";
import { Award, ArrowUpRight } from "lucide-react";
import { TeamFlag } from "./TeamFlag";
import { motion, AnimatePresence } from "motion/react";

interface GroupStandingsProps {
  groupId: string;
  standings: GroupStanding[];
}

export const GroupStandings: React.FC<GroupStandingsProps> = ({ groupId, standings }) => {
  return (
    <div
      id={`standings-table-container-${groupId}`}
      className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl overflow-hidden hover:border-purple-500/30 transition-all duration-300"
    >
      {/* Header */}
      <div id={`standings-header-${groupId}`} className="bg-slate-950/80 inset-shadow px-5 py-3.5 flex items-center justify-between border-b border-white/5">
        <h3 className="text-normal font-bold text-slate-100 flex items-center gap-2">
          <span className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-400 p-1.5 rounded-lg text-sm font-mono border border-pink-500/20 shadow-sm">
            گروه {groupId}
          </span>
          <span>جدول رده‌بندی گروهی</span>
        </h3>
        <span className="text-xs text-slate-400 font-medium">به‌روزرسانی خودکار</span>
      </div>

      {/* Table */}
      <div id={`standings-table-row-${groupId}`} className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="text-slate-400 text-xs bg-slate-950/40 uppercase border-b border-white/5 font-semibold">
            <tr>
              <th className="px-4 py-3 text-center w-12">رتبه</th>
              <th className="px-4 py-3 text-right">تیم</th>
              <th className="px-3 py-3 text-center">بازی</th>
              <th className="px-3 py-3 text-center">برد</th>
              <th className="px-3 py-3 text-center">مساوی</th>
              <th className="px-3 py-3 text-center">باخت</th>
              <th className="px-3 py-3 text-center">تفاضل</th>
              <th className="px-4 py-3 text-center font-bold text-slate-300">امتیاز</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence mode="popLayout">
              {standings.map((row, index) => {
                const team: Team = TEAMS[row.teamId];
                const isQualified = index < 2; // Top 2 teams advance

                return (
                  <motion.tr
                    id={`standing-row-${groupId}-${team.id}`}
                    key={row.teamId}
                    layoutId={`standing-row-layout-${groupId}-${team.id}`}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                      mass: 0.8
                    }}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isQualified ? "bg-purple-950/10" : ""
                    }`}
                  >
                    {/* Position */}
                    <td className="px-4 py-3.5 text-center font-mono">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          isQualified
                            ? "bg-gradient-to-tr from-pink-500 to-purple-500 text-white shadow-sm"
                            : "bg-slate-950/80 text-slate-400 border border-white/5"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>

                    {/* Team details */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <TeamFlag team={team} className="w-7 h-5 hover:scale-110 duration-200 shadow-sm filter drop-shadow select-none" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-100 flex items-center gap-1.5 leading-none">
                            {team.name}
                            {isQualified && (
                              <span
                                className="inline-flex items-center gap-0.5 text-[9px] font-bold text-pink-300 bg-pink-500/10 px-1.5 py-0.5 rounded-full border border-pink-500/20 hover:scale-105 duration-100 cursor-default select-none group"
                                title="صعود به مرحله حذفی"
                              >
                                <ArrowUpRight size={8} />
                                صعود
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono tracking-wide mt-1">
                            {team.nameEn} (قدرت: {team.strength})
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Played */}
                    <td className="px-3 py-3.5 text-center font-mono text-slate-300">
                      {row.played}
                    </td>

                    {/* Won */}
                    <td className="px-3 py-3.5 text-center font-mono text-slate-300">
                      {row.won}
                    </td>

                    {/* Drawn */}
                    <td className="px-3 py-3.5 text-center font-mono text-slate-300">
                      {row.drawn}
                    </td>

                    {/* Lost */}
                    <td className="px-3 py-3.5 text-center font-mono text-slate-300">
                      {row.lost}
                    </td>

                    {/* Goal Difference */}
                    <td
                      className={`px-3 py-3.5 text-center font-mono font-semibold ${
                        row.goalDifference > 0
                          ? "text-cyan-400"
                          : row.goalDifference < 0
                          ? "text-rose-400"
                          : "text-slate-400"
                      }`}
                    >
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </td>

                    {/* Points */}
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-base text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                      {row.points}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Info indicator */}
      <div id={`standings-footer-${groupId}`} className="bg-slate-950/20 px-5 py-2.5 flex items-center justify-start text-xs text-slate-400 space-x-2 border-t border-white/5">
        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 mr-2"></span>
        <span>دو تیم برتر مشخص شده با برچسب صعود، به مرحله یک‌هشتم نهایی راه می‌یابند.</span>
      </div>
    </div>
  );
};

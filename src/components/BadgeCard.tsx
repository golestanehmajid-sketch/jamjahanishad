/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Achievement } from "../types";
import { Zap, Heart, Flame, ShieldAlert, CheckCircle, Award, Crown, Lock } from "lucide-react";
import { motion } from "motion/react";

interface BadgeCardProps {
  achievement: Achievement;
}

// Map strings to dynamic Lucide components
const IconComponent: React.FC<{ name: string; size?: number; className?: string }> = ({
  name,
  size = 24,
  className,
}) => {
  switch (name) {
    case "Zap":
      return <Zap size={size} className={className} />;
    case "Heart":
      return <Heart size={size} className={className} />;
    case "Flame":
      return <Flame size={size} className={className} />;
    case "ShieldAlert":
      return <ShieldAlert size={size} className={className} />;
    case "CheckCircle":
      return <CheckCircle size={size} className={className} />;
    case "Award":
      return <Award size={size} className={className} />;
    case "Crown":
      return <Crown size={size} className={className} />;
    default:
      return <Award size={size} className={className} />;
  }
};

export const BadgeCard: React.FC<BadgeCardProps> = ({ achievement }) => {
  const { title, description, iconName, unlocked, color, id } = achievement;

  return (
    <motion.div
      id={`badge-card-${id}`}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative rounded-2xl border p-5 flex items-start gap-4 transition-all duration-300 overflow-hidden ${
        unlocked
          ? `bg-slate-900/80 border-white/10 hover:border-purple-500/50 shadow-xl shadow-purple-950/20`
          : "bg-slate-900/40 border-white/5 grayscale text-slate-500"
      }`}
    >
      {/* Dynamic Glowing background if unlocked */}
      {unlocked && (
        <div id={`badge-glow-${id}`} className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/15 via-transparent to-transparent rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
      )}

      {/* Badge Icon Slot */}
      <div
        id={`badge-icon-slot-${id}`}
        className={`flex-shrink-0 p-3.5 rounded-2xl border ${
          unlocked
            ? `bg-gradient-to-tr ${color} border-white/10 text-white shadow-md shadow-purple-950/50`
            : "bg-slate-850 border-white/5 text-slate-500"
        }`}
      >
        <IconComponent name={iconName} className={unlocked ? "animate-pulse" : ""} />
      </div>

      {/* Text Details */}
      <div id={`badge-info-${id}`} className="flex-1 flex flex-col pt-0.5">
        <h4
          className={`font-extrabold text-base tracking-tight flex items-center gap-1.5 leading-none ${
            unlocked ? "text-slate-100" : "text-slate-500"
          }`}
        >
          {title}
          {!unlocked && <Lock size={12} className="text-slate-600 inline" />}
        </h4>
          <p className="text-xs text-slate-400 mt-2.5 leading-relaxed font-medium Persian-font">
          {description}
        </p>

        {/* Unlocked marker */}
        {unlocked && (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-pink-400 mt-3 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></span>
            آزاد شده
          </span>
        )}
      </div>
    </motion.div>
  );
};

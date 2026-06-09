/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, Trophy, Award, Gift, Check, Flame, Zap, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GiftItem {
  id: string;
  name: string;
  emoji: string;
  requirement: string;
  description: string;
  checkUnlocked: () => boolean;
  effectName: string;
}

interface TeensGiftHubProps {
  predictedCount: number;
  hasFavoriteTeam: boolean;
  iranEnthusiasm: number;
  totalGoals: number;
  unlockedBadgesCount: number;
  onApplyGiftEffect: (effectId: string, active: boolean) => void;
  activeEffects: Record<string, boolean>;
  userName: string;
}

export const TeensGiftHub: React.FC<TeensGiftHubProps> = ({
  predictedCount,
  hasFavoriteTeam,
  iranEnthusiasm,
  totalGoals,
  unlockedBadgesCount,
  onApplyGiftEffect,
  activeEffects,
  userName,
}) => {
  const [claimedGifts, setClaimedGifts] = useState<Record<string, boolean>>(() => {
    const local = localStorage.getItem("wc_predictor_claimed_gifts");
    return local ? JSON.parse(local) : {};
  });

  const [recentClaimedWord, setRecentClaimedWord] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("wc_predictor_claimed_gifts", JSON.stringify(claimedGifts));
  }, [claimedGifts]);

  // Define the dynamic teenagers gifts list
  const gifts: GiftItem[] = [
    {
      id: "gift_ball",
      name: "توپ طلایی نئونی درخشان",
      emoji: "⚽✨",
      requirement: "پیش‌بینی حداقل ۵ بازی گروهی",
      description: "با فعال‌سازی این هدیه، حاشیه درخشان نئونی و افکت سایه روی تمام بازی‌ها فعال می‌شود!",
      checkUnlocked: () => predictedCount >= 5,
      effectName: "نئون طلایی مسابقات"
    },
    {
      id: "gift_avatar",
      name: "کارت ویژه خبرنگار طلایی",
      emoji: "🎫🔥",
      requirement: "پیش‌بینی حداقل ۱۵ بازی گروهی",
      description: "اضافه کردن پیشوند افسانه‌ای خبرنگار خلاق به کاربری شما و تغییر دکمه‌ها به طلایی متحرک.",
      checkUnlocked: () => predictedCount >= 15,
      effectName: "لقب خبرنگار خلاق"
    },
    {
      id: "gift_sound",
      name: "شیپور بمب صوتی هوگو",
      emoji: "🎺🔊",
      requirement: "انتخاب یک تیم محبوب و هواداری",
      description: "باز کردن قابلیت تولید افکت صوتی ریتمیک سه بعدی هیجان‌انگیز استادیومی با کلیک مجدد.",
      checkUnlocked: () => hasFavoriteTeam,
      effectName: "تقویت بمب صدا"
    },
    {
      id: "gift_vuvuzela",
      name: "طبل جنگی یوزهای آسیا",
      emoji: "🥁🌟",
      requirement: "رسیدن به سطح هیجان بالای ۶۰٪ در کلوپ ایران",
      description: "باز شدن امواج ضربانی سبز و قرمز و پس‌زمینه لرزان پرچم در بخش بالایی برنامه.",
      checkUnlocked: () => iranEnthusiasm >= 60,
      effectName: "شبیه‌ساز جنگلی طبل‌ها"
    },
    {
      id: "gift_crown",
      name: "تاج امپراتوری پیش‌گویان",
      emoji: "👑💎",
      requirement: "کسب حداقل ۴ مدال و نشان فوتبال",
      description: "تاج‌گذاری نهایی کاربری فانتزی با المان‌های درخشان الماس چند رنگ روی پروفایل کاربری.",
      checkUnlocked: () => unlockedBadgesCount >= 4,
      effectName: "تاج پروفایل درخشان"
    }
  ];

  const handleClaim = (gift: GiftItem) => {
    if (!gift.checkUnlocked() || claimedGifts[gift.id]) return;

    // Save claim status
    setClaimedGifts((prev) => ({
      ...prev,
      [gift.id]: true,
    }));

    // Trigger sweet sound effect!
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      // Beautiful shiny arpeggio effect
      const now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
      
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      
      osc.start();
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn(e);
    }

    // Set popup feedback
    setRecentClaimedWord(`تبریک! هدیه "${gift.name}" فعال و در حساب شما ثبت شد! 🎁🌟`);
    onApplyGiftEffect(gift.id, true);

    setTimeout(() => {
      setRecentClaimedWord(null);
    }, 4500);
  };

  const handleToggleEffect = (giftId: string) => {
    if (!claimedGifts[giftId]) return;
    const isNowActive = !activeEffects[giftId];
    onApplyGiftEffect(giftId, isNowActive);

    // sound confirmation click
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(isNowActive ? 800 : 400, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
  };

  return (
    <div id="teens-rewards-section" className="bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/15 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      
      {/* Absolute decorative gradient highlights */}
      <div className="absolute top-0 left-0 w-32 h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full" />
      <div className="absolute -top-16 -left-16 w-36 h-36 bg-purple-500/5 rounded-full filter blur-2xl pointer-events-none" />

      {/* Header text */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
            <Gift size={20} className="font-extrabold animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[10px] bg-purple-500/15 text-purple-400 font-extrabold px-2.5 py-1 rounded-full border border-purple-500/30">سیستم پاداش دیجیتال</span>
              <span className="text-[10px] bg-pink-500/15 text-pink-400 font-extrabold px-2.5 py-1 rounded-full border border-pink-500/30">جدید نوجوانان</span>
            </div>
            <h3 className="text-base font-black text-slate-100 flex items-center gap-2 mt-1">
              <span>گنجینه هدایا و پاداش‌های فانتزی نوجوانان</span>
              <span className="text-xs text-yellow-400 select-none">🎁👑</span>
            </h3>
          </div>
        </div>

        <div className="text-[10.5px] text-slate-400 max-w-sm Persian-font leading-relaxed">
          <strong>چرا طلا بگیری؟</strong> با پیش‌روی و پر کردن خانه‌های پیش‌بینی جدول و تعامل با برنامه، این هدایای شگفت‌انگیز را باز کنید، پاداش‌های فانتزی را لمس کنید و از استایل‌های بصری جدید لذت ببرید!
        </div>
      </div>

      {/* Claim success notice popup */}
      <AnimatePresence>
        {recentClaimedWord && (
          <motion.div
            id="gift-claim-toast"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="mb-4 bg-gradient-to-r from-yellow-500 via-amber-600 to-orange-600 text-slate-950 px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-yellow-500/15"
          >
            <Sparkles size={14} className="animate-spin text-slate-950" />
            <span>{recentClaimedWord}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gifts horizontal/flex list wrapper */}
      <div id="rewards-cabinets" className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {gifts.map((g) => {
          const isUnlocked = g.checkUnlocked();
          const isClaimed = claimedGifts[g.id];
          const isEffectActive = activeEffects[g.id];

          return (
            <div
              id={`cabinet-slot-${g.id}`}
              key={g.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between items-center text-center transition-all duration-300 relative ${
                isClaimed
                  ? "bg-slate-950/60 border-purple-500/30 shadow-inner"
                  : isUnlocked
                  ? "bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5 hover:-translate-y-1"
                  : "bg-slate-950/20 border-white/5 opacity-65"
              }`}
            >
              {/* Star sparkles for unlocked unclaimed gems */}
              {isUnlocked && !isClaimed && (
                <div className="absolute top-2 right-2 text-yellow-400 select-none animate-pulse text-[10px]">⭐</div>
              )}

              {/* Large Reward Emoji Illustration */}
              <div className="relative mb-2 select-none group">
                <div className={`text-4xl filter drop-shadow transition-transform duration-200 group-hover:scale-125 ${isUnlocked ? "animate-bounce" : "grayscale opacity-40"}`}>
                  {g.emoji}
                </div>
              </div>

              {/* Label Info */}
              <div className="space-y-1 w-full flex-1 mb-3">
                <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{g.name}</h4>
                <p className="text-[8.5px] font-medium text-slate-400 min-h-[30px] line-clamp-3 leading-tight select-none px-1">
                  {g.description}
                </p>
                
                {/* Condition box */}
                <div className="bg-slate-900/60 p-1 rounded-lg border border-white/5 text-[8px] font-bold text-slate-400 flex items-center justify-center gap-0.5 min-h-[18px]">
                  {isUnlocked ? (
                    <span className="text-emerald-400 flex items-center gap-0.5"><Check size={8} /> پیش‌شرط انجام شد</span>
                  ) : (
                    <span className="text-pink-400">{g.requirement}</span>
                  )}
                </div>
              </div>

              {/* Action interactive trigger button */}
              <div className="w-full">
                {!isClaimed ? (
                  <button
                    id={`claim-btn-${g.id}`}
                    onClick={() => handleClaim(g)}
                    disabled={!isUnlocked}
                    className={`w-full py-1.5 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer select-none outline-none ${
                      isUnlocked
                        ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 hover:opacity-90 shadow shadow-amber-500/25 cursor-pointer"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                    }`}
                  >
                    {!isUnlocked ? "🔒 قفل است" : "🎁 باز کردن بسته"}
                  </button>
                ) : (
                  <button
                    id={`toggle-effect-btn-${g.id}`}
                    onClick={() => handleToggleEffect(g.id)}
                    className={`w-full py-1.5 px-2.5 rounded-xl text-[10px] font-black transition-all cursor-pointer select-none outline-none flex items-center justify-center gap-1 border ${
                      isEffectActive
                        ? "bg-purple-500/10 border-purple-500/60 text-purple-300 shadow shadow-purple-500/15"
                        : "bg-slate-900 border-white/5 text-slate-400"
                    }`}
                    title="برای فعال/غیرفعال‌سازی این ویژگی کلیک کنید"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                    <span>{isEffectActive ? "فعال شده" : "غیرفعال"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

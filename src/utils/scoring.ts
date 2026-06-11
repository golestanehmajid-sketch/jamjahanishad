/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// محاسبه امتیاز برای یک بازی تکی
export const calculateMatchPoints = (
  prediction: { scoreA: number; scoreB: number },
  actual: { scoreA: number; scoreB: number },
  isKnockout: boolean = false
): number => {
  const points = {
    EXACT_SCORE: isKnockout ? 7 : 5,
    CORRECT_OUTCOME: isKnockout ? 4 : 3,
  };

  // ۱. پیشبینی دقیق
  if (prediction.scoreA === actual.scoreA && prediction.scoreB === actual.scoreB) {
    return points.EXACT_SCORE;
  }

  // ۲. تشخیص درست برنده یا مساوی
  const predDiff = prediction.scoreA - prediction.scoreB;
  const actualDiff = actual.scoreA - actual.scoreB;

  if (
    (predDiff > 0 && actualDiff > 0) || // برد تیم A
    (predDiff < 0 && actualDiff < 0) || // برد تیم B
    (predDiff === 0 && actualDiff === 0) // مساوی
  ) {
    return points.CORRECT_OUTCOME;
  }

  return 0;
};

// سیستم لِوِل و عنوان‌های تشویقی بر اساس امتیاز
export const getUserLevel = (points: number) => {
  if (points < 20) return { level: 1, title: "تازهکار ⚽" };
  if (points < 50) return { level: 2, title: "شکارچی گل 🎯" };
  if (points < 100) return { level: 3, title: "استاد جدول 📋" };
  if (points < 200) return { level: 4, title: "مغز حذفی 🧠" };
  return { level: 5, title: "پیشگوی بزرگ 🔮" };
};

// نگاشت نشان‌های افتخار (Badges) به آیکون و برچسب
export const BADGE_CONFIG = {
  FIRST_KICK: { label: "شروع طوفانی", icon: "Zap", desc: "اولین پیشبینی درست", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  EXACT_MASTER: { label: "دقیق‌زن", icon: "Target", desc: "۳ پیشبینی دقیق", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  STREAK_3: { label: "روی غلتک", icon: "Flame", desc: "۳ برد پیاپی کارشناسی", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  GROUP_WIZARD: { label: "جادوگر گروهی", icon: "Sparkles", desc: "پیشبینی همه راند گروهی", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  KNOCKOUT_NINJA: { label: "نینجای حذفی", icon: "Award", desc: "پاداش مرحله حذفی", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  CHAMPION_PROPHET: { label: "نوستراداموس", icon: "Crown", desc: "حدس درست قهرمان نهایی", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
};

export type BadgeKey = keyof typeof BADGE_CONFIG;

/**
 * Helper to dynamically determine badges based on scores/predictions
 */
export const deriveBadgesForScore = (score: number, predictionsCount: number): BadgeKey[] => {
  const list: BadgeKey[] = [];
  if (score > 0) {
    list.push("FIRST_KICK");
  }
  if (score >= 40) {
    list.push("EXACT_MASTER");
  }
  if (score >= 70) {
    list.push("STREAK_3");
  }
  if (predictionsCount >= 36) {
    list.push("GROUP_WIZARD");
  }
  if (predictionsCount >= 44 && score >= 90) {
    list.push("KNOCKOUT_NINJA");
  }
  if (score >= 95) {
    list.push("CHAMPION_PROPHET");
  }
  return list;
};

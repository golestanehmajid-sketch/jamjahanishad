/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Team, Match, Group } from "./types";

export const TEAMS: Record<string, Team> = {
  // Group A
  mexico: { id: "mexico", name: "مکزیک", nameEn: "Mexico", flag: "🇲🇽", strength: 78 },
  southafrica: { id: "southafrica", name: "آفریقای جنوبی", nameEn: "South Africa", flag: "🇿🇦", strength: 71 },
  korea: { id: "korea", name: "کره جنوبی", nameEn: "South Korea", flag: "🇰🇷", strength: 79 },
  czech: { id: "czech", name: "جمهوری چک", nameEn: "Czech Republic", flag: "🇨🇿", strength: 76 },

  // Group B
  canada: { id: "canada", name: "کانادا", nameEn: "Canada", flag: "🇨🇦", strength: 75 },
  bosnia: { id: "bosnia", name: "بوسنی و هرزگوین", nameEn: "Bosnia & Herzegovina", flag: "🇧🇦", strength: 73 },
  qatar: { id: "qatar", name: "قطر", nameEn: "Qatar", flag: "🇶🇦", strength: 75 },
  switzerland: { id: "switzerland", name: "سوئیس", nameEn: "Switzerland", flag: "🇨🇭", strength: 78 },

  // Group C
  brazil: { id: "brazil", name: "برزیل", nameEn: "Brazil", flag: "🇧🇷", strength: 91 },
  morocco: { id: "morocco", name: "مراکش", nameEn: "Morocco", flag: "🇲🇦", strength: 82 },
  haiti: { id: "haiti", name: "هایتی", nameEn: "Haiti", flag: "🇭🇹", strength: 66 },
  scotland: { id: "scotland", name: "اسکاتلند", nameEn: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", strength: 74 },

  // Group D
  usa: { id: "usa", name: "آمریکا", nameEn: "USA", flag: "🇺🇸", strength: 80 },
  paraguay: { id: "paraguay", name: "پاراگوئه", nameEn: "Paraguay", flag: "🇵🇾", strength: 73 },
  australia: { id: "australia", name: "استرالیا", nameEn: "Australia", flag: "🇦🇺", strength: 74 },
  turkey: { id: "turkey", name: "ترکیه", nameEn: "Turkey", flag: "🇹🇷", strength: 77 },

  // Group E
  germany: { id: "germany", name: "آلمان", nameEn: "Germany", flag: "🇩🇪", strength: 84 },
  curacao: { id: "curacao", name: "کوراسائو", nameEn: "Curaçao", flag: "🇨🇼", strength: 65 },
  ivorycoast: { id: "ivorycoast", name: "ساحل عاج", nameEn: "Ivory Coast", flag: "🇨🇮", strength: 76 },
  ecuador: { id: "ecuador", name: "اکوادور", nameEn: "Ecuador", flag: "🇪🇨", strength: 75 },

  // Group F
  netherlands: { id: "netherlands", name: "هلند", nameEn: "Netherlands", flag: "🇳🇱", strength: 84 },
  japan: { id: "japan", name: "ژاپن", nameEn: "Japan", flag: "🇯🇵", strength: 81 },
  sweden: { id: "sweden", name: "سوئد", nameEn: "Sweden", flag: "🇸🇪", strength: 77 },
  tunisia: { id: "tunisia", name: "تونس", nameEn: "Tunisia", flag: "🇹🇳", strength: 72 },

  // Group G
  belgium: { id: "belgium", name: "بلژیک", nameEn: "Belgium", flag: "🇧🇪", strength: 82 },
  egypt: { id: "egypt", name: "مصر", nameEn: "Egypt", flag: "🇪🇬", strength: 75 },
  iran: { id: "iran", name: "ایران", nameEn: "Iran", flag: "🇮🇷", strength: 81 },
  newzealand: { id: "newzealand", name: "نیوزیلند", nameEn: "New Zealand", flag: "🇳🇿", strength: 68 },

  // Group H
  spain: { id: "spain", name: "اسپانیا", nameEn: "Spain", flag: "🇪🇸", strength: 86 },
  capeverde: { id: "capeverde", name: "کیپ ورد", nameEn: "Cape Verde", flag: "🇨🇻", strength: 72 },
  saudi: { id: "saudi", name: "عربستان", nameEn: "Saudi Arabia", flag: "🇸🇦", strength: 73 },
  uruguay: { id: "uruguay", name: "اروگوئه", nameEn: "Uruguay", flag: "🇺🇾", strength: 80 },

  // Group I
  france: { id: "france", name: "فرانسه", nameEn: "France", flag: "🇫🇷", strength: 90 },
  senegal: { id: "senegal", name: "سنگال", nameEn: "Senegal", flag: "🇸🇳", strength: 78 },
  iraq: { id: "iraq", name: "عراق", nameEn: "Iraq", flag: "🇮🇶", strength: 72 },
  norway: { id: "norway", name: "نروژ", nameEn: "Norway", flag: "🇳🇴", strength: 78 },

  // Group J
  argentina: { id: "argentina", name: "آرژانتین", nameEn: "Argentina", flag: "🇦🇷", strength: 89 },
  algeria: { id: "algeria", name: "الجزایر", nameEn: "Algeria", flag: "🇩🇿", strength: 74 },
  austria: { id: "austria", name: "اتریش", nameEn: "Austria", flag: "🇦🇹", strength: 78 },
  jordan: { id: "jordan", name: "اردن", nameEn: "Jordan", flag: "🇯🇴", strength: 70 },

  // Group K
  portugal: { id: "portugal", name: "پرتغال", nameEn: "Portugal", flag: "🇵🇹", strength: 86 },
  drcongo: { id: "drcongo", name: "جمهوری دموکراتیک کنگو", nameEn: "DR Congo", flag: "🇨🇩", strength: 73 },
  uzbekistan: { id: "uzbekistan", name: "ازبکستان", nameEn: "Uzbekistan", flag: "🇺🇿", strength: 76 },
  colombia: { id: "colombia", name: "کلمبیا", nameEn: "Colombia", flag: "🇨🇴", strength: 81 },

  // Group L
  england: { id: "england", name: "انگلستان", nameEn: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", strength: 86 },
  croatia: { id: "croatia", name: "کرواسی", nameEn: "Croatia", flag: "🇭🇷", strength: 81 },
  ghana: { id: "ghana", name: "غنا", nameEn: "Ghana", flag: "🇬🇭", strength: 72 },
  panama: { id: "panama", name: "پاناما", nameEn: "Panama", flag: "🇵🇦", strength: 71 }
};

export const GROUPS: Record<string, Group> = {
  A: { id: "A", teams: ["mexico", "southafrica", "korea", "czech"], matches: [] },
  B: { id: "B", teams: ["canada", "bosnia", "qatar", "switzerland"], matches: [] },
  C: { id: "C", teams: ["brazil", "morocco", "haiti", "scotland"], matches: [] },
  D: { id: "D", teams: ["usa", "paraguay", "australia", "turkey"], matches: [] },
  E: { id: "E", teams: ["germany", "curacao", "ivorycoast", "ecuador"], matches: [] },
  F: { id: "F", teams: ["netherlands", "japan", "sweden", "tunisia"], matches: [] },
  G: { id: "G", teams: ["belgium", "egypt", "iran", "newzealand"], matches: [] },
  H: { id: "H", teams: ["spain", "capeverde", "saudi", "uruguay"], matches: [] },
  I: { id: "I", teams: ["france", "senegal", "iraq", "norway"], matches: [] },
  J: { id: "J", teams: ["argentina", "algeria", "austria", "jordan"], matches: [] },
  K: { id: "K", teams: ["portugal", "drcongo", "uzbekistan", "colombia"], matches: [] },
  L: { id: "L", teams: ["england", "croatia", "ghana", "panama"], matches: [] }
};

/**
 * Returns static dynamic-round group stage matches
 */
export function generateGroupMatches(): Match[] {
  const matches: Match[] = [];

  Object.entries(GROUPS).forEach(([groupId, grp]) => {
    const t = grp.teams;
    // Standard 6 matchups for 4 teams:
    // Match 1: T0 vs T1
    // Match 2: T2 vs T3
    // Match 3: T0 vs T2
    // Match 4: T1 vs T3
    // Match 5: T3 vs T0
    // Match 6: T1 vs T2
    const pairings = [
      { a: t[0], b: t[1] },
      { a: t[2], b: t[3] },
      { a: t[0], b: t[2] },
      { a: t[1], b: t[3] },
      { a: t[3], b: t[0] },
      { a: t[1], b: t[2] }
    ];

    pairings.forEach((pair, idx) => {
      matches.push({
        id: `G-${groupId}-${idx + 1}`,
        group: groupId,
        teamA: TEAMS[pair.a],
        teamB: TEAMS[pair.b],
        scoreA: null,
        scoreB: null,
        isKnockout: false,
        stage: "group"
      });
    });
  });

  return matches;
}

export const ACHIEVEMENTS_DATA: { id: string; title: string; description: string; iconName: string; color: string }[] = [
  {
    id: "first_prediction",
    title: "شروع پیش‌گویی",
    description: "اولین امتیاز مسابقه را پیش‌بینی کنید!",
    iconName: "Zap",
    color: "from-blue-500 to-indigo-500"
  },
  {
    id: "all_group_b",
    title: "عرق ملی",
    description: "همه بازی‌های گروه ایران (گروه G) را پیش‌بینی کنید.",
    iconName: "Heart",
    color: "from-emerald-500 to-green-500"
  },
  {
    id: "goal_storm",
    title: "طوفان گل باران",
    description: "پیش‌بینی یک مسابقه با بیش از ۴ گل مجموع.",
    iconName: "Flame",
    color: "from-orange-500 to-red-500"
  },
  {
    id: "oracle_clean_sheet",
    title: "شناخت صخره‌های دفاعی",
    description: "پیش‌بینی حداقل یک بازی با نتیجه مساوی بدون گل (۰-۰).",
    iconName: "ShieldAlert",
    color: "from-purple-500 to-pink-500"
  },
  {
    id: "halfway_there",
    title: "کارشناس فوتبال خستگی‌ناپذیر",
    description: "حداقل ۳۶ بازی از کل بازی‌های گروهی را پیش‌بینی کنید.",
    iconName: "CheckCircle",
    color: "from-yellow-500 to-amber-500"
  },
  {
    id: "oracle_all_groups",
    title: "پیش‌گوی اعظم مرحله گروهی",
    description: "تمام ۷۲ بازی مرحله گروهی را پیش‌بینی کنید و جدول‌ها را کامل کنید!",
    iconName: "Award",
    color: "from-teal-500 to-cyan-500"
  },
  {
    id: "knockout_champion",
    title: "تاج پادشاهی جام",
    description: "تیم قهرمان جهان را از مسیر حذفی مشخص کنید!",
    iconName: "Crown",
    color: "from-red-500 to-yellow-600"
  }
];

export function getGroupIdIndex(groupId: string): number {
  const groupsOrder = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  return groupsOrder.indexOf(groupId);
}

export function getMatchDay(matchId: string): number {
  const parts = matchId.split("-");
  if (parts.length < 3 || parts[0] !== "G") return 1;
  const gId = parts[1];
  const mIndex = parseInt(parts[2], 10); // 1 to 6
  
  const gIdx = getGroupIdIndex(gId);
  if (gIdx === -1) return 1;
  const cluster = Math.floor(gIdx / 3); // 4 clusters: ABC(0), DEF(1), GHI(2), JKL(3)
  
  let phase = 0;
  if (mIndex === 1 || mIndex === 2) phase = 0;
  else if (mIndex === 3 || mIndex === 4) phase = 1;
  else phase = 2;
  
  return (phase * 4) + cluster + 1; // 1 to 12
}


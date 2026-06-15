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
  try {
    const kickoff = getMatchKickoffDate(matchId);
    // All group matches are in June 2026, so day of month - 10 gives 1 to 18
    const dayOfMonth = kickoff.getUTCDate();
    return Math.max(1, Math.min(18, dayOfMonth - 10));
  } catch (e) {
    // Basic fallback based on index to prevent any errors during initialization
    const parts = matchId.split("-");
    if (parts.length < 3 || parts[0] !== "G") return 1;
    const gId = parts[1];
    const mIndex = parseInt(parts[2], 10); // 1 to 6
    const gIdx = getGroupIdIndex(gId);
    if (gIdx === -1) return 1;
    const cluster = Math.floor(gIdx / 3);
    let phase = 0;
    if (mIndex === 1 || mIndex === 2) phase = 0;
    else if (mIndex === 3 || mIndex === 4) phase = 1;
    else phase = 2;
    return (phase * 4) + cluster + 1;
  }
}

/**
 * Calculates simulated real World Cup 2026 chronological kickoff date in June 2026
 * Day 1 = June 11, Day 12 = June 22. Slots are 14:00, 17:00, 20:00 UTC.
 */
const MATCH_KICKOFF_MAP: Record<string, string> = {
  "mexico-southafrica": "11.06 22:30",
  "czech-korea": "12.06 05:30",
  "qatar-switzerland": "13.06 22:30",
  "brazil-morocco": "14.06 01:30",
  "haiti-scotland": "14.06 04:30",
  "australia-turkey": "14.06 07:30",
  "bosnia-canada": "12.06 22:30",
  "curacao-germany": "14.06 20:30",
  "paraguay-usa": "13.06 04:30",
  "japan-netherlands": "14.06 23:30",
  "ecuador-ivorycoast": "15.06 02:30",
  "sweden-tunisia": "15.06 05:30",
  "capeverde-spain": "15.06 19:30",
  "belgium-egypt": "15.06 22:30",
  "saudi-uruguay": "16.06 01:30",
  "iran-newzealand": "16.06 04:30",
  "france-senegal": "16.06 22:30",
  "iraq-norway": "17.06 01:30",
  "algeria-argentina": "17.06 04:30",
  "austria-jordan": "17.06 07:30",
  "drcongo-portugal": "17.06 20:30",
  "croatia-england": "17.06 23:30",
  "ghana-panama": "18.06 02:30",
  "colombia-uzbekistan": "18.06 05:30",
  "czech-southafrica": "18.06 19:30",
  "bosnia-switzerland": "18.06 22:30",
  "canada-qatar": "19.06 01:30",
  "korea-mexico": "19.06 04:30",
  "australia-usa": "19.06 22:30",
  "morocco-scotland": "20.06 01:30",
  "brazil-haiti": "20.06 04:00",
  "paraguay-turkey": "20.06 06:30",
  "netherlands-sweden": "20.06 20:30",
  "germany-ivorycoast": "20.06 23:30",
  "curacao-ecuador": "21.06 03:30",
  "japan-tunisia": "21.06 07:30",
  "saudi-spain": "21.06 19:30",
  "belgium-iran": "21.06 22:30",
  "capeverde-uruguay": "22.06 01:30",
  "egypt-newzealand": "22.06 04:30",
  "argentina-austria": "22.06 20:30",
  "france-iraq": "23.06 00:30",
  "norway-senegal": "23.06 03:30",
  "algeria-jordan": "23.06 06:30",
  "portugal-uzbekistan": "23.06 20:30",
  "england-ghana": "23.06 23:30",
  "croatia-panama": "24.06 02:30",
  "colombia-drcongo": "24.06 05:30",
  "bosnia-qatar": "24.06 22:30",
  "canada-switzerland": "24.06 22:30",
  "haiti-morocco": "25.06 01:30",
  "brazil-scotland": "25.06 01:30",
  "czech-mexico": "25.06 04:30",
  "korea-southafrica": "25.06 04:30",
  "curacao-ivorycoast": "25.06 23:30",
  "ecuador-germany": "25.06 23:30",
  "japan-sweden": "26.06 02:30",
  "netherlands-tunisia": "26.06 02:30",
  "australia-paraguay": "26.06 05:30",
  "turkey-usa": "26.06 05:30",
  "france-norway": "26.06 22:30",
  "iraq-senegal": "26.06 22:30",
  "capeverde-saudi": "27.06 03:30",
  "spain-uruguay": "27.06 03:30",
  "egypt-iran": "27.06 06:30",
  "belgium-newzealand": "27.06 06:30",
  "croatia-ghana": "28.06 00:30",
  "england-panama": "28.06 00:30",
  "colombia-portugal": "28.06 03:00",
  "drcongo-uzbekistan": "28.06 03:00",
  "algeria-austria": "28.06 05:30",
  "argentina-jordan": "28.06 05:30"
};

function parseTehranTimeToUTCDate(dateStr: string): Date {
  const [dayMonth, timeStr] = dateStr.split(" ");
  const [day, month] = dayMonth.split(".").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  const d = new Date(Date.UTC(2026, month - 1, day, hour, minute, 0));
  d.setTime(d.getTime() - (3.5 * 60 * 60 * 1000));
  return d;
}

let cachedGroupMatchesList: Match[] | null = null;
function getCachedGroupMatches(): Match[] {
  if (!cachedGroupMatchesList) {
    cachedGroupMatchesList = generateGroupMatches();
  }
  return cachedGroupMatchesList;
}

export function getMatchKickoffDate(matchId: string): Date {
  const matches = getCachedGroupMatches();
  const found = matches.find(m => m.id === matchId);
  if (found) {
    const idA = found.teamA.id;
    const idB = found.teamB.id;
    const sortedPairKey = [idA, idB].sort().join("-");
    const dateStr = MATCH_KICKOFF_MAP[sortedPairKey];
    if (dateStr) {
      return parseTehranTimeToUTCDate(dateStr);
    }
  }
  
  // Safe indices fallback to completely avoid infinite recursion
  const parts = matchId.split("-");
  if (parts.length >= 3 && parts[0] === "G") {
    const gId = parts[1];
    const mIndex = parseInt(parts[2], 10);
    const gIdx = getGroupIdIndex(gId);
    if (gIdx !== -1) {
      const cluster = Math.floor(gIdx / 3);
      let phase = 0;
      if (mIndex === 1 || mIndex === 2) phase = 0;
      else if (mIndex === 3 || mIndex === 4) phase = 1;
      else phase = 2;
      const indexDay = (phase * 4) + cluster + 1;
      const dateNum = 10 + indexDay;
      const hours = [14, 17, 20][(mIndex - 1) % 3] || 17;
      return new Date(Date.UTC(2026, 5, dateNum, hours, 0, 0));
    }
  }
  return new Date(Date.UTC(2026, 5, 11, 17, 0, 0));
}



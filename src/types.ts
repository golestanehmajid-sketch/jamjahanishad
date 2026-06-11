/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Team {
  id: string;
  name: string;
  nameEn: string;
  flag: string;
  strength: number; // 1 to 100 for simulated outcomes
}

export interface Match {
  id: string;
  group?: string; // e.g. 'A', 'B' ... 'H' (undefined for knockout)
  teamA: Team;
  teamB: Team;
  scoreA: number | null;
  scoreB: number | null;
  isKnockout: boolean;
  stage?: string; // 'group' or 'R16', 'QF', 'SF', 'FINAL'
  winnerId?: string; // To resolve draws in knockout matches
  isOfficial?: boolean; // Locked official scores
  isLive?: boolean; // Currently active match
  minute?: number; // Simulated live match minute
  userPredicted?: boolean; // User manually set this score
}

export interface Group {
  id: string; // 'A' to 'H'
  teams: string[]; // Team IDs
  matches: string[]; // Match IDs
}

export interface GroupStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  color: string;
}

export interface UserPredictionsState {
  matches: Record<string, { scoreA: number | null; scoreB: number | null; winnerId?: string }>;
  favoriteTeam: string | null;
  userName: string;
}

export interface UserScore {
  userId: string;
  totalPoints: number;
  exactScoresCount: number; // تعداد پیشبینیهای دقیق (برای رتبهبندی)
  correctOutcomesCount: number; // تعداد تشخیص درست برنده/مساوی
  level: number;
  badges: string[];
  predictionStreak: number; // زنجیره پیشبینیهای درست پشت سر هم
}

export type BadgeType = 
  | 'FIRST_KICK' | 'EXACT_MASTER' | 'STREAK_3' 
  | 'GROUP_WIZARD' | 'KNOCKOUT_NINJA' | 'CHAMPION_PROPHET';


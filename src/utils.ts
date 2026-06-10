/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Match, GroupStanding, Team } from "./types";

/**
 * Calculates standings for a specific group based on matches in state
 */
export function calculateStandings(
  groupId: string,
  matches: Match[],
  teamIds: string[]
): GroupStanding[] {
  // Initialize standings for the 4 teams
  const standings: Record<string, GroupStanding> = {};
  teamIds.forEach((id) => {
    standings[id] = {
      teamId: id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  });

  // Filter matches for this group that have scores filled
  const groupMatches = matches.filter(
    (m) => m.group === groupId && m.scoreA !== null && m.scoreB !== null
  );

  groupMatches.forEach((m) => {
    const sA = m.scoreA as number;
    const sB = m.scoreB as number;
    const teamAId = m.teamA.id;
    const teamBId = m.teamB.id;

    if (standings[teamAId] && standings[teamBId]) {
      // Both teams played
      standings[teamAId].played += 1;
      standings[teamBId].played += 1;

      // Goals for/against
      standings[teamAId].goalsFor += sA;
      standings[teamAId].goalsAgainst += sB;

      standings[teamBId].goalsFor += sB;
      standings[teamBId].goalsAgainst += sA;

      if (sA > sB) {
        // Team A won
        standings[teamAId].won += 1;
        standings[teamAId].points += 3;

        standings[teamBId].lost += 1;
      } else if (sB > sA) {
        // Team B won
        standings[teamBId].won += 1;
        standings[teamBId].points += 3;

        standings[teamAId].lost += 1;
      } else {
        // Draw
        standings[teamAId].drawn += 1;
        standings[teamAId].points += 1;

        standings[teamBId].drawn += 1;
        standings[teamBId].points += 1;
      }
    }
  });

  // Calculate goal differences
  teamIds.forEach((id) => {
    standings[id].goalDifference = standings[id].goalsFor - standings[id].goalsAgainst;
  });

  // Convert to array and sort according to soccer guidelines
  return Object.values(standings).sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // 2. Goal Difference
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    // 3. Goals For
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }
    // 4. Default alphabetic/stability fallback
    return a.teamId.localeCompare(b.teamId);
  });
}

/**
 * Simulates a score based on Team Strengths with teenage-friendly randomness (Poisson-like simulation)
 */
export function simulateMatchScore(strengthA: number, strengthB: number): { scoreA: number; scoreB: number } {
  // Base expectation: teams score between 0 and 4 goals.
  // Higher strength increases the lambda of the random variable.
  const diff = (strengthA - strengthB) / 100; // e.g. -0.2 to +0.2
  
  const baseA = 1.3 + diff * 1.5;
  const baseB = 1.3 - diff * 1.5;

  // Let's draw goals as a simplified Poisson approximation
  const drawGoals = (lambda: number): number => {
    let L = Math.exp(-Math.max(0.2, lambda));
    let k = 0;
    let p = 1.0;
    do {
      k++;
      p *= Math.random();
    } while (p > L && k < 10);
    return k - 1;
  };

  let scoreA = drawGoals(baseA);
  let scoreB = drawGoals(baseB);

  // Safety caps
  if (scoreA > 9) scoreA = 9;
  if (scoreB > 9) scoreB = 9;
  if (scoreA < 0) scoreA = 0;
  if (scoreB < 0) scoreB = 0;

  return { scoreA, scoreB };
}

/**
 * Checks which achievements are unlocked based on user predicting state
 */
export function checkUnlockedAchievements(
  matches: Match[],
  championId: string | undefined
): string[] {
  const unlockedIds: string[] = [];

  const groupMatches = matches.filter(m => !m.isKnockout);
  const playedMatches = groupMatches.filter(m => m.scoreA !== null && m.scoreB !== null);

  // 1. First Prediction
  if (matches.some(m => m.scoreA !== null && m.scoreB !== null)) {
    unlockedIds.push("first_prediction");
  }

  // 2. All Group G predicted (Iran group)
  const groupGMatches = groupMatches.filter(m => m.group === "G");
  if (groupGMatches.length > 0 && groupGMatches.every(m => m.scoreA !== null && m.scoreB !== null)) {
    unlockedIds.push("all_group_b");
  }

  // 3. Goal Storm (> 4 goals in total in any match)
  const isGoalStorm = matches.some(m => {
    if (m.scoreA !== null && m.scoreB !== null) {
      return (m.scoreA + m.scoreB) > 4;
    }
    return false;
  });
  if (isGoalStorm) {
    unlockedIds.push("goal_storm");
  }

  // 4. Clean Sheet Oracle (0-0 score in any match)
  const is0_0 = matches.some(m => {
    if (m.scoreA !== null && m.scoreB !== null) {
      return m.scoreA === 0 && m.scoreB === 0;
    }
    return false;
  });
  if (is0_0) {
    unlockedIds.push("oracle_clean_sheet");
  }

  // 5. Halfway there (>= 36 group matches)
  if (playedMatches.length >= 36) {
    unlockedIds.push("halfway_there");
  }

  // 6. Complete group stage (72 matches)
  if (playedMatches.length === 72) {
    unlockedIds.push("oracle_all_groups");
  }

  // 7. Champion selected
  if (championId) {
    unlockedIds.push("knockout_champion");
  }

  return unlockedIds;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Team, Match, Group, GroupStanding, Achievement } from "./types";
import { TEAMS, GROUPS, generateGroupMatches, ACHIEVEMENTS_DATA } from "./data";
import { calculateStandings, simulateMatchScore, checkUnlockedAchievements } from "./utils";
import { MatchRow } from "./components/MatchRow";
import { GroupStandings } from "./components/GroupStandings";
import { KnockoutStage } from "./components/KnockoutStage";
import { BadgeCard } from "./components/BadgeCard";
import { TeamFlag } from "./components/TeamFlag";
import { IranSupporterHub } from "./components/IranSupporterHub";
import { TeensGiftHub } from "./components/TeensGiftHub";
import { SoccerLiveTracker } from "./components/SoccerLiveTracker";
import { ParticipantsDashboard } from "./components/ParticipantsDashboard";
import { AppAdminDashboard } from "./components/AppAdminDashboard";
import {
  Trophy,
  Sparkles,
  Zap,
  Flame,
  User,
  Heart,
  Edit2,
  Trash2,
  Dices,
  Share2,
  CheckCircle,
  AlertCircle,
  Award,
  Calendar,
  ChevronRight,
  HelpCircle,
  Copy,
  Check,
  RotateCcw,
  Radio,
  Users,
  ShieldCheck,
  Settings,
  Gift
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // ----------------------------------------------------
  // 1. STATES
  // ----------------------------------------------------
  const [matches, setMatches] = useState<Match[]>(() => {
    const local = localStorage.getItem("wc_predictor_matches");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        // Validate if cached matches are aligned with the current 2026 group team configurations
        const isStale = parsed.some((m: any) => {
          if (m.isKnockout) return false;
          const groupTeams = GROUPS[m.group]?.teams || [];
          return !groupTeams.includes(m.teamA.id) || !groupTeams.includes(m.teamB.id);
        });

        if (!isStale) {
          // Map team models cleanly
          return parsed.map((m: any) => ({
            ...m,
            teamA: TEAMS[m.teamA.id] || m.teamA,
            teamB: TEAMS[m.teamB.id] || m.teamB,
          }));
        } else {
          console.warn("Stale match data in localStorage detected. Regenerating with current 2026 groups.");
        }
      } catch (e) {
        console.error("Error parsing local group matches", e);
      }
    }
    return generateGroupMatches();
  });

  const [knockoutPredictions, setKnockoutPredictions] = useState<
    Record<string, { scoreA: number | null; scoreB: number | null; winnerId?: string }>
  >(() => {
    const local = localStorage.getItem("wc_predictor_knockout");
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Error parsing local knockout predictions", e);
      }
    }
    return {};
  });

  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("wc_predictor_username") || "قهرمان جوان";
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  // ----------------------------------------------------
  // 🇮🇷 SHAD Webapp Integration Mechanism (Technical PDF Specs Part 3)
  // ----------------------------------------------------
  const [shadProfile, setShadProfile] = useState<any>(null);
  const [shadLoading, setShadLoading] = useState<boolean>(false);
  const [shadError, setShadError] = useState<string | null>(null);
  const [fromShad, setFromShad] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shadUserId = params.get("UserID") || params.get("UserHashId") || params.get("userId");
    
    if (shadUserId) {
      setFromShad(true);
      setShadLoading(true);
      setShadError(null);
      
      fetch(`/api/shad/user-info?UserID=${encodeURIComponent(shadUserId)}`)
        .then(async (res) => {
          const body = await res.json();
          if (!res.ok || !body.success) {
            throw new Error(body.error || "ارتباط با سرور همگام‌سازی شاد با شکست مواجه شد.");
          }
          return body;
        })
        .then((res) => {
          if (res.success && res.data) {
            setShadProfile(res.data);
            const fullname = `${res.data.name || ""} ${res.data.family || ""}`.trim();
            if (fullname) {
              setUserName(fullname);
              setTempName(fullname);
              localStorage.setItem("wc_predictor_username", fullname);
            }

            const participantId =
              res.participant?.id || res.data.hashedId || shadUserId;
            setServerId(participantId);
            localStorage.setItem("wc_predictor_server_id", participantId);
            localStorage.setItem("wc_predictor_shad_hash", participantId);

            setTimeout(() => {
              showNotice(
                fullname
                  ? `🟢 خوش آمدی ${fullname}! حضور شما در سامانه ثبت شد 🎓`
                  : "🟢 حضور شما در سامانه ثبت شد 🎓"
              );
            }, 1200);
          } else {
            setShadError(res.error || "شناسه معتبری در شاد یافت نشد.");
          }
        })
        .catch((err) => {
          console.error("Shad sync error:", err);
          setShadError("خطا در دریافت و ثبت اطلاعات از وب‌سرویس شاد");
        })
        .finally(() => {
          setShadLoading(false);
        });
    }
  }, []);

  const [favoriteTeam, setFavoriteTeam] = useState<string | null>(() => {
    return localStorage.getItem("wc_predictor_fav_team") || null;
  });

  const [isShadHelperOpen, setIsShadHelperOpen] = useState<boolean>(false);
  const [serverId, setServerId] = useState<string | null>(() => {
    return (
      localStorage.getItem("wc_predictor_server_id") ||
      localStorage.getItem("wc_predictor_shad_hash") ||
      null
    );
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "waiting" | "saving" | "saved" | "error">("idle");
  const [isSubmittingToDB, setIsSubmittingToDB] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has("admin") || params.has("panel") || params.get("mode") === "admin";
  });

  const [activeTab, setActiveTab] = useState<"groups" | "standings" | "knockout" | "achievements" | "sportsNews" | "participants" | "adminDashboard">("groups");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("A");
  
  // Simulation alert details
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);
  
  // Share link copy confirmation
  const [codeCopied, setCodeCopied] = useState(false);
  const [shareCode, setShareCode] = useState<string>("");
  const [importCodeText, setImportCodeText] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);

  // Active teenager gift effects states
  const [activeEffects, setActiveEffects] = useState<Record<string, boolean>>(() => {
    const local = localStorage.getItem("wc_predictor_active_effects");
    return local ? JSON.parse(local) : {};
  });

  const [iranEnthusiasm, setIranEnthusiasm] = useState<number>(() => {
    return Number(localStorage.getItem("wc_predictor_iran_enthusiasm") || "20");
  });

  const handleApplyGiftEffect = (effectId: string, active: boolean) => {
    setActiveEffects((prev) => {
      const updated = { ...prev, [effectId]: active };
      localStorage.setItem("wc_predictor_active_effects", JSON.stringify(updated));
      return updated;
    });
  };

  // ----------------------------------------------------
  // 2. PERSISTENCE
  // ----------------------------------------------------
  useEffect(() => {
    localStorage.setItem("wc_predictor_matches", JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem("wc_predictor_knockout", JSON.stringify(knockoutPredictions));
  }, [knockoutPredictions]);

  useEffect(() => {
    localStorage.setItem("wc_predictor_username", userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem("wc_predictor_iran_enthusiasm", String(iranEnthusiasm));
  }, [iranEnthusiasm]);

  useEffect(() => {
    if (favoriteTeam) {
      localStorage.setItem("wc_predictor_fav_team", favoriteTeam);
    } else {
      localStorage.removeItem("wc_predictor_fav_team");
    }
  }, [favoriteTeam]);

  // ----------------------------------------------------
  // 2B. DATABASE BACKING AUTO-SAVE MECHANISM (5-SECOND DEBOUNCED)
  // ----------------------------------------------------
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setAutoSaveStatus("waiting");

    const delayDebounceId = setTimeout(() => {
      submitPredictionToServer(undefined, true);
    }, 5000);

    return () => {
      clearTimeout(delayDebounceId);
    };
  }, [matches, knockoutPredictions, userName, favoriteTeam]);

  // ----------------------------------------------------
  // 3. COMPUTED STATES
  // ----------------------------------------------------
  // Live calculated standings for all 8 groups
  const standingsByGroup = useMemo(() => {
    const res: Record<string, GroupStanding[]> = {};
    Object.keys(GROUPS).forEach((gId) => {
      res[gId] = calculateStandings(gId, matches, GROUPS[gId].teams);
    });
    return res;
  }, [matches]);

  // Derived top 2 qualifiers for knockout brackets
  const groupQualifiers = useMemo(() => {
    const res: Record<string, { winner: Team; runnerUp: Team; third: Team }> = {};
    Object.entries(standingsByGroup).forEach(([gId, st]) => {
      res[gId] = {
        winner: TEAMS[st[0].teamId],
        runnerUp: TEAMS[st[1].teamId],
        third: TEAMS[st[2].teamId],
      };
    });
    return res;
  }, [standingsByGroup]);

  // Derived 8 best 3rd placed teams overall sorted by Points, GD, GF
  const bestThirds = useMemo(() => {
    const thirdPlacedStandings = Object.entries(standingsByGroup).map(([gId, st]) => {
      return {
        groupId: gId,
        standing: st[2],
        team: TEAMS[st[2].teamId],
      };
    });

    thirdPlacedStandings.sort((a, b) => {
      const sA = a.standing;
      const sB = b.standing;
      if (sB.points !== sA.points) {
        return sB.points - sA.points;
      }
      if (sB.goalDifference !== sA.goalDifference) {
        return sB.goalDifference - sA.goalDifference;
      }
      if (sB.goalsFor !== sA.goalsFor) {
        return sB.goalsFor - sA.goalsFor;
      }
      return a.team.id.localeCompare(b.team.id);
    });

    return thirdPlacedStandings.slice(0, 8).map((item) => item.team);
  }, [standingsByGroup]);

  // Find overall World Cup Champion from knockout final predictions
  const tournamentChampion = useMemo(() => {
    const finalPred = knockoutPredictions["FINAL_2"];
    if (!finalPred || finalPred.scoreA === null || finalPred.scoreB === null) {
      return null;
    }
    const winnerId = finalPred.winnerId;
    if (winnerId) {
      return TEAMS[winnerId] || null;
    }
    return null;
  }, [knockoutPredictions]);

  // Core statistical metrics
  const stats = useMemo(() => {
    const predictedCount = matches.filter((m) => m.scoreA !== null && m.scoreB !== null).length;
    const progressPercent = Math.round((predictedCount / 72) * 100);
    const totalGoals = matches.reduce((sum, m) => sum + (m.scoreA || 0) + (m.scoreB || 0), 0) +
                       Object.values(knockoutPredictions).reduce((sum, p: any) => sum + (p?.scoreA || 0) + (p?.scoreB || 0), 0);
    
    // Unlock achievements
    const unlockedIds = checkUnlockedAchievements(matches, tournamentChampion?.id);
    const achievements: Achievement[] = ACHIEVEMENTS_DATA.map((item) => ({
      ...item,
      unlocked: unlockedIds.includes(item.id),
    }));

    const unlockedCount = achievements.filter((a) => a.unlocked).length;

    return {
      predictedCount,
      progressPercent,
      totalGoals,
      achievements,
      unlockedCount,
    };
  }, [matches, knockoutPredictions, tournamentChampion]);

  // ----------------------------------------------------
  // 4. ACTION HANDLERS
  // ----------------------------------------------------
  const handleScoreChange = (matchId: string, scoreA: number | null, scoreB: number | null) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, scoreA, scoreB } : m))
    );
  };

  const handleSimulateMatch = (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    const result = simulateMatchScore(match.teamA.strength, match.teamB.strength);
    handleScoreChange(matchId, result.scoreA, result.scoreB);
  };

  const handleSimulateGroup = (groupId: string) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.group === groupId) {
          const result = simulateMatchScore(m.teamA.strength, m.teamB.strength);
          return { ...m, scoreA: result.scoreA, scoreB: result.scoreB };
        }
        return m;
      })
    );
    showNotice(`تمام بازی‌های گروه ${groupId} با توجه به قدرت تیم‌ها شبیه‌سازی شدند! 🎲`);
  };

  const handleSimulateAllGroupMatches = () => {
    setMatches((prev) =>
      prev.map((m) => {
        const result = simulateMatchScore(m.teamA.strength, m.teamB.strength);
        return { ...m, scoreA: result.scoreA, scoreB: result.scoreB };
      })
    );
    showNotice("پیش‌بینی تمام مسابقات این ۷۲ بازی گروهی شبیه‌سازی شد! به بخش جدول رده‌بندی نگاه کنید! 🏆✨");
  };

  const handleResetMatches = () => {
    if (confirm("آیا مطمئن هستید که می‌خواهید تمام پیش‌بینی‌ها را پاک کنید؟")) {
      setMatches(generateGroupMatches());
      setKnockoutPredictions({});
      setFavoriteTeam(null);
      showNotice("تمام اطلاعات با موفقیت بازنشانی شد 🧹");
    }
  };

  // ----------------------------------------------------
  // Live Official World Cup Match Sync Mechanics
  // ----------------------------------------------------
  const [isLiveMode, setIsLiveMode] = useState<boolean>(() => {
    return localStorage.getItem("wc_predictor_live_mode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("wc_predictor_live_mode", String(isLiveMode));
  }, [isLiveMode]);

  const handleToggleLiveMode = (enableLive: boolean) => {
    setIsLiveMode(enableLive);
    if (enableLive) {
      // 1. Back up current user predictions to prevent loss
      const backupPayload = matches.map((m) => ({ id: m.id, scoreA: m.scoreA, scoreB: m.scoreB }));
      localStorage.setItem("wc_predictor_predictions_bak", JSON.stringify(backupPayload));

      // 2. Override and lock live official matches representing 2026 World Cup
      const updated = applyOfficialScores(matches);
      setMatches(updated);
      showNotice("🟢 حالت ردیاب نتایج واقعی فعال شد! بازی‌های انجام شده قفل شدند تا به آمار نهایی تکیه کنید.");
    } else {
      // Restore user predictions from backup
      const backupStr = localStorage.getItem("wc_predictor_predictions_bak");
      if (backupStr) {
        try {
          const parsedBackup: { id: string; scoreA: number | null; scoreB: number | null }[] = JSON.parse(backupStr);
          setMatches((prev) =>
            prev.map((m) => {
              const bak = parsedBackup.find((b) => b.id === m.id);
              if (bak) {
                return {
                  ...m,
                  scoreA: bak.scoreA,
                  scoreB: bak.scoreB,
                  isOfficial: false,
                  isLive: false,
                  minute: undefined,
                };
              }
              return { ...m, isOfficial: false, isLive: false, minute: undefined };
            })
          );
          showNotice("🔮 به شبیه‌ساز پیش‌بینی آزاد برگشتید! مجدد می‌توانید مسابقات را دستکاری کنید.");
        } catch (e) {
          console.error("Error restoring predictions backup", e);
          setMatches((prev) => prev.map((m) => ({ ...m, isOfficial: false, isLive: false, minute: undefined })));
        }
      } else {
        setMatches((prev) => prev.map((m) => ({ ...m, isOfficial: false, isLive: false, minute: undefined })));
      }
    }
  };

  const applyOfficialScores = (currentMatches: Match[]): Match[] => {
    const officialResults: Record<string, { scoreA: number; scoreB: number; isOfficial?: boolean; isLive?: boolean; minute?: number }> = {
      // Group A
      "G-A-1": { scoreA: 2, scoreB: 1, isOfficial: true },
      "G-A-2": { scoreA: 1, scoreB: 1, isOfficial: true },
      "G-A-3": { scoreA: 1, scoreB: 0, isOfficial: true },
      "G-A-4": { scoreA: 0, scoreB: 2, isOfficial: true },
      "G-A-5": { scoreA: 1, scoreB: 2, isOfficial: true },
      "G-A-6": { scoreA: 1, scoreB: 2, isOfficial: true },
      // Group B
      "G-B-1": { scoreA: 1, scoreB: 0, isOfficial: true },
      "G-B-2": { scoreA: 0, scoreB: 2, isOfficial: true },
      "G-B-3": { scoreA: 1, scoreB: 1, isOfficial: true },
      "G-B-4": { scoreA: 0, scoreB: 2, isOfficial: true },
      "G-B-5": { scoreA: 2, scoreB: 1, isOfficial: true },
      "G-B-6": { scoreA: 1, scoreB: 1, isOfficial: true },
      // Group C
      "G-C-1": { scoreA: 2, scoreB: 1, isOfficial: true },
      "G-C-2": { scoreA: 0, scoreB: 2, isOfficial: true },
      "G-C-3": { scoreA: 4, scoreB: 0, isOfficial: true },
      "G-C-4": { scoreA: 1, scoreB: 0, isOfficial: true },
      "G-C-5": { scoreA: 0, scoreB: 3, isOfficial: true },
      "G-C-6": { scoreA: 2, scoreB: 0, isOfficial: true },
      // Group D
      "G-D-1": { scoreA: 2, scoreB: 1, isOfficial: true },
      "G-D-2": { scoreA: 1, scoreB: 2, isOfficial: true },
      "G-D-3": { scoreA: 3, scoreB: 1, isOfficial: true },
      "G-D-4": { scoreA: 1, scoreB: 1, isOfficial: true },
      "G-D-5": { scoreA: 2, scoreB: 2, isOfficial: true },
      "G-D-6": { scoreA: 0, scoreB: 1, isOfficial: true },
      // Group E
      "G-E-1": { scoreA: 4, scoreB: 0, isOfficial: true },
      "G-E-2": { scoreA: 1, scoreB: 1, isOfficial: true },
      "G-E-3": { scoreA: 2, scoreB: 1, isOfficial: true },
      "G-E-4": { scoreA: 0, scoreB: 2, isOfficial: true },
      "G-E-5": { scoreA: 1, scoreB: 3, isOfficial: true },
      "G-E-6": { scoreA: 1, scoreB: 3, isOfficial: true },
      // Group F
      "G-F-1": { scoreA: 1, scoreB: 1, isOfficial: true },
      "G-F-2": { scoreA: 2, scoreB: 1, isOfficial: true },
      "G-F-3": { scoreA: 2, scoreB: 1, isOfficial: true },
      "G-F-4": { scoreA: 2, scoreB: 0, isOfficial: true },
      "G-F-5": { scoreA: 0, scoreB: 2, isOfficial: true },
      "G-F-6": { scoreA: 2, scoreB: 2, isOfficial: true },
      // Group G (belgium egypt iran newzealand) - Iran's Group and live match G-G-6 (Egypt vs Iran)
      "G-G-1": { scoreA: 2, scoreB: 1, isOfficial: true },
      "G-G-2": { scoreA: 2, scoreB: 0, isOfficial: true },
      "G-G-3": { scoreA: 1, scoreB: 1, isOfficial: true },
      "G-G-4": { scoreA: 3, scoreB: 0, isOfficial: true },
      "G-G-5": { scoreA: 0, scoreB: 3, isOfficial: true },
      "G-G-6": { scoreA: 1, scoreB: 2, isLive: true, minute: 76 },
      // Group H
      "G-H-1": { scoreA: 3, scoreB: 0, isOfficial: true },
      "G-H-2": { scoreA: 1, scoreB: 2, isOfficial: true },
      "G-H-3": { scoreA: 3, scoreB: 1, isOfficial: true },
      "G-H-4": { scoreA: 0, scoreB: 2, isOfficial: true },
      "G-H-5": { scoreA: 1, scoreB: 1, isOfficial: true },
      "G-H-6": { scoreA: 1, scoreB: 2, isOfficial: true },
      // Group I
      "G-I-1": { scoreA: 2, scoreB: 1, isOfficial: true },
      "G-I-2": { scoreA: 0, scoreB: 2, isOfficial: true },
      "G-I-3": { scoreA: 3, scoreB: 0, isOfficial: true },
      "G-I-4": { scoreA: 1, scoreB: 2, isOfficial: true },
      "G-I-5": { scoreA: 1, scoreB: 2, isOfficial: true },
      "G-I-6": { scoreA: 2, scoreB: 1, isOfficial: true },
      // Group J
      "G-J-1": { scoreA: 2, scoreB: 0, isOfficial: true },
      "G-J-2": { scoreA: 3, scoreB: 1, isOfficial: true },
      "G-J-3": { scoreA: 2, scoreB: 1, isOfficial: true },
      "G-J-4": { scoreA: 2, scoreB: 0, isOfficial: true },
      "G-J-5": { scoreA: 0, scoreB: 4, isOfficial: true },
      "G-J-6": { scoreA: 1, scoreB: 2, isOfficial: true },
      // Group K
      "G-K-1": { scoreA: 3, scoreB: 1, isOfficial: true },
      "G-K-2": { scoreA: 1, scoreB: 2, isOfficial: true },
      "G-K-3": { scoreA: 2, scoreB: 0, isOfficial: true },
      "G-K-4": { scoreA: 1, scoreB: 3, isOfficial: true },
      "G-K-5": { scoreA: 1, scoreB: 1, isOfficial: true },
      "G-K-6": { scoreA: 1, scoreB: 2, isOfficial: true },
      // Group L
      "G-L-1": { scoreA: 1, scoreB: 1, isOfficial: true },
      "G-L-2": { scoreA: 2, scoreB: 1, isOfficial: true },
      "G-L-3": { scoreA: 3, scoreB: 1, isOfficial: true },
      "G-L-4": { scoreA: 2, scoreB: 0, isOfficial: true },
      "G-L-5": { scoreA: 0, scoreB: 4, isOfficial: true },
      "G-L-6": { scoreA: 2, scoreB: 1, isOfficial: true },
    };

    return currentMatches.map((m) => {
      const res = officialResults[m.id];
      if (res) {
        return {
          ...m,
          scoreA: res.scoreA,
          scoreB: res.scoreB,
          isOfficial: res.isOfficial || false,
          isLive: res.isLive || false,
          minute: res.minute,
        };
      }
      return m;
    });
  };

  const handleTickLiveMatch = () => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.isLive) {
          const nextMin = Math.min(90, (m.minute || 76) + Math.floor(Math.random() * 3) + 1);
          let nA = m.scoreA ?? 0;
          let nB = m.scoreB ?? 0;
          if (nextMin === 90) {
            showNotice("🔔 سوت پایان بازی! پیروزی شیرین و تاریخی مل‌پوشان ایران در برابر مصر ثبت شد! 🇮🇷🎉");
          } else if (Math.random() > 0.65) {
            if (Math.random() > 0.4) {
              nB += 1; // Team B is Iran in Egypt (A) vs Iran (B)
              showNotice("⚽ گل برای ایران! یوزهای ایرانی استادیوم را منفجر کردند! 🔥🦅");
            } else {
              nA += 1; // Team A is Egypt
              showNotice("⚽ گل برای مصر! ریتم حمله حریف شدت گرفت.");
            }
          } else {
            showNotice(`⏱️ دقیقه ${nextMin}' نبرد شدید و جذاب در جریان بازی گروه G ادامه دارد.`);
          }
          return {
            ...m,
            minute: nextMin,
            scoreA: nA,
            scoreB: nB,
            isLive: nextMin < 90,
            isOfficial: nextMin >= 90,
          };
        }
        return m;
      })
    );
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      setIsEditingName(false);
      showNotice(`نام کاربری با موفقیت به "${tempName}" تغییر یافت 👤`);
    }
  };

  const getSafeOrigin = () => {
    if (typeof window === "undefined") return "";
    if (window.location.origin && window.location.origin !== "null") {
      return window.location.origin;
    }
    if (window.location.protocol && window.location.host) {
      return `${window.location.protocol}//${window.location.host}`;
    }
    return "";
  };

  const submitPredictionToServer = async (customContact?: string, isSilent: boolean = false) => {
    if (!isSilent) setIsSubmittingToDB(true);
    setAutoSaveStatus("saving");
    try {
      // Compute prediction statistics
      const groupPredCount = matches.filter(m => m.homeGoals !== undefined && m.awayGoals !== undefined).length;
      const koPredCount = Object.keys(knockoutPredictions).length;
      const totalPreds = groupPredCount + koPredCount;

      let predictedChamp = "نامشخص";
      const finalMatch = knockoutPredictions["FINAL_2"];
      if (finalMatch) {
        if (finalMatch.homeGoals !== undefined && finalMatch.awayGoals !== undefined) {
          if (finalMatch.homeGoals > finalMatch.awayGoals) {
            predictedChamp = "ایران"; 
          } else if (finalMatch.awayGoals > finalMatch.homeGoals) {
            predictedChamp = "بلژیک"; 
          }
          if (finalMatch.penaltyWinner) {
            predictedChamp = finalMatch.penaltyWinner;
          }
        }
      }
      if (predictedChamp === "نامشخص" && favoriteTeam) {
        predictedChamp = favoriteTeam;
      } else if (predictedChamp === "نامشخص") {
        predictedChamp = "ایران";
      }

      // Generate a prediction quality rating
      let predScore = 0;
      if (totalPreds > 0) {
        predScore = Math.min(100, Math.round((groupPredCount / 48) * 60 + (koPredCount / 16) * 40));
      }

      const shadHashedId =
        shadProfile?.hashedId ||
        localStorage.getItem("wc_predictor_shad_hash") ||
        null;

      const payload = {
        name: userName || "کاربر شاد",
        favoriteTeam: favoriteTeam || "ایران",
        predictedChampion: predictedChamp,
        predScore: predScore || 50,
        status: totalPreds >= 48 ? "completed" : totalPreds > 0 ? "active" : "visited",
        phoneOrEmail: customContact || (shadProfile ? shadProfile.mobile : "") || "از طریق شاد",
        isPublished: totalPreds > 0,
        predictionsCount: totalPreds,
        shadHashedId,
        hashedId: shadHashedId,
      };

      let response;
      if (serverId) {
        response = await fetch(`/api/participants/${serverId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          // If the record was removed from memory/server (e.g. administrator reset), fallback to POST
          response = await fetch("/api/participants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        }
      } else {
        response = await fetch("/api/participants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        throw new Error("نمیتوان پیش‌بینی‌ها را روی سرور ذخیره کرد.");
      }

      const savedParticipant = await response.json();
      if (savedParticipant && savedParticipant.id) {
        setServerId(savedParticipant.id);
        localStorage.setItem("wc_predictor_server_id", savedParticipant.id);
      }

      setAutoSaveStatus("saved");
      if (!isSilent) {
        showNotice("🏆 لایو ثبت شد! پیش‌بینی شما در بانک مرکزی ذخیره گردید و به لیست شرکت‌کنندگان اضافه شد!");
      }
    } catch (error: any) {
      console.error(error);
      setAutoSaveStatus("error");
      if (!isSilent) {
        showNotice("⚠️ خطا در ارتباط با پایگاه داده: " + error.message);
      }
    } finally {
      if (!isSilent) setIsSubmittingToDB(false);
    }
  };

  const showNotice = (msg: string) => {
    setSimulationNotice(msg);
    setTimeout(() => {
      setSimulationNotice((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  // ----------------------------------------------------
  // 5. IMPORT/EXPORT PREDICTIONS
  // ----------------------------------------------------
  const handleGenerateShareCode = () => {
    const payload = {
      username: userName,
      fav: favoriteTeam,
      matches: matches.map((m) => ({ id: m.id, scoreA: m.scoreA, scoreB: m.scoreB })),
      knockout: knockoutPredictions,
    };
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    setShareCode(code);
    setShowShareModal(true);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(shareCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  const handleImportCode = () => {
    if (!importCodeText.trim()) {
      alert("لطفا کد اشتراک‌گذاری معتبری وارد کنید.");
      return;
    }
    try {
      const decodedHash = decodeURIComponent(escape(atob(importCodeText.trim())));
      const parsed = JSON.parse(decodedHash);
      
      if (parsed.username) setUserName(parsed.username);
      if (parsed.fav) setFavoriteTeam(parsed.fav);
      
      if (Array.isArray(parsed.matches)) {
        setMatches((prev) =>
          prev.map((m) => {
            const matchImport = parsed.matches.find((x: any) => x.id === m.id);
            if (matchImport) {
              return {
                ...m,
                scoreA: matchImport.scoreA,
                scoreB: matchImport.scoreB,
              };
            }
            return m;
          })
        );
      }
      
      if (parsed.knockout) {
        setKnockoutPredictions(parsed.knockout);
      }
      
      setShowShareModal(false);
      setImportCodeText("");
      showNotice("پیش‌بینی‌های دوست شما با موفقیت بارگذاری شد! 🎉");
    } catch (e) {
      alert("کد نامعتبر است! لطفا یک کد صحیح و کامل کپی کنید.");
    }
  };

  // ----------------------------------------------------
  // 6. RENDER
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative antialiased" dir="rtl">
      
      {/* Dynamic Background Grid Effects */}
      {activeEffects.gift_vuvuzela && (
        <div id="vuvuzela-pulsing-bar" className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-green-500 via-white to-red-500 animate-pulse z-[100] shadow-[0_3px_12px_rgba(16,185,129,0.5)]" />
      )}
      <div id="stadium-bg-effect" className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-950/30 via-slate-950/10 to-transparent pointer-events-none" />
      <div id="radial-highlights" className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* ----------------- NOTIFICATION TOAST ----------------- */}
      <AnimatePresence>
        {simulationNotice && (
          <motion.div
            id="toast-notification"
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 font-bold border border-white/20 max-w-sm text-center text-sm shadow-purple-500/15"
          >
            <Sparkles size={18} className="animate-spin text-white" />
            <span>{simulationNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------- APP HEADER / HERO ----------------- */}
      <header id="main-header" className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div id="logo-emblem" className="w-10 h-10 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-purple-500/30">
              <motion.div
                animate={{
                  scale: [0.95, 1.1, 0.95],
                  rotate: [0, 8, -8, 8, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex items-center justify-center"
              >
                <Trophy size={20} className="font-extrabold text-yellow-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
              </motion.div>
            </div>
            <div>
              <h1 className="text-normal sm:text-xl font-black text-white tracking-tight flex items-center gap-2 select-none">
                پیش بینی جام جهانی 2026
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 Persian-font select-none">شبیه سازی مسابقات و آنالیز صعود گروه ها مخصوص نوجوان ها</p>
            </div>
          </div>

          {/* User Nickname & Edit Tool */}
          <div className="flex items-center gap-2 flex-wrap">
            <div id="user-profile-widget" className="flex items-center gap-2.5 bg-slate-900/80 p-1.5 px-3 rounded-2xl border border-white/5 shadow">
            <User size={15} className="text-slate-400" />
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <input
                  id="user-name-input"
                  type="text"
                  maxLength={16}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="bg-slate-800 text-white rounded-lg px-2 py-0.5 text-xs font-semibold w-24 border border-purple-500/70 focus:outline-none"
                />
                <button
                  id="save-user-name"
                  onClick={handleSaveName}
                  className="p-1 rounded bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-400 hover:to-purple-400 duration-150 cursor-pointer"
                >
                  <Check size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100 select-none Persian-font flex items-center gap-1">
                  {activeEffects.gift_crown && <span className="text-xs animate-bounce" title="تاج امپراتوری پیش‌گویان">👑</span>}
                  <span>{activeEffects.gift_avatar ? `✨ خبرنگار طلایی ${userName} ✨` : userName}</span>
                </span>
                <button
                  id="edit-user-name"
                  onClick={() => setIsEditingName(true)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                  title="ویرایش نام"
                >
                  <Edit2 size={11} />
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
      </header>

      {/* ----------------- DAILY PREDICTION & SHADQ PROMO BANNER ----------------- */}
      <section id="daily-prediction-promo" className="max-w-6xl mx-auto w-full px-4 pt-6 animate-fade-in">
        <div className="relative overflow-hidden rounded-3xl border border-pink-500/25 bg-gradient-to-r from-pink-500/10 via-purple-600/10 to-indigo-600/10 backdrop-blur-md p-5 sm:p-6 shadow-xl shadow-purple-900/10">
          
          {/* Glowing Ambient Background Circles */}
          <div className="absolute top-0 right-10 w-44 h-44 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 relative z-10 w-full">
            <div className="flex items-center gap-4 flex-col sm:flex-row text-center sm:text-right w-full md:w-auto">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30">
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Gift size={28} className="text-yellow-200" />
                </motion.div>
              </div>
              <div>
                <h3 className="text-normal sm:text-[15px] font-black text-white tracking-tight Persian-font leading-relaxed">
                  هر روز بیا اینجا پیش بینی کن و عصر در شادکیو شرکت کن کلی جایزه برنده شو
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-1 select-none font-medium">
                  مسابقات آنلاین هیجان‌انگیز، پیش‌بینی مسابقات فوتبال و شانس برنده شدن جوایز شگفت‌انگیز روزانه!
                </p>
              </div>
            </div>
            
            <div className="shrink-0 flex items-center justify-center w-full md:w-auto relative px-4 select-none">
              <div className="relative w-28 h-16 flex items-center justify-center">
                {/* Sparkle background elements */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute text-yellow-300 opacity-60 pointer-events-none -top-1 -left-1"
                >
                  <Sparkles size={16} />
                </motion.div>
                
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute text-pink-400 opacity-55 pointer-events-none -bottom-2 -right-1"
                >
                  <Sparkles size={12} />
                </motion.div>

                {/* Animated Awards Cluster */}
                {/* 1. Award badge (Left side) */}
                <motion.div
                  animate={{ 
                    y: [2, -4, 2],
                    rotate: [-5, 5, -5]
                  }}
                  transition={{ 
                    duration: 3.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="absolute left-3 bottom-1.5 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 shadow-md transform -rotate-12 z-0"
                >
                  <Award size={20} />
                </motion.div>

                {/* 2. Gift box (Right side) */}
                <motion.div
                  animate={{ 
                    y: [4, -2, 4],
                    rotate: [5, -5, 5]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="absolute right-3 bottom-1 flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-300 shadow-md transform rotate-12 z-0"
                >
                  <Gift size={18} className="text-pink-300" />
                </motion.div>

                {/* 3. Golden Trophy (Center & Front) */}
                <motion.div
                  animate={{ 
                    y: [-6, 2, -6],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ 
                    duration: 2.8, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="absolute bottom-2 h-14 w-14 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/40 z-10 border border-yellow-200/40"
                >
                  <Trophy size={28} className="drop-shadow-md" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- SHAD SYNCHRONIZATION STATUS BAR (Technical PDF Specs Part 3) ----------------- */}
      {fromShad && (
        <section id="shad-integration-bar" className="max-w-6xl mx-auto w-full px-4 pt-6 animate-fade-in">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900/80 backdrop-blur-md p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            {/* Green Ambient Light */}
            <div className="absolute top-0 right-0 w-32 h-full bg-emerald-500/[0.05] blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3.5 relative z-10 w-full md:w-auto">
              {shadLoading ? (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                </div>
              ) : shadError ? (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                  <AlertCircle size={20} />
                </div>
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                  <ShieldCheck size={22} className="animate-pulse" />
                </div>
              )}
              
              <div className="text-right flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10.5px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                    همگام‌سازی شبکه آموزش دانش‌آموزی (شاد)
                  </span>
                  {shadProfile && (
                    <span className="text-[9px] bg-slate-950/80 border border-white/5 text-slate-350 px-2.5 py-0.5 rounded-full font-mono font-bold">
                       کد احراز: {shadProfile.id}
                    </span>
                  )}
                </div>

                {shadLoading ? (
                  <p className="text-xs text-slate-400 mt-1">در حال استعلام شناسه‌نامه تحصیلی و تطابق پروفایل کارشناسی از وب‌سرویس شاد...</p>
                ) : shadError ? (
                  <p className="text-xs text-rose-400 mt-1 font-bold">⚠️ {shadError}</p>
                ) : shadProfile ? (
                  <div className="mt-1 flex flex-wrap items-center gap-y-1 gap-x-3 text-slate-300 font-bold text-[10.5px] sm:text-xs">
                    <span>خوش آمدید، <strong className="text-white text-xs font-black">{shadProfile.name} {shadProfile.family}</strong></span>
                    <span className="text-slate-600">|</span>
                    <span>مقطع: <strong className="text-emerald-300">{shadProfile.courseStudy || "نامشخص"}</strong></span>
                    <span className="text-slate-600">|</span>
                    <span>محل تحصیل: <strong className="text-emerald-300">{shadProfile.provinceName} ({shadProfile.districtName || "منطقه ۱"})</strong></span>
                    <span className="text-slate-600">|</span>
                    <span>نقش: <strong className="text-teal-300">دانش‌آموز فعال</strong></span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">شناسه کاربری شما دریافت شد اما اطلاعات تکمیلی هنوز استعلام نشده است.</p>
                )}
              </div>
            </div>

            {/* Accent badge indicating online live connection status & save button */}
            {!shadLoading && !shadError && shadProfile && (
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  onClick={() => submitPredictionToServer()}
                  disabled={isSubmittingToDB}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold text-xs text-white shadow-lg shadow-emerald-500/20 cursor-pointer duration-150 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingToDB ? (
                    <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <CheckCircle size={14} />
                  )}
                  <span>📤 ثبت و ارسال نهایی پیش‌بینی من به سرور</span>
                </button>

                <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-emerald-400 font-bold text-xs flex items-center gap-2 shrink-0 shadow-inner select-none animate-fade-in">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>پروفایل شاد فعال و همگام است</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}



      {/* ----------------- CORE STATS PANEL ----------------- */}
      <section id="stats-dashboard" className="max-w-6xl mx-auto w-full px-4 pt-6">
        <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-purple-950/25 relative overflow-hidden flex flex-col md:flex-row items-stretch justify-between gap-6">
          
          {/* Achievement Trophy Glow */}
          <div className="absolute top-0 left-0 w-44 h-full bg-gradient-to-r from-purple-500/10 to-transparent pointer-events-none" />

          {/* Favorite Team & Stats */}
          <div id="stats-summary" className="flex-1 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-bold select-none leading-none">
                <Flame size={14} className="text-pink-500" />
                <span>وضعیت پیش‌بینی‌های شما</span>
              </div>
              <div className="flex items-center gap-3 mt-1 select-none">
                <h2 className="text-2xl font-extrabold text-white">کمپ بوقچی ایران</h2>
                <motion.div
                  animate={{
                    rotate: [0, 4, -4, 4, 0],
                    y: [0, -3, 1, -3, 0],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="flex items-center justify-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 63 36" className="w-8 h-5.5 rounded border border-white/20 overflow-hidden shadow">
                    <rect width="63" height="12" fill="#239F40"/>
                    <rect y="12" width="63" height="12" fill="#ffffff"/>
                    <rect y="24" width="63" height="12" fill="#DA2128"/>
                    <g transform="translate(31.5, 18) scale(0.65)">
                      <path d="M0 -7 C1 -4 3.5 -1.5 3.5 2 C3.5 4 2 6 0 7.5 C-2 6 -3.5 4 -3.5 2 C-3.5 -1.5 -1 -4 0 -7 Z" fill="#DA2128"/>
                      <path d="M-5.5 -1.5 C-3.5 -0.5 -2.5 1.5 -2.5 3 C-2.5 4.5 -3.5 6 -5.5 6 C-6.5 6 -7 5 -7 4 C-7 1.5 -6.5 -0.5 -5.5 -1.5 Z" fill="#DA2128"/>
                      <path d="M5.5 -1.5 C3.5 -0.5 2.5 1.5 2.5 3 C2.5 4.5 3.5 6 5.5 6 C6.5 6 7 5 7 4 C7 1.5 6.5 -0.5 5.5 -1.5 Z" fill="#DA2128"/>
                      <circle cx="0" cy="0" r="1.5" fill="#DA2128"/>
                    </g>
                  </svg>
                </motion.div>
              </div>
            </div>

            {/* Progress line */}
            <div id="predict-progress-bar" className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400 Persian-font">مسابقات گروهی پیش‌بینی شده:</span>
                <span className="text-pink-400 flex items-center gap-1 font-mono drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                  {stats.predictedCount} / ۴۸
                  <span className="text-[10.5px] text-slate-500">({stats.progressPercent}%)</span>
                </span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  id="progress-fill"
                  className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progressPercent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Total Goals and unlocked widgets */}
            <div className="flex flex-wrap items-center gap-4 mt-1 bg-slate-950/60 p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-sm text-slate-400 select-none">مجموع گل‌ها:</span>
                <span className="text-base font-bold font-mono text-cyan-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-white/5 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                  {stats.totalGoals}
                </span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-sm text-slate-400 select-none">نشان‌های کسب‌شده:</span>
                <span className="text-base font-bold font-mono text-yellow-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-white/5 flex items-center gap-1 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">
                  🏆 {stats.unlockedCount}
                </span>
              </div>
            </div>
          </div>

          {/* Favorite Team selector widget */}
          <div id="fav-team-card" className="flex-1 md:max-w-[40%] bg-slate-950/75 rounded-2xl p-4 border border-white/5 flex flex-col justify-between gap-3 shadow-inner">
            <div>
              <label htmlFor="fav-team-select" className="block text-xs font-bold text-slate-400 mb-1 leading-none select-none">
                ❤️ انتخاب تیم محبوب من:
              </label>
              <select
                id="fav-team-select"
                value={favoriteTeam || ""}
                onChange={(e) => setFavoriteTeam(e.target.value || null)}
                className="w-full bg-slate-905 bg-slate-900 border border-white/5 text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-500/50 cursor-pointer"
              >
                <option value="">-- هیچکدام (به‌عنوان تماشاگر بی‌طرف) --</option>
                {Object.values(TEAMS)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.flag} {team.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Dynamic support banner */}
            <div id="cheer-banner" className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center gap-2.5">
              {favoriteTeam ? (
                <>
                  <TeamFlag team={TEAMS[favoriteTeam]} className="w-12 h-8 animate-bounce hover:scale-110 duration-200 shadow-md filter drop-shadow select-none" />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">طرفدار متعصب {TEAMS[favoriteTeam]?.name}!</div>
                    <div className="text-[10px] text-slate-400 font-medium leading-tight">تیم محبوبت رو تا فینال هل بده! مسابقاتش در جدول با حاشیه درخشان مشخص شده‌اند.</div>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-3xl text-slate-500 select-none">⚽</span>
                  <div className="flex-1">
                    <div className="text-xs font-extrabold text-slate-300">یک تیم را انتخاب کنید!</div>
                    <div className="text-[10px] text-slate-500 leading-tight">با انتخاب تیم محبوب، حس و حال پرانرژی استادیوم را روی بازی‌هایش تجربه کنید.</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>



      {/* ----------------- LIVE SCORE TRACKER SWITCHER PANEL ----------------- */}
      <section id="live-sync-panel" className="max-w-6xl mx-auto w-full px-4 pt-6 select-none animate-fade-in">
        <div className={`border rounded-2xl p-4 sm:p-5 backdrop-blur-md transition-all duration-300 ${
          isLiveMode 
            ? "bg-emerald-950/10 border-emerald-500/30 shadow-lg shadow-emerald-950/20" 
            : "bg-slate-900/60 border-white/5"
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Header info */}
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl flex items-center justify-center transition-colors ${
                isLiveMode ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
              }`}>
                <Calendar size={20} className={isLiveMode ? "animate-pulse" : ""} />
              </div>
              <div className="text-right">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2 justify-start">
                  <span>ردیاب و همگام‌ساز زنده جام جهانی ۲۰۲۶</span>
                  {isLiveMode && (
                    <span className="inline-flex items-center gap-1 bg-red-500/15 border border-red-500/25 text-[9px] text-red-400 px-2.5 py-0.5 rounded-full font-bold animate-pulse font-mono">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                      لایو فعال
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {isLiveMode 
                    ? "مراحل و بازی‌های برگزارشده به صورت رسمی قفل شدند تا بتوانید با داده‌های حقیقی، جداول صعود را آنالیز کنید." 
                    : "در حال استفاده از حالت پیش‌بینی آزاد. در این حالت می‌توانید نتایج تمام مسابقات را خودتان شبیه‌سازی و تغییر دهید."}
                </p>
              </div>
            </div>

            {/* Controller actions */}
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              {/* Toggle switcher */}
              <div className="flex items-center bg-slate-950/90 rounded-xl p-1 border border-white/5">
                <button
                  id="live-mode-off-btn"
                  onClick={() => handleToggleLiveMode(false)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold duration-150 cursor-pointer outline-none transition-all ${
                    !isLiveMode 
                      ? "bg-slate-800 text-pink-400 shadow" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  🔮 پیش‌بینی آزاد
                </button>
                <button
                  id="live-mode-on-btn"
                  onClick={() => handleToggleLiveMode(true)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold duration-150 cursor-pointer outline-none flex items-center gap-1 transition-all ${
                    isLiveMode 
                      ? "bg-emerald-500/20 text-emerald-400 shadow border border-emerald-500/20" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  🟢 ردیاب رسمی زنده
                </button>
              </div>

              {/* Ticking live action */}
              {isLiveMode && matches.some(m => m.isLive) && (
                <button
                  id="tick-live-score-btn"
                  onClick={handleTickLiveMatch}
                  className="bg-gradient-to-r from-red-500/25 to-pink-500/25 hover:from-red-500/35 hover:to-pink-500/35 text-red-300 font-bold px-3.5 py-2 rounded-xl border border-red-500/30 text-xs flex items-center gap-1.5 active:scale-95 duration-150 cursor-pointer shadow-lg shadow-red-950/20 animate-pulse outline-none"
                  title="شبیه‌سازی گذر زمان و تحولات زنده بازی فعال ایران"
                >
                  <RotateCcw size={13} className="animate-spin duration-1000" />
                  <span>⏱️ تحولات دقایق بعد بازی زنده</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ----------------- MODERN TABS NAVIGATION ----------------- */}
      <nav id="navigation-tabs" className="max-w-6xl mx-auto w-full px-4 pt-6">
        <div className="flex border-b border-white/5">
          {[
            { id: "groups", label: "گروه‌ها و بازی‌ها", icon: Calendar },
            { id: "standings", label: "جدول‌های تفکیکی رده‌بندی", icon: Award },
            { id: "knockout", label: "نمودار مرحله حذفی (پلی‌آف)", icon: Trophy },
            { id: "achievements", label: "نشان‌ها و دستاوردهای من", icon: Sparkles },
            { id: "participants", label: "جدول کارشناسی شرکت‌کنندگان", icon: Users },
            ...(isAdminMode ? [{ id: "adminDashboard", label: "⚡ پنل مدیریت ابری", icon: ShieldCheck }] : [])
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                id={`tab-btn-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-3.5 px-3 border-b-2 font-bold text-xs sm:text-sm duration-150 cursor-pointer outline-none relative transition-all ${
                  isActive
                    ? "border-pink-500 text-pink-400 bg-pink-500/[0.02]"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                }`}
              >
                <Icon size={14} className={isActive ? "text-pink-400 scale-110" : "text-slate-500"} />
                <span>{tab.label}</span>
                {tab.id === "achievements" && stats.unlockedCount > 0 && (
                  <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 text-[9px] font-black text-slate-950 animate-pulse">
                    {stats.unlockedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ----------------- MAIN PANEL / CONTAINER ----------------- */}
      <main id="primary-view-container" className="max-w-6xl mx-auto w-full px-4 py-8 flex-1">
        <AnimatePresence mode="wait">
          
          {/* 1. GROUPS & MATCHES VIEW */}
          {activeTab === "groups" && (
            <motion.div
              id="view-groups"
              key="groups"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Special Iran National Team Supporter Hub */}
              <IranSupporterHub
                iranTeam={TEAMS["iran"]}
                groupMatches={matches}
                onScoreChange={handleScoreChange}
                userName={userName}
                enthusiasm={iranEnthusiasm}
                onEnthusiasmChange={setIranEnthusiasm}
              />

              {/* Group filter slide buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/40 p-3 rounded-2xl border border-white/5">
                <div className="flex flex-wrap items-center gap-1.5 justify-center font-bold">
                  <span className="text-xs font-bold text-slate-400 ml-2 select-none leading-none">انتخاب گروه:</span>
                  {Object.keys(GROUPS).map((gId) => (
                    <button
                      id={`group-pill-${gId}`}
                      key={gId}
                      onClick={() => setSelectedGroupFilter(gId)}
                      className={`w-9 h-9 rounded-xl font-bold font-mono text-sm duration-150 flex items-center justify-center cursor-pointer outline-none transition-all ${
                        selectedGroupFilter === gId
                          ? "bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 font-black"
                          : "bg-slate-904 bg-slate-900 border border-white/5 text-slate-300 hover:bg-slate-850 hover:text-white"
                      }`}
                    >
                      {gId}
                    </button>
                  ))}
                </div>

                {/* Instant Actions for teens */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {!isLiveMode ? (
                    <>
                      <button
                        id="sim-group-btn"
                        onClick={() => handleSimulateGroup(selectedGroupFilter)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-500/10 hover:bg-pink-500/25 text-pink-400 border border-pink-500/30 text-xs font-extrabold duration-150 cursor-pointer active:scale-95 outline-none transition-all"
                        title="پیش‌بینی شبیه‌سازی برای کل ۶ بازی این گروه"
                      >
                        <Dices size={14} />
                        <span>شبیه‌سازی کل گروه {selectedGroupFilter}</span>
                      </button>
                      
                      <button
                        id="sim-all-btn"
                        onClick={handleSimulateAllGroupMatches}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 text-xs font-extrabold duration-150 cursor-pointer active:scale-95 outline-none transition-all"
                        title="شبیه‌سازی تمام بازی‌های کل مرحله گروهی جام"
                      >
                        <Sparkles size={14} />
                        <span>شبیه‌سازی کل ۷۲ بازی</span>
                      </button>

                      <button
                        id="reset-btn"
                        onClick={handleResetMatches}
                        className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 border border-white/5 duration-150 cursor-pointer outline-none transition-all"
                        title="پاک کردن تمام نتایج و بازنشانی"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-emerald-950/25 border border-emerald-500/25 px-3 py-2 rounded-xl text-emerald-400 text-xs font-bold select-none decoration-transparent">
                      🔒 حالت نتایج رسمی فعال است
                    </div>
                  )}

                  <button
                    id="share-btn"
                    onClick={handleGenerateShareCode}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-bold text-xs duration-150 hover:opacity-95 active:scale-95 cursor-pointer outline-none shadow shadow-purple-500/20 transition-all"
                  >
                    <Share2 size={13} />
                    <span>اشتراک‌گذاری</span>
                  </button>
                </div>
              </div>

              {/* Grid content split: matches left, standing dynamic preview right */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Active Group Matches List */}
                <div id="active-matches-stack" className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-200 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-pulse"></span>
                      <span>بازی‌های پیش‌بینی گروه {selectedGroupFilter}</span>
                    </h3>
                    <span className="text-xs text-slate-400 select-none font-medium">۶ بازی در کل</span>
                  </div>

                  <div id="matches-container" className="space-y-3.5">
                    {matches
                      .filter((m) => m.group === selectedGroupFilter)
                      .map((m) => {
                        const isFavMatch = favoriteTeam && (m.teamA.id === favoriteTeam || m.teamB.id === favoriteTeam);
                        const hasNeonGold = activeEffects.gift_ball;
                        return (
                          <div
                            id={`match-row-wrapper-${m.id}`}
                            key={m.id}
                            className={`rounded-xl transition-all duration-300 ${
                              isFavMatch
                                ? "ring-2 ring-purple-500/60 relative shadow-xl shadow-purple-500/10 overflow-hidden"
                                : ""
                            } ${
                              hasNeonGold
                                ? "bg-amber-500/[0.03] border-2 border-amber-500/40 shadow-[0_0_15px_rgba(234,179,8,0.18)]"
                                : ""
                            }`}
                          >
                            {isFavMatch && (
                              <div className="absolute top-0 right-0 bg-purple-600 text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg tracking-wider z-10 uppercase select-none leading-none">
                                بازی تیم محبوب شما
                              </div>
                            )}
                            <MatchRow
                              match={m}
                              onScoreChange={handleScoreChange}
                              onSimulate={handleSimulateMatch}
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Right side live standing preview widget */}
                <div id="group-standings-preview" className="lg:col-span-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-pulse"></span>
                    <h3 className="text-base font-black text-slate-200">وضعیت زنده گروه {selectedGroupFilter}</h3>
                  </div>

                  <GroupStandings
                    groupId={selectedGroupFilter}
                    standings={standingsByGroup[selectedGroupFilter]}
                  />

                  {/* Quick helpful information */}
                  <div className="bg-slate-900/40 p-4 border border-white/5 rounded-2xl flex items-start gap-3">
                    <span className="text-pink-400 mt-0.5 select-none animate-pulse">💡</span>
                    <p className="text-xs text-slate-400 Persian-font leading-relaxed">
                      <strong>راهنما:</strong> با تغییر و ذخیره نتایج بازی‌ها در بخش سمت چپ، امتیازات و تفاضل گل در جدول سمت راست در همان لحظه محاسبه و به‌روزرسانی می‌شوند تا موقعیت ردیف صعود تیم‌ها را ببینید.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modern Live Soccer News & Tracker Section at Bottom */}
              <div id="groups-football-news-module" className="mt-8 pt-8 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-450 text-emerald-400 border border-emerald-500/10 shadow-lg shadow-emerald-950/20">
                    <Radio size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-200">
                      بستر رسمی اخبار زنده و ردیاب فوری مسابقات
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 Persian-font">پایش اختصاصی آخرین وقایع فوتبال، رکوردهای برخط و پچ‌های خبری همگام با دیتابیس هوشمند جهانی</p>
                  </div>
                </div>

                <SoccerLiveTracker
                  matches={matches}
                  onApplyOfficialScores={() => handleToggleLiveMode(true)}
                  onClearScores={handleResetMatches}
                  isLiveMode={isLiveMode}
                  onToggleLiveMode={handleToggleLiveMode}
                  simulationNotice={simulationNotice}
                  onTickLive={handleTickLiveMatch}
                />
              </div>
            </motion.div>
          )}

          {/* 2. STANDINGS VIEW */}
          {activeTab === "standings" && (
            <motion.div
              id="view-standings"
              key="standings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="text-center max-w-lg mx-auto mb-2.5">
                <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                  <Award className="text-pink-400" />
                  <span>کل جدول رده‌بندی هر ۸ گروه</span>
                </h3>
                <p className="text-xs text-slate-400 Persian-font mt-2 leading-relaxed">
                  بررسی رده‌بندی تیم‌های انتخابی شما در تمام مسیرهای تورنمنت به شما کمک می‌کند جفت‌های صعودکننده به مرحله پلی‌آف حذفی را مدیریت کنید.
                </p>
              </div>

              {/* Grid with 8 groups */}
              <div id="standings-all-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(GROUPS).map((groupId) => (
                  <div id={`all-st-card-${groupId}`} key={groupId} className="space-y-1">
                    <GroupStandings groupId={groupId} standings={standingsByGroup[groupId]} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 3. KNOCKOUTSTAGE VIEW */}
          {activeTab === "knockout" && (
            <motion.div
              id="view-knockout"
              key="knockout"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="text-center max-w-lg mx-auto mb-2">
                <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                  <Trophy className="text-yellow-400 animate-spin-slow" />
                  <span>مسیر صعود تا جام پادشاهی</span>
                </h3>
                <p className="text-slate-400 text-xs mt-2 Persian-font leading-relaxed">
                  تیم‌های صعودکننده اول و دوم مرحله گروهی در درگاه این جدول حذفی نشسته‌اند. بازی‌ها را به سمت فینال پیش‌بینی کنید تا قهرمان طلایی شما تاج‌گذاری شود!
                </p>
              </div>

              <KnockoutStage
                qualifiers={groupQualifiers}
                bestThirds={bestThirds}
                predictions={knockoutPredictions}
                onPredictionChange={(matchId, item) => {
                  setKnockoutPredictions((prev) => ({
                    ...prev,
                    [matchId]: item,
                  }));
                }}
              />
            </motion.div>
          )}

          {/* 4. ACHIEVEMENTS VIEW */}
          {activeTab === "achievements" && (
            <motion.div
              id="view-achievements"
              key="achievements"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="text-center max-w-lg mx-auto">
                <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                  <Sparkles className="text-yellow-400" />
                  <span>افتخارات و نشان‌های فعال شده نوجوان طلایی</span>
                </h3>
                <p className="text-slate-400 text-xs mt-2 Persian-font leading-relaxed">
                  با ثبت نتایج مسابقات و پیش‌روی خلاقانه در شبیه‌ساز جام جهانی، مهارت پیش اطلاعات فوتبالی تفریحی‌ات را بسنج و مدال‌ها را باز کن!
                </p>
              </div>

              {/* Progress meter visual */}
              <div id="achieve-meter-gauge" className="bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center flex flex-col items-center justify-center max-w-md mx-auto relative overflow-hidden shadow-xl shadow-purple-950/20">
                <div className="text-5xl mb-2 select-none animate-bounce">🏆</div>
                <div className="font-extrabold text-lg text-slate-100 font-mono">
                  {stats.unlockedCount} از {stats.achievements.length} مدال آزاد شده
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full mt-3 border border-white/5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full duration-500"
                    style={{ width: `${(stats.unlockedCount / stats.achievements.length) * 100}%` }}
                  />
                </div>
                {stats.unlockedCount === stats.achievements.length && (
                  <p className="text-xs text-yellow-300 font-bold mt-4 animate-pulse leading-none">
                    شگفت‌آور است! شما به پیش‌گوی اعظم نهایی جام دست یافتید! 🌟
                  </p>
                )}
              </div>

              {/* Teens Gamified Gift Box Cabinets */}
              <TeensGiftHub
                predictedCount={stats.predictedCount}
                hasFavoriteTeam={!!favoriteTeam}
                iranEnthusiasm={iranEnthusiasm}
                totalGoals={stats.totalGoals}
                unlockedBadgesCount={stats.unlockedCount}
                onApplyGiftEffect={handleApplyGiftEffect}
                activeEffects={activeEffects}
                userName={userName}
              />

              {/* Badges and listings */}
              <div id="badge-master-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-3">
                {stats.achievements.map((item) => (
                  <BadgeCard key={item.id} achievement={item} />
                ))}
              </div>
            </motion.div>
          )}

          {/* 5. SOCCER LIVE TRACKER & STATS SYNC VIEW */}
          {activeTab === "sportsNews" && (
            <motion.div
              id="view-sportsNews"
              key="sportsNews"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <SoccerLiveTracker
                matches={matches}
                onApplyOfficialScores={() => handleToggleLiveMode(true)}
                onClearScores={handleResetMatches}
                isLiveMode={isLiveMode}
                onToggleLiveMode={handleToggleLiveMode}
                simulationNotice={simulationNotice}
                onTickLive={handleTickLiveMatch}
              />
            </motion.div>
          )}

          {/* 6. PARTICIPANTS DASHBOARD VIEW */}
          {activeTab === "participants" && (
            <motion.div
              id="view-participants"
              key="participants"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <ParticipantsDashboard />
            </motion.div>
          )}

          {/* 7. APP ADMIN DASHBOARD VIEW */}
          {activeTab === "adminDashboard" && (
            <motion.div
              id="view-admin"
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <AppAdminDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ----------------- SHARE & EXPORT MODAL ----------------- */}
      <AnimatePresence>
        {showShareModal && (
          <div id="share-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-3xl w-full max-w-lg p-6 flex flex-col gap-4 shadow-2xl shadow-purple-950/40 relative"
            >
              {/* Close Button */}
              <button
                id="close-modal-x"
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white bg-slate-900 p-1.5 rounded-lg border border-white/5 duration-150 cursor-pointer hover:bg-slate-800"
              >
                ✕
              </button>

              <h3 className="text-xl font-bold text-white flex items-center gap-2 Persian-font leading-none mb-1">
                <Share2 size={20} className="text-pink-400" />
                <span>اشتراک‌گذاری پیش‌بینی‌ها</span>
              </h3>

              {/* Section 1: Export Code */}
              <div id="code-export-slot" className="mt-3 bg-slate-900/50 p-4 rounded-2xl border border-white/5 space-y-2.5">
                <label className="block text-xs font-semibold text-slate-400 select-none">
                  کد کپی شده را برای دوستان خود بفرستید تا برگه پیش‌بینی شما را ببینند:
                </label>
                <textarea
                  id="share-code-field"
                  readOnly
                  value={shareCode}
                  className="w-full h-18 bg-slate-950 text-slate-300 rounded-xl px-3 py-2 text-[10px] font-mono border border-white/5 focus:outline-none resize-none shadow-inner"
                />
                <button
                  id="copy-code-btn"
                  onClick={handleCopyCode}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold duration-200 cursor-pointer outline-none ${
                    codeCopied
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/5"
                  }`}
                >
                  {codeCopied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  <span>{codeCopied ? "کد پیش‌بینی کپی شد مظهر خلاقیت!" : "کپی کد به حافظه موقت"}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] text-slate-500 font-bold tracking-wider select-none">یا</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {/* Section 2: Import Code */}
              <div id="code-import-slot" className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 space-y-2.5">
                <label className="block text-xs font-semibold text-slate-400 select-none">
                  کد دریافتی از دوست خود را اینجا قرار دهید تا کارهای او بارگذاری شود:
                </label>
                <textarea
                  id="import-text-field"
                  placeholder="کد پیش‌بینی دریافتی را اینجا پیست کنید..."
                  value={importCodeText}
                  onChange={(e) => setImportCodeText(e.target.value)}
                  className="w-full h-18 bg-slate-950 text-slate-300 rounded-xl px-3 py-2 text-[10px] font-mono border border-white/5 focus:outline-none focus:border-purple-500/30 resize-none shadow-inner text-right"
                  dir="ltr"
                />
                <button
                  id="load-friend-code"
                  onClick={handleImportCode}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-bold text-xs duration-200 cursor-pointer outline-none shadow hover:opacity-90"
                >
                  بارگذاری پیش‌بینی دوست
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- GLOBAL FOOTER ----------------- */}
      <footer id="main-footer" className="border-t border-slate-900 bg-slate-900/10 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <div className="flex flex-wrap items-center gap-4 select-none justify-center">
            <div className="flex items-center gap-1.5">
              <span>⚽</span>
              <span className="Persian-font">طراحی شده ویژه نوجوانان خلاق اهل فوتبال مبهوت‌کننده</span>
            </div>
          </div>
          <div className="flex items-center gap-1 select-none font-mono text-[10px]">
            <span>© 2026 World Cup Predictor Sandbox</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

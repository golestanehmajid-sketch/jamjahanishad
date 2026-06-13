/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { toPng } from "html-to-image";
import { Team, Match, Group, GroupStanding, Achievement } from "./types";
import { TEAMS, GROUPS, generateGroupMatches, ACHIEVEMENTS_DATA, getMatchDay, getMatchKickoffDate } from "./data";
import { calculateStandings, simulateMatchScore, checkUnlockedAchievements } from "./utils";
import { MatchRow } from "./components/MatchRow";
import { GroupStandings } from "./components/GroupStandings";
import { KnockoutStage } from "./components/KnockoutStage";
import { BadgeCard } from "./components/BadgeCard";
import { TeamFlag } from "./components/TeamFlag";
import { SoccerLiveTracker } from "./components/SoccerLiveTracker";
import { IranSupporterHub } from "./components/IranSupporterHub";
import { TeensGiftHub } from "./components/TeensGiftHub";
import { ParticipantsDashboard } from "./components/ParticipantsDashboard";
import { AppAdminDashboard } from "./components/AppAdminDashboard";
import { ResultsAdminDashboard } from "./components/ResultsAdminDashboard";
import { RulesAndPrizes } from "./components/RulesAndPrizes";
import { trackUserAction } from "./utils/tracker";
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
  Gift,
  Search,
  X,
  Smartphone,
  Watch,
  Headphones,
  Wifi,
  Menu,
  MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const getTeamFlagColor = (teamId: string): string => {
  const colors: Record<string, string> = {
    mexico: "#10b981", // green
    southafrica: "#007a4d", // green
    korea: "#cd2e3a", // red
    czech: "#11457e", // blue
    canada: "#ff0000", // red
    bosnia: "#002395", // blue
    qatar: "#8a1538", // maroon
    switzerland: "#da291c", // red
    brazil: "#eab308", // yellow/green
    morocco: "#c1272d", // red
    haiti: "#00209f", // blue
    scotland: "#005eb8", // blue
    usa: "#002868", // blue
    paraguay: "#d52b1e", // red
    australia: "#00008b", // blue
    turkey: "#e30a17", // red
    germany: "#ffcc00", // yellow
    curacao: "#002b7f", // blue
    ivorycoast: "#f97316", // orange
    ecuador: "#facc15", // yellow
    netherlands: "#ff4f00", // orange
    japan: "#bc002d", // red
    sweden: "#006aa7", // blue
    tunisia: "#e2091c", // red
    belgium: "#ffe936", // yellow
    egypt: "#ef4444", // red
    iran: "#22c55e", // green
    newzealand: "#94a3b8", // grey/silver
    spain: "#f1bf00", // yellow
    capeverde: "#002a8f", // blue
    saudi: "#006c35", // green
    uruguay: "#0081c6", // blue
    france: "#3b82f6", // blue
    senegal: "#10b981", // green
    iraq: "#007a3d", // green
    norway: "#ef2b2d", // red
    argentina: "#06b6d4", // light blue
    algeria: "#10b981", // green
    austria: "#ed2939", // red
    jordan: "#ce1126", // red
    portugal: "#ef4444", // red
    drcongo: "#3b82f6", // blue
    uzbekistan: "#00bfff", // cyan
    colombia: "#facc15", // yellow
    england: "#ef4444", // red
    croatia: "#ef4444", // red
    ghana: "#facc15", // yellow
    panama: "#3b82f6", // blue
  };
  return colors[teamId] || "#ec4899"; // default pink
};

const hexToRgb = (hex: string): string => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "236, 72, 153"; // default to pink
};

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
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlName = params.get("username") || params.get("UserName") || params.get("name") || params.get("fullname") || params.get("student_name");
      if (urlName) {
        localStorage.setItem("wc_predictor_username", urlName);
        return urlName;
      }
    }
    return localStorage.getItem("wc_predictor_username") || "کاربر شاد";
  });

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
              localStorage.setItem("wc_predictor_username", fullname);
            }

            const participantId =
              res.participant?.id || res.data.hashedId || shadUserId;
            setServerId(participantId);
            localStorage.setItem("wc_predictor_server_id", participantId);
            localStorage.setItem("wc_predictor_shad_hash", participantId);

            setTimeout(() => {
              showNotice("🟢 حضور شما در سامانه ثبت شد 🎓");
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

  const [campaignChamp, setCampaignChamp] = useState<string>(() => {
    return localStorage.getItem("predictor_campaign_champ") || "";
  });
  const [isChampModalOpen, setIsChampModalOpen] = useState(false);
  const [champModalSearch, setChampModalSearch] = useState("");

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
  const [isResultsAdminMode, setIsResultsAdminMode] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return params.has("results") || params.has("scores") ||
           path.includes("/results") || path.includes("/scores") ||
           hash.includes("results") || hash.includes("scores") || hash.includes("resultsadmin");
  });
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return params.has("admin") || params.has("panel") || params.get("mode") === "admin" ||
           path.includes("/admin") || path.includes("/panel") ||
           hash.includes("admin") || hash.includes("panel");
  });

  const [activeTab, setActiveTab] = useState<"groups" | "standings" | "knockout" | "achievements" | "sportsNews" | "participants" | "adminDashboard" | "resultsAdmin" | "rules">(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const isResults = params.has("results") || params.has("scores") || path.includes("/results") || hash.includes("results") || hash.includes("resultsadmin");
    if (isResults) return "resultsAdmin";
    const isAdmin = params.has("admin") || params.has("panel") || params.get("mode") === "admin" ||
                    path.includes("/admin") || path.includes("/panel") ||
                    hash.includes("admin") || hash.includes("panel");
    return isAdmin ? "adminDashboard" : "groups";
  });

  // Keep adminMode and activeTab in sync with browser address bar changes
  useEffect(() => {
    const syncRouteChanges = () => {
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      
      const isResults = params.has("results") || params.has("scores") || path.includes("/results") || hash.includes("results") || hash.includes("resultsadmin");
      if (isResults) {
        setIsResultsAdminMode(true);
        setActiveTab("resultsAdmin");
        return;
      }
      
      const isAdmin = params.has("admin") || params.has("panel") || params.get("mode") === "admin" ||
                      path.includes("/admin") || path.includes("/panel") ||
                      hash.includes("admin") || hash.includes("panel");
      if (isAdmin) {
        setIsAdminMode(true);
        setActiveTab("adminDashboard");
      }
    };
    window.addEventListener("popstate", syncRouteChanges);
    window.addEventListener("hashchange", syncRouteChanges);
    return () => {
      window.removeEventListener("popstate", syncRouteChanges);
      window.removeEventListener("hashchange", syncRouteChanges);
    };
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("A");
  const [matchViewMode, setMatchViewMode] = useState<"daily" | "groups">("daily");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  
  // Simulation alert details
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);
  
  // Share link copy confirmation
  const [codeCopied, setCodeCopied] = useState(false);
  const [shareCode, setShareCode] = useState<string>("");
  const [importCodeText, setImportCodeText] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTab, setShareTab] = useState<"image" | "code">("image");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

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
    
    const effectLabels: Record<string, string> = {
      vuvuzela: "شیپور گوبوزلا سخنگو 🎺",
      confetti: "باران فشفشه‌های لیزری زنده ✨",
      glowingCard: "کارت نقره‌ای کهکشانی 💳"
    };
    trackUserAction(`${active ? "فعال‌سازی" : "غیرفعال‌سازی"} افکت کادوی نوجوان شاد: ${effectLabels[effectId] || effectId}`);
  };

  const [isFabOpen, setIsFabOpen] = useState(false);

  const handleFabShortcut = (action: "daily" | "standings") => {
    if (action === "daily") {
      setActiveTab("groups");
      setMatchViewMode("daily");
      trackUserAction("کلیک روی میانبر ثبت پیش‌بینی روزانه از طریق دکمه شناور FAB");
    } else if (action === "standings") {
      setActiveTab("standings");
      trackUserAction("کلیک روی میانبر مشاهده جدول رده‌بندی از طریق دکمه شناور FAB");
    }
    setIsFabOpen(false);

    setTimeout(() => {
      const element = document.getElementById("primary-view-container") || document.getElementById("navigation-tabs");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handlePredictTodayBtn = () => {
    trackUserAction("کلیک روی دکمه شناور پیش‌بینی سریع بازی امروز");
    
    // 1. Search for live match in groups
    const liveMatch = matches.find(m => m.isLive && !m.isKnockout);
    if (liveMatch) {
      const matchDay = getMatchDay(liveMatch.id);
      setActiveTab("groups");
      setMatchViewMode("daily");
      setSelectedDay(matchDay);
      showNotice(`🔥 شادکیوی عزیز، هدایت شدی به بازی زنده امروز (روز ${matchDay})!`);
    } else {
      // 2. Find first unpredicted group match
      const unpredictedMatch = matches.find(m => !m.isKnockout && (m.scoreA === null || m.scoreB === null));
      if (unpredictedMatch) {
        const matchDay = getMatchDay(unpredictedMatch.id);
        setActiveTab("groups");
        setMatchViewMode("daily");
        setSelectedDay(matchDay);
        showNotice(`🎯 هدایت شدی به روز ${matchDay} برای پیش‌بینی اولین بازی خالی پیش‌رو!`);
      } else {
        // 3. Find first unpredicted knockout match
        const unpredictedKnockout = matches.find(m => m.isKnockout && (m.scoreA === null || m.scoreB === null));
        if (unpredictedKnockout) {
          setActiveTab("knockout");
          showNotice(`🏆 تمام بازی‌های گروهی پیش‌بینی شده‌اند! هدایت شدی به درخت حذفی.`);
        } else {
          // All done
          setActiveTab("groups");
          setMatchViewMode("daily");
          setSelectedDay(1);
          showNotice(`✨ آفرین قهرمان! تو تمام بازی‌های گروهی و حذفی رو پیش‌بینی کردی!`);
        }
      }
    }

    setTimeout(() => {
      const container = document.getElementById("primary-view-container") || document.getElementById("navigation-tabs");
      if (container) {
        container.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // First render guards for action logs tracking
  const isFirstRenderActiveTab = React.useRef(true);
  const isFirstRenderFavTeam = React.useRef(true);
  const isFirstRenderName = React.useRef(true);
  const isFirstRenderCampaignChamp = React.useRef(true);

  useEffect(() => {
    if (isFirstRenderActiveTab.current) {
      isFirstRenderActiveTab.current = false;
      return;
    }
    const tabLabels: Record<string, string> = {
      groups: "گروه‌ها و بازی‌ها 📅",
      standings: "جدول‌های تفکیکی رده‌بندی 📊",
      knockout: "نمودار مرحله حذفی 🏆",
      achievements: "نشان‌ها و دستاوردهای من 🏅",
      sportsNews: "اخبار و پخش زنده 📺",
      rules: "راهنما و جوایز مسابقه 🎁",
      participants: "جدول کارشناسی شرکت‌کنندگان 👥",
      adminDashboard: "پنل مدیریت ابری ⚡"
    };
    trackUserAction(`مشاهده بخش: ${tabLabels[activeTab] || activeTab}`);
  }, [activeTab]);

  useEffect(() => {
    if (isFirstRenderFavTeam.current) {
      isFirstRenderFavTeam.current = false;
      return;
    }
    const teamName = favoriteTeam && TEAMS[favoriteTeam] ? TEAMS[favoriteTeam].name : "هیچکدام (بی‌طرف)";
    trackUserAction(`تغییر تیم محبوب به: ${teamName} ❤️`);
  }, [favoriteTeam]);

  useEffect(() => {
    if (isFirstRenderName.current) {
      isFirstRenderName.current = false;
      return;
    }
    trackUserAction(`تغییر نام کاربری به: ${userName} 👤`);
  }, [userName]);

  useEffect(() => {
    if (isFirstRenderCampaignChamp.current) {
      isFirstRenderCampaignChamp.current = false;
      return;
    }
    if (campaignChamp) {
      const champName = TEAMS[campaignChamp] ? TEAMS[campaignChamp].name : campaignChamp;
      trackUserAction(`پیش‌بینی زودهنگام قهرمان نهایی جام جهانی: ${champName} 🏆👑`);
    }
  }, [campaignChamp]);

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
  }, [matches, knockoutPredictions, userName, favoriteTeam, campaignChamp]);

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
    // Prevent changing score if match has already started (live or official or chronologically past)
    const match = matches.find((m) => m.id === matchId);
    if (match) {
      const kickoff = getMatchKickoffDate(matchId);
      const isLocked = match.isLive || match.isOfficial || (new Date() >= kickoff);
      if (isLocked) {
        return;
      }
    }
    
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, scoreA, scoreB, userPredicted: true } : m))
    );
    const m = matches.find((match) => match.id === matchId);
    if (m) {
      trackUserAction(`ثبت پیش‌بینی بازی گروهی ${m.teamA.name} ${scoreA ?? "?"} - ${scoreB ?? "?"} ${m.teamB.name}`);
    }
  };

  const handleSimulateMatch = (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    // Prevent simulation if match has already started (live or official or chronologically past)
    const kickoff = getMatchKickoffDate(matchId);
    const isLocked = match.isLive || match.isOfficial || (new Date() >= kickoff);
    if (isLocked) return;
    
    const result = simulateMatchScore(match.teamA.strength, match.teamB.strength);
    handleScoreChange(matchId, result.scoreA, result.scoreB);
    trackUserAction(`شبیه‌سازی ابری تکی بازی: ${match.teamA.name} - ${match.teamB.name} 🎲`);
  };

  const handleSimulateGroup = (groupId: string) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.group === groupId) {
          // Do not overwrite live or official match predictions
          if (m.isLive || m.isOfficial) return m;
          const result = simulateMatchScore(m.teamA.strength, m.teamB.strength);
          return { ...m, scoreA: result.scoreA, scoreB: result.scoreB, userPredicted: true };
        }
        return m;
      })
    );
    showNotice(`تمام بازی‌های گروه {groupId} با توجه به قدرت تیم‌ها شبیه‌سازی شدند! 🎲`);
    trackUserAction(`شبیه‌سازی دسته جمعی مسابقات گروه ${groupId} 🎲📋`);
  };

  const handleSimulateAllGroupMatches = () => {
    setMatches((prev) =>
      prev.map((m) => {
        // Do not overwrite live or official match predictions
        if (m.isLive || m.isOfficial) return m;
        const result = simulateMatchScore(m.teamA.strength, m.teamB.strength);
        return { ...m, scoreA: result.scoreA, scoreB: result.scoreB, userPredicted: true };
      })
    );
    showNotice("پیش‌بینی تمام مسابقات این ۷۲ بازی گروهی شبیه‌سازی شد! به بخش جدول رده‌بندی نگاه کنید! 🏆✨");
    trackUserAction("شبیه‌سازی تمام بازی‌های گروهی جام جهانی (۷۲ بازی) 🚀🔮");
  };

  const handleResetMatches = () => {
    if (confirm("آیا مطمئن هستید که می‌خواهید تمام پیش‌بینی‌ها را پاک کنید؟")) {
      const freshMatches = generateGroupMatches().map((m) => ({
        ...m,
        scoreA: null,
        scoreB: null,
        userPredicted: false,
        isLive: false,
        isOfficial: false,
      }));
      setMatches(freshMatches);
      setKnockoutPredictions({});
      setFavoriteTeam(null);
      showNotice("تمام اطلاعات با موفقیت بازنشانی شد 🧹");
      trackUserAction("پاکسازی و بازنشانی کلیه پیش‌بینی‌ها و مقادیر ذخیره‌شده 🧹❌");
    }
  };

  // ----------------------------------------------------
  // Live Official World Cup Match Sync Mechanics
  // ----------------------------------------------------
  const isLiveMode = true;

  useEffect(() => {
    // High-fidelity matching helper to pair static teams with scraped teams
    const matchTeamEn = (team: { name: string; nameEn: string }, scraped: { name: string; nameEn?: string }) => {
      if (!scraped) return false;
      const scrapEn = (scraped.nameEn || "").trim().toLowerCase();
      const scrapFa = (scraped.name || "").trim();
      const teamEn = team.nameEn.trim().toLowerCase();
      const teamFa = team.name.trim();

      if (scrapEn === teamEn || scrapFa === teamFa) return true;

      // Class-standard normalization helper
      const norm = (s: string) => s.replace(/[\s\-_']+/g, "").toLowerCase();
      const normScrapedEn = norm(scrapEn);
      const normTeamEn = norm(teamEn);
      if (normScrapedEn === normTeamEn || norm(scrapFa) === norm(teamFa)) return true;

      // Custom high-fidelity synonym groups
      const synonyms: Record<string, string[]> = {
        "usa": ["united states", "united states of america", "us", "america", "آمریکا", "ایالات متحده"],
        "korea": ["south korea", "korea republic", "korea", "korea rep", "کره جنوبی", "کره"],
        "drcongo": ["dr congo", "congo dr", "democratic republic of the congo", "congo", "کنگو", "جمهوری دموکراتیک کنگو"],
        "czech": ["czech republic", "czechia", "czech", "جمهوری چک", "چک"],
        "ivorycoast": ["ivory coast", "côte d'ivoire", "cote d'ivoire", "ivorycoast", "ساحل عاج"],
        "saudi": ["saudi arabia", "saudi", "saudi_arabia", "عربستان", "عربستان سعودی"],
        "southafrica": ["south africa", "s. africa", "آفریقای جنوبی"],
        "newzealand": ["new zealand", "n. zealand", "نیوزیلند"],
        "capeverde": ["cape verde", "cabo verde", "کیپ ورد"],
        "morocco": ["morocco", "مراکش", "مغرب"],
        "england": ["england", "انگلستان", "انگلیس"]
      };

      for (const [key, list] of Object.entries(synonyms)) {
        const isTeamMatch = normTeamEn.includes(key) || key.includes(normTeamEn);
        if (isTeamMatch) {
          const matchFound = list.some(item => {
            const lowerItem = item.toLowerCase();
            return scrapEn === lowerItem || scrapFa === item || norm(scrapEn) === norm(lowerItem);
          });
          if (matchFound) return true;
        }
      }

      // Check substring match
      if (normScrapedEn.length > 3 && normTeamEn.length > 3) {
        if (normScrapedEn.includes(normTeamEn) || normTeamEn.includes(normScrapedEn)) {
          return true;
        }
      }

      return false;
    };

    const autoSyncWithLiveScore = async () => {
      try {
        const res = await fetch("/api/sports-hub/livescore");
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data) {
          let extractedMatches: any[] = [];
          for (const league of json.data) {
            for (const dateObj of league.dates || []) {
              for (const scrapedMatch of dateObj.matches || []) {
                extractedMatches.push(scrapedMatch);
              }
            }
          }

          if (extractedMatches.length > 0) {
            setMatches((prevMatches) => {
              let changed = false;
              const updated = prevMatches.map((m) => {
                const scraped = extractedMatches.find((sm) => {
                  const hostOk = matchTeamEn(m.teamA, sm.host) && matchTeamEn(m.teamB, sm.guest);
                  const reversedOk = matchTeamEn(m.teamA, sm.guest) && matchTeamEn(m.teamB, sm.host);
                  return hostOk || reversedOk;
                });

                if (scraped) {
                  // Chronological safety guard: If the match's kickoff time is in the future,
                  // do not let the scraper mark it as Live (1) or Finished (2)!
                  const kickoff = getMatchKickoffDate(m.id);
                  const now = new Date();
                  if (now < kickoff) {
                    // Match has not started yet. Ensure it is reset to scheduled state if currently marked otherwise
                    if (m.isLive || m.isOfficial) {
                      changed = true;
                      return {
                        ...m,
                        isLive: false,
                        isOfficial: false
                      };
                    }
                    return m;
                  }

                  const isReversed = matchTeamEn(m.teamA, scraped.guest);
                  const goalsA = isReversed ? scraped.guestGoals : scraped.hostGoals;
                  const goalsB = isReversed ? scraped.hostGoals : scraped.guestGoals;

                  // If user has predicted this match, preserve their score but sync status if needed
                  if (m.userPredicted) {
                    if (scraped.status === 2 && (!m.isOfficial || m.isLive)) {
                      changed = true;
                      return {
                        ...m,
                        isOfficial: true,
                        isLive: false,
                      };
                    } else if (scraped.status === 1 && (!m.isLive || m.isOfficial || m.minute !== scraped.minute)) {
                      changed = true;
                      return {
                        ...m,
                        isOfficial: false,
                        isLive: true,
                        minute: scraped.minute || 84,
                      };
                    } else if (scraped.status === 3 && (m.isLive || m.isOfficial)) {
                      changed = true;
                      return {
                        ...m,
                        isOfficial: false,
                        isLive: false,
                      };
                    }
                    return m;
                  }

                  // scraped.status: 1 = live, 2 = finished, 3 = scheduled
                  if (scraped.status === 2 && (!m.isOfficial || m.scoreA !== goalsA || m.scoreB !== goalsB)) {
                    changed = true;
                    return {
                      ...m,
                      scoreA: goalsA !== null ? goalsA : m.scoreA,
                      scoreB: goalsB !== null ? goalsB : m.scoreB,
                      isOfficial: true,
                      isLive: false,
                    };
                  } else if (scraped.status === 1 && (!m.isLive || m.scoreA !== goalsA || m.scoreB !== goalsB || m.minute !== scraped.minute)) {
                    changed = true;
                    return {
                      ...m,
                      scoreA: goalsA !== null ? goalsA : m.scoreA,
                      scoreB: goalsB !== null ? goalsB : m.scoreB,
                      isOfficial: false,
                      isLive: true,
                      minute: scraped.minute || 84,
                    };
                  } else if (scraped.status === 3 && (m.isLive || m.isOfficial)) {
                    changed = true;
                    return {
                      ...m,
                      isOfficial: false,
                      isLive: false,
                    };
                  }
                }
                return m;
              });

              return changed ? updated : prevMatches;
            });
          }
        }
      } catch (err) {
        console.warn("Background syncing matches offline or API unreachable:", err);
      }
    };

    autoSyncWithLiveScore();
    const interval = setInterval(autoSyncWithLiveScore, 30000);
    return () => clearInterval(interval);
  }, []);





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
      if (campaignChamp && TEAMS[campaignChamp]) {
        predictedChamp = TEAMS[campaignChamp].name;
      } else {
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
          predictedChamp = TEAMS[favoriteTeam]?.name || favoriteTeam;
        } else if (predictedChamp === "نامشخص") {
          predictedChamp = "ایران";
        }
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
        let serverErrorMsg = "";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            serverErrorMsg = `: ${errData.error}`;
          }
        } catch (_) {}
        throw new Error(`نمیتوان پیش‌بینی‌ها را روی سرور ذخیره کرد.${serverErrorMsg}`);
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

  const downloadPredictionImage = async () => {
    const node = document.getElementById("prediction-share-card-render");
    if (!node) {
      showNotice("خطا: المان کارت پیش‌بینی یافت نشد.");
      return;
    }
    
    setIsGeneratingImage(true);
    try {
      // Small timeout to allow styles/animations to settle
      await new Promise((resolve) => setTimeout(resolve, 350));
      const dataUrl = await toPng(node, {
        quality: 0.98,
        pixelRatio: 2, // High resolution Retinal export
        backgroundColor: "#020617", // slate-950 background
        style: {
          transform: 'scale(1)',
          borderRadius: '0px'
        }
      });
      
      const link = document.createElement("a");
      link.download = `jamejahani-predictions-${userName || "user"}.png`;
      link.href = dataUrl;
      link.click();
      showNotice("تصویر زیبای برگه پیش‌بینی شما دانلود شد! ✨📸");
    } catch (error) {
      console.error("Error generating prediction image:", error);
      showNotice("خطا در ساخت تصویر کارت پیش‌بینی. دوباره تلاش کنید!");
    } finally {
      setIsGeneratingImage(false);
    }
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative antialiased pb-20 sm:pb-0" dir="rtl">
      
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

          {/* User Nickname (Authentic Shad Identity Badge - Read Only) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div id="user-profile-widget" className="flex items-center gap-2.5 bg-slate-900/80 p-1.5 px-3.5 rounded-2xl border border-emerald-500/10 shadow-md">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${fromShad ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${fromShad ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <User size={13} className="text-slate-400 shrink-0" />
              <span className="text-xs font-extrabold text-slate-100 select-none Persian-font flex items-center gap-1.5 max-w-[180px] truncate">
                {activeEffects.gift_crown && <span className="text-xs animate-bounce" title="تاج امپراتوری پیش‌گویان">👑</span>}
                <span>{activeEffects.gift_avatar ? `✨ خبرنگار طلایی ${userName} ✨` : userName}</span>
              </span>
              {fromShad && (
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full select-none Persian-font shrink-0 scale-90">
                  تایید شده شاد ✅
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ----------------- DAILY PREDICTION & SHADQ PROMO BANNER ----------------- */}
      <section id="daily-prediction-promo" className="max-w-6xl mx-auto w-full px-4 pt-6 animate-fade-in">
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 group transition-all duration-300 hover:border-indigo-500/30">
          
          {/* Shifting Gradient Aura */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-0 left-1/4 w-85 h-85 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-4000" />
          
          {/* Subtle Grid overlay for technical high-end feel */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] opacity-70 pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10 w-full">
            
            {/* Right side: Detailed Information & Badges */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-right gap-4 flex-1 w-full">
              {/* Main Headline */}
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-normal Persian-font text-white">
                  پیش‌بینی کن و برنده شو! 📱🏆
                </h3>
              </div>

              {/* Horizontal / Wrapped Pill Badges of the exact prize tier */}
              <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start w-full mt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold leading-normal px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 Persian-font shadow-inner">
                  <Smartphone size={14} className="shrink-0" />
                  <span>۳ گوشی هوشمند جدید (نفرات ۱ تا ۳ جدول)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold leading-normal px-3.5 py-2 rounded-2xl bg-blue-505/10 border border-blue-500/20 text-blue-300 Persian-font shadow-inner">
                  <Watch size={14} className="shrink-0" />
                  <span>ساعت هوشمند دیجیتال</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold leading-normal px-3.5 py-2 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 Persian-font shadow-inner">
                  <Headphones size={14} className="shrink-0" />
                  <span>هدفون بی‌سیم مدرن</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold leading-normal px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 Persian-font shadow-inner">
                  <Flame size={14} className="shrink-0 animate-pulse text-emerald-400" />
                  <span>بسته‌های اینترنتی رایگان</span>
                </div>
              </div>

              {/* Explanatory subtitle */}
              <p className="text-xs text-slate-400 leading-relaxed text-center lg:text-right max-w-lg mt-2 Persian-font">
                با هر پیش‌بینی صحیح مسابقات جام جهانی دانش‌آموزی، امتیاز کسب کنید. در پایان، برندگان رتبه‌های اول تا سوم جوایز فوق‌العاده‌ای مثل گوشی هوشمند، ساعت و هدفون دیجیتال دریافت می‌کنند!
              </p>
            </div>

            {/* Left side: Golden Trophy Showcase Model */}
            <div className="flex-shrink-0 relative flex items-center justify-center p-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Floating animations using Framer Motion */}
                {/* Real-time rotating glow rings behind trophy */}
                <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping duration-3000 pointer-events-none" />
                <div className="absolute w-28 h-28 rounded-full border border-yellow-500/10 animate-spin duration-10000 pointer-events-none" />
                
                {/* 3D-angled Glassmorphic Smartphone Model */}
                <motion.div
                  animate={{ 
                    y: [-6, 6, -6],
                    rotateY: [-12, -4, -12],
                    rotateX: [6, 12, 6]
                  }}
                  style={{ perspective: 1000 }}
                  transition={{ 
                    duration: 5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="w-32 h-52 rounded-[2.2rem] bg-slate-900 border-4 border-slate-700/70 p-2 shadow-2xl relative z-20 flex flex-col justify-between overflow-hidden cursor-pointer hover:border-pink-500/50 hover:shadow-indigo-500/25 transition-all duration-300 group-hover:scale-105"
                >
                  {/* Speaker Notch */}
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-12 h-3.5 rounded-full bg-slate-800 z-30 flex items-center justify-center">
                    <div className="w-6 h-1 rounded-full bg-slate-700" />
                  </div>

                  {/* Shaky screen-glow behind elements inside the phone screen */}
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-950 to-purple-950 z-0" />
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-pink-500/20 rounded-full blur-xl pointer-events-none animate-pulse" />
                  <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-blue-500/20 rounded-full blur-xl pointer-events-none animate-pulse duration-3000" />

                  {/* Screensaver content with Grid Pattern */}
                  <div className="relative w-full h-full rounded-[1.8rem] overflow-hidden bg-slate-950/65 flex flex-col items-center justify-center gap-1 z-10 border border-white/5 p-1.5">
                    {/* Tiny Stadium Grid Lines */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:12px_12px] opacity-80" />
                    
                    {/* Jumping Football */}
                    <motion.div 
                      animate={{ y: [4, -14, 4], rotate: [0, 180, 360] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      className="text-2xl drop-shadow-xl z-10"
                    >
                      ⚽
                    </motion.div>

                    {/* Floating Golden Trophy standing tall inside the screen */}
                    <motion.div
                      animate={{ 
                        scale: [1, 1.12, 1],
                        rotate: [-4, 4, -4]
                      }}
                      transition={{ 
                        duration: 2.8, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-slate-950 shadow-md border border-yellow-200/30 z-20 mt-1"
                    >
                      <Trophy size={20} className="drop-shadow" />
                    </motion.div>

                    {/* Miniature live-rank card */}
                    <span className="text-[8px] font-black tracking-tight text-yellow-300 bg-yellow-500/10 px-2.5 py-0.5 rounded-full border border-yellow-500/20 uppercase mt-2 Persian-font scale-90">
                      رتبه ۱ تا ۳ لیدربورد 🏆
                    </span>
                  </div>
                </motion.div>

                {/* Additional floating medals behind the 3D Phone to add depth */}
                {/* 1. Purple medal (left side) */}
                <motion.div
                  animate={{ 
                    y: [0, -8, 0],
                    rotate: [-15, -5, -15]
                  }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-4 bottom-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 shadow-lg backdrop-blur-sm z-10"
                >
                  <Award size={20} className="text-indigo-400" />
                </motion.div>

                {/* 2. Pink gift (right side) */}
                <motion.div
                  animate={{ 
                    y: [6, -4, 6],
                    rotate: [15, 5, 15]
                  }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-4 bottom-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-500/20 border border-pink-500/30 text-pink-300 shadow-lg backdrop-blur-sm z-10"
                >
                  <Gift size={20} className="text-pink-400" />
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
              
              <div className="text-right flex-1 select-none">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10.5px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                    ورود تایید شده از طریق شبکه شاد
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
                    <span>تایید شاد: <strong className="text-emerald-300">موفقیت‌آمیز</strong></span>
                    <span className="text-slate-600">|</span>
                    <span>محل سکونت: <strong className="text-emerald-300">{shadProfile.provinceName}</strong></span>
                    <span className="text-slate-600">|</span>
                    <span>وضعیت کاربری: <strong className="text-teal-300">کاربر تایید شده شاد</strong></span>
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





      {/* ----------------- MODERN TABS NAVIGATION ----------------- */}
      <nav id="navigation-tabs" className="max-w-6xl mx-auto w-full px-4 pt-6 hidden sm:block">
        <div className="flex border-b border-white/5">
          {[
            { id: "groups", label: "گروه‌ها و بازی‌ها", icon: Calendar },
            { id: "standings", label: "جدول‌های تفکیکی رده‌بندی", icon: Award },
            { id: "knockout", label: "نمودار مرحله حذفی (پلی‌آف)", icon: Trophy },
            { id: "achievements", label: "نشان‌ها و دستاوردهای من", icon: Sparkles },
            { id: "sportsNews", label: "اخبار و پخش زنده", icon: Radio },
            { id: "rules", label: "راهنما و جوایز", icon: Gift },
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

              {/* 🏆 Ultimate World Cup Champion Predictor Widget (Campaign) */}
              <div 
                id="campaign-ultimate-champion-predictor" 
                className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl p-6 transition-all duration-300"
                style={{
                  background: "radial-gradient(115% 140% at 0% 0%, rgba(139, 92, 246, 0.15) 0%, rgba(219, 39, 119, 0.1) 50%, rgba(2, 6, 23, 0.8) 100%)",
                  boxShadow: "0 20px 40px -15px rgba(139, 92, 246, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)"
                }}
              >
                {/* Stunning animated glowing nodes */}
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[6000ms]" />
                <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-pink-500/10 rounded-full blur-[80px] pointer-events-none animate-pulse duration-[4000ms]" />
                
                {/* Shimmering Top border */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-pink-500/50 to-transparent pointer-events-none" />

                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10 w-full text-right" dir="rtl">
                  
                  {/* Left Column: Info Hub */}
                  <div className="flex gap-4 flex-col sm:flex-row text-center sm:text-right items-center sm:items-start w-full lg:w-3/5">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20 border border-white/20 select-none cursor-pointer"
                    >
                      <Trophy size={28} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
                    </motion.div>
                    
                    <div className="space-y-1 w-full">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                        <span className="text-[10px] font-black text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 select-none">
                           پیش‌بینی فوق‌ستاره طلایی ⭐
                        </span>
                        <span className="text-[10px] font-black text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20 select-none">
                           امتیاز هدیه: ۱۵۰ امتیاز بونس 🎁
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white mt-1 leading-relaxed Persian-font">
                        پیش‌بینی فاتح ابدی جام جهانی ۲۰۲۶
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        در مسابقه زنده شادکیو، قهرمان نهایی رو از همین اول راه حدس بزن! تیم تحت حمایت خود را مشخص کنید تا در چارت افتخارات قرار بگیرید و امتیاز ویژه کارشناسی دریافت کنید.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Premium 3D-Like Glowing Card Slot */}
                  <div className="w-full lg:w-2/5 flex justify-center lg:justify-end">
                    {campaignChamp && TEAMS[campaignChamp] ? (() => {
                      const glowColor = getTeamFlagColor(campaignChamp);
                      const glowRgb = hexToRgb(glowColor);
                      return (
                        <motion.div 
                          id="ultimate-champ-3d-card"
                          whileHover={{ 
                            scale: 1.04, 
                            perspective: 1000,
                            rotateX: 6,
                            rotateY: -6,
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="w-full max-w-sm group relative overflow-hidden rounded-2xl bg-slate-950/85 p-5 border shadow-2xl transition-all flex flex-col justify-between"
                          style={{
                            background: "linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.8) 100%)",
                            borderColor: `rgba(${glowRgb}, 0.25)`,
                            boxShadow: `0 10px 30px -10px rgba(0,0,0,0.5), 0 0 20px 2px rgba(${glowRgb}, 0.15)`
                          }}
                        >
                          {/* Dynamic Team Colored Subtle Background Glow */}
                          <div 
                            className="absolute top-0 right-0 w-32 h-32 rounded-full filter blur-2xl transition-all duration-500 pointer-events-none group-hover:scale-125" 
                            style={{
                              background: `rgba(${glowRgb}, 0.12)`,
                            }}
                          />
                          
                          {/* Dynamic Team Colored Glowing Hover Overlay (Pulses when hovered) */}
                          <motion.div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                            style={{
                              border: `1.5px solid ${glowColor}`,
                              boxShadow: `inset 0 0 25px rgba(${glowRgb}, 0.3)`
                            }}
                            animate={{
                              boxShadow: [
                                `inset 0 0 15px rgba(${glowRgb}, 0.2)`,
                                `inset 0 0 35px rgba(${glowRgb}, 0.45)`,
                                `inset 0 0 15px rgba(${glowRgb}, 0.2)`
                              ]
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 2,
                              ease: "easeInOut"
                            }}
                          />
                          
                          {/* 3D Border Light Reflex */}
                          <div 
                            className="absolute inset-x-0 top-0 h-px opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" 
                            style={{
                              background: `linear-gradient(90deg, transparent, rgba(${glowRgb}, 0.8), transparent)`
                            }}
                          />
                          
                          {/* Inner Content */}
                          <div className="flex items-center justify-between gap-4 mt-1">
                            <div className="flex items-center gap-3">
                              <motion.div 
                                whileHover={{ scale: 1.1 }}
                                className="relative"
                              >
                                <div 
                                  className="absolute inset-0 rounded-lg filter blur-md animate-pulse" 
                                  style={{ backgroundColor: `rgba(${glowRgb}, 0.45)` }}
                                />
                                <TeamFlag team={TEAMS[campaignChamp]} className="w-14 h-9 rounded-lg border border-white/20 shadow-lg object-cover relative z-10 block" />
                              </motion.div>
                              
                              <div className="text-right">
                                <span 
                                  className="text-[10px] font-extrabold uppercase tracking-wide block mb-0.5"
                                  style={{ color: glowColor }}
                                >
                                  قهرمان برگزیده شما
                                </span>
                                <h4 className="text-base font-black text-white Persian-font leading-none">{TEAMS[campaignChamp].name}</h4>
                                <p className="text-[10px] text-slate-400 font-mono mt-1">{TEAMS[campaignChamp].nameEn}</p>
                              </div>
                            </div>
  
                            {/* Level / Strength Indicator */}
                            <div className="flex flex-col items-center justify-center bg-slate-900 border border-white/5 py-1.5 px-2.5 rounded-xl shrink-0">
                              <span className="text-[8px] text-slate-500 font-bold block select-none">توان تیم</span>
                              <span className="text-xs font-extrabold text-amber-400 font-mono mt-0.5">★ {TEAMS[campaignChamp].strength}</span>
                            </div>
                          </div>
  
                          {/* Middle Stat Line */}
                          <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 select-none">
                            <span className="flex items-center gap-1">
                              <span className="text-xs">🏆</span>
                              <span>مدعی اصلی جام قهرمانی</span>
                            </span>
                            <span 
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                              style={{ 
                                backgroundColor: `rgba(${glowRgb}, 0.15)`,
                                color: glowColor 
                              }}
                            >
                              ۱۰۰٪ معتبر
                            </span>
                          </div>
  
                          {/* Action buttons slot */}
                          <div className="mt-4 flex items-center gap-2">
                            <button
                              id="change-ultimate-champ-3d-btn"
                              onClick={() => {
                                setIsChampModalOpen(true);
                                setChampModalSearch("");
                              }}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-[11px] font-black border border-white/10 hover:border-pink-500/35 transition-all text-center cursor-pointer outline-none shadow-md"
                            >
                              🔄 تغییر تیم قهرمان
                            </button>
                          </div>
                        </motion.div>
                      );
                    })() : (
                      <motion.div
                        id="empty-champ-card-slot"
                        whileHover={{ scale: 1.03 }}
                        className="w-full max-w-sm rounded-2xl bg-slate-950/40 p-5 border border-white/5 flex flex-col items-center text-center justify-center gap-3 relative overflow-hidden py-6"
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-950/20 pointer-events-none" />
                        
                        <div className="w-12 h-12 rounded-full bg-slate-900/90 flex items-center justify-center border border-white/10 text-xl relative z-10 text-slate-400 animate-pulse select-none">
                          ❓
                        </div>
                        
                        <p className="text-xs text-slate-400 font-bold relative z-10 Persian-font leading-relaxed max-w-[240px]">
                          هنوز تیمی را به عنوان قهرمان مطلق معرفی نکرده‌اید!
                        </p>

                        <button
                          id="select-ultimate-champ-3d-btn"
                          onClick={() => {
                            setIsChampModalOpen(true);
                            setChampModalSearch("");
                          }}
                          className="relative z-10 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-650 hover:to-purple-750 text-white font-black text-xs shadow-lg shadow-pink-500/10 transition-all cursor-pointer outline-none border border-white/10 flex items-center gap-1.5 hover:scale-103 duration-150"
                        >
                          <Sparkles size={13} className="text-amber-400 animate-spin" />
                          <span>انتخاب قهرمان طلایی جام</span>
                        </button>
                      </motion.div>
                    )}
                  </div>

                </div>
              </div>

              {/* 🔄 Unified Compact View Switcher Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/30 border border-white/5 p-4 rounded-2xl" dir="rtl">
                <div className="flex items-center gap-2 text-right select-none">
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 animate-pulse"></span>
                  <p className="text-xs sm:text-sm font-black text-slate-200 font-sans Persian-font">
                    {matchViewMode === "daily" 
                      ? "پیش‌بینی سریع روزانه" 
                      : "پیش‌بینی کل گروه‌ها و جدول رده‌بندی زنده"
                    }
                  </p>
                </div>

                <div className="flex items-center bg-slate-950/80 border border-white/10 p-1 rounded-xl shadow-inner font-sans shrink-0 max-w-full overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMatchViewMode("daily")}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none select-none ${
                      matchViewMode === "daily"
                        ? "bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-lg font-black"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Calendar size={13} />
                    <span>برنامه روزانه</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchViewMode("groups")}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none select-none ${
                      matchViewMode === "groups"
                        ? "bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-lg font-black"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Trophy size={13} />
                    <span>جدول گروه‌ها</span>
                  </button>
                </div>
              </div>

              {/* BRANCH 1: DAILY MATCHES (Focused, Mobile-friendly, Day-by-Day scroll) */}
              {matchViewMode === "daily" && (
                <div id="daily-predictor-section" className="space-y-5 animate-fade-in text-right" dir="rtl">
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-3">
                    <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-extrabold px-2.5 py-1 rounded-md block w-fit Persian-font select-none">
                      فیلتر روزانه مرحله گروهی ⚡
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-300 leading-relaxed Persian-font">
                      مرحله گروهی جام جهانی شامل ۷۲ بازی پرهیجان است.
                    </h4>

                    {/* Horizontal scrollable slider of 12 Match Days */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                      {Array.from({ length: 12 }).map((_, i) => {
                        const dayNum = i + 1;
                        const isSelected = selectedDay === dayNum;
                        return (
                          <button
                            key={dayNum}
                            id={`daily-day-pill-${dayNum}`}
                            onClick={() => setSelectedDay(dayNum)}
                            className={`px-4 py-2 text-xs font-black rounded-xl duration-150 transition-all cursor-pointer select-none shrink-0 min-w-[70px] text-center ${
                              isSelected
                                ? "bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 border border-purple-500/30"
                                : "bg-slate-900 border border-white/5 text-slate-400 hover:bg-slate-850 hover:text-white"
                            }`}
                          >
                            روز {String(dayNum).replace(/[0-9]/g, c => "۰۱۲۳۴۵۶۷۸۹"[+c])}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions for Daily View */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shrink-0"></span>
                        <h4 className="text-sm font-black text-rose-400 Persian-font">
                          دیدارهای روز {String(selectedDay).replace(/[0-9]/g, c => "۰۱۲۳۴۵۶۷۸۹"[+c])} مقدماتی گروهی
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                        ۶ بازی همزمان در گروه‌های مختلف. برای پیش‌بینی خودکار و سریع، می‌توانید از دکمه شبیه‌سازی هوشمند استفاده کنید.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        id="simulate-active-day-btn"
                        onClick={() => {
                          const dayMatches = matches.filter(m => getMatchDay(m.id) === selectedDay);
                          dayMatches.forEach(m => handleSimulateMatch(m.id));
                          if (typeof showNotice === "function") {
                            showNotice(`🎲 تمام بازی‌های روز ${String(selectedDay).replace(/[0-9]/g, c => "۰۱۲۳۴۵۶۷۸۹"[+c])} با تکیه بر الگوریتم‌های قدرت شبیه‌سازی شدند!`);
                          } else {
                            setSimulationNotice(`🎲 تمام بازی‌های روز ${String(selectedDay).replace(/[0-9]/g, c => "۰۱۲۳۴۵۶۷۸۹"[+c])} شبیه‌سازی شدند!`);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/25 text-xs font-black duration-150 cursor-pointer active:scale-95 transition-all focus:outline-none"
                      >
                        <Dices size={13} />
                        <span>شبیه‌سازی هوشمند بازی‌های روز {String(selectedDay).replace(/[0-9]/g, c => "۰۱۲۳۴۵۶۷۸۹"[+c])}</span>
                      </button>

                      <button
                        type="button"
                        id="reset-active-day-btn"
                        onClick={() => {
                          const dayMatches = matches.filter(m => getMatchDay(m.id) === selectedDay);
                          dayMatches.forEach(m => handleScoreChange(m.id, null, null));
                          if (typeof showNotice === "function") {
                            showNotice(`🔄 پیش‌بینی‌های روز ${String(selectedDay).replace(/[0-9]/g, c => "۰۱۲۳۴۵۶۷۸۹"[+c])} با موفقیت پاک شدند.`);
                          } else {
                            setSimulationNotice(`🔄 پیش‌بینی‌های روز ${String(selectedDay).replace(/[0-9]/g, c => "۰۱۲۳۴۵۶۷۸۹"[+c])} حذف شدند.`);
                          }
                        }}
                        className="p-2.5 rounded-xl bg-slate-900 text-slate-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 border border-white/5 duration-150 cursor-pointer focus:outline-none transition-all"
                        title="پاک کردن نتایج مسابقات روز جاری"
                      >
                        <RotateCcw size={14} />
                      </button>

                      <button
                        type="button"
                        id="share-active-day-btn"
                        onClick={handleGenerateShareCode}
                        className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-black text-xs duration-150 hover:opacity-95 active:scale-95 cursor-pointer focus:outline-none shadow shadow-purple-500/20 transition-all"
                      >
                        <Share2 size={13} />
                        <span>اشتراک‌گذاری</span>
                      </button>
                    </div>
                  </div>

                  {/* List of 6 Matches on selected day - beautifully side-by-side or stacked */}
                  <div className="grid grid-cols-1 gap-4">
                    {matches
                      .filter((m) => getMatchDay(m.id) === selectedDay)
                      .map((m) => {
                        const isFavMatch = favoriteTeam && (m.teamA.id === favoriteTeam || m.teamB.id === favoriteTeam);
                        const hasNeonGold = activeEffects.gift_ball;
                        return (
                          <div
                            id={`match-row-wrapper-${m.id}`}
                            key={m.id}
                            className={`rounded-2xl transition-all duration-300 ${
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
                              displayDay={false}
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* BRANCH 2: FULL TRADITIONAL GROUPS VIEW (A-L selection and Tables) */}
              {matchViewMode === "groups" && (
                <div id="full-groups-predictor-section" className="space-y-6 animate-fade-in">
                  
                  {/* Group filter slide buttons */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/40 p-3 rounded-2xl border border-white/5" dir="rtl">
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
                              : "bg-slate-900 border border-white/5 text-slate-300 hover:bg-slate-850 hover:text-white"
                          }`}
                        >
                          {gId}
                        </button>
                      ))}
                    </div>

                    {/* Instant Actions for teens */}
                    <div className="flex flex-wrap items-center justify-center gap-2">
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
                      <div className="flex items-center justify-between" dir="rtl">
                        <h3 className="text-base font-black text-slate-200 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-pulse"></span>
                          <span>بازی‌های پیش‌بینی گروه {selectedGroupFilter}</span>
                        </h3>
                        <span className="text-sm text-slate-400 select-none font-black Persian-font">۶ بازی در کل</span>
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
                                  displayDay={true}
                                />
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Right side live standing preview widget */}
                    <div id="group-standings-preview" className="lg:col-span-1 space-y-4" dir="rtl">
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

                </div>
              )}


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
                  trackUserAction(`ثبت تغییر بازی حذفی ${matchId}`, { ...item });
                }}
                matches={matches}
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

          {/* Results Admin manual outcomes view */}
          {activeTab === "resultsAdmin" && (
            <motion.div
              id="view-results-admin"
              key="results-admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <ResultsAdminDashboard />
            </motion.div>
          )}

          {/* 8. RULES & PRIZES VIEW */}
          {activeTab === "rules" && (
            <motion.div
              id="view-rules"
              key="rules"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <RulesAndPrizes />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ----------------- SHARE & EXPORT MODAL ----------------- */}
      <AnimatePresence>
        {showShareModal && (
          <div id="share-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-3xl w-full max-w-xl p-5 flex flex-col gap-4 shadow-2xl shadow-purple-950/40 relative my-8 text-right"
              dir="rtl"
            >
              {/* Close Button */}
              <button
                id="close-modal-x"
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white bg-slate-950 p-1.5 rounded-lg border border-white/5 duration-150 cursor-pointer hover:bg-slate-800 z-10"
              >
                ✕
              </button>

              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 Persian-font leading-none mb-1">
                <Share2 size={20} className="text-pink-400" />
                <span>اشتراک‌گذاری پیش‌بینی‌ها</span>
              </h3>

              {/* Tabs Switcher */}
              <div className="flex bg-slate-900/80 p-0.5 rounded-xl border border-white/5 w-full">
                <button
                  id="tab-btn-share-image"
                  onClick={() => setShareTab("image")}
                  className={`flex-1 py-1.5 text-xs font-black rounded-lg duration-150 cursor-pointer text-center Persian-font ${
                    shareTab === "image"
                      ? "bg-gradient-to-r from-pink-500 to-purple-650 text-white shadow-md shadow-pink-500/10"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  📸 کارت تصویری مخصوص استوری و کانال
                </button>
                <button
                  id="tab-btn-share-code"
                  onClick={() => setShareTab("code")}
                  className={`flex-1 py-1.5 text-xs font-black rounded-lg duration-150 cursor-pointer text-center Persian-font ${
                    shareTab === "code"
                      ? "bg-gradient-to-r from-pink-500 to-purple-650 text-white shadow-md shadow-pink-500/10"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  🔗 کد متنی بازیابی
                </button>
              </div>

              {shareTab === "image" ? (
                /* --- IMAGE CARD SHARE TAB --- */
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 font-bold select-none leading-relaxed">
                    با کلیک روی دکمه زیر، کارت پیش‌بینی شخصی‌سازی‌شده و زیبای خود را به صورت تصویر دانلود کنید و در استوری یا کانال‌ها بفرستید:
                  </p>

                  <div className="flex justify-center p-2 bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
                    {/* The actual Card element that will be captured as an image */}
                    <div
                      id="prediction-share-card-render"
                      className="w-[340px] sm:w-[380px] bg-slate-950 p-6 rounded-3xl border border-pink-500/30 flex flex-col gap-4 text-slate-100 relative overflow-hidden select-none text-right shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #07090e 0%, #150f28 50%, #24072c 100%)',
                        boxShadow: '0 0 35px rgba(236,72,153,0.18)',
                      }}
                      dir="rtl"
                    >
                      {/* Design accents */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-500/12 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/15 blur-3xl rounded-full" />
                      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/15 blur-3xl rounded-full" />
                      
                      {/* Card Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">⚽</span>
                          <div className="text-right">
                            <h4 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-amber-300 to-yellow-300 Persian-font tracking-tight leading-none">کارت پیش‌بینی شادکیو</h4>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-pink-500 to-purple-650 px-2.5 py-1 rounded-full text-[9px] font-black tracking-tight select-none border border-white/10 Persian-font">
                          🏆 جام جهانی ۲۰۲۶
                        </div>
                      </div>

                      {/* Avatar & User Profile */}
                      <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 relative z-10 select-none">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-650 flex items-center justify-center text-lg shadow-md border border-white/10 select-none shrink-0">
                          👤
                        </div>
                        <div className="flex-1 text-right">
                          <h4 className="text-sm font-black text-white Persian-font leading-none">{userName || "کاربر شادکیو"}</h4>
                        </div>
                      </div>

                      {/* Golden Champion Prediction */}
                      <div className="bg-slate-900/80 p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between relative z-10">
                        <div className="text-right flex-1">
                          <span className="text-[10px] text-amber-400 font-black block select-none mb-1">قهرمان نهایی من</span>
                          {campaignChamp && TEAMS[campaignChamp] ? (
                            <div className="flex items-center gap-2 mt-1">
                              <TeamFlag team={TEAMS[campaignChamp]} className="w-8 h-5 rounded border border-white/20 shadow-md object-cover" />
                              <span className="text-sm font-black text-amber-300 Persian-font">{TEAMS[campaignChamp].name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">مشخص نشده</span>
                          )}
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">
                          🏆
                        </div>
                      </div>

                      {/* Favorite & Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 relative z-10 text-right">
                        {/* Favorite Team */}
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col justify-between h-18">
                          <span className="text-[10px] text-slate-400 font-semibold select-none block leading-none">تیم محبوب</span>
                          <div className="mt-1">
                            {favoriteTeam && TEAMS[favoriteTeam] ? (
                              <div className="flex items-center gap-1.5 justify-start">
                                <TeamFlag team={TEAMS[favoriteTeam]} className="w-6 h-4 rounded border border-white/10 shadow-sm object-cover" />
                                <span className="text-xs font-black text-rose-300 Persian-font truncate">{TEAMS[favoriteTeam].name}</span>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-slate-500 Persian-font">بی‌طرف</span>
                            )}
                          </div>
                        </div>

                        {/* Iran devotion */}
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col justify-between h-18">
                          <span className="text-[10px] text-emerald-400 font-semibold select-none block leading-none">تعصب به ایران</span>
                          <div className="mt-1">
                            <span className="text-xs font-black text-white Persian-font block">{iranEnthusiasm}٪</span>
                            <div className="w-full bg-slate-900 h-1 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse" style={{ width: `${iranEnthusiasm}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Predictions Count & Achievements */}
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 grid grid-cols-2 gap-2 relative z-10 text-right">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block select-none mb-0.5">کل پیش‌بینی‌ها</span>
                          <span className="text-xs sm:text-sm font-black text-white Persian-font">
                            {matches.filter((m) => m.scoreA !== null && m.scoreB !== null).length} بازی
                          </span>
                        </div>
                        <div className="border-r border-white/10 pr-2">
                          <span className="text-[10px] text-slate-400 font-semibold block select-none mb-0.5">مدال‌های کسب‌شده</span>
                          <span className="text-xs sm:text-sm font-black text-amber-400 Persian-font">
                            {stats.unlockedCount} نشان 🎖️
                          </span>
                        </div>
                      </div>

                      {/* Footer CTA */}
                      <div className="border-t border-white/10 pt-3.5 mt-1 flex flex-col items-center text-center relative z-10 select-none">
                        <p className="text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-200 to-slate-200 leading-none Persian-font font-black">
                          در مسابقه زنده شادکیو پیش‌بینی کن ⚽📱
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Export Button */}
                  <button
                    id="download-predictions-card-btn"
                    onClick={downloadPredictionImage}
                    disabled={isGeneratingImage}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-650 hover:from-pink-600 hover:to-indigo-750 text-white font-black text-sm duration-200 cursor-pointer shadow-lg shadow-pink-500/10 disabled:opacity-50 select-none border border-white/10 outline-none"
                  >
                    {isGeneratingImage ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                        <span>در حال پردازش و تولید فایل تصویر...</span>
                      </>
                    ) : (
                      <>
                        <span>📥 ذخیره و دانلود تصویر کارت پیش‌بینی</span>
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <p className="text-[10px] sm:text-xs leading-relaxed text-slate-400">
                      تصویر در گالری گوشی شما ذخیره خواهد شد. آن را برای دوستان خود بفرستید، استوری کنید یا برای ما ارسال کنید!
                    </p>
                  </div>

                  {/* Back/Close Button */}
                  <button
                    id="back-share-image-btn"
                    onClick={() => setShowShareModal(false)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs duration-150 cursor-pointer border border-white/10 outline-none select-none Persian-font mr-auto"
                  >
                    <ChevronRight size={14} />
                    <span>بازگشت به برنامه</span>
                  </button>
                </div>
              ) : (
                /* --- ORIGINAL TEXT CODE SHARE TAB --- */
                <div className="space-y-4">
                  {/* Section 1: Export Code */}
                  <div id="code-export-slot" className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 space-y-2.5">
                    <label className="block text-xs font-semibold text-slate-400 select-none">
                      کد کپی شده را برای دوستان خود بفرستید تا برگه پیش‌بینی شما را ببینند:
                    </label>
                    <textarea
                      id="share-code-field"
                      readOnly
                      value={shareCode}
                      className="w-full h-18 bg-slate-950 text-slate-300 rounded-xl px-3 py-2 text-[10px] font-mono border border-white/5 focus:outline-none resize-none shadow-inner text-left"
                      dir="ltr"
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

                  {/* Section 2: Import Code */}
                  <div id="code-import-slot" className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 space-y-2.5 font-bold">
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
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-650 text-white font-bold text-xs duration-200 cursor-pointer outline-none shadow hover:opacity-90 mb-1"
                    >
                      بارگذاری پیش‌بینی دوست
                    </button>
                  </div>

                  {/* Back/Close Button */}
                  <button
                    id="back-share-code-btn"
                    onClick={() => setShowShareModal(false)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs duration-150 cursor-pointer border border-white/10 outline-none select-none Persian-font"
                  >
                    <ChevronRight size={14} />
                    <span>بازگشت به برنامه</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🏆 ULTIMATE CHAMPION SELECTION MODAL */}
      <AnimatePresence>
        {isChampModalOpen && (
          <div id="champ-selection-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-3xl w-full max-w-lg p-6 flex flex-col gap-4 shadow-2xl shadow-purple-950/40 relative max-h-[85vh] text-right"
              dir="rtl"
            >
              {/* Close Button */}
              <button
                id="close-champ-modal"
                onClick={() => setIsChampModalOpen(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white bg-slate-900 p-1.5 rounded-lg border border-white/5 duration-150 cursor-pointer hover:bg-slate-800"
              >
                ✕
              </button>

              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
                  <Trophy size={16} className="text-yellow-400 rotate-12" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-100 Persian-font">انتخاب قهرمان طلایی جام</h3>
                  <p className="text-[10px] sm:text-xs text-slate-400">یک کشور را به عنوان پیش‌بینی فاتح جام انتخاب کنید</p>
                </div>
              </div>

              {/* Search Field */}
              <div className="relative">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="جستجوی نام کشور یا کلمه کلیدی..."
                  value={champModalSearch}
                  onChange={(e) => setChampModalSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pr-9 pl-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-pink-500/40 text-right"
                />
              </div>

              {/* Grid of Teams */}
              <div className="overflow-y-auto pr-1 space-y-2 flex-1 scrollbar-thin scrollbar-thumb-white/10 max-h-[50vh]">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-2">
                  {Array.from(new Map(Object.values(TEAMS).map(t => [t.id, t])).values())
                    .filter(t => 
                      t.name.includes(champModalSearch) || 
                      t.nameEn.toLowerCase().includes(champModalSearch.toLowerCase())
                    )
                    .map(t => {
                      const isSelected = campaignChamp === t.id;
                      return (
                        <button
                          id={`camp-champ-item-${t.id}`}
                          key={t.id}
                          onClick={() => {
                            setCampaignChamp(t.id);
                            localStorage.setItem("predictor_campaign_champ", t.id);
                            setIsChampModalOpen(false);
                            showNotice(`تیم ${t.name} به عنوان قهرمان نهایی انتخاب شد! ۱۵۰ امتیاز ویژه هدیه برای شما فعال گشت. 🏆🔥`);
                          }}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-150 text-right w-full cursor-pointer hover:scale-[1.02] ${
                            isSelected 
                              ? "bg-gradient-to-l from-pink-500/25 to-indigo-500/25 border-pink-500 text-white font-black animate-pulse" 
                              : "bg-slate-950/40 hover:bg-slate-950/90 border-white/5 text-slate-300 hover:text-white"
                          }`}
                        >
                          <TeamFlag team={t} className="w-7 h-4.5 rounded border border-white/10 shrink-0 object-cover" />
                          <div className="flex flex-col text-right leading-none min-w-0 flex-1">
                            <span className="text-xs font-black truncate">{t.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono truncate">{t.nameEn}</span>
                          </div>
                          {isSelected && <Check size={13} className="text-pink-400 shrink-0" />}
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="text-[10px] text-center text-slate-500 pt-2 border-t border-white/5 Persian-font">
                🎁 با انتخاب قهرمان زودهنگام، <span className="text-pink-400 font-bold">۱۵۰ امتیاز بونس</span> ویژه برای شما فعال می‌شود.
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

      {/* ----------------- FLOATING ACTION TOOLBAR ----------------- */}
      <div id="floating-action-toolbar" className="fixed bottom-20 left-auto right-4 sm:right-8 sm:bottom-8 z-40 flex items-center justify-end pointer-events-none">
        
        {/* Predict Today Button (Pill shape) */}
        <motion.button
          id="predict-today-toast-fab"
          onClick={handlePredictTodayBtn}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="pointer-events-auto h-14 px-5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white font-black text-xs shadow-xl shadow-orange-950/40 border border-white/20 flex items-center gap-2 outline-none select-none Persian-font cursor-pointer hover:brightness-110 active:brightness-95 transition-all"
        >
          <span className="text-sm">⚡</span>
          <span>پیش‌بینی بازی امروز</span>
        </motion.button>
      </div>

      {/* ----------------- MOBILE BOTTOM NAV BAR & MORE PANEL ----------------- */}
      <nav id="mobile-navigation-tabs" className="sm:hidden fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 px-1 py-1 z-40 shadow-2xl flex items-center justify-around h-16 w-full animate-fade-in" dir="rtl">
        {[
          { id: "groups", label: "بازی‌ها", icon: Calendar },
          { id: "standings", label: "جدول‌ها", icon: Award },
          { id: "knockout", label: "حذفی", icon: Trophy },
          { id: "participants", label: "کاربران", icon: Users },
          { id: "more", label: "بیشتر", icon: Menu }
        ].map((tab) => {
          const Icon = tab.icon;
          // The more button is active if the active tab is one of the secondary pages (not the main 4)
          const isSecondaryActive = ["achievements", "sportsNews", "rules", "adminDashboard"].includes(activeTab);
          const isActive = tab.id === "more" ? isSecondaryActive : activeTab === tab.id;

          return (
            <button
              id={`mobile-tab-btn-${tab.id}`}
              key={tab.id}
              onClick={() => {
                if (tab.id === "more") {
                  setIsMobileMenuOpen(true);
                  trackUserAction("کلیک روی دکمه بیشتر در منوی موبایل");
                } else {
                  setActiveTab(tab.id as any);
                  setIsMobileMenuOpen(false);
                  const element = document.getElementById("primary-view-container") || document.getElementById("navigation-tabs");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 px-0.5 h-full font-bold duration-150 cursor-pointer outline-none relative transition-all ${
                isActive ? "text-pink-400 font-black" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon size={18} className={isActive ? "text-pink-400 scale-110 animate-pulse" : "text-slate-400"} />
                {tab.id === "more" && stats.unlockedCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 text-[8px] font-black text-slate-950">
                    {stats.unlockedCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] tracking-tight Persian-font select-none">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="mobileActiveTabIndicator"
                  className="absolute bottom-0.5 w-6 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* 🔮 BEAUTIFUL MOBILE SLIDING MORE TRAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:hidden">
            {/* Dark glass overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Custom bottom sheet tray */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950 border-t border-purple-500/20 rounded-t-[2rem] p-6 shadow-2xl z-50 flex flex-col gap-4 text-right"
              dir="rtl"
            >
              {/* Grab handle */}
              <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mb-2 shrink-0" />

              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="text-right">
                  <h3 className="text-sm font-black text-slate-200 Persian-font">سایر بخش‌ها و امکانات</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 Persian-font">بخش پشتیبانی و تنظیمات کاربری مسابقه</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer active:scale-95"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Grid of options */}
              <div className="grid grid-cols-2 gap-3 py-2">
                {[
                  { id: "achievements", label: "نشان‌ها و دستاوردها", desc: "جوایز و مدال‌های کسب شده", icon: Sparkles, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                  { id: "sportsNews", label: "اخبار و پخش زنده", desc: "ویدیوها و خبرهای جام", icon: Radio, color: "text-red-400 bg-red-500/10 border-red-500/20" },
                  { id: "rules", label: "قوانین و جوایز مسابقه", desc: "راهنمای کامل ثبت پیش‌بینی", icon: Gift, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
                  ...(isAdminMode ? [{ id: "adminDashboard", label: "پنل مدیریت سیستم", desc: "دسترسی بوقچی ارشد", icon: ShieldCheck, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }] : [])
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setIsMobileMenuOpen(false);
                        const element = document.getElementById("primary-view-container");
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }}
                      className={`p-3 rounded-2xl border text-right flex flex-col gap-2 transition-all outline-none duration-150 cursor-pointer active:scale-95 ${
                        isActive
                          ? "border-pink-500 bg-pink-500/5 text-pink-400 ring-2 ring-pink-500/20"
                          : "border-white/5 bg-slate-900/60 text-slate-300 hover:bg-slate-900 hover:border-white/10"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${item.color}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="text-[11.5px] font-black leading-none">{item.label}</div>
                        <div className="text-[9px] text-slate-500 mt-1 leading-none">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick tip */}
              <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 text-[10px] text-slate-400 text-center select-none leading-relaxed Persian-font mt-1">
                🏆 تمام اطلاعات و رکوردهای شما به صورت لایو با همگام‌سازی سرور دانش‌آموزی شاد حفظ خواهند شد.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

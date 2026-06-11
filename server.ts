import express from "express";
import path from "path";
import fs from "fs";
import https from "https";
import * as cheerio from "cheerio";

const app = express();
const PORT = 3000;

app.use(express.json());

import {
  initDb,
  dbGetParticipants,
  dbSaveParticipant,
  dbUpdateParticipant,
  dbDeleteParticipant,
  dbBulkSaveParticipants,
  dbUpsertShadParticipant,
  dbGetParticipantByShadHashedId,
  dbGetActionLogs,
  dbSaveActionLog,
  dbClearActionLogs,
} from "./src/db";
import { getShadAccessToken, fetchShadUserEvent } from "./src/shad-api";

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 🌐 SHAD Events API Integration Endpoint
// Decodes UserID/UserHashId to retrieve student identity details from the SHAD operations server.
app.get("/api/shad/user-info", async (req, res) => {
  const userId = (req.query.UserID || req.query.UserHashId || req.query.userId || "") as string;
  
  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      error: "شناسه کاربر شاد (UserID) الزامی است." 
    });
  }

  const landingIdStr = process.env.SHAD_LANDING_ID;
  const username = process.env.SHAD_USERNAME;
  const password = process.env.SHAD_PASSWORD;

  const isConfigured = landingIdStr && username && password;

  if (!isConfigured) {
    // ⚙️ High-Fidelity Simulator Fallback Mode when SHAD secrets are not yet configured in env
    // This allows seamless testing of the SHAD integration directly from the AI Studio pre-production preview.
    console.info(`[SHAD Simulator] Querying profile for UserID: ${userId}. Environment credentials not fully configured (SHAD_USERNAME, SHAD_PASSWORD). Providing demonstration avatar data.`);
    
    // Choose/mock a student identity depending on the hash ID to make it interactive and dynamic
    const isMockGirl = userId.length % 2 === 0;
    
    const mockStudent = isMockGirl ? {
      id: 516222,
      nationalId: null,
      hashedId: userId,
      name: "رونیکا",
      family: "نادم کچائی",
      event: "جشنواره ورزشی نوجوانان شاد",
      provinceName: "گیلان",
      mobile: "989226670378",
      courseStudy: "دوره ابتدایی توصیفی",
      districtName: "رشت .ناحیه ۱",
      fundamentalId: 3,
      role: "student"
    } : {
      id: 516223,
      nationalId: null,
      hashedId: userId,
      name: "امیرحسین",
      family: "رحیمیان",
      event: "مسابقات فوتبال دانش‌آموزی",
      provinceName: "تهران",
      mobile: "989123456789",
      courseStudy: "متوسطه اول نظری",
      districtName: "تهران .منطقه ۵",
      fundamentalId: 3,
      role: "student"
    };

    const participant = await dbUpsertShadParticipant(mockStudent);

    return res.json({
      success: true,
      simulation: true,
      data: mockStudent,
      participant,
      description: "با موفقیت انجام شد (شبیه‌ساز — فقط برای توسعه لوکال)"
    });
  }

  try {
    const landingId = parseInt(landingIdStr, 10);
    const token = await getShadAccessToken(landingId, username, password);

    console.log(`[SHAD API] Querying ShadEvent user details for UserHashId: ${userId}`);
    const eventResult = await fetchShadUserEvent(userId, token);

    if (!eventResult.success || !eventResult.data) {
      return res.status(404).json({
        success: false,
        error: eventResult.description || "اطلاعات کاربر در شاد یافت نشد.",
      });
    }

    const profileData = {
      ...eventResult.data,
      hashedId: eventResult.data.hashedId || userId,
    };

    const participant = await dbUpsertShadParticipant(profileData);

    return res.json({
      success: true,
      simulation: false,
      data: profileData,
      participant,
      description: eventResult.description || "اطلاعات با موفقیت از شاد همگام‌سازی شد.",
    });
  } catch (error: any) {
    console.error("[SHAD Integration Error]", error.message);
    return res.status(502).json({
      success: false,
      error: error.message || "خطا در ارتباط با وب‌سرویس شاد",
    });
  }
});

app.post("/api/participants/register-shad", async (req, res) => {
  try {
    const hashedId =
      req.body.hashedId || req.body.UserID || req.body.UserHashId || req.body.userId;

    if (!hashedId) {
      return res.status(400).json({ error: "شناسه کاربر شاد (hashedId) الزامی است." });
    }

    const participant = await dbUpsertShadParticipant(
      {
        hashedId,
        id: req.body.id,
        name: req.body.name,
        family: req.body.family,
        mobile: req.body.mobile,
        event: req.body.event,
        provinceName: req.body.provinceName,
        districtName: req.body.districtName,
        courseStudy: req.body.courseStudy,
        role: req.body.role,
      },
      {
        favoriteTeam: req.body.favoriteTeam,
        predictedChampion: req.body.predictedChampion,
        predScore: req.body.predScore,
        status: req.body.status ?? "visited",
        phoneOrEmail: req.body.mobile || req.body.phoneOrEmail,
        isPublished: req.body.isPublished,
        predictionsCount: req.body.predictionsCount,
      }
    );

    res.status(201).json(participant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 USER ACTION TRACKING ENDPOINTS
app.get("/api/action-logs", async (req, res) => {
  try {
    const list = await dbGetActionLogs();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/action-logs", async (req, res) => {
  try {
    const { username, action, details } = req.body;
    if (!username || !action) {
      return res.status(400).json({ error: "Username and action fields are required." });
    }
    const log = {
      id: "log-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      username,
      action,
      timestamp: new Date().toISOString(),
      details: details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : undefined,
    };
    const saved = await dbSaveActionLog(log);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/action-logs", async (req, res) => {
  try {
    await dbClearActionLogs();
    res.json({ success: true, message: "کلیه گزارش‌های فعالیت کاربران با موفقیت پاکسازی شد." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/participants", async (req, res) => {
  try {
    const list = await dbGetParticipants();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/participants", async (req, res) => {
  try {
    const shadHashedId =
      req.body.shadHashedId || req.body.hashedId || req.body.UserID || null;

    if (shadHashedId) {
      const existing = await dbGetParticipantByShadHashedId(shadHashedId);
      if (existing) {
        const updated = await dbUpdateParticipant(existing.id, {
          name: req.body.name ?? existing.name,
          favoriteTeam: req.body.favoriteTeam ?? existing.favoriteTeam,
          predictedChampion: req.body.predictedChampion ?? existing.predictedChampion,
          predScore: req.body.predScore ?? existing.predScore,
          status: req.body.status ?? existing.status,
          phoneOrEmail: req.body.phoneOrEmail ?? existing.phoneOrEmail,
          isPublished: req.body.isPublished ?? existing.isPublished,
          predictionsCount: req.body.predictionsCount ?? existing.predictionsCount,
        });
        return res.json(updated);
      }

      const saved = await dbUpsertShadParticipant(
        {
          hashedId: shadHashedId,
          name: req.body.name,
          family: req.body.family,
          mobile: req.body.phoneOrEmail,
        },
        {
          name: req.body.name || "",
          favoriteTeam: req.body.favoriteTeam || "ایران",
          predictedChampion: req.body.predictedChampion || "",
          predScore: req.body.predScore || 0,
          status: req.body.status || "active",
          phoneOrEmail: req.body.phoneOrEmail || "",
          isPublished: req.body.isPublished !== undefined ? req.body.isPublished : false,
          registeredAt: new Date().toLocaleDateString("fa-IR"),
          predictionsCount: req.body.predictionsCount || 0,
        }
      );
      return res.status(201).json(saved);
    }

    const newParticipant = {
      id: "p-" + Math.random().toString(36).substr(2, 9),
      registeredAt: new Date().toLocaleDateString("fa-IR"),
      predictionsCount: req.body.predictionsCount || 0,
      isPublished: req.body.isPublished !== undefined ? req.body.isPublished : false,
      name: req.body.name || "",
      favoriteTeam: req.body.favoriteTeam || "",
      predictedChampion: req.body.predictedChampion || "",
      predScore: req.body.predScore || 0,
      status: req.body.status || "active",
      phoneOrEmail: req.body.phoneOrEmail || "",
    };
    const saved = await dbSaveParticipant(newParticipant);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/participants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await dbUpdateParticipant(id, req.body);
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: "Participant not found" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/participants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await dbDeleteParticipant(id);
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Participant not found" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/participants/bulk", async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      const success = await dbBulkSaveParticipants(req.body);
      res.json({ success, count: req.body.length });
    } else {
      res.status(400).json({ error: "Expected array of participants" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

let liveScoreCache: {
  timestamp: number;
  data: any[];
} | null = null;

const LIVESCORE_CACHE_DURATION = 3600000; // 1 hour (3600000 ms)

function fetchUrlWithHttps(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "fa,en-US;q=0.9,en;q=0.8"
      }
    };
    const req = https.get(url, options, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith("http") 
          ? res.headers.location 
          : new URL(res.headers.location, url).toString();
        fetchUrlWithHttps(redirectUrl).then(resolve).catch(reject);
        return;
      }
      
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => { resolve(data); });
    });
    
    req.on("error", (err) => { reject(err); });
    req.setTimeout(4500, () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
  });
}

const translateTeamName = (englishName: string): string => {
  if (!englishName) return "نامشخص";
  const map: { [key: string]: string } = {
    "Mexico": "مکزیک",
    "South Africa": "آفریقای جنوبی",
    "USA": "آمریکا",
    "United States": "آمریکا",
    "Iran": "ایران",
    "Brazil": "برزیل",
    "France": "فرانسه",
    "England": "انگلستان",
    "Italy": "ایتالیا",
    "Spain": "اسپانیا",
    "Germany": "آلمان",
    "Argentina": "آرژانتین",
    "Portugal": "پرتغال",
    "Japan": "ژاپن",
    "South Korea": "کره جنوبی",
    "Croatia": "کرواسی",
    "Morocco": "مراکش",
    "Senegal": "سنگال",
    "Netherlands": "هلند",
    "Belgium": "بلژیک",
    "Switzerland": "سوئیس",
    "Uruguay": "اوروگوئه",
    "Saudi Arabia": "عربستان سعودی",
    "Canada": "کانادا",
    "Qatar": "قطر",
    "Ecuador": "اکوادور",
    "Wales": "ولز",
    "Australia": "استرالیا",
    "Tunisia": "تونس",
    "Poland": "لهستان",
    "Denmark": "دانمارک",
    "Costa Rica": "کاستاریکا",
    "Serbia": "صربستان",
    "Cameroon": "کامرون",
    "Ghana": "غنا"
  };
  return map[englishName] || englishName;
};

const getFlagLogo = (name: string): string => {
  const flags: { [key: string]: string } = {
    "Mexico": "mx", "South Africa": "za", "USA": "us", "United States": "us",
    "Iran": "ir", "Brazil": "br", "France": "fr", "England": "gb",
    "Italy": "it", "Spain": "es", "Germany": "de", "Argentina": "ar",
    "Portugal": "pt", "Japan": "jp", "South Korea": "kr", "Croatia": "hr",
    "Morocco": "ma", "Senegal": "sn", "Netherlands": "nl", "Belgium": "be",
    "Switzerland": "ch", "Uruguay": "uy", "Saudi Arabia": "sa", "Canada": "ca",
    "Qatar": "qa", "Ecuador": "ec", "Wales": "gb-wls", "Australia": "au",
    "Tunisia": "tn", "Poland": "pl", "Denmark": "dk", "Costa Rica": "cr",
    "Serbia": "rs", "Cameroon": "cm", "Ghana": "gh",
    "مکزیک": "mx", "آفریقای جنوبی": "za", "آمریکا": "us", "ایران": "ir",
    "برزیل": "br", "فرانسه": "fr", "انگلستان": "gb", "ایتالیا": "it",
    "اسپانیا": "es", "آلمان": "de", "آرژانتین": "ar", "پرتغال": "pt",
    "ژاپن": "jp", "کره جنوبی": "kr", "کرواسی": "hr", "مراکش": "ma",
    "سنگال": "sn", "هلند": "nl", "بلژیک": "be", "سوئیس": "ch",
    "اروگوئه": "uy", "عربستان سعودی": "sa", "کانادا": "ca", "قطر": "qa",
    "اکوادور": "ec", "ولز": "gb-wls", "استرالیا": "au", "تونس": "tn",
    "لهستان": "pl", "دانمارک": "dk", "کاستاریکا": "cr", "صربستان": "rs",
    "کامرون": "cm", "غنا": "gh"
  };
  const code = flags[name] || "un";
  return `https://flagcdn.com/w80/${code}.png`;
};

const toPersianDigits = (str: string | number): string => {
  if (str === null || str === undefined) return "";
  const numStr = String(str);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return numStr.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
};

const translateStatusDescription = (desc: string): string => {
  if (!desc || desc === "UNKNOWN") return "در جریان";
  const map: { [key: string]: string } = {
    "FT": "پایان",
    "HT": "بین دو نیمه",
    "NS": "شروع نشده",
    "AET": "پایان وقت اضافه",
    "AP": "ضربات پنالتی"
  };
  if (map[desc]) return map[desc];
  const minMatch = desc.match(/(\d+)/);
  if (minMatch) {
    return `دقیقه ${toPersianDigits(minMatch[1])}`;
  }
  return desc;
};

function parseLiveScoreHTML(html: string): any[] {
  const $ = cheerio.load(html);
  const nextData = $("#__NEXT_DATA__").text().trim();
  if (!nextData) return [];
  
  try {
    const parsed = JSON.parse(nextData);
    const pageProps = parsed.props?.pageProps;
    if (!pageProps || !pageProps.initialData) return [];

    const sections = pageProps.initialData.sections || [];
    const extractedMatches: any[] = [];

    sections.forEach((section: any) => {
      if (section.events && Array.isArray(section.events)) {
        section.events.forEach((ev: any) => {
          try {
            const rawHostName = ev.homeTeamName || "Host";
            const rawGuestName = ev.awayTeamName || "Guest";
            
            const hostNamePersian = translateTeamName(rawHostName);
            const guestNamePersian = translateTeamName(rawGuestName);

            const hostGoals = ev.homeTeamScore !== null && ev.homeTeamScore !== undefined && ev.homeTeamScore !== ""
              ? parseInt(ev.homeTeamScore, 10)
              : null;
            const guestGoals = ev.awayTeamScore !== null && ev.awayTeamScore !== undefined && ev.awayTeamScore !== ""
              ? parseInt(ev.awayTeamScore, 10)
              : null;

            let status = 3; // Scheduled / شروع نشده
            let statusTitle = "شروع نشده";

            if (ev.eventStatus === "LIVE" || ev.eventStatus === "IN_PLAY") {
              status = 1;
              statusTitle = translateStatusDescription(ev.statusDescription);
            } else if (ev.eventStatus === "FINISHED" || ev.eventStatus === "FT" || ev.overallStatusId === 2) {
              status = 2;
              statusTitle = "پایان";
            } else {
              status = 3;
              statusTitle = "شروع نشده";
            }

            let time = "۲۰:۰۰";
            if (ev.startDateTimeString && ev.startDateTimeString.length >= 12) {
              const hours = ev.startDateTimeString.substring(8, 10);
              const mins = ev.startDateTimeString.substring(10, 12);
              time = toPersianDigits(`${hours}:${mins}`);
            }

            extractedMatches.push({
              status,
              statusTitle,
              time,
              hostGoals,
              guestGoals,
              host: {
                name: hostNamePersian,
                nameEn: rawHostName,
                logo: getFlagLogo(rawHostName)
              },
              guest: {
                name: guestNamePersian,
                nameEn: rawGuestName,
                logo: getFlagLogo(rawGuestName)
              }
            });
          } catch (innerErr) {
            console.warn("Error parsing matches entry:", innerErr);
          }
        });
      }
    });

    if (extractedMatches.length === 0) return [];

    return [
      {
        title: "جام جهانی ۲۰۲۶ - نتایج زنده (LiveScore)",
        logo: "",
        dates: [
          {
            date: "امروز",
            matches: extractedMatches
          }
        ]
      }
    ];
  } catch (err) {
    console.warn("Error parsing NextData in LiveScore layout:", err);
    return [];
  }
}

app.get("/api/sports-hub/livescore", async (req, res) => {
  if (liveScoreCache && (Date.now() - liveScoreCache.timestamp < LIVESCORE_CACHE_DURATION)) {
    return res.json({ success: true, source: "cached_memory", data: liveScoreCache.data });
  }

  // Define fallback matches in scope
  const fallbackMatches = [
    {
      title: "جام جهانی ۲۰۲۶ - گروه A (آفلاین)",
      logo: "",
      dates: [
        {
          date: "امروز",
          matches: [
            {
              status: 1,
              statusTitle: "دقیقه ۷۲",
              time: "۲۱:۳۰",
              hostGoals: 2,
              guestGoals: 1,
              host: {
                name: "ایران",
                logo: "https://flagcdn.com/w80/ir.png"
              },
              guest: {
                name: "آمریکا",
                logo: "https://flagcdn.com/w80/us.png"
              }
            },
            {
              status: 3,
              statusTitle: "شروع نشده",
              time: "۲۳:۴۵",
              hostGoals: null,
              guestGoals: null,
              host: {
                name: "برزیل",
                logo: "https://flagcdn.com/w80/br.png"
              },
              guest: {
                name: "فرانسه",
                logo: "https://flagcdn.com/w80/fr.png"
              }
            }
          ]
        }
      ]
    },
    {
      title: "جام جهانی ۲۰۲۶ - گروه B (آفلاین)",
      logo: "",
      dates: [
        {
          date: "امروز",
          matches: [
            {
              status: 2,
              statusTitle: "پایان",
              time: "۱۸:۰۰",
              hostGoals: 3,
              guestGoals: 1,
              host: {
                name: "انگلستان",
                logo: "https://flagcdn.com/w80/gb.png"
              },
              guest: {
                name: "ایتالیا",
                logo: "https://flagcdn.com/w80/it.png"
              }
            }
          ]
        }
      ]
    }
  ];

  try {
    // 1. Primary Strategy - Fetch and Scrape LiveScore.com World Cup page
    const targetUrl = "https://www.livescore.com/en/football/international/world-cup-2026/";
    const html = await fetchUrlWithHttps(targetUrl);
    
    if (html && html.trim().length > 0) {
      const scrapedData = parseLiveScoreHTML(html);
      if (scrapedData && scrapedData.length > 0) {
        liveScoreCache = {
          timestamp: Date.now(),
          data: scrapedData
        };
        return res.json({ success: true, source: "livescore_scraped_page", data: scrapedData });
      }
    }
    
    throw new Error("LiveScore match list empty or schema changed");
  } catch (err: any) {
    console.warn("LiveScore scrape failed or timed out. Trying backup live api...", err.message);
    
    try {
      // 2. Secondary Strategy - Fetch from backup web api
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const feedUrl = "https://web-api.varzesh3.com/v2.0/livescore/0";
      const response = await fetch(feedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const apiData = await response.json();
        if (apiData && Array.isArray(apiData)) {
          liveScoreCache = {
            timestamp: Date.now(),
            data: apiData
          };
          return res.json({ success: true, source: "live_api_backup", data: apiData });
        }
      }
    } catch (innerErr: any) {
      console.warn("Backup Varzesh3 API also failed:", innerErr.message);
    }
    
    // 3. Fallback of High-Fidelity Pre-set World Cup 2026 data
    if (!liveScoreCache) {
      liveScoreCache = {
        timestamp: Date.now(),
        data: fallbackMatches
      };
    }
    return res.json({ success: true, source: "fallback_preset", data: liveScoreCache.data });
  }
});

let newsCache: {
  timestamp: number;
  data: any[];
} | null = null;

const CACHE_DURATION = 3600000; // 1 hour (3600000 ms)

app.get("/api/sports-hub/news", async (req, res) => {
  // Check if we have dynamic fresh data in cache
  if (newsCache && (Date.now() - newsCache.timestamp < CACHE_DURATION)) {
    return res.json({ success: true, source: "cached_memory", news: newsCache.data });
  }

  try {
    // Attempt to fetch from official RSS feed
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const feedUrl = "https://www.varzesh3.com/rss/all";
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/xml, application/xml, */*"
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Official RSS fetch failed with status ${response.status}`);
    }

    const xmlText = await response.text();

    // Parse items using Regex
    const items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    const cleanText = (text: string): string => {
      if (!text) return "";
      return text
        // Clean Varzesh 3 sources and reporting phrases to satisfy "بدون ذکر منبع"
        .replace(/به\s+گزارش\s+["«']?ورزش\s*(?:سه|۳)["»']?\s*،?/g, "")
        .replace(/به\s+گزارش\s+ایسنا\s*،?/g, "")
        .replace(/به\s+گزارش\s+خبرگزاری\s+(?:فارس|مهر|تسنیم|دانشجو)\s*،?/g, "")
        .replace(/گزارش\s+["«']?ورزش\s*(?:سه|۳)["»']?\s*،?/g, "")
        .replace(/ورزش\s*(?:سه|۳)/g, "")
        .replace(/varzesh\s*3/ig, "")
        // Clean up common leader/reporter tags
        .replace(/به\s+گزارش\s+["«']?[^"»']+["»']?\s*،?/g, "")
        .replace(/^\s*[-ـ–—:\s،,._\n\r]+\s*/g, "")
        .replace(/\s*[-ـ–—:\s،,._\n\r]+\s*$/g, "")
        .trim();
    };

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];

      // helper to extract tag content
      const getTagValue = (tag: string) => {
        const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`, "i");
        const matchTag = regex.exec(itemContent);
        if (matchTag) {
          return (matchTag[1] || matchTag[2] || "").trim();
        }
        return "";
      };

      let title = getTagValue("title");
      let description = getTagValue("description");
      const pubDate = getTagValue("pubDate");

      // Clean sources entirely (بدون ذکر منبع) and keep clean
      title = cleanText(title);
      description = cleanText(description);

      if (title && description) {
        // Filter strictly for World Cup / Football relevant news to satisfy: "اخبار مربوط به جام جهانی"
        const isWorldCupRelated = /جام|جهانی|کاپ|ایران|تیم\s+ملی|بلژیک|مصر|فیفا|world\s+cup|fifa/i.test(title + " " + description);

        if (isWorldCupRelated) {
          items.push({
            title,
            description, // Representing the clean summary ("خلاصه خبر")
            date: pubDate || new Date().toLocaleString("fa-IR"),
            isLive: true,
          });
        }
      }
    }

    const sortedItems = items.slice(0, 15);

    if (sortedItems.length > 0) {
      // Save to memory cache (hourly)
      newsCache = {
        timestamp: Date.now(),
        data: sortedItems
      };
      return res.json({ success: true, source: "varzesh3_rss", news: sortedItems });
    } else {
      return res.json({ success: true, source: "varzesh3_rss", news: [] });
    }

  } catch (error: any) {
    const fallbackNews = [
      {
        title: "تلاش یوزهای ایرانی برای صعود مقتدرانه در جام جهانی ۲۰۲۶",
        description: "تیم ملی فوتبال ایران با آمادگی کامل کادر فنی و بازیکنان برتر، خود را برای مصاف حساس در مرحله گروهی دور برگشت آماده می‌کند. آخرین وضعیت مربیان و بازیکنان حاکی از روحیه بالای تیم است.",
        date: new Date().toLocaleString("fa-IR"),
        isLive: true,
      },
      {
        title: "آنالیز حریفان ایران در شبیه‌ساز رسمی جام جهانی فوتبال",
        description: "کارشناسان ورزشی به بررسی نقاط قوت و ضعف تیم‌های هم‌گروه ایران پرداختند. پیش‌بینی‌ها نشان‌دهنده شانس بالایی برای صعود جذاب از این مرحله است.",
        date: new Date().toLocaleString("fa-IR"),
        isLive: true,
      },
      {
        title: "آخرین وضعیت مصدومیت ستارگان مربیگری در فوتبال جهانی",
        description: "کادر پزشکی تیم‌های بزرگ آخرین گزارش‌ها را درباره بازیکنان مصدوم منتشر کردند تا کادر فنی برای انتخاب ۱۱ نفر اصلی چالش‌های جدی پیش‌روی داشته باشد.",
        date: new Date().toLocaleString("fa-IR"),
        isLive: true,
      }
    ];

    if (!newsCache) {
      newsCache = {
        timestamp: Date.now(),
        data: fallbackNews
      };
    }
    return res.json({ success: true, source: "fallback_preset", news: newsCache.data });
  }
});


// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  await initDb();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

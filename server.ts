import express from "express";
import path from "path";
import fs from "fs";

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

app.get("/api/sports-hub/livescore", async (req, res) => {
  if (liveScoreCache && (Date.now() - liveScoreCache.timestamp < LIVESCORE_CACHE_DURATION)) {
    return res.json({ success: true, source: "cached_memory", data: liveScoreCache.data });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const feedUrl = "https://web-api.varzesh3.com/v2.0/livescore/0";
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Livescore fetch failed with status ${response.status}`);
    }

    const data = await response.json();
    liveScoreCache = {
      timestamp: Date.now(),
      data: data
    };

    return res.json({ success: true, source: "live", data });
  } catch (err: any) {
    console.error("Livescore fetch error:", err.message);
    if (liveScoreCache) {
       return res.json({ success: true, source: "stale_cache", data: liveScoreCache.data });
    }
    res.status(500).json({ success: false, error: "خطا در دریافت نتایج زنده" });
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
    console.error("Could not fetch rss:", error.message);
    return res.status(500).json({ success: false, error: "خطا در دریافت اطلاعات از سرور ورزش ۳" });
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

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to store participants json file
const PARTICIPANTS_FILE = path.join(process.cwd(), "participants.json");

// Default initial seed data so the dashboard is immediately interesting!
const DEFAULT_PARTICIPANTS = [
  { id: "p-1", name: "علی دایی", favoriteTeam: "ایران", predictedChampion: "برزیل", predScore: 82, status: "completed", phoneOrEmail: "daei@football.ir", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۵", predictionsCount: 48 },
  { id: "p-2", name: "کریم باقری", favoriteTeam: "ایران", predictedChampion: "آلمان", predScore: 75, status: "completed", phoneOrEmail: "bagheri@football.id", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۶", predictionsCount: 48 },
  { id: "p-3", name: "حمید استیلی", favoriteTeam: "ایران", predictedChampion: "آرژانتین", predScore: 68, status: "completed", phoneOrEmail: "estili@champions.net", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۶", predictionsCount: 42 },
  { id: "p-4", name: "مهدی مهدوی‌کیا", favoriteTeam: "ایران", predictedChampion: "فرانسه", predScore: 91, status: "completed", phoneOrEmail: "kia@hamburg.de", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۷", predictionsCount: 48 },
  { id: "p-5", name: "جواد نکونام", favoriteTeam: "اسپانیا", predictedChampion: "اسپانیا", predScore: 54, status: "active", phoneOrEmail: "neko@osasuna.es", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۷", predictionsCount: 36 },
  { id: "p-6", name: "خداداد عزیزی", favoriteTeam: "ایران", predictedChampion: "انگلیس", predScore: 40, status: "pending", phoneOrEmail: "khodadad@saga.ir", isPublished: false, registeredAt: "۱۴۰۵/۰۳/۱۸", predictionsCount: 12 }
];

function getParticipants() {
  try {
    if (!fs.existsSync(PARTICIPANTS_FILE)) {
      fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(DEFAULT_PARTICIPANTS, null, 2), "utf-8");
      return DEFAULT_PARTICIPANTS;
    }
    const data = fs.readFileSync(PARTICIPANTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading participants file:", err);
    return DEFAULT_PARTICIPANTS;
  }
}

function saveParticipants(data: any) {
  try {
    fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing participants file:", err);
    return false;
  }
}

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

    return res.json({
      success: true,
      simulation: true,
      data: mockStudent,
      description: "با موفقیت انجام شد (شبیه‌ساز هوشمند کلوپ شاد)"
    });
  }

  try {
    const landingId = parseInt(landingIdStr, 10);
    
    // Step 1: Login to get the access token from NOYANET SHAD API
    console.log("[SHAD API] Logging in to retrieve integration token...");
    const loginResponse = await fetch("https://shadapi.noyanet.com/api/v1/Account/login", {
      method: "POST",
      headers: {
        "Accept": "text/plain",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        landingId,
        username,
        password
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`شکست در همگام‌سازی احراز هویت با سرور شاد: ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.data;

    if (!token) {
      throw new Error("توکن اختصاصی از وب‌سرویس دریافت شاد بازگردانده نشد.");
    }

    // Step 2: Request user event information using the newly attained Bearer token
    console.log(`[SHAD API] Querying ShadEvent user details for UserHashId: ${userId}`);
    const eventResponse = await fetch(`https://shadapi.noyanet.com/api/v1/ShadEvent?UserHashId=${encodeURIComponent(userId)}`, {
      method: "GET",
      headers: {
        "Accept": "text/plain",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!eventResponse.ok) {
      throw new Error(`خطا در ارتباط با وب‌سرویس استعلام شاد: ${eventResponse.statusText}`);
    }

    const eventResult = await eventResponse.json();
    return res.json({
      success: eventResult.success,
      simulation: false,
      data: eventResult.data,
      description: eventResult.description || "اطلاعات با موفقیت از شاد همگام‌سازی شد."
    });

  } catch (error: any) {
    console.error("[SHAD Integration Error]", error.message);
    
    // Safe degradation: in case of transient network failure on production integration, fallback to simulator
    return res.status(200).json({
      success: true,
      simulation: true,
      networkError: error.message,
      data: {
        id: 500200,
        nationalId: null,
        hashedId: userId,
        name: "کاربر لایو",
        family: "شاد",
        event: "سرویس رویداد زنده شاد",
        provinceName: "ایلام",
        mobile: "989350000000",
        courseStudy: "متوسطه دوم تجربی",
        districtName: "ایلام .ناحیه ۱",
        fundamentalId: 3,
        role: "student"
      },
      description: "به دلیل خطای ارتباطی فعال، نمایش شبیه‌ساز دانش‌آموز بر روی سیستم اعمال گردید."
    });
  }
});

app.get("/api/participants", (req, res) => {
  res.json(getParticipants());
});

app.post("/api/participants", (req, res) => {
  const list = getParticipants();
  const newParticipant = {
    id: "p-" + Math.random().toString(36).substr(2, 9),
    registeredAt: new Date().toLocaleDateString("fa-IR"),
    predictionsCount: req.body.predictionsCount || 48,
    isPublished: req.body.isPublished !== undefined ? req.body.isPublished : true,
    ...req.body
  };
  list.push(newParticipant);
  saveParticipants(list);
  res.status(201).json(newParticipant);
});

app.put("/api/participants/:id", (req, res) => {
  const { id } = req.params;
  const list = getParticipants();
  const idx = list.findIndex((p: any) => p.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...req.body };
    saveParticipants(list);
    res.json(list[idx]);
  } else {
    res.status(404).json({ error: "Participant not found" });
  }
});

app.delete("/api/participants/:id", (req, res) => {
  const { id } = req.params;
  let list = getParticipants();
  const filtered = list.filter((p: any) => p.id !== id);
  if (filtered.length !== list.length) {
    saveParticipants(filtered);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Participant not found" });
  }
});

app.post("/api/participants/bulk", (req, res) => {
  if (Array.isArray(req.body)) {
    saveParticipants(req.body);
    res.json({ success: true, count: req.body.length });
  } else {
    res.status(400).json({ error: "Expected array of participants" });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import fs from "fs";
import path from "path";
import pg from "pg";

export interface Participant {
  id: string;
  shadHashedId?: string | null;
  shadUserId?: number | null;
  name: string;
  favoriteTeam: string;
  predictedChampion: string;
  predScore: number;
  status: string;
  phoneOrEmail: string;
  isPublished: boolean;
  registeredAt: string;
  predictionsCount: number;
  provinceName?: string | null;
  districtName?: string | null;
  courseStudy?: string | null;
  shadEvent?: string | null;
  shadRole?: string | null;
}

export interface ShadProfileInput {
  hashedId: string;
  id?: number;
  name?: string | null;
  family?: string | null;
  mobile?: string;
  event?: string | null;
  provinceName?: string | null;
  districtName?: string | null;
  courseStudy?: string | null;
  role?: string | null;
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const PARTICIPANTS_FILE = path.join(DATA_DIR, "participants.json");
const ACTION_LOGS_FILE = path.join(DATA_DIR, "action_logs.json");
const PREDICTIONS_FILE = path.join(DATA_DIR, "predictions.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

let pool: pg.Pool | null = null;
let isDbInitialized = false;

function resolvePgSsl(): false | { rejectUnauthorized: boolean } {
  if (process.env.DATABASE_SSL === "true") {
    return { rejectUnauthorized: false };
  }
  if (process.env.DATABASE_SSL === "false") {
    return false;
  }
  if (/sslmode=(require|verify-full|verify-ca)/i.test(DATABASE_URL)) {
    return { rejectUnauthorized: false };
  }
  return false;
}

if (DATABASE_URL) {
  console.log("🔌 PostgreSQL Database URL detected. Setting up connection pool...");
  pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: resolvePgSsl(),
  });
} else {
  console.log(`📁 No DATABASE_URL detected. Using file storage at ${PARTICIPANTS_FILE}`);
}

function mapRowToParticipant(row: any): Participant {
  return {
    id: row.id,
    shadHashedId: row.shad_hashed_id ?? null,
    shadUserId: row.shad_user_id ?? null,
    name: row.name,
    favoriteTeam: row.favorite_team,
    predictedChampion: row.predicted_champion,
    predScore: row.pred_score,
    status: row.status,
    phoneOrEmail: row.phone_or_email,
    isPublished: row.is_published,
    registeredAt: row.registered_at,
    predictionsCount: row.predictions_count,
    provinceName: row.province_name ?? null,
    districtName: row.district_name ?? null,
    courseStudy: row.course_study ?? null,
    shadEvent: row.shad_event ?? null,
    shadRole: row.shad_role ?? null,
  };
}

function participantToRow(p: Participant) {
  return [
    p.id,
    p.shadHashedId ?? null,
    p.shadUserId ?? null,
    p.name,
    p.favoriteTeam,
    p.predictedChampion,
    p.predScore,
    p.status,
    p.phoneOrEmail,
    p.isPublished,
    p.registeredAt,
    p.predictionsCount,
    p.provinceName ?? null,
    p.districtName ?? null,
    p.courseStudy ?? null,
    p.shadEvent ?? null,
    p.shadRole ?? null,
  ];
}

const PARTICIPANT_COLUMNS = `
  id, shad_hashed_id, shad_user_id, name, favorite_team, predicted_champion,
  pred_score, status, phone_or_email, is_published, registered_at, predictions_count,
  province_name, district_name, course_study, shad_event, shad_role
`;

async function migrateParticipantsTable() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS participants (
      id VARCHAR(200) PRIMARY KEY,
      shad_hashed_id VARCHAR(200),
      shad_user_id INT,
      name VARCHAR(200) NOT NULL,
      favorite_team VARCHAR(200),
      predicted_champion VARCHAR(200),
      pred_score INT DEFAULT 0,
      status VARCHAR(100) DEFAULT 'visited',
      phone_or_email VARCHAR(200),
      is_published BOOLEAN DEFAULT FALSE,
      registered_at VARCHAR(100),
      predictions_count INT DEFAULT 0,
      province_name VARCHAR(200),
      district_name VARCHAR(200),
      course_study VARCHAR(200),
      shad_event VARCHAR(300),
      shad_role VARCHAR(100)
    )
  `);

  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS shad_hashed_id VARCHAR(200)`);
  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS shad_user_id INT`);
  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS favorite_team VARCHAR(200)`);
  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS predicted_champion VARCHAR(200)`);
  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS pred_score INT DEFAULT 0`);
  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS status VARCHAR(100) DEFAULT 'visited'`);
  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS phone_or_email VARCHAR(200)`);
  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE`);
  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS registered_at VARCHAR(100)`);
  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS predictions_count INT DEFAULT 0`);
  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS province_name VARCHAR(200)`);
  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS district_name VARCHAR(200)`);
  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS course_study VARCHAR(200)`);
  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS shad_event VARCHAR(300)`);
  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS shad_role VARCHAR(100)`);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS participants_shad_hashed_id_unique
    ON participants (shad_hashed_id) WHERE shad_hashed_id IS NOT NULL
  `);
}

export interface ActionLog {
  id: string;
  username: string;
  action: string;
  timestamp: string;
  exactTime?: string;
  details?: string;
}

async function migrateActionLogsTable() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS action_logs (
      id VARCHAR(200) PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      action TEXT NOT NULL,
      timestamp VARCHAR(100) NOT NULL,
      details TEXT
    )
  `);
  try {
    await pool.query(`ALTER TABLE action_logs ADD COLUMN IF NOT EXISTS exact_time VARCHAR(100)`);
  } catch (err) {
    console.error("Error migrating exact_time for action_logs:", err);
  }
}

async function migratePredictionsTable() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS predictions (
      id VARCHAR(255) PRIMARY KEY,
      participant_id VARCHAR(200) NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      match_id VARCHAR(100) NOT NULL,
      score_a INT,
      score_b INT,
      winner_id VARCHAR(100),
      updated_at VARCHAR(100) NOT NULL
    )
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_predictions_participant_match
    ON predictions (participant_id, match_id)
  `);
}

export async function initDb() {
  if (isDbInitialized) return;

  if (pool) {
    try {
      console.log("⏳ Initializing database tables in PostgreSQL...");
      await migrateParticipantsTable();
      await migrateActionLogsTable();
      await migratePredictionsTable();
      isDbInitialized = true;
      console.log("❇️ PostgreSQL initialization completed.");
    } catch (err) {
      console.error("❌ Failed to initialize PostgreSQL table. Falling back to File Mode.", err);
      pool = null;
    }
  }

  if (!pool) {
    try {
      ensureDataDir();
      if (!fs.existsSync(PARTICIPANTS_FILE) || fs.readFileSync(PARTICIPANTS_FILE, "utf-8").trim() === "[]") {
        fs.writeFileSync(PARTICIPANTS_FILE, "[]", "utf-8");
      }
      if (!fs.existsSync(ACTION_LOGS_FILE)) {
        fs.writeFileSync(ACTION_LOGS_FILE, "[]", "utf-8");
      }
      if (!fs.existsSync(PREDICTIONS_FILE) || fs.readFileSync(PREDICTIONS_FILE, "utf-8").trim() === "{}") {
        fs.writeFileSync(PREDICTIONS_FILE, "{}", "utf-8");
      }
      isDbInitialized = true;
      console.log("❇️ Local file storage initialized successfully.");

      // Run auto-seeders for high fidelity demonstrative experience
      try {
        const partsContent = fs.readFileSync(PARTICIPANTS_FILE, "utf-8").trim();
        const predsContent = fs.readFileSync(PREDICTIONS_FILE, "utf-8").trim();
        if (partsContent === "[]") {
          await seedDefaultMockParticipants();
        }
        if (predsContent === "{}") {
          await seedDefaultMockPredictions();
        }
      } catch (seedErr) {
        console.error("Error running auto-seeders:", seedErr);
      }
    } catch (err) {
      console.error("❌ Failed to initialize local file storage:", err);
    }
  }
}

export function buildParticipantFromShad(
  shad: ShadProfileInput,
  overrides: Partial<Participant> = {}
): Participant {
  const hashedId = shad.hashedId;
  const fullName = `${shad.name || ""} ${shad.family || ""}`.trim() || "کاربر شاد";

  return {
    id: hashedId,
    shadHashedId: hashedId,
    shadUserId: shad.id ?? null,
    name: overrides.name ?? fullName,
    favoriteTeam: overrides.favoriteTeam ?? "ایران",
    predictedChampion: overrides.predictedChampion ?? "",
    predScore: overrides.predScore ?? 0,
    status: overrides.status ?? "visited",
    phoneOrEmail: overrides.phoneOrEmail ?? shad.mobile ?? "",
    isPublished: overrides.isPublished ?? false,
    registeredAt: overrides.registeredAt ?? new Date().toLocaleDateString("fa-IR"),
    predictionsCount: overrides.predictionsCount ?? 0,
    provinceName: shad.provinceName ?? null,
    districtName: shad.districtName ?? null,
    courseStudy: shad.courseStudy ?? null,
    shadEvent: shad.event ?? null,
    shadRole: shad.role ?? null,
  };
}

export async function dbGetParticipantByShadHashedId(hashedId: string): Promise<Participant | null> {
  await initDb();

  if (pool) {
    try {
      const res = await pool.query(
        "SELECT * FROM participants WHERE shad_hashed_id = $1 OR id = $1 LIMIT 1",
        [hashedId]
      );
      if (res.rows.length > 0) return mapRowToParticipant(res.rows[0]);
    } catch (err) {
      console.error("Error reading participant by shad hash:", err);
    }
  }

  const list = await dbGetParticipants();
  return list.find((p) => p.shadHashedId === hashedId || p.id === hashedId) ?? null;
}

export async function dbUpsertShadParticipant(
  shad: ShadProfileInput,
  overrides: Partial<Participant> = {}
): Promise<Participant> {
  await initDb();
  const participant = buildParticipantFromShad(shad, overrides);

  if (pool) {
    try {
      const res = await pool.query(
        `
        INSERT INTO participants (${PARTICIPANT_COLUMNS})
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        ON CONFLICT (id) DO UPDATE SET
          shad_hashed_id = EXCLUDED.shad_hashed_id,
          shad_user_id = COALESCE(EXCLUDED.shad_user_id, participants.shad_user_id),
          name = EXCLUDED.name,
          phone_or_email = COALESCE(NULLIF(EXCLUDED.phone_or_email, ''), participants.phone_or_email),
          province_name = COALESCE(EXCLUDED.province_name, participants.province_name),
          district_name = COALESCE(EXCLUDED.district_name, participants.district_name),
          course_study = COALESCE(EXCLUDED.course_study, participants.course_study),
          shad_event = COALESCE(EXCLUDED.shad_event, participants.shad_event),
          shad_role = COALESCE(EXCLUDED.shad_role, participants.shad_role)
        RETURNING *
        `,
        participantToRow(participant)
      );
      return mapRowToParticipant(res.rows[0]);
    } catch (err) {
      console.error("Error upserting Shad participant in PostgreSQL, falling back to files:", err);
    }
  }

  const list = await dbGetParticipants();
  const idx = list.findIndex((p) => p.shadHashedId === participant.shadHashedId || p.id === participant.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...participant, ...overrides };
    fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(list, null, 2), "utf-8");
    return list[idx];
  }
  list.push(participant);
  fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(list, null, 2), "utf-8");
  return participant;
}

export async function dbGetParticipants(): Promise<Participant[]> {
  await initDb();

  if (pool) {
    try {
      const res = await pool.query("SELECT * FROM participants ORDER BY registered_at DESC, id DESC");
      return res.rows.map(mapRowToParticipant);
    } catch (err) {
      console.error("Error reading from PostgreSQL. Falling back to memory/file...", err);
    }
  }

  try {
    if (!fs.existsSync(PARTICIPANTS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(PARTICIPANTS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error parsing participants file:", err);
    return [];
  }
}

export async function dbSaveParticipant(p: Participant): Promise<Participant> {
  await initDb();

  if (pool) {
    try {
      await pool.query(
        `
        INSERT INTO participants (${PARTICIPANT_COLUMNS})
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        `,
        participantToRow(p)
      );
      return p;
    } catch (err) {
      console.error("Error inserting into PostgreSQL, falling back to file storage:", err);
    }
  }

  const list = await dbGetParticipants();
  list.push(p);
  fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(list, null, 2), "utf-8");
  return p;
}

export async function dbUpdateParticipant(id: string, updates: Partial<Participant>): Promise<Participant | null> {
  await initDb();

  if (pool) {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      const columnMap: Record<string, string> = {
        name: "name",
        favoriteTeam: "favorite_team",
        predictedChampion: "predicted_champion",
        predScore: "pred_score",
        status: "status",
        phoneOrEmail: "phone_or_email",
        isPublished: "is_published",
        registeredAt: "registered_at",
        predictionsCount: "predictions_count",
        provinceName: "province_name",
        districtName: "district_name",
        courseStudy: "course_study",
        shadEvent: "shad_event",
        shadRole: "shad_role",
        shadUserId: "shad_user_id",
        shadHashedId: "shad_hashed_id",
      };

      for (const [key, column] of Object.entries(columnMap)) {
        const value = (updates as any)[key];
        if (value !== undefined) {
          fields.push(`${column} = $${paramIndex++}`);
          values.push(value);
        }
      }

      if (fields.length > 0) {
        values.push(id);
        const query = `
          UPDATE participants
          SET ${fields.join(", ")}
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        const res = await pool.query(query, values);
        if (res.rowCount && res.rowCount > 0) {
          return mapRowToParticipant(res.rows[0]);
        }
      }
    } catch (err) {
      console.error("Error updating PostgreSQL participant, falling back to files:", err);
    }
  }

  const list = await dbGetParticipants();
  const idx = list.findIndex((p) => p.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
    fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(list, null, 2), "utf-8");
    return list[idx];
  }
  return null;
}

export async function dbDeleteParticipant(id: string): Promise<boolean> {
  await initDb();

  if (pool) {
    try {
      const res = await pool.query("DELETE FROM participants WHERE id = $1", [id]);
      return res.rowCount !== null && res.rowCount > 0;
    } catch (err) {
      console.error("Error deleting from PostgreSQL, falling back to files:", err);
    }
  }

  const list = await dbGetParticipants();
  const filtered = list.filter((p) => p.id !== id);
  if (filtered.length !== list.length) {
    fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    return true;
  }
  return false;
}

export async function dbBulkSaveParticipants(newList: Participant[]): Promise<boolean> {
  await initDb();

  if (pool) {
    let client;
    try {
      client = await pool.connect();
      await client.query("BEGIN");
      await client.query("DELETE FROM participants");
      for (const p of newList) {
        await client.query(
          `
          INSERT INTO participants (${PARTICIPANT_COLUMNS})
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
          `,
          participantToRow(p)
        );
      }
      await client.query("COMMIT");
      return true;
    } catch (transactionErr) {
      if (client) {
        try {
          await client.query("ROLLBACK");
        } catch (_) {}
      }
      console.error("Error in Postgres transaction bulk save, falling back to files:", transactionErr);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(newList, null, 2), "utf-8");
  if (newList.some((p) => p.id === "p-s1")) {
    await seedDefaultMockPredictions();
  }
  return true;
}

export async function dbGetActionLogs(): Promise<ActionLog[]> {
  await initDb();
  if (pool) {
    try {
      const res = await pool.query("SELECT id, username, action, timestamp, exact_time, details FROM action_logs ORDER BY timestamp DESC, id DESC");
      return res.rows.map(row => ({
        id: row.id,
        username: row.username,
        action: row.action,
        timestamp: row.timestamp,
        exactTime: row.exact_time ?? undefined,
        details: row.details ?? undefined
      }));
    } catch (err) {
      console.error("Error reading action_logs from PostgreSQL:", err);
    }
  }

  try {
    if (!fs.existsSync(ACTION_LOGS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(ACTION_LOGS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error parsing action_logs file:", err);
    return [];
  }
}

export async function dbSaveActionLog(log: ActionLog): Promise<ActionLog> {
  await initDb();
  if (pool) {
    try {
      await pool.query(
        "INSERT INTO action_logs (id, username, action, timestamp, exact_time, details) VALUES ($1, $2, $3, $4, $5, $6)",
        [log.id, log.username, log.action, log.timestamp, log.exactTime ?? null, log.details ?? null]
      );
      return log;
    } catch (err) {
      console.error("Error saving action_log to PostgreSQL:", err);
    }
  }

  const list = await dbGetActionLogs();
  list.unshift(log); // newest first
  // Keep logs complete without deleting/truncating any data as requested
  fs.writeFileSync(ACTION_LOGS_FILE, JSON.stringify(list, null, 2), "utf-8");
  return log;
}

export async function dbClearActionLogs(): Promise<boolean> {
  await initDb();
  if (pool) {
    try {
      await pool.query("DELETE FROM action_logs");
      return true;
    } catch (err) {
      console.error("Error clearing action_logs in PostgreSQL:", err);
    }
  }

  fs.writeFileSync(ACTION_LOGS_FILE, JSON.stringify([], null, 2), "utf-8");
  return true;
}

export async function dbSaveUserPredictions(participantId: string, predictions: any[]): Promise<boolean> {
  await initDb();
  if (!participantId) return false;

  const updatedAt = new Date().toISOString();

  if (pool) {
    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        for (const pred of predictions) {
          const id = `${participantId}_${pred.matchId}`;
          await client.query(`
            INSERT INTO predictions (id, participant_id, match_id, score_a, score_b, winner_id, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
              score_a = EXCLUDED.score_a,
              score_b = EXCLUDED.score_b,
              winner_id = EXCLUDED.winner_id,
              updated_at = EXCLUDED.updated_at
          `, [id, participantId, pred.matchId, pred.scoreA, pred.scoreB, pred.winnerId || null, updatedAt]);
        }
        await client.query("COMMIT");
        return true;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Error saving predictions in PostgreSQL, falling back to files:", err);
    }
  }

  try {
    ensureDataDir();
    let dataMap: Record<string, any[]> = {};
    if (fs.existsSync(PREDICTIONS_FILE)) {
      const content = fs.readFileSync(PREDICTIONS_FILE, "utf-8");
      dataMap = JSON.parse(content);
    }
    dataMap[participantId] = predictions.map(p => ({
      matchId: p.matchId,
      scoreA: p.scoreA,
      scoreB: p.scoreB,
      winnerId: p.winnerId || null,
      updatedAt
    }));
    fs.writeFileSync(PREDICTIONS_FILE, JSON.stringify(dataMap, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing local predictions file:", err);
    return false;
  }
}

export async function dbGetUserPredictions(participantId: string): Promise<any[]> {
  await initDb();
  if (!participantId) return [];

  if (pool) {
    try {
      const res = await pool.query(
        "SELECT match_id as \"matchId\", score_a as \"scoreA\", score_b as \"scoreB\", winner_id as \"winnerId\" FROM predictions WHERE participant_id = $1",
        [participantId]
      );
      return res.rows.map(row => ({
        matchId: row.matchId,
        scoreA: row.scoreA,
        scoreB: row.scoreB,
        winnerId: row.winnerId
      }));
    } catch (err) {
      console.error("Error reading predictions from PostgreSQL, falling back to files:", err);
    }
  }

  try {
    if (fs.existsSync(PREDICTIONS_FILE)) {
      const content = fs.readFileSync(PREDICTIONS_FILE, "utf-8");
      const dataMap = JSON.parse(content);
      return dataMap[participantId] || [];
    }
  } catch (err) {
    console.error("Error parsing local predictions file:", err);
  }

  return [];
}

export async function dbGetAllPredictions(): Promise<any[]> {
  await initDb();
  if (pool) {
    try {
      const res = await pool.query(
        "SELECT participant_id as \"participantId\", match_id as \"matchId\", score_a as \"scoreA\", score_b as \"scoreB\", winner_id as \"winnerId\" FROM predictions"
      );
      return res.rows;
    } catch (err) {
      console.error("Error reading all predictions from PostgreSQL, falling back to files:", err);
    }
  }

  try {
    if (fs.existsSync(PREDICTIONS_FILE)) {
      const content = fs.readFileSync(PREDICTIONS_FILE, "utf-8");
      const dataMap = JSON.parse(content);
      const all: any[] = [];
      for (const [partId, preds] of Object.entries(dataMap)) {
        if (Array.isArray(preds)) {
          preds.forEach((p: any) => {
            all.push({
              participantId: partId,
              matchId: p.matchId,
              scoreA: p.scoreA,
              scoreB: p.scoreB,
              winnerId: p.winnerId
            });
          });
        }
      }
      return all;
    }
  } catch (err) {
    console.error("Error parsing all local predictions:", err);
  }

  return [];
}

export async function seedDefaultMockParticipants() {
  const samples: Participant[] = [
    { id: "p-s1", name: "امیر قلعه‌نویی", favoriteTeam: "ایران", predictedChampion: "برزیل", predScore: 88, status: "completed", phoneOrEmail: "ghalenoei@teammelli.ir", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۸", predictionsCount: 48 },
    { id: "p-s2", name: "پیمان یوسفی", favoriteTeam: "انگلستان", predictedChampion: "فرانسه", predScore: 62, status: "completed", phoneOrEmail: "yousefi@irib.ir", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۹", predictionsCount: 48 },
    { id: "p-s3", name: "سردار آزمون", favoriteTeam: "ایران", predictedChampion: "آلمان", predScore: 92, status: "completed", phoneOrEmail: "sardar@roma.it", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۹", predictionsCount: 48 }
  ];
  if (pool) {
    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("DELETE FROM participants");
        for (const p of samples) {
          await client.query(
            `
            INSERT INTO participants (${PARTICIPANT_COLUMNS})
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
            `,
            participantToRow(p)
          );
        }
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("PG Seed participants failed:", err);
      } finally {
        client.release();
      }
    } catch (_) {}
  }
  ensureDataDir();
  fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(samples, null, 2), "utf-8");
}

export async function seedDefaultMockPredictions() {
  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const participants = ["p-s1", "p-s2", "p-s3"];
  
  const mockData: Record<string, any[]> = {};
  
  participants.forEach((partId, pIdx) => {
    const list: any[] = [];
    groups.forEach(gId => {
      for (let mIdx = 1; mIdx <= 6; mIdx++) {
        const matchId = `G-${gId}-${mIdx}`;
        // Generate deterministic, typical scores based on user index
        let scoreA = 1;
        let scoreB = 0;
        if (pIdx === 0) {
          scoreA = mIdx % 2 === 0 ? 2 : 1;
          scoreB = mIdx % 3 === 0 ? 1 : 0;
        } else if (pIdx === 1) {
          scoreA = mIdx % 2 === 0 ? 1 : 2;
          scoreB = mIdx % 2 === 0 ? 1 : 2; // high draw probability
        } else if (pIdx === 2) {
          scoreA = mIdx % 3 === 0 ? 3 : 2;
          scoreB = mIdx % 3 === 0 ? 0 : 1;
        }
        list.push({
          matchId,
          scoreA,
          scoreB,
          winnerId: null,
          updatedAt: new Date().toISOString()
        });
      }
    });
    mockData[partId] = list;
  });

  if (pool) {
    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        for (const [partId, preds] of Object.entries(mockData)) {
          for (const p of preds) {
            const id = `${partId}_${p.matchId}`;
            await client.query(`
              INSERT INTO predictions (id, participant_id, match_id, score_a, score_b, winner_id, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (id) DO NOTHING
            `, [id, partId, p.matchId, p.scoreA, p.scoreB, p.winnerId, p.updatedAt]);
          }
        }
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("PG Seed failed:", err);
      } finally {
        client.release();
      }
    } catch (_) {}
  }

  ensureDataDir();
  fs.writeFileSync(PREDICTIONS_FILE, JSON.stringify(mockData, null, 2), "utf-8");
}


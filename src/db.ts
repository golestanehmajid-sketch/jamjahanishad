import fs from "fs";
import path from "path";
import pg from "pg";

export interface Participant {
  id: string;
  name: string;
  favoriteTeam: string;
  predictedChampion: string;
  predScore: number;
  status: string;
  phoneOrEmail: string;
  isPublished: boolean;
  registeredAt: string;
  predictionsCount: number;
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const PARTICIPANTS_FILE = path.join(DATA_DIR, "participants.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: "p-1", name: "علی دایی", favoriteTeam: "ایران", predictedChampion: "برزیل", predScore: 82, status: "completed", phoneOrEmail: "daei@football.ir", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۵", predictionsCount: 48 },
  { id: "p-2", name: "کریم باقری", favoriteTeam: "ایران", predictedChampion: "آلمان", predScore: 75, status: "completed", phoneOrEmail: "bagheri@football.id", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۶", predictionsCount: 48 },
  { id: "p-3", name: "حمید استیلی", favoriteTeam: "ایران", predictedChampion: "آرژانتین", predScore: 68, status: "completed", phoneOrEmail: "estili@champions.net", isPublished: true, registeredAt: "۱۴۰۵/۰3/۱۶", predictionsCount: 42 },
  { id: "p-4", name: "مهدی مهدوی‌کیا", favoriteTeam: "ایران", predictedChampion: "فرانسه", predScore: 91, status: "completed", phoneOrEmail: "kia@hamburg.de", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۷", predictionsCount: 48 },
  { id: "p-5", name: "جواد نکونام", favoriteTeam: "اسپانیا", predictedChampion: "اسپانیا", predScore: 54, status: "active", phoneOrEmail: "neko@osasuna.es", isPublished: true, registeredAt: "۱۴۰۵/۰۳/۱۷", predictionsCount: 36 },
  { id: "p-6", name: "خداداد عزیزی", favoriteTeam: "ایران", predictedChampion: "انگلیس", predScore: 40, status: "pending", phoneOrEmail: "khodadad@saga.ir", isPublished: false, registeredAt: "۱۴۰۵/۰۳/۱۸", predictionsCount: 12 }
];

// Determine if we should use PostgreSQL
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
  // Liara private-network Postgres does not use SSL; enable only when URL asks for it
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

// Map database row to Participant object
function mapRowToParticipant(row: any): Participant {
  return {
    id: row.id,
    name: row.name,
    favoriteTeam: row.favorite_team,
    predictedChampion: row.predicted_champion,
    predScore: row.pred_score,
    status: row.status,
    phoneOrEmail: row.phone_or_email,
    isPublished: row.is_published,
    registeredAt: row.registered_at,
    predictionsCount: row.predictions_count
  };
}

export async function initDb() {
  if (isDbInitialized) return;

  if (pool) {
    try {
      console.log("⏳ Initializing database tables in PostgreSQL...");
      // Create table if not exists with correct data schema
      await pool.query(`
        CREATE TABLE IF NOT EXISTS participants (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          favorite_team VARCHAR(200),
          predicted_champion VARCHAR(200),
          pred_score INT DEFAULT 0,
          status VARCHAR(100) DEFAULT 'active',
          phone_or_email VARCHAR(200),
          is_published BOOLEAN DEFAULT TRUE,
          registered_at VARCHAR(100),
          predictions_count INT DEFAULT 0
        )
      `);
      
      // Check if table is empty, if is empty seed with default initial data
      const checkRes = await pool.query("SELECT COUNT(*) FROM participants");
      const count = parseInt(checkRes.rows[0].count, 10);
      if (count === 0) {
        console.log("🌱 Seeding empty PostgreSQL database with initial participants...");
        for (const p of DEFAULT_PARTICIPANTS) {
          await pool.query(`
            INSERT INTO participants 
            (id, name, favorite_team, predicted_champion, pred_score, status, phone_or_email, is_published, registered_at, predictions_count)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            p.id, p.name, p.favoriteTeam, p.predictedChampion, p.predScore, 
            p.status, p.phoneOrEmail, p.isPublished, p.registeredAt, p.predictionsCount
          ]);
        }
        console.log("✅ Seeding completed successfully.");
      }
      isDbInitialized = true;
      console.log("❇️ PostgreSQL initialization completed.");
    } catch (err) {
      console.error("❌ Failed to initialize PostgreSQL table. Falling back to File Mode.", err);
      pool = null; // Mark as null to use fallback file mode gracefully
    }
  }

  if (!pool) {
    try {
      ensureDataDir();
      if (!fs.existsSync(PARTICIPANTS_FILE)) {
        fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(DEFAULT_PARTICIPANTS, null, 2), "utf-8");
      }
      isDbInitialized = true;
      console.log("❇️ Local file storage initialized successfully.");
    } catch (err) {
      console.error("❌ Failed to initialize local file storage:", err);
    }
  }
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

  // Fallback to local file
  try {
    if (!fs.existsSync(PARTICIPANTS_FILE)) {
      return DEFAULT_PARTICIPANTS;
    }
    const data = fs.readFileSync(PARTICIPANTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error parsing participants file:", err);
    return DEFAULT_PARTICIPANTS;
  }
}

export async function dbSaveParticipant(p: Participant): Promise<Participant> {
  await initDb();

  if (pool) {
    try {
      await pool.query(`
        INSERT INTO participants 
        (id, name, favorite_team, predicted_champion, pred_score, status, phone_or_email, is_published, registered_at, predictions_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        p.id, p.name, p.favoriteTeam, p.predictedChampion, p.predScore, 
        p.status, p.phoneOrEmail, p.isPublished, p.registeredAt, p.predictionsCount
      ]);
      return p;
    } catch (err) {
      console.error("Error inserting into PostgreSQL:", err);
    }
  }

  // Fallback
  const list = await dbGetParticipants();
  list.push(p);
  try {
    fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing JSON fallback:", err);
  }
  return p;
}

export async function dbUpdateParticipant(id: string, updates: Partial<Participant>): Promise<Participant | null> {
  await initDb();

  if (pool) {
    try {
      // Build dynamic SQL settlement for fields provided
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.favoriteTeam !== undefined) {
        fields.push(`favorite_team = $${paramIndex++}`);
        values.push(updates.favoriteTeam);
      }
      if (updates.predictedChampion !== undefined) {
        fields.push(`predicted_champion = $${paramIndex++}`);
        values.push(updates.predictedChampion);
      }
      if (updates.predScore !== undefined) {
        fields.push(`pred_score = $${paramIndex++}`);
        values.push(updates.predScore);
      }
      if (updates.status !== undefined) {
        fields.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }
      if (updates.phoneOrEmail !== undefined) {
        fields.push(`phone_or_email = $${paramIndex++}`);
        values.push(updates.phoneOrEmail);
      }
      if (updates.isPublished !== undefined) {
        fields.push(`is_published = $${paramIndex++}`);
        values.push(updates.isPublished);
      }
      if (updates.registeredAt !== undefined) {
        fields.push(`registered_at = $${paramIndex++}`);
        values.push(updates.registeredAt);
      }
      if (updates.predictionsCount !== undefined) {
        fields.push(`predictions_count = $${paramIndex++}`);
        values.push(updates.predictionsCount);
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
      console.error("Error updating PostgreSQL participant:", err);
    }
  }

  // Fallback
  const list = await dbGetParticipants();
  const idx = list.findIndex((p) => p.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
    try {
      fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(list, null, 2), "utf-8");
      return list[idx];
    } catch (err) {
      console.error("Error writing JSON fallback updates:", err);
    }
  }
  return null;
}

export async function dbDeleteParticipant(id: string): Promise<boolean> {
  await initDb();

  if (pool) {
    try {
      const res = await pool.query("DELETE FROM participants WHERE id = $1", [id]);
      return (res.rowCount !== null && res.rowCount > 0);
    } catch (err) {
      console.error("Error deleting from PostgreSQL:", err);
    }
  }

  // Fallback
  const list = await dbGetParticipants();
  const filtered = list.filter((p) => p.id !== id);
  if (filtered.length !== list.length) {
    try {
      fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
      return true;
    } catch (err) {
      console.error("Error writing JSON fallback deletion:", err);
    }
  }
  return false;
}

export async function dbBulkSaveParticipants(newList: Participant[]): Promise<boolean> {
  await initDb();

  if (pool) {
    try {
      // Clear entire table and insert in bulk transactionally
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("DELETE FROM participants");
        for (const p of newList) {
          await client.query(`
            INSERT INTO participants 
            (id, name, favorite_team, predicted_champion, pred_score, status, phone_or_email, is_published, registered_at, predictions_count)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            p.id, p.name, p.favoriteTeam, p.predictedChampion, p.predScore, 
            p.status, p.phoneOrEmail, p.isPublished, p.registeredAt, p.predictionsCount
          ]);
        }
        await client.query("COMMIT");
        return true;
      } catch (transactionErr) {
        await client.query("ROLLBACK");
        throw transactionErr;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Error bulk saving to PostgreSQL:", err);
    }
  }

  // Fallback
  try {
    fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(newList, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing JSON fallback bulk save:", err);
    return false;
  }
}

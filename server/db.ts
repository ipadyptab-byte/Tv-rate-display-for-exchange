import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let initPromise: Promise<void> | null = null;
let isDbConnected = false;

export function getDatabaseUrl() {
  const neonDefault = "postgresql://neondb_owner:npg_p9MsbmIFeEq6@ep-ancient-sky-adb87hwt-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const rawUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

  // If process.env contains an unreachable private LAN IP like 192.168.x.x or 10.x.x.x, override with Neon Cloud URL
  if (!rawUrl || rawUrl.includes("192.168.") || rawUrl.includes("10.0.") || rawUrl.includes("127.0.0.1")) {
    return neonDefault;
  }
  return rawUrl;
}

export function isDbAvailable() {
  return isDbConnected && Boolean(db);
}

async function ensureSchema(client: Pool) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS gold_rates (
      id SERIAL PRIMARY KEY,
      gold_24k_sale REAL NOT NULL,
      gold_24k_purchase REAL NOT NULL,
      gold_24k_exchange REAL DEFAULT 0,
      gold_22k_sale REAL NOT NULL,
      gold_22k_purchase REAL NOT NULL,
      gold_22k_exchange REAL DEFAULT 0,
      gold_18k_sale REAL NOT NULL,
      gold_18k_purchase REAL NOT NULL,
      gold_18k_exchange REAL DEFAULT 0,
      silver_per_kg_sale REAL NOT NULL,
      silver_per_kg_purchase REAL NOT NULL,
      silver_per_kg_exchange REAL DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      source TEXT DEFAULT 'api',
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS display_settings (
      id SERIAL PRIMARY KEY,
      orientation TEXT DEFAULT 'horizontal',
      background_color TEXT DEFAULT '#FFF8E1',
      text_color TEXT DEFAULT '#212529',
      rate_number_font_size TEXT DEFAULT 'text-4xl',
      show_media BOOLEAN DEFAULT true,
      rates_display_duration_seconds INTEGER DEFAULT 15,
      refresh_interval INTEGER DEFAULT 30,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS media_items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      file_url TEXT,
      file_data TEXT,
      media_type TEXT NOT NULL,
      duration_seconds INTEGER DEFAULT 30,
      order_index INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      file_size INTEGER,
      mime_type TEXT,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS promo_images (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      image_url TEXT,
      image_data TEXT,
      duration_seconds INTEGER DEFAULT 5,
      transition_effect TEXT DEFAULT 'fade',
      order_index INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      file_size INTEGER,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS banner_settings (
      id SERIAL PRIMARY KEY,
      banner_image_url TEXT,
      banner_image_data TEXT,
      banner_height INTEGER DEFAULT 120,
      is_active BOOLEAN DEFAULT true,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rate_settings (
      id SERIAL PRIMARY KEY,
      external_rates_url TEXT DEFAULT 'https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php',
      perc_24k_purchase REAL DEFAULT 0.985,
      perc_24k_exchange REAL DEFAULT 0.99,
      perc_22k_sale REAL DEFAULT 0.92,
      perc_22k_purchase REAL DEFAULT 0.90,
      perc_22k_exchange REAL DEFAULT 0.91,
      perc_18k_sale REAL DEFAULT 0.86,
      perc_18k_purchase REAL DEFAULT 0.80,
      perc_18k_exchange REAL DEFAULT 0.85,
      silver_purchase_offset REAL DEFAULT -5000,
      silver_exchange_offset REAL DEFAULT -3000,
      check_interval_minutes INTEGER DEFAULT 5,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE gold_rates ADD COLUMN IF NOT EXISTS gold_24k_exchange REAL DEFAULT 0;
    ALTER TABLE rate_settings ADD COLUMN IF NOT EXISTS perc_24k_exchange REAL DEFAULT 0.99;
    ALTER TABLE rate_settings ADD COLUMN IF NOT EXISTS external_rates_url TEXT DEFAULT 'https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php';
  `);
}

function init() {
  if (db && initPromise) return;

  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    console.warn("[AI Studio] DATABASE_URL not set — using in-memory storage fallback");
    isDbConnected = false;
    return;
  }

  try {
    const isRemoteDb = Boolean(
      process.env.VERCEL ||
      connectionString.includes("sslmode=") ||
      connectionString.includes("neon.tech") ||
      connectionString.includes("supabase.co") ||
      connectionString.includes("render.com") ||
      connectionString.includes("aws.com")
    );

    pool = new Pool({ 
      connectionString,
      connectionTimeoutMillis: 5000,
      ...(isRemoteDb ? { ssl: { rejectUnauthorized: false } } : {})
    });
    pool.on("error", (err) => {
      isDbConnected = false;
      db = null;
    });
    initPromise = ensureSchema(pool)
      .then(() => {
        isDbConnected = true;
      })
      .catch(async (err) => {
        console.error("[AI Studio] Database connection error:", err);
        isDbConnected = false;
        db = null;
        if (pool) {
          try { await pool.end(); } catch {}
          pool = null;
        }
      });
    db = drizzle({ client: pool, schema });
  } catch (err: any) {
    console.log("[AI Studio] Database notice: Postgres unavailable, active in-memory storage.");
    isDbConnected = false;
    db = null;
    if (pool) {
      try { pool.end(); } catch {}
      pool = null;
    }
  }
}

export function getDb() {
  init();
  return isDbConnected ? db : null;
}

export async function ensureDbReady() {
  init();
  if (initPromise) {
    try {
      await initPromise;
    } catch {
      isDbConnected = false;
    }
  }
}

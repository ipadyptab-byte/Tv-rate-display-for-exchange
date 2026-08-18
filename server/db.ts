import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema";

let pool: mysql.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let initPromise: Promise<void> | null = null;
let isDbConnected = false;

export function getDatabaseUrl() {
  // Check for MariaDB/MySQL connection string first
  const mariaUrl = process.env.MARIA_URL || process.env.MYSQL_URL || process.env.DATABASE_URL;
  
  if (mariaUrl && (mariaUrl.startsWith('mysql://') || mariaUrl.startsWith('mariadb://'))) {
    return mariaUrl;
  }
  
  // Build MariaDB URL from individual components
  const host = process.env.DB_HOST || process.env.MARIA_HOST || "localhost";
  const port = process.env.DB_PORT || process.env.MARIA_PORT || "3306";
  const user = process.env.DB_USER || process.env.MARIA_USER || "root";
  const password = process.env.DB_PASS || process.env.MARIA_PASS || "";
  const database = process.env.DB_NAME || process.env.MARIA_DATABASE || "devi_jewellers";
  
  if (password) {
    return `mysql://${user}:${password}@${host}:${port}/${database}`;
  }
  return `mysql://${user}@${host}:${port}/${database}`;
}

export function isMariaDB() {
  const url = getDatabaseUrl();
  return url.startsWith('mysql://') || url.startsWith('mariadb://');
}

export function isDbAvailable() {
  return isDbConnected && Boolean(db);
}

async function ensureSchema(pool: mysql.Pool) {
  const conn = await pool.getConnection();
  try {
    // Create database if not exists
    await conn.query(`CREATE DATABASE IF NOT EXISTS devi_jewellers CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE devi_jewellers`);
    
    // Create tables with MariaDB/MySQL syntax
    await conn.query(`
      CREATE TABLE IF NOT EXISTS gold_rates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gold_24k_sale DECIMAL(12,2) NOT NULL,
        gold_24k_purchase DECIMAL(12,2) NOT NULL,
        gold_24k_exchange DECIMAL(12,2) DEFAULT 0,
        gold_22k_sale DECIMAL(12,2) NOT NULL,
        gold_22k_purchase DECIMAL(12,2) NOT NULL,
        gold_22k_exchange DECIMAL(12,2) DEFAULT 0,
        gold_18k_sale DECIMAL(12,2) NOT NULL,
        gold_18k_purchase DECIMAL(12,2) NOT NULL,
        gold_18k_exchange DECIMAL(12,2) DEFAULT 0,
        silver_per_kg_sale DECIMAL(12,2) NOT NULL,
        silver_per_kg_purchase DECIMAL(12,2) NOT NULL,
        silver_per_kg_exchange DECIMAL(12,2) DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        source VARCHAR(50) DEFAULT 'api',
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_is_active (is_active),
        INDEX idx_created_date (created_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS display_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orientation VARCHAR(20) DEFAULT 'horizontal',
        background_color VARCHAR(20) DEFAULT '#FFF8E1',
        text_color VARCHAR(20) DEFAULT '#212529',
        rate_number_font_size VARCHAR(20) DEFAULT 'text-4xl',
        show_media TINYINT(1) DEFAULT 1,
        rates_display_duration_seconds INT DEFAULT 15,
        refresh_interval INT DEFAULT 30,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS media_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        file_url TEXT,
        file_data LONGTEXT,
        media_type VARCHAR(20) NOT NULL,
        duration_seconds INT DEFAULT 30,
        order_index INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        file_size INT,
        mime_type VARCHAR(100),
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_index (order_index),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS promo_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image_url TEXT,
        image_data LONGTEXT,
        duration_seconds INT DEFAULT 5,
        transition_effect VARCHAR(20) DEFAULT 'fade',
        order_index INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        file_size INT,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_index (order_index),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS banner_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        banner_image_url TEXT,
        banner_image_data LONGTEXT,
        banner_height INT DEFAULT 120,
        is_active TINYINT(1) DEFAULT 1,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS rate_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        external_rates_url TEXT DEFAULT 'https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php',
        perc_24k_purchase DECIMAL(6,5) DEFAULT 0.985,
        perc_24k_exchange DECIMAL(6,5) DEFAULT 0.99,
        perc_22k_sale DECIMAL(6,5) DEFAULT 0.92,
        perc_22k_purchase DECIMAL(6,5) DEFAULT 0.90,
        perc_22k_exchange DECIMAL(6,5) DEFAULT 0.91,
        perc_18k_sale DECIMAL(6,5) DEFAULT 0.86,
        perc_18k_purchase DECIMAL(6,5) DEFAULT 0.80,
        perc_18k_exchange DECIMAL(6,5) DEFAULT 0.85,
        silver_purchase_offset DECIMAL(10,2) DEFAULT -5000,
        silver_exchange_offset DECIMAL(10,2) DEFAULT -3000,
        check_interval_minutes INT DEFAULT 5,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Insert default settings if not exists
    const [displayRows] = await conn.query('SELECT COUNT(*) as cnt FROM display_settings');
    if (displayRows[0].cnt === 0) {
      await conn.query("INSERT INTO display_settings (orientation, background_color, text_color) VALUES ('horizontal', '#FFF8E1', '#212529')");
    }

    const [bannerRows] = await conn.query('SELECT COUNT(*) as cnt FROM banner_settings');
    if (bannerRows[0].cnt === 0) {
      await conn.query('INSERT INTO banner_settings (banner_height, is_active) VALUES (120, 1)');
    }

    const [rateRows] = await conn.query('SELECT COUNT(*) as cnt FROM rate_settings');
    if (rateRows[0].cnt === 0) {
      await conn.query(`INSERT INTO rate_settings (external_rates_url, perc_24k_purchase, perc_24k_exchange, perc_22k_sale, perc_22k_purchase, perc_22k_exchange, perc_18k_sale, perc_18k_purchase, perc_18k_exchange, silver_purchase_offset, silver_exchange_offset, check_interval_minutes) VALUES ('https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php', 0.985, 0.99, 0.92, 0.90, 0.91, 0.86, 0.80, 0.85, -5000, -3000, 5)`);
    }
  } finally {
    conn.release();
  }
}

function init() {
  if (db && initPromise) return;

  const connectionString = getDatabaseUrl();
  console.log("[DB] getDatabaseUrl returned:", connectionString ? connectionString.replace(/:[^:@]+@/, ':****@') : 'NULL');
  
  if (!connectionString) {
    console.warn("[DB] MARIA_URL not set — using in-memory storage fallback");
    isDbConnected = false;
    return;
  }

  try {
    pool = mysql.createPool({
      uri: connectionString,
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 10000,
    });

    pool.on("error", (err) => {
      console.error("[AI Studio] Pool error:", err);
      isDbConnected = false;
      db = null;
    });

    initPromise = ensureSchema(pool)
      .then(() => {
        console.log("[DB] Database connection successful!");
        isDbConnected = true;
      })
      .catch(async (err) => {
        console.error("[DB] Database connection error:", err.message);
        isDbConnected = false;
        db = null;
        if (pool) {
          try { await pool.end(); } catch {}
          pool = null;
        }
      });

    db = drizzle({ client: pool, schema });
  } catch (err: any) {
    console.log("[DB] MariaDB unavailable - in-memory storage:", err.message);
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

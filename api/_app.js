var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  bannerSettings: () => bannerSettings,
  displaySettings: () => displaySettings,
  goldRates: () => goldRates,
  insertBannerSettingsSchema: () => insertBannerSettingsSchema,
  insertDisplaySettingsSchema: () => insertDisplaySettingsSchema,
  insertGoldRateSchema: () => insertGoldRateSchema,
  insertMediaItemSchema: () => insertMediaItemSchema,
  insertPromoImageSchema: () => insertPromoImageSchema,
  insertRateSettingsSchema: () => insertRateSettingsSchema,
  mediaItems: () => mediaItems,
  promoImages: () => promoImages,
  rateSettings: () => rateSettings
});
import { pgTable, text, integer, real, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var goldRates, displaySettings, mediaItems, promoImages, bannerSettings, rateSettings, insertGoldRateSchema, insertDisplaySettingsSchema, insertMediaItemSchema, insertPromoImageSchema, insertBannerSettingsSchema, insertRateSettingsSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    goldRates = pgTable("gold_rates", {
      id: serial("id").primaryKey(),
      gold_24k_sale: real("gold_24k_sale").notNull(),
      gold_24k_purchase: real("gold_24k_purchase").notNull(),
      gold_24k_exchange: real("gold_24k_exchange").default(0),
      gold_22k_sale: real("gold_22k_sale").notNull(),
      gold_22k_purchase: real("gold_22k_purchase").notNull(),
      gold_22k_exchange: real("gold_22k_exchange").default(0),
      gold_18k_sale: real("gold_18k_sale").notNull(),
      gold_18k_purchase: real("gold_18k_purchase").notNull(),
      gold_18k_exchange: real("gold_18k_exchange").default(0),
      silver_per_kg_sale: real("silver_per_kg_sale").notNull(),
      silver_per_kg_purchase: real("silver_per_kg_purchase").notNull(),
      silver_per_kg_exchange: real("silver_per_kg_exchange").default(0),
      is_active: boolean("is_active").default(true),
      source: text("source").default("api"),
      created_date: timestamp("created_date").defaultNow()
    });
    displaySettings = pgTable("display_settings", {
      id: serial("id").primaryKey(),
      orientation: text("orientation").default("horizontal"),
      background_color: text("background_color").default("#FFF8E1"),
      text_color: text("text_color").default("#212529"),
      rate_number_font_size: text("rate_number_font_size").default("text-4xl"),
      show_media: boolean("show_media").default(true),
      rates_display_duration_seconds: integer("rates_display_duration_seconds").default(15),
      refresh_interval: integer("refresh_interval").default(30),
      created_date: timestamp("created_date").defaultNow()
    });
    mediaItems = pgTable("media_items", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      file_url: text("file_url"),
      // Keep for backward compatibility
      file_data: text("file_data"),
      // Store base64 encoded data
      media_type: text("media_type").notNull(),
      // 'image' or 'video'
      duration_seconds: integer("duration_seconds").default(30),
      order_index: integer("order_index").default(0),
      is_active: boolean("is_active").default(true),
      file_size: integer("file_size"),
      mime_type: text("mime_type"),
      created_date: timestamp("created_date").defaultNow()
    });
    promoImages = pgTable("promo_images", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      image_url: text("image_url"),
      // Keep for backward compatibility
      image_data: text("image_data"),
      // Store base64 encoded data
      duration_seconds: integer("duration_seconds").default(5),
      transition_effect: text("transition_effect").default("fade"),
      order_index: integer("order_index").default(0),
      is_active: boolean("is_active").default(true),
      file_size: integer("file_size"),
      created_date: timestamp("created_date").defaultNow()
    });
    bannerSettings = pgTable("banner_settings", {
      id: serial("id").primaryKey(),
      banner_image_url: text("banner_image_url"),
      // Keep for backward compatibility
      banner_image_data: text("banner_image_data"),
      // Store base64 encoded data
      banner_height: integer("banner_height").default(120),
      is_active: boolean("is_active").default(true),
      created_date: timestamp("created_date").defaultNow()
    });
    rateSettings = pgTable("rate_settings", {
      id: serial("id").primaryKey(),
      external_rates_url: text("external_rates_url").default("https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php"),
      perc_24k_purchase: real("perc_24k_purchase").default(0.985),
      perc_24k_exchange: real("perc_24k_exchange").default(0.99),
      perc_22k_sale: real("perc_22k_sale").default(0.92),
      perc_22k_purchase: real("perc_22k_purchase").default(0.9),
      perc_22k_exchange: real("perc_22k_exchange").default(0.91),
      perc_18k_sale: real("perc_18k_sale").default(0.86),
      perc_18k_purchase: real("perc_18k_purchase").default(0.8),
      perc_18k_exchange: real("perc_18k_exchange").default(0.85),
      silver_purchase_offset: real("silver_purchase_offset").default(-5e3),
      // purchase = sale + offset
      silver_exchange_offset: real("silver_exchange_offset").default(-3e3),
      // exchange = sale + offset
      check_interval_minutes: integer("check_interval_minutes").default(5),
      // auto sync interval
      created_date: timestamp("created_date").defaultNow()
    });
    insertGoldRateSchema = createInsertSchema(goldRates).omit({
      id: true,
      created_date: true
    });
    insertDisplaySettingsSchema = createInsertSchema(displaySettings).omit({
      id: true,
      created_date: true
    });
    insertMediaItemSchema = createInsertSchema(mediaItems).omit({
      id: true,
      created_date: true
    });
    insertPromoImageSchema = createInsertSchema(promoImages).omit({
      id: true,
      created_date: true
    });
    insertBannerSettingsSchema = createInsertSchema(bannerSettings).omit({
      id: true,
      created_date: true
    });
    insertRateSettingsSchema = createInsertSchema(rateSettings).omit({
      id: true,
      created_date: true
    });
  }
});

// server/app.ts
import "dotenv/config";
import express2 from "express";
import postgres from "postgres";

// server/storage.ts
init_schema();
import { eq, desc, asc } from "drizzle-orm";

// server/db.ts
init_schema();
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var { Pool } = pg;
var pool = null;
var db = null;
var initPromise = null;
var isDbConnected = false;
function getDatabaseUrl() {
  const neonDefault = "postgresql://neondb_owner:npg_p9MsbmIFeEq6@ep-ancient-sky-adb87hwt-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const rawUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
  if (!rawUrl || rawUrl.includes("192.168.") || rawUrl.includes("10.0.") || rawUrl.includes("127.0.0.1")) {
    return neonDefault;
  }
  return rawUrl;
}
function isDbAvailable() {
  return isDbConnected && Boolean(db);
}
async function ensureSchema(client) {
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
    console.warn("[AI Studio] DATABASE_URL not set \u2014 using in-memory storage fallback");
    isDbConnected = false;
    return;
  }
  try {
    const isRemoteDb = Boolean(
      process.env.VERCEL || connectionString.includes("sslmode=") || connectionString.includes("neon.tech") || connectionString.includes("supabase.co") || connectionString.includes("render.com") || connectionString.includes("aws.com")
    );
    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 5e3,
      ...isRemoteDb ? { ssl: { rejectUnauthorized: false } } : {}
    });
    pool.on("error", (err) => {
      isDbConnected = false;
      db = null;
    });
    initPromise = ensureSchema(pool).then(() => {
      isDbConnected = true;
    }).catch(async (err) => {
      console.error("[AI Studio] Database connection error:", err);
      isDbConnected = false;
      db = null;
      if (pool) {
        try {
          await pool.end();
        } catch {
        }
        pool = null;
      }
    });
    db = drizzle({ client: pool, schema: schema_exports });
  } catch (err) {
    console.log("[AI Studio] Database notice: Postgres unavailable, active in-memory storage.");
    isDbConnected = false;
    db = null;
    if (pool) {
      try {
        pool.end();
      } catch {
      }
      pool = null;
    }
  }
}
function getDb() {
  init();
  return isDbConnected ? db : null;
}
async function ensureDbReady() {
  init();
  if (initPromise) {
    try {
      await initPromise;
    } catch {
      isDbConnected = false;
    }
  }
}

// server/storage.ts
function roundTo10(val) {
  if (val === void 0 || val === null || isNaN(val)) return 0;
  return Math.round(val / 10) * 10;
}
function processRateData(rate) {
  const processed = { ...rate };
  if (processed.gold_24k_sale !== void 0) processed.gold_24k_sale = roundTo10(processed.gold_24k_sale);
  if (processed.gold_24k_purchase !== void 0) processed.gold_24k_purchase = roundTo10(processed.gold_24k_purchase);
  if (processed.gold_24k_exchange !== void 0) processed.gold_24k_exchange = roundTo10(processed.gold_24k_exchange);
  if (processed.gold_22k_sale !== void 0) processed.gold_22k_sale = roundTo10(processed.gold_22k_sale);
  if (processed.gold_22k_purchase !== void 0) processed.gold_22k_purchase = roundTo10(processed.gold_22k_purchase);
  if (processed.gold_22k_exchange !== void 0) processed.gold_22k_exchange = roundTo10(processed.gold_22k_exchange);
  if (processed.gold_18k_sale !== void 0) processed.gold_18k_sale = roundTo10(processed.gold_18k_sale);
  if (processed.gold_18k_purchase !== void 0) processed.gold_18k_purchase = roundTo10(processed.gold_18k_purchase);
  if (processed.gold_18k_exchange !== void 0) processed.gold_18k_exchange = roundTo10(processed.gold_18k_exchange);
  if (processed.silver_per_kg_sale !== void 0) processed.silver_per_kg_sale = roundTo10(processed.silver_per_kg_sale);
  if (processed.silver_per_kg_purchase !== void 0) processed.silver_per_kg_purchase = roundTo10(processed.silver_per_kg_purchase);
  if (processed.silver_per_kg_exchange !== void 0) processed.silver_per_kg_exchange = roundTo10(processed.silver_per_kg_exchange);
  return processed;
}
var MemStorage = class {
  goldRatesList = [];
  displaySettingsData;
  rateSettingsData;
  mediaItemsList = [];
  promoImagesList = [];
  bannerSettingsData;
  nextId = { rates: 1, display: 1, rateSettings: 1, media: 1, promo: 1, banner: 1 };
  constructor() {
    this.goldRatesList.push({
      id: this.nextId.rates++,
      gold_24k_sale: 151e3,
      gold_24k_purchase: 148740,
      gold_24k_exchange: 149490,
      gold_22k_sale: 138920,
      gold_22k_purchase: 135900,
      gold_22k_exchange: 137410,
      gold_18k_sale: 129860,
      gold_18k_purchase: 120800,
      gold_18k_exchange: 128350,
      silver_per_kg_sale: 235e3,
      silver_per_kg_purchase: 23e4,
      silver_per_kg_exchange: 232e3,
      is_active: true,
      source: "default",
      created_date: /* @__PURE__ */ new Date()
    });
    this.displaySettingsData = {
      id: this.nextId.display++,
      orientation: "horizontal",
      background_color: "#FFF8E1",
      text_color: "#212529",
      rate_number_font_size: "text-4xl",
      show_media: true,
      rates_display_duration_seconds: 15,
      refresh_interval: 30,
      created_date: /* @__PURE__ */ new Date()
    };
    this.rateSettingsData = {
      id: this.nextId.rateSettings++,
      external_rates_url: "https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php",
      perc_24k_purchase: 0.985,
      perc_24k_exchange: 0.99,
      perc_22k_sale: 0.92,
      perc_22k_purchase: 0.9,
      perc_22k_exchange: 0.91,
      perc_18k_sale: 0.86,
      perc_18k_purchase: 0.8,
      perc_18k_exchange: 0.85,
      silver_purchase_offset: -5e3,
      silver_exchange_offset: -3e3,
      check_interval_minutes: 5,
      created_date: /* @__PURE__ */ new Date()
    };
    this.bannerSettingsData = {
      id: this.nextId.banner++,
      banner_image_url: null,
      banner_image_data: null,
      banner_height: 120,
      is_active: true,
      created_date: /* @__PURE__ */ new Date()
    };
  }
  async getCurrentRates() {
    const active = this.goldRatesList.filter((r) => r.is_active);
    return active[active.length - 1] || this.goldRatesList[this.goldRatesList.length - 1];
  }
  async createGoldRate(rate) {
    const processedRate = processRateData(rate);
    const activeRates = this.goldRatesList.filter((r) => r.is_active);
    const lastRate = activeRates[activeRates.length - 1] || this.goldRatesList[this.goldRatesList.length - 1];
    if (lastRate) {
      const rateFields = [
        "gold_24k_sale",
        "gold_24k_purchase",
        "gold_24k_exchange",
        "gold_22k_sale",
        "gold_22k_purchase",
        "gold_22k_exchange",
        "gold_18k_sale",
        "gold_18k_purchase",
        "gold_18k_exchange",
        "silver_per_kg_sale",
        "silver_per_kg_purchase",
        "silver_per_kg_exchange"
      ];
      let hasChanges = false;
      for (const field of rateFields) {
        const lastVal = Number(lastRate[field]);
        const newVal = Number(processedRate[field]);
        if (lastVal !== newVal) {
          hasChanges = true;
          break;
        }
      }
      if (!hasChanges) {
        return lastRate;
      }
    }
    for (const r of this.goldRatesList) {
      r.is_active = false;
    }
    const newRate = {
      id: this.nextId.rates++,
      gold_24k_sale: processedRate.gold_24k_sale,
      gold_24k_purchase: processedRate.gold_24k_purchase,
      gold_24k_exchange: processedRate.gold_24k_exchange ?? 0,
      gold_22k_sale: processedRate.gold_22k_sale,
      gold_22k_purchase: processedRate.gold_22k_purchase,
      gold_22k_exchange: processedRate.gold_22k_exchange ?? 0,
      gold_18k_sale: processedRate.gold_18k_sale,
      gold_18k_purchase: processedRate.gold_18k_purchase,
      gold_18k_exchange: processedRate.gold_18k_exchange ?? 0,
      silver_per_kg_sale: processedRate.silver_per_kg_sale,
      silver_per_kg_purchase: processedRate.silver_per_kg_purchase,
      silver_per_kg_exchange: processedRate.silver_per_kg_exchange ?? 0,
      is_active: true,
      source: processedRate.source ?? "api",
      created_date: /* @__PURE__ */ new Date()
    };
    this.goldRatesList.push(newRate);
    return newRate;
  }
  async updateGoldRate(id, rate) {
    const processedRate = processRateData(rate);
    const item = this.goldRatesList.find((r) => r.id === id);
    if (!item) return void 0;
    Object.assign(item, processedRate);
    return item;
  }
  async getDisplaySettings() {
    return this.displaySettingsData;
  }
  async createDisplaySettings(settings) {
    const newSettings = {
      id: this.nextId.display++,
      orientation: settings.orientation ?? "horizontal",
      background_color: settings.background_color ?? "#FFF8E1",
      text_color: settings.text_color ?? "#212529",
      rate_number_font_size: settings.rate_number_font_size ?? "text-4xl",
      show_media: settings.show_media ?? true,
      rates_display_duration_seconds: settings.rates_display_duration_seconds ?? 15,
      refresh_interval: settings.refresh_interval ?? 30,
      created_date: /* @__PURE__ */ new Date()
    };
    this.displaySettingsData = newSettings;
    return newSettings;
  }
  async updateDisplaySettings(id, settings) {
    if (!this.displaySettingsData) {
      return this.createDisplaySettings(settings);
    }
    Object.assign(this.displaySettingsData, settings);
    return this.displaySettingsData;
  }
  async getRateSettings() {
    return this.rateSettingsData;
  }
  async createRateSettings(settings) {
    const newSettings = {
      id: this.nextId.rateSettings++,
      external_rates_url: settings.external_rates_url ?? "https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php",
      perc_24k_purchase: settings.perc_24k_purchase ?? 0.985,
      perc_24k_exchange: settings.perc_24k_exchange ?? 0.99,
      perc_22k_sale: settings.perc_22k_sale ?? 0.92,
      perc_22k_purchase: settings.perc_22k_purchase ?? 0.9,
      perc_22k_exchange: settings.perc_22k_exchange ?? 0.91,
      perc_18k_sale: settings.perc_18k_sale ?? 0.86,
      perc_18k_purchase: settings.perc_18k_purchase ?? 0.8,
      perc_18k_exchange: settings.perc_18k_exchange ?? 0.85,
      silver_purchase_offset: settings.silver_purchase_offset ?? -5e3,
      silver_exchange_offset: settings.silver_exchange_offset ?? -3e3,
      check_interval_minutes: settings.check_interval_minutes ?? 5,
      created_date: /* @__PURE__ */ new Date()
    };
    this.rateSettingsData = newSettings;
    return newSettings;
  }
  async updateRateSettings(id, settings) {
    if (!this.rateSettingsData) {
      return this.createRateSettings(settings);
    }
    Object.assign(this.rateSettingsData, settings);
    return this.rateSettingsData;
  }
  async getMediaItems(activeOnly = false) {
    if (activeOnly) {
      return this.mediaItemsList.filter((m) => m.is_active);
    }
    return this.mediaItemsList;
  }
  async createMediaItem(item) {
    const newItem = {
      id: this.nextId.media++,
      name: item.name,
      file_url: item.file_url ?? null,
      file_data: item.file_data ?? null,
      media_type: item.media_type,
      duration_seconds: item.duration_seconds ?? 30,
      order_index: item.order_index ?? 0,
      is_active: item.is_active ?? true,
      file_size: item.file_size ?? null,
      mime_type: item.mime_type ?? null,
      created_date: /* @__PURE__ */ new Date()
    };
    this.mediaItemsList.push(newItem);
    return newItem;
  }
  async updateMediaItem(id, item) {
    const existing = this.mediaItemsList.find((m) => m.id === id);
    if (!existing) return void 0;
    Object.assign(existing, item);
    return existing;
  }
  async deleteMediaItem(id) {
    const index = this.mediaItemsList.findIndex((m) => m.id === id);
    if (index === -1) return false;
    this.mediaItemsList.splice(index, 1);
    return true;
  }
  async getPromoImages(activeOnly = false) {
    if (activeOnly) {
      return this.promoImagesList.filter((p) => p.is_active);
    }
    return this.promoImagesList;
  }
  async createPromoImage(image) {
    const newPromo = {
      id: this.nextId.promo++,
      name: image.name,
      image_url: image.image_url ?? null,
      image_data: image.image_data ?? null,
      duration_seconds: image.duration_seconds ?? 5,
      transition_effect: image.transition_effect ?? "fade",
      order_index: image.order_index ?? 0,
      is_active: image.is_active ?? true,
      file_size: image.file_size ?? null,
      created_date: /* @__PURE__ */ new Date()
    };
    this.promoImagesList.push(newPromo);
    return newPromo;
  }
  async updatePromoImage(id, image) {
    const existing = this.promoImagesList.find((p) => p.id === id);
    if (!existing) return void 0;
    Object.assign(existing, image);
    return existing;
  }
  async deletePromoImage(id) {
    const index = this.promoImagesList.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.promoImagesList.splice(index, 1);
    return true;
  }
  async getBannerSettings() {
    return this.bannerSettingsData;
  }
  async createBannerSettings(banner) {
    const newBanner = {
      id: this.nextId.banner++,
      banner_image_url: banner.banner_image_url ?? null,
      banner_image_data: banner.banner_image_data ?? null,
      banner_height: banner.banner_height ?? 120,
      is_active: banner.is_active ?? true,
      created_date: /* @__PURE__ */ new Date()
    };
    this.bannerSettingsData = newBanner;
    return newBanner;
  }
  async updateBannerSettings(id, banner) {
    if (!this.bannerSettingsData) {
      return this.createBannerSettings(banner);
    }
    Object.assign(this.bannerSettingsData, banner);
    return this.bannerSettingsData;
  }
};
var PostgresStorage = class {
  memFallback = new MemStorage();
  async useDb() {
    await ensureDbReady();
    const db2 = getDb();
    if (!db2 || !isDbAvailable()) return null;
    return db2;
  }
  // Gold Rates
  async getCurrentRates() {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.getCurrentRates();
      const rates = await db2.select().from(goldRates).where(eq(goldRates.is_active, true)).orderBy(desc(goldRates.created_date)).limit(1);
      return rates[0] || this.memFallback.getCurrentRates();
    } catch {
      return this.memFallback.getCurrentRates();
    }
  }
  async createGoldRate(rate) {
    const processedRate = processRateData(rate);
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.createGoldRate(processedRate);
      const currentRates = await db2.select().from(goldRates).where(eq(goldRates.is_active, true)).orderBy(desc(goldRates.created_date)).limit(1);
      if (currentRates.length > 0) {
        const lastRate = currentRates[0];
        const rateFields = [
          "gold_24k_sale",
          "gold_24k_purchase",
          "gold_24k_exchange",
          "gold_22k_sale",
          "gold_22k_purchase",
          "gold_22k_exchange",
          "gold_18k_sale",
          "gold_18k_purchase",
          "gold_18k_exchange",
          "silver_per_kg_sale",
          "silver_per_kg_purchase",
          "silver_per_kg_exchange"
        ];
        let hasChanges = false;
        for (const field of rateFields) {
          const lastValue = Number(lastRate[field]);
          const newValue = Number(processedRate[field]);
          if (lastValue !== newValue) {
            hasChanges = true;
            break;
          }
        }
        if (!hasChanges) {
          return lastRate;
        }
      }
      await db2.update(goldRates).set({ is_active: false });
      const result = await db2.insert(goldRates).values(processedRate).returning();
      return result[0];
    } catch {
      return this.memFallback.createGoldRate(processedRate);
    }
  }
  async updateGoldRate(id, rate) {
    const processedRate = processRateData(rate);
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.updateGoldRate(id, processedRate);
      const result = await db2.update(goldRates).set(processedRate).where(eq(goldRates.id, id)).returning();
      return result[0];
    } catch {
      return this.memFallback.updateGoldRate(id, processedRate);
    }
  }
  // Display Settings
  async createDisplaySettings(settings) {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.createDisplaySettings(settings);
      const result = await db2.insert(displaySettings).values(settings).returning();
      return result[0];
    } catch {
      return this.memFallback.createDisplaySettings(settings);
    }
  }
  async getDisplaySettings() {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.getDisplaySettings();
      const settings = await db2.select().from(displaySettings).orderBy(desc(displaySettings.created_date)).limit(1);
      return settings[0] || this.memFallback.getDisplaySettings();
    } catch {
      return this.memFallback.getDisplaySettings();
    }
  }
  async updateDisplaySettings(id, settings) {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.updateDisplaySettings(id, settings);
      const result = await db2.update(displaySettings).set(settings).where(eq(displaySettings.id, id)).returning();
      return result[0];
    } catch {
      return this.memFallback.updateDisplaySettings(id, settings);
    }
  }
  // Rate Calculation Settings
  async getRateSettings() {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.getRateSettings();
      const settings = await db2.select().from(rateSettings).orderBy(desc(rateSettings.created_date)).limit(1);
      return settings[0] || this.memFallback.getRateSettings();
    } catch {
      return this.memFallback.getRateSettings();
    }
  }
  async createRateSettings(settings) {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.createRateSettings(settings);
      const result = await db2.insert(rateSettings).values(settings).returning();
      return result[0];
    } catch {
      return this.memFallback.createRateSettings(settings);
    }
  }
  async updateRateSettings(id, settings) {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.updateRateSettings(id, settings);
      const result = await db2.update(rateSettings).set(settings).where(eq(rateSettings.id, id)).returning();
      return result[0];
    } catch {
      return this.memFallback.updateRateSettings(id, settings);
    }
  }
  // Media Items
  async getMediaItems(activeOnly = false) {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.getMediaItems(activeOnly);
      if (activeOnly) {
        return await db2.select().from(mediaItems).where(eq(mediaItems.is_active, true)).orderBy(asc(mediaItems.order_index));
      }
      return await db2.select().from(mediaItems).orderBy(asc(mediaItems.order_index));
    } catch {
      return this.memFallback.getMediaItems(activeOnly);
    }
  }
  async createMediaItem(item) {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.createMediaItem(item);
      const result = await db2.insert(mediaItems).values(item).returning();
      return result[0];
    } catch {
      return this.memFallback.createMediaItem(item);
    }
  }
  async updateMediaItem(id, item) {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.updateMediaItem(id, item);
      const result = await db2.update(mediaItems).set(item).where(eq(mediaItems.id, id)).returning();
      return result[0];
    } catch {
      return this.memFallback.updateMediaItem(id, item);
    }
  }
  async deleteMediaItem(id) {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.deleteMediaItem(id);
      const result = await db2.delete(mediaItems).where(eq(mediaItems.id, id)).returning();
      return result.length > 0;
    } catch {
      return this.memFallback.deleteMediaItem(id);
    }
  }
  // Promo Images
  async getPromoImages(activeOnly = false) {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.getPromoImages(activeOnly);
      if (activeOnly) {
        return await db2.select().from(promoImages).where(eq(promoImages.is_active, true)).orderBy(asc(promoImages.order_index));
      }
      return await db2.select().from(promoImages).orderBy(asc(promoImages.order_index));
    } catch {
      return this.memFallback.getPromoImages(activeOnly);
    }
  }
  async createPromoImage(image) {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.createPromoImage(image);
      const result = await db2.insert(promoImages).values(image).returning();
      return result[0];
    } catch {
      return this.memFallback.createPromoImage(image);
    }
  }
  async updatePromoImage(id, image) {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.updatePromoImage(id, image);
      const result = await db2.update(promoImages).set(image).where(eq(promoImages.id, id)).returning();
      return result[0];
    } catch {
      return this.memFallback.updatePromoImage(id, image);
    }
  }
  async deletePromoImage(id) {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.deletePromoImage(id);
      const result = await db2.delete(promoImages).where(eq(promoImages.id, id)).returning();
      return result.length > 0;
    } catch {
      return this.memFallback.deletePromoImage(id);
    }
  }
  // Banner Settings
  async getBannerSettings() {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.getBannerSettings();
      const banner = await db2.select().from(bannerSettings).where(eq(bannerSettings.is_active, true)).orderBy(desc(bannerSettings.created_date)).limit(1);
      return banner[0] || this.memFallback.getBannerSettings();
    } catch {
      return this.memFallback.getBannerSettings();
    }
  }
  async createBannerSettings(banner) {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.createBannerSettings(banner);
      const result = await db2.insert(bannerSettings).values(banner).returning();
      return result[0];
    } catch {
      return this.memFallback.createBannerSettings(banner);
    }
  }
  async updateBannerSettings(id, banner) {
    try {
      const db2 = await this.useDb();
      if (!db2) return this.memFallback.updateBannerSettings(id, banner);
      const result = await db2.update(bannerSettings).set(banner).where(eq(bannerSettings.id, id)).returning();
      return result[0];
    } catch {
      return this.memFallback.updateBannerSettings(id, banner);
    }
  }
};
var storage = new PostgresStorage();

// server/routes.ts
init_schema();
import multer from "multer";
import { z as z2 } from "zod";

// server/ratesSync.ts
import { z } from "zod";

// server/currentratesfile.ts
import { writeFile } from "node:fs/promises";
function getCurrentRatesFilePath() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return "/tmp/currentrates.txt";
  }
  return new URL("../currentrates.txt", import.meta.url);
}
async function writeCurrentRatesToFile(rates) {
  try {
    const lines = [
      `gold_24k_sale=${rates.gold_24k_sale}`,
      `gold_24k_purchase=${rates.gold_24k_purchase}`,
      `gold_24k_exchange=${rates.gold_24k_exchange}`,
      `gold_22k_sale=${rates.gold_22k_sale}`,
      `gold_22k_purchase=${rates.gold_22k_purchase}`,
      `gold_22k_exchange=${rates.gold_22k_exchange}`,
      `gold_18k_sale=${rates.gold_18k_sale}`,
      `gold_18k_purchase=${rates.gold_18k_purchase}`,
      `gold_18k_exchange=${rates.gold_18k_exchange}`,
      `silver_per_kg_sale=${rates.silver_per_kg_sale}`,
      `silver_per_kg_purchase=${rates.silver_per_kg_purchase}`,
      `silver_per_kg_exchange=${rates.silver_per_kg_exchange}`,
      `is_active=${rates.is_active}`,
      `created_date=${rates.created_date instanceof Date ? rates.created_date.toISOString() : new Date(rates.created_date).toISOString()}`
    ];
    await writeFile(getCurrentRatesFilePath(), `${lines.join("\n")}
`, "utf8");
  } catch (err) {
    console.warn("Notice: currentrates.txt write skipped (read-only filesystem or serverless context):", err);
  }
}

// server/ratesSync.ts
var parseNumberVal = z.union([z.number(), z.string()]).transform((val) => {
  if (val === null || val === void 0) return null;
  if (typeof val === "number") return val;
  const clean = String(val).replace(/,/g, "").trim();
  const num = Number(clean);
  return isNaN(num) ? null : num;
}).nullable().optional();
var externalRatesSchema = z.object({
  "24K Gold": parseNumberVal,
  "22K Gold": parseNumberVal,
  "18K Gold": parseNumberVal,
  "Silver": parseNumberVal
}).passthrough();
var lastSyncAttemptTime = 0;
var syncLogBuffer = [];
function addSyncLog(message, type = "info", details) {
  const entry = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    type,
    message,
    details
  };
  syncLogBuffer.unshift(entry);
  if (syncLogBuffer.length > 50) syncLogBuffer.pop();
  console.log(`[Auto-Sync ${entry.timestamp}] [${type.toUpperCase()}] ${message}`);
}
function getSyncLogs() {
  return syncLogBuffer;
}
function getSyncStatus(intervalMinutes = 5) {
  const now = Date.now();
  const timeSinceLastSync = lastSyncAttemptTime > 0 ? now - lastSyncAttemptTime : null;
  const intervalMs = intervalMinutes * 60 * 1e3;
  const nextSyncInMs = lastSyncAttemptTime > 0 ? Math.max(0, intervalMs - timeSinceLastSync) : 0;
  return {
    lastSyncAttemptTime: lastSyncAttemptTime > 0 ? new Date(lastSyncAttemptTime).toISOString() : null,
    secondsSinceLastSync: timeSinceLastSync ? Math.round(timeSinceLastSync / 1e3) : null,
    nextSyncInSeconds: Math.round(nextSyncInMs / 1e3),
    intervalMinutes,
    totalLogsRecorded: syncLogBuffer.length,
    latestLog: syncLogBuffer[0] || null
  };
}
function roundRate(value) {
  const result = Math.round(value / 10) * 10;
  if (!Number.isFinite(result)) return value;
  return result;
}
function calculateAllRates(gold24Sale, silverSale, settings, raw22kSale, raw18kSale) {
  const perc24Purchase = settings?.perc_24k_purchase ?? 0.985;
  const perc24Exchange = settings?.perc_24k_exchange ?? 0.99;
  const perc22Sale = settings?.perc_22k_sale ?? 0.92;
  const perc22Purchase = settings?.perc_22k_purchase ?? 0.9;
  const perc22Exchange = settings?.perc_22k_exchange ?? 0.91;
  const perc18Sale = settings?.perc_18k_sale ?? 0.86;
  const perc18Purchase = settings?.perc_18k_purchase ?? 0.8;
  const perc18Exchange = settings?.perc_18k_exchange ?? 0.85;
  const silverPurchaseOffset = settings?.silver_purchase_offset ?? -5e3;
  const silverExchangeOffset = settings?.silver_exchange_offset ?? -3e3;
  const gold22Sale = raw22kSale && raw22kSale > 0 ? roundRate(raw22kSale) : roundRate(gold24Sale * perc22Sale);
  const gold18Sale = raw18kSale && raw18kSale > 0 ? roundRate(raw18kSale) : roundRate(gold24Sale * perc18Sale);
  const result = {
    gold_24k_sale: gold24Sale,
    gold_24k_purchase: roundRate(gold24Sale * perc24Purchase),
    gold_24k_exchange: roundRate(gold24Sale * perc24Exchange),
    gold_22k_sale: gold22Sale,
    gold_22k_purchase: roundRate(gold24Sale * perc22Purchase),
    gold_22k_exchange: roundRate(gold24Sale * perc22Exchange),
    gold_18k_sale: gold18Sale,
    gold_18k_purchase: roundRate(gold24Sale * perc18Purchase),
    gold_18k_exchange: roundRate(gold24Sale * perc18Exchange),
    silver_per_kg_sale: silverSale,
    silver_per_kg_purchase: roundRate(silverSale + silverPurchaseOffset),
    silver_per_kg_exchange: roundRate(silverSale + silverExchangeOffset)
  };
  console.log("Calculated rates:", JSON.stringify(result));
  return result;
}
async function syncRatesFromExternal(storage2, opts) {
  const settings = await storage2.getRateSettings();
  const intervalMinutes = settings?.check_interval_minutes ?? 5;
  const intervalMs = intervalMinutes * 60 * 1e3;
  const current = await storage2.getCurrentRates();
  const now = Date.now();
  if (!opts.force && current && current.source !== "default") {
    const elapsed = now - lastSyncAttemptTime;
    if (elapsed < intervalMs) {
      const remainingSec = Math.round((intervalMs - elapsed) / 1e3);
      addSyncLog(`Within ${intervalMinutes}-minute sync interval (${remainingSec}s remaining). Returning active database rates.`, "skip", {
        remainingSec,
        currentRatesId: current.id,
        gold_24k_sale: current.gold_24k_sale
      });
      return current;
    }
  }
  lastSyncAttemptTime = now;
  const defaultUrl = "https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php";
  const url = settings?.external_rates_url || process.env.EXTERNAL_RATES_URL || defaultUrl;
  addSyncLog(`Interval due or force requested. Fetching external rates from ${url}`, "info");
  let response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1e4);
    response = await fetch(url, {
      headers: {
        "accept": "application/json, text/plain, */*",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (err) {
    const errMsg = `Unable to reach external rates URL (${url}): ${err?.message || err}`;
    addSyncLog(errMsg, "error");
    if (current) return current;
    throw new Error(errMsg);
  }
  if (!response.ok) {
    const errMsg = `External rates URL returned HTTP status ${response.status}`;
    addSyncLog(errMsg, "error");
    if (current) return current;
    throw new Error(errMsg);
  }
  const rawText = await response.text();
  let parsedJson;
  try {
    parsedJson = JSON.parse(rawText);
  } catch (e) {
    const errMsg = `Failed to parse external API JSON: ${rawText.slice(0, 100)}`;
    addSyncLog(errMsg, "error");
    if (current) return current;
    throw new Error("Invalid JSON received from external rates API");
  }
  const payload = externalRatesSchema.parse(parsedJson);
  const gold24Raw = payload["24K Gold"];
  const gold22Raw = payload["22K Gold"];
  const gold18Raw = payload["18K Gold"];
  const silverRaw = payload["Silver"];
  const gold24Sale = gold24Raw ? roundRate(gold24Raw) : null;
  const gold22Sale = gold22Raw ? roundRate(gold22Raw) : null;
  const gold18Sale = gold18Raw ? roundRate(gold18Raw) : null;
  const silverSale = silverRaw ? roundRate(silverRaw < 1e4 ? silverRaw * 100 : silverRaw) : null;
  if (!gold24Sale || !silverSale) {
    const errMsg = "Missing 24K Gold or Silver in API response payload";
    addSyncLog(errMsg, "error", payload);
    if (current) {
      return current;
    }
    throw new Error("Invalid response from external API: missing 24K Gold or Silver rates");
  }
  const newRates = calculateAllRates(gold24Sale, silverSale, settings, gold22Sale, gold18Sale);
  const created = await storage2.createGoldRate({
    ...newRates,
    is_active: true,
    source: "api"
  });
  if (current && created.id === current.id) {
    addSyncLog(`Fetched external rates (24K: \u20B9${newRates.gold_24k_sale}, 22K: \u20B9${newRates.gold_22k_sale}, 18K: \u20B9${newRates.gold_18k_sale}, Silver/kg: \u20B9${newRates.silver_per_kg_sale}) match existing database. Ignored duplicate values.`, "info", {
      rateId: created.id,
      rates: newRates
    });
  } else {
    addSyncLog(`Rates CHANGED! Stored new rate entry in database (Record ID #${created.id}, 24K: \u20B9${newRates.gold_24k_sale}, 22K: \u20B9${newRates.gold_22k_sale}, 18K: \u20B9${newRates.gold_18k_sale}, Silver/kg: \u20B9${newRates.silver_per_kg_sale})`, "success", {
      rateId: created.id,
      rates: newRates
    });
  }
  await writeCurrentRatesToFile(created);
  return created;
}

// server/routes.ts
import { GoogleGenAI } from "@google/genai";
var memoryStorage = multer.memoryStorage();
var uploadMedia = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    // 50MB
    files: 10,
    // Maximum 10 files per upload
    fieldSize: 10 * 1024 * 1024,
    // 10MB per field
    fields: 20
    // Maximum fields
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/avi",
      "video/mov"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images and videos are allowed."));
    }
  }
});
var uploadPromo = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    // 10MB
    files: 10,
    // Maximum 10 files per upload
    fieldSize: 5 * 1024 * 1024,
    // 5MB per field
    fields: 15
    // Maximum fields
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  }
});
var uploadBanner = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG and PNG images are allowed."));
    }
  }
});
async function registerRoutes(app) {
  app.get("/api/media/:id/file", async (req, res) => {
    try {
      const media = await storage.getMediaItems(false);
      const item = media.find((m) => m.id === parseInt(req.params.id));
      if (!item || !item.file_data && !item.file_url) {
        return res.status(404).json({ message: "File not found" });
      }
      res.set({
        "Content-Type": item.mime_type || "application/octet-stream",
        "Content-Length": item.file_size?.toString() || "0"
      });
      if (item.file_data) {
        const buffer = Buffer.from(item.file_data, "base64");
        res.send(buffer);
      } else if (item.file_url) {
        res.redirect(item.file_url);
      } else {
        res.status(404).json({ message: "File data not available" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to serve file" });
    }
  });
  app.get("/api/promo/:id/file", async (req, res) => {
    try {
      const promos = await storage.getPromoImages(false);
      const item = promos.find((p) => p.id === parseInt(req.params.id));
      if (!item || !item.image_data && !item.image_url) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.set({
        "Content-Type": item.file_size ? "image/jpeg" : "application/octet-stream"
      });
      if (item.image_data) {
        const buffer = Buffer.from(item.image_data, "base64");
        res.send(buffer);
      } else if (item.image_url) {
        res.redirect(item.image_url);
      } else {
        res.status(404).json({ message: "Image data not available" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to serve image" });
    }
  });
  app.get("/api/banner/:id/file", async (req, res) => {
    try {
      const banner = await storage.getBannerSettings();
      if (!banner || !banner.banner_image_data && !banner.banner_image_url) {
        return res.status(404).json({ message: "Banner image not found" });
      }
      res.set({ "Content-Type": "image/jpeg" });
      if (banner.banner_image_data) {
        const buffer = Buffer.from(banner.banner_image_data, "base64");
        res.send(buffer);
      } else if (banner.banner_image_url) {
        res.redirect(banner.banner_image_url);
      } else {
        res.status(404).json({ message: "Banner image data not available" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to serve banner image" });
    }
  });
  app.get("/api/rates/current", async (req, res) => {
    try {
      const rates = await storage.getCurrentRates();
      res.json(rates || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current rates" });
    }
  });
  app.post("/api/rates", async (req, res) => {
    try {
      const validatedData = insertGoldRateSchema.parse(req.body);
      const newRates = await storage.createGoldRate(validatedData);
      res.status(201).json(newRates);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid rate data", errors: error.errors });
      } else {
        console.error("Create rates error:", error);
        res.status(500).json({ message: "Failed to create rates", error: error.message });
      }
    }
  });
  app.get("/api/settings/rates", async (_req, res) => {
    try {
      const settings = await storage.getRateSettings();
      res.json(settings || {
        perc_24k_purchase: 1,
        perc_22k_sale: 0.92,
        perc_22k_purchase: 0.9,
        perc_22k_exchange: 0.91,
        perc_18k_sale: 0.86,
        perc_18k_purchase: 0.8,
        perc_18k_exchange: 0.85,
        silver_purchase_offset: -5e3,
        silver_exchange_offset: -3e3,
        check_interval_minutes: 1
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rate settings" });
    }
  });
  app.post("/api/settings/rates", async (req, res) => {
    try {
      const { insertRateSettingsSchema: insertRateSettingsSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const validated = insertRateSettingsSchema2.parse(req.body);
      const created = await storage.createRateSettings(validated);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid rate settings", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create rate settings" });
      }
    }
  });
  app.put("/api/settings/rates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { insertRateSettingsSchema: insertRateSettingsSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const validated = insertRateSettingsSchema2.partial().parse(req.body);
      const updated = await storage.updateRateSettings(id, validated);
      if (!updated) return res.status(404).json({ message: "Rate settings not found" });
      res.json(updated);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid rate settings", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update rate settings" });
      }
    }
  });
  app.get("/api/rates/debug", async (req, res) => {
    try {
      const url = process.env.EXTERNAL_RATES_URL;
      if (!url) {
        return res.json({ error: "EXTERNAL_RATES_URL not set" });
      }
      const response = await fetch(url, { headers: { "accept": "application/json" } });
      const data = await response.json();
      const settings = await storage.getRateSettings();
      const currentRates = await storage.getCurrentRates();
      res.json({
        externalApiUrl: url,
        externalApiStatus: response.ok,
        externalApiData: data,
        rateSettings: settings,
        currentRatesInDb: currentRates ? {
          id: currentRates.id,
          gold_24k_sale: currentRates.gold_24k_sale,
          created_date: currentRates.created_date
        } : null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/rates/sync", async (req, res) => {
    try {
      const force = req.query.force !== "0";
      const newRates = await syncRatesFromExternal(storage, { force });
      res.status(201).json({ message: "Rates synced", rates: newRates });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid computed rate data", errors: error.errors });
      } else {
        console.error("Rates sync error:", error);
        res.status(500).json({ message: "Failed to sync rates", error: error.message });
      }
    }
  });
  app.get("/api/rates/sync-scheduled", async (_req, res) => {
    try {
      const newRates = await syncRatesFromExternal(storage, { force: false });
      res.status(200).json({ message: "Scheduled sync checked", rates: newRates });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid computed rate data", errors: error.errors });
      } else {
        console.error("Rates scheduled sync error:", error);
        res.status(500).json({ message: "Failed to sync rates", error: error.message });
      }
    }
  });
  app.get("/api/rates/sync-logs", async (_req, res) => {
    try {
      const settings = await storage.getRateSettings();
      const intervalMinutes = settings?.check_interval_minutes ?? 5;
      res.json({
        status: getSyncStatus(intervalMinutes),
        logs: getSyncLogs()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/db-health", async (_req, res) => {
    try {
      await ensureDbReady();
      const db2 = getDb();
      const result = await db2.select().from(goldRates).limit(100);
      res.json({
        status: "connected",
        table_exists: true,
        row_count: result.length,
        db_url: getDatabaseUrl() ? "configured" : "missing",
        sample_data: result.slice(0, 3)
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: error.message
      });
    }
  });
  app.get("/api/test-round", async (_req, res) => {
    const testValues = [146765, 134845, 111750, 23e4];
    const results = testValues.map((v) => {
      const rounded = Math.ceil(v / 10) * 10;
      return { input: v, output: rounded };
    });
    res.json({ results });
  });
  app.get("/api/debug-calculate", async (_req, res) => {
    const gold24Sale = 149e3;
    const silverSale = 2300;
    const perc24Purchase = 0.985;
    const perc24Exchange = 0.99;
    const perc22Sale = 0.92;
    const perc22Purchase = 0.905;
    const perc18Sale = 0.8;
    const perc18Purchase = 0.75;
    const silverPurchaseOffset = -5e3;
    const roundRate2 = (v) => Math.ceil(v / 10) * 10;
    const result = {
      gold_24k_sale: gold24Sale,
      gold_24k_purchase: roundRate2(gold24Sale * perc24Purchase),
      gold_24k_exchange: roundRate2(gold24Sale * perc24Exchange),
      gold_22k_sale: roundRate2(gold24Sale * perc22Sale),
      gold_22k_purchase: roundRate2(gold24Sale * perc22Purchase),
      gold_18k_sale: roundRate2(gold24Sale * perc18Sale),
      gold_18k_purchase: roundRate2(gold24Sale * perc18Purchase),
      silver_per_kg_sale: silverSale,
      silver_per_kg_purchase: roundRate2(silverSale + silverPurchaseOffset)
    };
    res.json(result);
  });
  app.get("/api/settings/display", async (req, res) => {
    try {
      const settings = await storage.getDisplaySettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch display settings" });
    }
  });
  app.post("/api/settings/display", async (req, res) => {
    try {
      const validatedData = insertDisplaySettingsSchema.parse(req.body);
      const newSettings = await storage.createDisplaySettings(validatedData);
      res.status(201).json(newSettings);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create settings" });
      }
    }
  });
  app.put("/api/settings/display/:id?", async (req, res) => {
    try {
      const validatedData = insertDisplaySettingsSchema.partial().parse(req.body);
      const existingSettings = await storage.getDisplaySettings();
      if (existingSettings && existingSettings.id) {
        const updatedSettings = await storage.updateDisplaySettings(existingSettings.id, validatedData);
        res.json(updatedSettings);
      } else {
        const newSettings = await storage.createDisplaySettings({
          ...validatedData,
          orientation: validatedData.orientation || "horizontal",
          background_color: validatedData.background_color || "#FFF8E1",
          text_color: validatedData.text_color || "#212529",
          rate_number_font_size: validatedData.rate_number_font_size || "text-4xl",
          show_media: validatedData.show_media !== void 0 ? validatedData.show_media : true,
          rates_display_duration_seconds: validatedData.rates_display_duration_seconds || 15,
          refresh_interval: validatedData.refresh_interval || 30
        });
        res.json(newSettings);
      }
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        console.error("Settings update error:", error);
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });
  app.get("/api/media", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const media = await storage.getMediaItems(activeOnly);
      res.json(media);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch media items" });
    }
  });
  app.post("/api/media/upload", uploadMedia.array("files", 10), async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      console.log(`Processing ${files.length} media files for upload`);
      const createdItems = [];
      const allMedia = await storage.getMediaItems(false);
      const highestOrder = allMedia.reduce((max, item) => Math.max(max, item.order_index || 0), 0);
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        console.log(`Processing file ${index + 1}/${files.length}: ${file.originalname} (${file.size} bytes)`);
        if (file.size > 50 * 1024 * 1024) {
          console.warn(`File ${file.originalname} too large: ${file.size} bytes`);
          continue;
        }
        const mediaType = file.mimetype.startsWith("image/") ? "image" : "video";
        try {
          const fileData = file.buffer.toString("base64");
          console.log(`File ${file.originalname} converted to base64, length: ${fileData.length}`);
          const mediaItem = await storage.createMediaItem({
            name: file.originalname,
            file_url: `/api/media/${Date.now()}/file`,
            // Placeholder URL, will be updated with real ID
            file_data: fileData,
            media_type: mediaType,
            duration_seconds: parseInt(req.body.duration_seconds) || 30,
            order_index: highestOrder + index + 1,
            is_active: req.body.autoActivate === "true",
            file_size: file.size,
            mime_type: file.mimetype
          });
          console.log(`Created media item with ID: ${mediaItem.id}`);
          await storage.updateMediaItem(mediaItem.id, {
            file_url: `/api/media/${mediaItem.id}/file`
          });
          createdItems.push(mediaItem);
        } catch (fileError) {
          console.error(`Error processing file ${file.originalname}:`, fileError);
        }
      }
      console.log(`Successfully created ${createdItems.length} media items`);
      res.status(201).json(createdItems);
    } catch (error) {
      console.error("Media upload error details:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : void 0,
        filesCount: req.files ? req.files.length : 0
      });
      res.status(500).json({
        message: "Failed to upload media files",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app.put("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMediaItemSchema.partial().parse(req.body);
      const updatedItem = await storage.updateMediaItem(id, validatedData);
      if (updatedItem) {
        res.json(updatedItem);
      } else {
        res.status(404).json({ message: "Media item not found" });
      }
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid media data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update media item" });
      }
    }
  });
  app.delete("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMediaItem(id);
      if (deleted) {
        res.json({ message: "Media item deleted successfully" });
      } else {
        res.status(404).json({ message: "Media item not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete media item" });
    }
  });
  app.get("/api/promo", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const promos = await storage.getPromoImages(activeOnly);
      res.json(promos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promotional images" });
    }
  });
  app.post("/api/promo/upload", uploadPromo.array("files", 10), async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      console.log(`Processing ${files.length} promo images for upload`);
      const createdItems = [];
      for (const file of files) {
        console.log(`Processing promo image: ${file.originalname} (${file.size} bytes)`);
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`Promo image ${file.originalname} too large: ${file.size} bytes`);
          continue;
        }
        try {
          const imageData = file.buffer.toString("base64");
          console.log(`Promo image ${file.originalname} converted to base64, length: ${imageData.length}`);
          const promoImage = await storage.createPromoImage({
            name: file.originalname,
            image_url: `/api/promo/${Date.now()}/file`,
            // Placeholder
            image_data: imageData,
            duration_seconds: parseInt(req.body.duration_seconds) || 5,
            transition_effect: req.body.transition || "fade",
            order_index: 0,
            is_active: req.body.autoActivate === "true",
            file_size: file.size
          });
          console.log(`Created promo image with ID: ${promoImage.id}`);
          await storage.updatePromoImage(promoImage.id, {
            image_url: `/api/promo/${promoImage.id}/file`
          });
          createdItems.push(promoImage);
        } catch (fileError) {
          console.error(`Error processing promo image ${file.originalname}:`, fileError);
        }
      }
      console.log(`Successfully created ${createdItems.length} promo images`);
      res.status(201).json(createdItems);
    } catch (error) {
      console.error("Promo upload error details:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : void 0,
        filesCount: req.files ? req.files.length : 0
      });
      res.status(500).json({
        message: "Failed to upload promotional images",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app.put("/api/promo/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPromoImageSchema.partial().parse(req.body);
      const updatedItem = await storage.updatePromoImage(id, validatedData);
      if (updatedItem) {
        res.json(updatedItem);
      } else {
        res.status(404).json({ message: "Promotional image not found" });
      }
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid promo data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update promotional image" });
      }
    }
  });
  app.delete("/api/promo/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePromoImage(id);
      if (deleted) {
        res.json({ message: "Promotional image deleted successfully" });
      } else {
        res.status(404).json({ message: "Promotional image not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete promotional image" });
    }
  });
  app.get("/api/banner", async (req, res) => {
    try {
      const banner = await storage.getBannerSettings();
      res.json(banner || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch banner settings" });
    }
  });
  app.post("/api/banner/upload", uploadBanner.single("banner"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No banner file uploaded" });
      }
      const imageData = file.buffer.toString("base64");
      const existingBanner = await storage.getBannerSettings();
      if (existingBanner && existingBanner.id) {
        const updatedBanner = await storage.updateBannerSettings(existingBanner.id, {
          banner_image_data: imageData,
          banner_image_url: `/api/banner/${existingBanner.id}/file`,
          is_active: true
        });
        res.status(201).json({
          banner_image_url: updatedBanner?.banner_image_url,
          message: "Banner updated successfully"
        });
      } else {
        res.status(201).json({
          banner_image_url: `/api/banner/1/file`,
          message: "Banner uploaded successfully"
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to upload banner" });
    }
  });
  app.post("/api/generate-status-bg", async (req, res) => {
    const { promptType, customPrompt } = req.body || {};
    let promptText = "";
    if (promptType === "marathi_lady") {
      promptText = "A beautiful traditional Maharashtrian Marathi woman wearing an authentic festive Nauvari saree and traditional pure gold Maharashtrian jewellery including Thushi necklace, Nath nose ring, Mohanmala, Laxmi haar, and gold bangles, smiling gracefully, festive warm ambient lighting, elegant gold jewelry backdrop, hyperrealistic photorealistic 8k vertical wallpaper.";
    } else if (promptType === "royal_gold") {
      promptText = "An opulent royal Indian gold palace interior background with glittering golden ornaments, warm ambient candlelight, soft blur depth of field, royal gold silk backdrop, photorealistic vertical wallpaper.";
    } else if (promptType === "custom" && customPrompt && customPrompt.trim().length > 0) {
      promptText = `${customPrompt.trim()}, luxury gold jewellery background, photorealistic 8k vertical status background.`;
    } else {
      promptText = "A stunning high-resolution luxury background of pure Indian plain gold bangles, gold necklaces, and gold coins artfully arranged on dark crimson velvet or soft golden silk background with gentle warm bokeh lighting. Plain gold jewellery backdrop for a gold rate banner, photorealistic vertical 9:16 wallpaper.";
    }
    const apiKey = process.env.GEMINI_API_KEY;
    const createFallbackSvg = (theme, customTxt) => {
      let themeArt = "";
      if (theme === "marathi_lady") {
        themeArt = `
          <!-- Maharashtrian Traditional Gold Lady Profile Art -->
          <g transform="translate(540, 960)" opacity="0.35">
            <!-- Glowing Halo -->
            <circle cx="0" cy="-80" r="320" fill="url(#glow)" />
            <!-- Silhouette & Gold Jewellery Art -->
            <!-- Hair Bun with Gajra -->
            <path d="M -120,-220 C -180,-200 -220,-120 -190,-50 C -170,-10 -130,-10 -100,-40" fill="none" stroke="url(#goldGrad)" stroke-width="12" />
            <!-- Traditional Nath (Nose Ring) -->
            <circle cx="-15" cy="-70" r="35" fill="none" stroke="url(#goldGrad)" stroke-width="6" />
            <circle cx="-35" cy="-70" r="10" fill="#FFE885" />
            <circle cx="-15" cy="-35" r="8" fill="#FF5555" />
            <!-- Thushi Choker Necklace -->
            <path d="M -160,80 Q 0,160 160,80" fill="none" stroke="url(#goldGrad)" stroke-width="28" stroke-dasharray="14 6" />
            <path d="M -160,80 Q 0,160 160,80" fill="none" stroke="#FFE885" stroke-width="8" />
            <!-- Laxmi Haar Long Necklace -->
            <path d="M -220,100 Q 0,380 220,100" fill="none" stroke="url(#goldGrad)" stroke-width="18" />
            <!-- Coins on Laxmi Haar -->
            <circle cx="-150" cy="180" r="18" fill="url(#goldGrad)" />
            <circle cx="-80" cy="230" r="18" fill="url(#goldGrad)" />
            <circle cx="0" cy="250" r="22" fill="url(#goldGrad)" />
            <circle cx="80" cy="230" r="18" fill="url(#goldGrad)" />
            <circle cx="150" cy="180" r="18" fill="url(#goldGrad)" />
          </g>
        `;
      } else if (theme === "royal_gold") {
        themeArt = `
          <!-- Royal Indian Palace Arch & Mandala -->
          <g transform="translate(540, 960)" opacity="0.4">
            <!-- Royal Arch Frame -->
            <path d="M -450,-700 C -450,-300 -200,-900 0,-900 C 200,-900 450,-300 450,-700" fill="none" stroke="url(#goldGrad)" stroke-width="12" />
            <path d="M -420,-680 C -420,-300 -180,-860 0,-860 C 180,-860 420,-300 420,-680" fill="none" stroke="#FFE885" stroke-width="3" />
            <!-- Grand Mandala Central Ring -->
            <circle cx="0" cy="-100" r="350" fill="none" stroke="url(#goldGrad)" stroke-width="8" />
            <circle cx="0" cy="-100" r="320" fill="none" stroke="#FFE885" stroke-width="2" stroke-dasharray="12 12" />
            <circle cx="0" cy="-100" r="280" fill="none" stroke="url(#goldGrad)" stroke-width="4" />
          </g>
        `;
      } else {
        themeArt = `
          <!-- Plain Gold Bangles & Coins Backdrop -->
          <g transform="translate(540, 960)" opacity="0.45">
            <!-- Big Faceted Gold Bangle 1 -->
            <ellipse cx="-80" cy="-120" rx="380" ry="220" fill="none" stroke="url(#goldGrad)" stroke-width="42" transform="rotate(-15)" />
            <ellipse cx="-80" cy="-120" rx="380" ry="220" fill="none" stroke="#FFE885" stroke-width="6" transform="rotate(-15)" />
            
            <!-- Faceted Gold Bangle 2 -->
            <ellipse cx="100" cy="80" rx="400" ry="240" fill="none" stroke="url(#goldGrad)" stroke-width="48" transform="rotate(12)" />
            <ellipse cx="100" cy="80" rx="400" ry="240" fill="none" stroke="#FFFFFF" stroke-width="8" transform="rotate(12)" opacity="0.7" />

            <!-- Gold Coins Scattered -->
            <g fill="url(#goldGrad)" stroke="#FFE885" stroke-width="3">
              <circle cx="-280" cy="220" r="45" />
              <circle cx="-180" cy="300" r="55" />
              <circle cx="260" cy="-280" r="50" />
              <circle cx="340" cy="-180" r="40" />
            </g>
          </g>
        `;
      }
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#140003" />
            <stop offset="35%" stop-color="#38020a" />
            <stop offset="70%" stop-color="#240006" />
            <stop offset="100%" stop-color="#0a0002" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFF3A1" />
            <stop offset="25%" stop-color="#E5C158" />
            <stop offset="50%" stop-color="#9E7817" />
            <stop offset="75%" stop-color="#FCDD6B" />
            <stop offset="100%" stop-color="#B58B1B" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="#E5C158" stop-opacity="0.4" />
            <stop offset="60%" stop-color="#9E7817" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
          <pattern id="goldPattern" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="50" cy="50" r="30" fill="none" stroke="#E5C158" stroke-width="0.8" opacity="0.1" />
          </pattern>
        </defs>

        <!-- Rich Velvet Crimson Canvas -->
        <rect width="1080" height="1920" fill="url(#bgGrad)" />
        <rect width="1080" height="1920" fill="url(#goldPattern)" />
        <circle cx="540" cy="960" r="750" fill="url(#glow)" />

        ${themeArt}

        <!-- Sparkling Gold Dust Particles -->
        <circle cx="180" cy="280" r="6" fill="#FFF3A1" opacity="0.8" />
        <circle cx="900" cy="380" r="9" fill="#FCDD6B" opacity="0.7" />
        <circle cx="220" cy="1400" r="12" fill="#FFF3A1" opacity="0.6" />
        <circle cx="860" cy="1550" r="8" fill="#E5C158" opacity="0.8" />
        <circle cx="540" cy="300" r="7" fill="#FFF" opacity="0.9" />

        <!-- Outer Gold Border Frame -->
        <rect x="30" y="30" width="1020" height="1860" rx="24" fill="none" stroke="url(#goldGrad)" stroke-width="6" opacity="0.6" />
        <rect x="42" y="42" width="996" height="1836" rx="16" fill="none" stroke="#FFE885" stroke-width="2" opacity="0.3" />
      </svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
    };
    if (!apiKey) {
      return res.json({
        success: true,
        imageUrl: createFallbackSvg(promptType),
        isFallback: true,
        notice: "GEMINI_API_KEY is not configured on the server. Showing luxury gold template."
      });
    }
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const candidateModels = [
        "gemini-3.1-flash-lite-image",
        "imagen-3.0-generate-002",
        "gemini-2.5-flash"
      ];
      let lastError = null;
      let imageUrl = null;
      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: promptText,
            config: {
              imageConfig: {
                aspectRatio: "9:16"
              }
            }
          });
          if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                const mime = part.inlineData.mimeType || "image/png";
                imageUrl = `data:${mime};base64,${part.inlineData.data}`;
                break;
              }
            }
          }
          if (imageUrl) break;
        } catch (err) {
          lastError = err;
        }
      }
      if (imageUrl) {
        return res.json({
          success: true,
          imageUrl,
          promptText
        });
      }
      const errMessage = lastError?.message || String(lastError || "");
      const isQuotaError = errMessage.includes("429") || errMessage.includes("RESOURCE_EXHAUSTED") || errMessage.includes("Quota");
      return res.json({
        success: true,
        imageUrl: createFallbackSvg(promptType),
        isFallback: true,
        notice: isQuotaError ? "Gemini API free tier quota limit was reached. Showing luxury gold artwork template." : "Image generation model busy. Showing luxury gold artwork template."
      });
    } catch (error) {
      console.error("Gemini AI Image Generation Error:", error);
      return res.json({
        success: true,
        imageUrl: createFallbackSvg(promptType),
        isFallback: true,
        notice: "Using luxury gold artwork template as fallback."
      });
    }
  });
  app.get("/api/system/info", async (req, res) => {
    try {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      const mediaCount = await storage.getMediaItems(false).then((items) => items.length);
      const promoCount = await storage.getPromoImages(false).then((items) => items.length);
      const ratesData = await storage.getCurrentRates();
      const istTime = (/* @__PURE__ */ new Date()).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      res.json({
        status: "online",
        server_time: istTime,
        uptime_hours: Math.floor(uptime / 3600),
        memory_used: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        memory_total: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        database_status: "connected",
        media_files: mediaCount,
        promo_images: promoCount,
        rates_last_updated: ratesData?.created_date || null,
        node_version: process.version,
        last_sync: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("System info error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to fetch system information"
      });
    }
  });
}

// server/log.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
async function setupVite(app) {
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: createLogger(),
    server: {
      middlewareMode: true,
      hmr: false
    },
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api")) {
      return next();
    }
    try {
      const clientTemplate = path2.resolve(import.meta.dirname, "..", "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = path2.resolve(import.meta.dirname, "..", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (req, res, next) => {
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/app.ts
async function createApp() {
  const app = express2();
  app.use(express2.json());
  app.use(express2.urlencoded({ extended: false }));
  app.use((req, res, next) => {
    const start = Date.now();
    const path3 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path3.startsWith("/api")) {
        let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "\xE2\u20AC\xA6";
        }
        log(logLine);
      }
    });
    next();
  });
  app.get("/api/health", async (_req, res) => {
    try {
      const connectionString = getDatabaseUrl();
      if (!connectionString) {
        return res.status(500).json({
          status: "unhealthy",
          database: "disconnected",
          error: "Database URL not set (DATABASE_URL / POSTGRES_URL / POSTGRES_PRISMA_URL)"
        });
      }
      const client = postgres(connectionString);
      await client`SELECT 1`;
      await client.end();
      res.json({ status: "healthy", database: "connected" });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        database: "disconnected",
        error: error.message
      });
    }
  });
  app.get("/api/debug/env", (_req, res) => {
    res.json({
      hasDatabaseUrl: Boolean(getDatabaseUrl()),
      nodeEnv: process.env.NODE_ENV,
      vercel: Boolean(process.env.VERCEL)
    });
  });
  app.get("/api/version", (_req, res) => {
    res.json({
      vercel: Boolean(process.env.VERCEL),
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
      gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
      buildTime: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.get("/api/debug/db", async (_req, res) => {
    try {
      const connectionString = getDatabaseUrl();
      if (!connectionString) {
        return res.json({
          error: "No DATABASE_URL set",
          envVars: {
            DATABASE_URL: process.env.DATABASE_URL ? "[SET]" : null,
            POSTGRES_URL: process.env.POSTGRES_URL ? "[SET]" : null,
            POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? "[SET]" : null
          }
        });
      }
      const url = new URL(connectionString);
      const debugInfo = {
        host: url.host,
        port: url.port,
        database: url.pathname.replace("/", ""),
        user: url.username,
        hasPassword: Boolean(url.password),
        ssl: connectionString.includes("sslmode=require")
      };
      const client = postgres(connectionString);
      const result = await client`SELECT version() as version, now() as time`;
      await client.end();
      res.json({
        connection: debugInfo,
        query: {
          success: true,
          version: result[0].version.split(",")[0],
          time: result[0].time
        }
      });
    } catch (error) {
      res.json({
        connection: "failed",
        error: error.message,
        code: error.code,
        errno: error.errno,
        hostname: error.hostname
      });
    }
  });
  await registerRoutes(app);
  app.use("/api/*", (req, res) => {
    res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  });
  if (process.env.VERCEL) {
  } else if (process.env.NODE_ENV !== "production") {
    await setupVite(app);
  } else {
    serveStatic(app);
  }
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message, error: err?.message });
  });
  return app;
}
export {
  createApp
};

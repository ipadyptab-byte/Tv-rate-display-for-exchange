import { sql } from "drizzle-orm";
import { mysqlTable, text, serial, boolean, timestamp, decimal, int, float, tinyint } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Gold and Silver Rates
export const goldRates = mysqlTable("gold_rates", {
  id: serial("id").primaryKey(),
  gold_24k_sale: decimal("gold_24k_sale", { precision: 12, scale: 2 }).notNull(),
  gold_24k_purchase: decimal("gold_24k_purchase", { precision: 12, scale: 2 }).notNull(),
  gold_24k_exchange: decimal("gold_24k_exchange", { precision: 12, scale: 2 }).default("0"),
  gold_22k_sale: decimal("gold_22k_sale", { precision: 12, scale: 2 }).notNull(),
  gold_22k_purchase: decimal("gold_22k_purchase", { precision: 12, scale: 2 }).notNull(),
  gold_22k_exchange: decimal("gold_22k_exchange", { precision: 12, scale: 2 }).default("0"),
  gold_18k_sale: decimal("gold_18k_sale", { precision: 12, scale: 2 }).notNull(),
  gold_18k_purchase: decimal("gold_18k_purchase", { precision: 12, scale: 2 }).notNull(),
  gold_18k_exchange: decimal("gold_18k_exchange", { precision: 12, scale: 2 }).default("0"),
  silver_per_kg_sale: decimal("silver_per_kg_sale", { precision: 12, scale: 2 }).notNull(),
  silver_per_kg_purchase: decimal("silver_per_kg_purchase", { precision: 12, scale: 2 }).notNull(),
  silver_per_kg_exchange: decimal("silver_per_kg_exchange", { precision: 12, scale: 2 }).default("0"),
  is_active: boolean("is_active").default(true),
  source: text("source").default('api'),
  created_date: timestamp("created_date").defaultNow()
});

// Display Settings
export const displaySettings = mysqlTable("display_settings", {
  id: serial("id").primaryKey(),
  orientation: text("orientation").default("horizontal"),
  background_color: text("background_color").default("#FFF8E1"),
  text_color: text("text_color").default("#212529"),
  rate_number_font_size: text("rate_number_font_size").default("text-4xl"),
  show_media: boolean("show_media").default(true),
  rates_display_duration_seconds: int("rates_display_duration_seconds").default(15),
  refresh_interval: int("refresh_interval").default(30),
created_date: timestamp("created_date").defaultNow()});

// Media Items (for ads between rates)
export const mediaItems = mysqlTable("media_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  file_url: text("file_url"), // Keep for backward compatibility
  file_data: text("file_data"), // Store base64 encoded data
  media_type: text("media_type").notNull(), // 'image' or 'video'
  duration_seconds: int("duration_seconds").default(30),
  order_index: int("order_index").default(0),
  is_active: boolean("is_active").default(true),
  file_size: int("file_size"),
  mime_type: text("mime_type"),
  created_date: timestamp("created_date").defaultNow()
 });

// Promotional Images (slideshow below silver rates)
export const promoImages = mysqlTable("promo_images", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  image_url: text("image_url"), // Keep for backward compatibility
  image_data: text("image_data"), // Store base64 encoded data
  duration_seconds: int("duration_seconds").default(5),
  transition_effect: text("transition_effect").default("fade"),
  order_index: int("order_index").default(0),
  is_active: boolean("is_active").default(true),
  file_size: int("file_size"),
  created_date: timestamp("created_date").defaultNow()
 });

// Banner Settings
export const bannerSettings = mysqlTable("banner_settings", {
  id: serial("id").primaryKey(),
  banner_image_url: text("banner_image_url"), // Keep for backward compatibility
  banner_image_data: text("banner_image_data"), // Store base64 encoded data
  banner_height: int("banner_height").default(120),
  is_active: boolean("is_active").default(true),
  created_date: timestamp("created_date").defaultNow()
});

// Rate Calculation Settings
export const rateSettings = mysqlTable("rate_settings", {
  id: serial("id").primaryKey(),
  external_rates_url: text("external_rates_url").default("https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php"),
  perc_24k_purchase: decimal("perc_24k_purchase", { precision: 6, scale: 5 }).default("0.985"),
  perc_24k_exchange: decimal("perc_24k_exchange", { precision: 6, scale: 5 }).default("0.99"),
  perc_22k_sale: decimal("perc_22k_sale", { precision: 6, scale: 5 }).default("0.92"),
  perc_22k_purchase: decimal("perc_22k_purchase", { precision: 6, scale: 5 }).default("0.90"),
  perc_22k_exchange: decimal("perc_22k_exchange", { precision: 6, scale: 5 }).default("0.91"),
  perc_18k_sale: decimal("perc_18k_sale", { precision: 6, scale: 5 }).default("0.86"),
  perc_18k_purchase: decimal("perc_18k_purchase", { precision: 6, scale: 5 }).default("0.80"),
  perc_18k_exchange: decimal("perc_18k_exchange", { precision: 6, scale: 5 }).default("0.85"),
  silver_purchase_offset: decimal("silver_purchase_offset", { precision: 10, scale: 2 }).default("-5000"), // purchase = sale + offset
  silver_exchange_offset: decimal("silver_exchange_offset", { precision: 10, scale: 2 }).default("-3000"), // exchange = sale + offset
  check_interval_minutes: int("check_interval_minutes").default(5), // auto sync interval
  created_date: timestamp("created_date").defaultNow()
});

// Insert schemas
export const insertGoldRateSchema = createInsertSchema(goldRates).omit({
  id: true,
  created_date: true
});

export const insertDisplaySettingsSchema = createInsertSchema(displaySettings).omit({
  id: true,
  created_date: true
});

export const insertMediaItemSchema = createInsertSchema(mediaItems).omit({
  id: true,
  created_date: true
});

export const insertPromoImageSchema = createInsertSchema(promoImages).omit({
  id: true,
  created_date: true
});

export const insertBannerSettingsSchema = createInsertSchema(bannerSettings).omit({
  id: true,
  created_date: true
});

export const insertRateSettingsSchema = createInsertSchema(rateSettings).omit({
  id: true,
  created_date: true
});

// Types
export type GoldRate = typeof goldRates.$inferSelect;
export type InsertGoldRate = z.infer<typeof insertGoldRateSchema>;

export type DisplaySettings = typeof displaySettings.$inferSelect;
export type InsertDisplaySettings = z.infer<typeof insertDisplaySettingsSchema>;

export type MediaItem = typeof mediaItems.$inferSelect;
export type InsertMediaItem = z.infer<typeof insertMediaItemSchema>;

export type PromoImage = typeof promoImages.$inferSelect;
export type InsertPromoImage = z.infer<typeof insertPromoImageSchema>;

export type BannerSettings = typeof bannerSettings.$inferSelect;
export type InsertBannerSettings = z.infer<typeof insertBannerSettingsSchema>;

export type RateSettings = typeof rateSettings.$inferSelect;
export type InsertRateSettings = z.infer<typeof insertRateSettingsSchema>;

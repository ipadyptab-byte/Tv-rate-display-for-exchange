import {
  goldRates,
  displaySettings,
  mediaItems,
  promoImages,
  bannerSettings,
  rateSettings,
  type GoldRate,
  type InsertGoldRate,
  type DisplaySettings,
  type InsertDisplaySettings,
  type MediaItem,
  type InsertMediaItem,
  type PromoImage,
  type InsertPromoImage,
  type BannerSettings,
  type InsertBannerSettings,
  type RateSettings,
  type InsertRateSettings
} from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";
import { ensureDbReady, getDb, isDbAvailable } from "./db";

export interface IStorage {
  // Gold Rates
  getCurrentRates(): Promise<GoldRate | undefined>;
  createGoldRate(rate: InsertGoldRate): Promise<GoldRate>;
  updateGoldRate(id: number, rate: Partial<InsertGoldRate>): Promise<GoldRate | undefined>;
  
  // Display Settings
  getDisplaySettings(): Promise<DisplaySettings | undefined>;
  createDisplaySettings(settings: InsertDisplaySettings): Promise<DisplaySettings>;
  updateDisplaySettings(id: number, settings: Partial<InsertDisplaySettings>): Promise<DisplaySettings | undefined>;
  
  // Rate Calculation Settings
  getRateSettings(): Promise<RateSettings | undefined>;
  createRateSettings(settings: InsertRateSettings): Promise<RateSettings>;
  updateRateSettings(id: number, settings: Partial<InsertRateSettings>): Promise<RateSettings | undefined>;
  
  // Media Items
  getMediaItems(activeOnly?: boolean): Promise<MediaItem[]>;
  createMediaItem(item: InsertMediaItem): Promise<MediaItem>;
  updateMediaItem(id: number, item: Partial<InsertMediaItem>): Promise<MediaItem | undefined>;
  deleteMediaItem(id: number): Promise<boolean>;
  
  // Promo Images
  getPromoImages(activeOnly?: boolean): Promise<PromoImage[]>;
  createPromoImage(image: InsertPromoImage): Promise<PromoImage>;
  updatePromoImage(id: number, image: Partial<InsertPromoImage>): Promise<PromoImage | undefined>;
  deletePromoImage(id: number): Promise<boolean>;
  
  // Banner Settings
  getBannerSettings(): Promise<BannerSettings | undefined>;
  createBannerSettings(banner: InsertBannerSettings): Promise<BannerSettings>;
  updateBannerSettings(id: number, banner: Partial<InsertBannerSettings>): Promise<BannerSettings | undefined>;
}

function roundTo10(val: number | undefined | null): number {
  if (val === undefined || val === null || isNaN(val)) return 0;
  return Math.round(val / 10) * 10;
}

function processRateData<T extends Partial<InsertGoldRate>>(rate: T): T {
  const processed = { ...rate };
  if (processed.gold_24k_sale !== undefined) processed.gold_24k_sale = roundTo10(processed.gold_24k_sale);
  if (processed.gold_24k_purchase !== undefined) processed.gold_24k_purchase = roundTo10(processed.gold_24k_purchase);
  if (processed.gold_24k_exchange !== undefined) processed.gold_24k_exchange = roundTo10(processed.gold_24k_exchange);
  if (processed.gold_22k_sale !== undefined) processed.gold_22k_sale = roundTo10(processed.gold_22k_sale);
  if (processed.gold_22k_purchase !== undefined) processed.gold_22k_purchase = roundTo10(processed.gold_22k_purchase);
  if (processed.gold_22k_exchange !== undefined) processed.gold_22k_exchange = roundTo10(processed.gold_22k_exchange);
  if (processed.gold_18k_sale !== undefined) processed.gold_18k_sale = roundTo10(processed.gold_18k_sale);
  if (processed.gold_18k_purchase !== undefined) processed.gold_18k_purchase = roundTo10(processed.gold_18k_purchase);
  if (processed.gold_18k_exchange !== undefined) processed.gold_18k_exchange = roundTo10(processed.gold_18k_exchange);
  if (processed.silver_per_kg_sale !== undefined) processed.silver_per_kg_sale = roundTo10(processed.silver_per_kg_sale);
  if (processed.silver_per_kg_purchase !== undefined) processed.silver_per_kg_purchase = roundTo10(processed.silver_per_kg_purchase);
  if (processed.silver_per_kg_exchange !== undefined) processed.silver_per_kg_exchange = roundTo10(processed.silver_per_kg_exchange);
  return processed;
}

export class MemStorage implements IStorage {
  private goldRatesList: GoldRate[] = [];
  private displaySettingsData: DisplaySettings | undefined;
  private rateSettingsData: RateSettings | undefined;
  private mediaItemsList: MediaItem[] = [];
  private promoImagesList: PromoImage[] = [];
  private bannerSettingsData: BannerSettings | undefined;
  private nextId = { rates: 1, display: 1, rateSettings: 1, media: 1, promo: 1, banner: 1 };

  constructor() {
    this.goldRatesList.push({
      id: this.nextId.rates++,
      gold_24k_sale: 151000,
      gold_24k_purchase: 148740,
      gold_24k_exchange: 149490,
      gold_22k_sale: 138920,
      gold_22k_purchase: 135900,
      gold_22k_exchange: 137410,
      gold_18k_sale: 129860,
      gold_18k_purchase: 120800,
      gold_18k_exchange: 128350,
      silver_per_kg_sale: 235000,
      silver_per_kg_purchase: 230000,
      silver_per_kg_exchange: 232000,
      is_active: true,
      source: 'default',
      created_date: new Date(),
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
      created_date: new Date(),
    };

    this.rateSettingsData = {
      id: this.nextId.rateSettings++,
      external_rates_url: "https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php",
      perc_24k_purchase: 0.985,
      perc_24k_exchange: 0.99,
      perc_22k_sale: 0.92,
      perc_22k_purchase: 0.90,
      perc_22k_exchange: 0.91,
      perc_18k_sale: 0.86,
      perc_18k_purchase: 0.80,
      perc_18k_exchange: 0.85,
      silver_purchase_offset: -5000,
      silver_exchange_offset: -3000,
      check_interval_minutes: 5,
      created_date: new Date(),
    };

    this.bannerSettingsData = {
      id: this.nextId.banner++,
      banner_image_url: null,
      banner_image_data: null,
      banner_height: 120,
      is_active: true,
      created_date: new Date(),
    };
  }

  async getCurrentRates(): Promise<GoldRate | undefined> {
    const active = this.goldRatesList.filter((r) => r.is_active);
    return active[active.length - 1] || this.goldRatesList[this.goldRatesList.length - 1];
  }

  async createGoldRate(rate: InsertGoldRate): Promise<GoldRate> {
    const processedRate = processRateData(rate);

    // Check if the latest active rate is identical to prevent duplicate database rows
    const activeRates = this.goldRatesList.filter((r) => r.is_active);
    const lastRate = activeRates[activeRates.length - 1] || this.goldRatesList[this.goldRatesList.length - 1];
    if (lastRate) {
      const rateFields = [
        'gold_24k_sale', 'gold_24k_purchase', 'gold_24k_exchange', 'gold_22k_sale', 'gold_22k_purchase', 'gold_22k_exchange',
        'gold_18k_sale', 'gold_18k_purchase', 'gold_18k_exchange', 'silver_per_kg_sale', 'silver_per_kg_purchase', 'silver_per_kg_exchange'
      ];
      let hasChanges = false;
      for (const field of rateFields) {
        const lastVal = Number(lastRate[field as keyof GoldRate]);
        const newVal = Number(processedRate[field as keyof InsertGoldRate]);
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
    const newRate: GoldRate = {
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
      source: processedRate.source ?? 'api',
      created_date: new Date(),
    };
    this.goldRatesList.push(newRate);
    return newRate;
  }

  async updateGoldRate(id: number, rate: Partial<InsertGoldRate>): Promise<GoldRate | undefined> {
    const processedRate = processRateData(rate);
    const item = this.goldRatesList.find((r) => r.id === id);
    if (!item) return undefined;
    Object.assign(item, processedRate);
    return item;
  }

  async getDisplaySettings(): Promise<DisplaySettings | undefined> {
    return this.displaySettingsData;
  }

  async createDisplaySettings(settings: InsertDisplaySettings): Promise<DisplaySettings> {
    const newSettings: DisplaySettings = {
      id: this.nextId.display++,
      orientation: settings.orientation ?? "horizontal",
      background_color: settings.background_color ?? "#FFF8E1",
      text_color: settings.text_color ?? "#212529",
      rate_number_font_size: settings.rate_number_font_size ?? "text-4xl",
      show_media: settings.show_media ?? true,
      rates_display_duration_seconds: settings.rates_display_duration_seconds ?? 15,
      refresh_interval: settings.refresh_interval ?? 30,
      created_date: new Date(),
    };
    this.displaySettingsData = newSettings;
    return newSettings;
  }

  async updateDisplaySettings(id: number, settings: Partial<InsertDisplaySettings>): Promise<DisplaySettings | undefined> {
    if (!this.displaySettingsData) {
      return this.createDisplaySettings(settings as InsertDisplaySettings);
    }
    Object.assign(this.displaySettingsData, settings);
    return this.displaySettingsData;
  }

  async getRateSettings(): Promise<RateSettings | undefined> {
    return this.rateSettingsData;
  }

  async createRateSettings(settings: InsertRateSettings): Promise<RateSettings> {
    const newSettings: RateSettings = {
      id: this.nextId.rateSettings++,
      external_rates_url: settings.external_rates_url ?? "https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php",
      perc_24k_purchase: settings.perc_24k_purchase ?? 0.985,
      perc_24k_exchange: settings.perc_24k_exchange ?? 0.99,
      perc_22k_sale: settings.perc_22k_sale ?? 0.92,
      perc_22k_purchase: settings.perc_22k_purchase ?? 0.90,
      perc_22k_exchange: settings.perc_22k_exchange ?? 0.91,
      perc_18k_sale: settings.perc_18k_sale ?? 0.86,
      perc_18k_purchase: settings.perc_18k_purchase ?? 0.80,
      perc_18k_exchange: settings.perc_18k_exchange ?? 0.85,
      silver_purchase_offset: settings.silver_purchase_offset ?? -5000,
      silver_exchange_offset: settings.silver_exchange_offset ?? -3000,
      check_interval_minutes: settings.check_interval_minutes ?? 5,
      created_date: new Date(),
    };
    this.rateSettingsData = newSettings;
    return newSettings;
  }

  async updateRateSettings(id: number, settings: Partial<InsertRateSettings>): Promise<RateSettings | undefined> {
    if (!this.rateSettingsData) {
      return this.createRateSettings(settings as InsertRateSettings);
    }
    Object.assign(this.rateSettingsData, settings);
    return this.rateSettingsData;
  }

  async getMediaItems(activeOnly = false): Promise<MediaItem[]> {
    if (activeOnly) {
      return this.mediaItemsList.filter((m) => m.is_active);
    }
    return this.mediaItemsList;
  }

  async createMediaItem(item: InsertMediaItem): Promise<MediaItem> {
    const newItem: MediaItem = {
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
      created_date: new Date(),
    };
    this.mediaItemsList.push(newItem);
    return newItem;
  }

  async updateMediaItem(id: number, item: Partial<InsertMediaItem>): Promise<MediaItem | undefined> {
    const existing = this.mediaItemsList.find((m) => m.id === id);
    if (!existing) return undefined;
    Object.assign(existing, item);
    return existing;
  }

  async deleteMediaItem(id: number): Promise<boolean> {
    const index = this.mediaItemsList.findIndex((m) => m.id === id);
    if (index === -1) return false;
    this.mediaItemsList.splice(index, 1);
    return true;
  }

  async getPromoImages(activeOnly = false): Promise<PromoImage[]> {
    if (activeOnly) {
      return this.promoImagesList.filter((p) => p.is_active);
    }
    return this.promoImagesList;
  }

  async createPromoImage(image: InsertPromoImage): Promise<PromoImage> {
    const newPromo: PromoImage = {
      id: this.nextId.promo++,
      name: image.name,
      image_url: image.image_url ?? null,
      image_data: image.image_data ?? null,
      duration_seconds: image.duration_seconds ?? 5,
      transition_effect: image.transition_effect ?? "fade",
      order_index: image.order_index ?? 0,
      is_active: image.is_active ?? true,
      file_size: image.file_size ?? null,
      created_date: new Date(),
    };
    this.promoImagesList.push(newPromo);
    return newPromo;
  }

  async updatePromoImage(id: number, image: Partial<InsertPromoImage>): Promise<PromoImage | undefined> {
    const existing = this.promoImagesList.find((p) => p.id === id);
    if (!existing) return undefined;
    Object.assign(existing, image);
    return existing;
  }

  async deletePromoImage(id: number): Promise<boolean> {
    const index = this.promoImagesList.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.promoImagesList.splice(index, 1);
    return true;
  }

  async getBannerSettings(): Promise<BannerSettings | undefined> {
    return this.bannerSettingsData;
  }

  async createBannerSettings(banner: InsertBannerSettings): Promise<BannerSettings> {
    const newBanner: BannerSettings = {
      id: this.nextId.banner++,
      banner_image_url: banner.banner_image_url ?? null,
      banner_image_data: banner.banner_image_data ?? null,
      banner_height: banner.banner_height ?? 120,
      is_active: banner.is_active ?? true,
      created_date: new Date(),
    };
    this.bannerSettingsData = newBanner;
    return newBanner;
  }

  async updateBannerSettings(id: number, banner: Partial<InsertBannerSettings>): Promise<BannerSettings | undefined> {
    if (!this.bannerSettingsData) {
      return this.createBannerSettings(banner as InsertBannerSettings);
    }
    Object.assign(this.bannerSettingsData, banner);
    return this.bannerSettingsData;
  }
}

export class PostgresStorage implements IStorage {
  private memFallback = new MemStorage();

  private async useDb() {
    await ensureDbReady();
    const db = getDb();
    if (!db || !isDbAvailable()) return null;
    return db;
  }

  // Gold Rates
  async getCurrentRates(): Promise<GoldRate | undefined> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.getCurrentRates();
      const rates = await db.select().from(goldRates)
        .where(eq(goldRates.is_active, true))
        .orderBy(desc(goldRates.created_date))
        .limit(1);
      return rates[0] || this.memFallback.getCurrentRates();
    } catch {
      return this.memFallback.getCurrentRates();
    }
  }

  async createGoldRate(rate: InsertGoldRate): Promise<GoldRate> {
    const processedRate = processRateData(rate);
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.createGoldRate(processedRate);

      const currentRates = await db.select().from(goldRates)
        .where(eq(goldRates.is_active, true))
        .orderBy(desc(goldRates.created_date))
        .limit(1);

      if (currentRates.length > 0) {
        const lastRate = currentRates[0];
        const rateFields = [
          'gold_24k_sale', 'gold_24k_purchase', 'gold_24k_exchange', 'gold_22k_sale', 'gold_22k_purchase', 'gold_22k_exchange',
          'gold_18k_sale', 'gold_18k_purchase', 'gold_18k_exchange', 'silver_per_kg_sale', 'silver_per_kg_purchase', 'silver_per_kg_exchange'
        ];

        let hasChanges = false;
        for (const field of rateFields) {
          const lastValue = Number(lastRate[field as keyof GoldRate]);
          const newValue = Number(processedRate[field as keyof InsertGoldRate]);
          if (lastValue !== newValue) {
            hasChanges = true;
            break;
          }
        }

        if (!hasChanges) {
          return lastRate;
        }
      }

      await db.update(goldRates).set({ is_active: false });
      const result = await db.insert(goldRates).values(processedRate).returning();
      return result[0];
    } catch {
      return this.memFallback.createGoldRate(processedRate);
    }
  }

  async updateGoldRate(id: number, rate: Partial<InsertGoldRate>): Promise<GoldRate | undefined> {
    const processedRate = processRateData(rate);
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.updateGoldRate(id, processedRate);
      const result = await db.update(goldRates)
        .set(processedRate)
        .where(eq(goldRates.id, id))
        .returning();
      return result[0];
    } catch {
      return this.memFallback.updateGoldRate(id, processedRate);
    }
  }

  // Display Settings
  async createDisplaySettings(settings: InsertDisplaySettings): Promise<DisplaySettings> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.createDisplaySettings(settings);
      const result = await db.insert(displaySettings).values(settings).returning();
      return result[0];
    } catch {
      return this.memFallback.createDisplaySettings(settings);
    }
  } 

  async getDisplaySettings(): Promise<DisplaySettings | undefined> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.getDisplaySettings();
      const settings = await db.select().from(displaySettings)
        .orderBy(desc(displaySettings.created_date))
        .limit(1);
      return settings[0] || this.memFallback.getDisplaySettings();
    } catch {
      return this.memFallback.getDisplaySettings();
    }
  }

  async updateDisplaySettings(id: number, settings: Partial<InsertDisplaySettings>): Promise<DisplaySettings | undefined> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.updateDisplaySettings(id, settings);
      const result = await db.update(displaySettings)
        .set(settings)
        .where(eq(displaySettings.id, id))
        .returning();
      return result[0];
    } catch {
      return this.memFallback.updateDisplaySettings(id, settings);
    }
  }

  // Rate Calculation Settings
  async getRateSettings(): Promise<RateSettings | undefined> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.getRateSettings();
      const settings = await db.select().from(rateSettings)
        .orderBy(desc(rateSettings.created_date))
        .limit(1);
      return settings[0] || this.memFallback.getRateSettings();
    } catch {
      return this.memFallback.getRateSettings();
    }
  }

  async createRateSettings(settings: InsertRateSettings): Promise<RateSettings> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.createRateSettings(settings);
      const result = await db.insert(rateSettings).values(settings).returning();
      return result[0];
    } catch {
      return this.memFallback.createRateSettings(settings);
    }
  }

  async updateRateSettings(id: number, settings: Partial<InsertRateSettings>): Promise<RateSettings | undefined> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.updateRateSettings(id, settings);
      const result = await db.update(rateSettings)
        .set(settings)
        .where(eq(rateSettings.id, id))
        .returning();
      return result[0];
    } catch {
      return this.memFallback.updateRateSettings(id, settings);
    }
  }

  // Media Items
  async getMediaItems(activeOnly = false): Promise<MediaItem[]> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.getMediaItems(activeOnly);

      if (activeOnly) {
        return await db.select().from(mediaItems)
          .where(eq(mediaItems.is_active, true))
          .orderBy(asc(mediaItems.order_index));
      }

      return await db.select().from(mediaItems)
        .orderBy(asc(mediaItems.order_index));
    } catch {
      return this.memFallback.getMediaItems(activeOnly);
    }
  }

  async createMediaItem(item: InsertMediaItem): Promise<MediaItem> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.createMediaItem(item);
      const result = await db.insert(mediaItems).values(item).returning();
      return result[0];
    } catch {
      return this.memFallback.createMediaItem(item);
    }
  }

  async updateMediaItem(id: number, item: Partial<InsertMediaItem>): Promise<MediaItem | undefined> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.updateMediaItem(id, item);
      const result = await db.update(mediaItems)
        .set(item)
        .where(eq(mediaItems.id, id))
        .returning();
      return result[0];
    } catch {
      return this.memFallback.updateMediaItem(id, item);
    }
  }

  async deleteMediaItem(id: number): Promise<boolean> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.deleteMediaItem(id);
      const result = await db.delete(mediaItems).where(eq(mediaItems.id, id)).returning();
      return result.length > 0;
    } catch {
      return this.memFallback.deleteMediaItem(id);
    }
  }

  // Promo Images
  async getPromoImages(activeOnly = false): Promise<PromoImage[]> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.getPromoImages(activeOnly);

      if (activeOnly) {
        return await db.select().from(promoImages)
          .where(eq(promoImages.is_active, true))
          .orderBy(asc(promoImages.order_index));
      }

      return await db.select().from(promoImages)
        .orderBy(asc(promoImages.order_index));
    } catch {
      return this.memFallback.getPromoImages(activeOnly);
    }
  }

  async createPromoImage(image: InsertPromoImage): Promise<PromoImage> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.createPromoImage(image);
      const result = await db.insert(promoImages).values(image).returning();
      return result[0];
    } catch {
      return this.memFallback.createPromoImage(image);
    }
  }

  async updatePromoImage(id: number, image: Partial<InsertPromoImage>): Promise<PromoImage | undefined> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.updatePromoImage(id, image);
      const result = await db.update(promoImages)
        .set(image)
        .where(eq(promoImages.id, id))
        .returning();
      return result[0];
    } catch {
      return this.memFallback.updatePromoImage(id, image);
    }
  }

  async deletePromoImage(id: number): Promise<boolean> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.deletePromoImage(id);
      const result = await db.delete(promoImages).where(eq(promoImages.id, id)).returning();
      return result.length > 0;
    } catch {
      return this.memFallback.deletePromoImage(id);
    }
  }

  // Banner Settings
  async getBannerSettings(): Promise<BannerSettings | undefined> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.getBannerSettings();
      const banner = await db.select().from(bannerSettings)
        .where(eq(bannerSettings.is_active, true))
        .orderBy(desc(bannerSettings.created_date))
        .limit(1);
      return banner[0] || this.memFallback.getBannerSettings();
    } catch {
      return this.memFallback.getBannerSettings();
    }
  }

  async createBannerSettings(banner: InsertBannerSettings): Promise<BannerSettings> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.createBannerSettings(banner);
      const result = await db.insert(bannerSettings).values(banner).returning();
      return result[0];
    } catch {
      return this.memFallback.createBannerSettings(banner);
    }
  }

  async updateBannerSettings(id: number, banner: Partial<InsertBannerSettings>): Promise<BannerSettings | undefined> {
    try {
      const db = await this.useDb();
      if (!db) return this.memFallback.updateBannerSettings(id, banner);
      const result = await db.update(bannerSettings)
        .set(banner)
        .where(eq(bannerSettings.id, id))
        .returning();
      return result[0];
    } catch {
      return this.memFallback.updateBannerSettings(id, banner);
    }
  }
}

export const storage = new PostgresStorage();

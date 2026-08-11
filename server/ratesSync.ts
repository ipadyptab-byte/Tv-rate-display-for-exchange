import { z } from "zod";
import type { IStorage } from "./storage";
import { writeCurrentRatesToFile } from "./currentratesfile";

// Schema for businessmantra.info API response
// Returns: { "24K Gold": 145000, "22K Gold": 133400, "18K Gold": 116000, "Silver": 2280 }
const parseNumberVal = z.union([z.number(), z.string()]).transform(val => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  const clean = String(val).replace(/,/g, '').trim();
  const num = Number(clean);
  return isNaN(num) ? null : num;
}).nullable().optional();

// Schema for external API response (e.g., businessmantra)
const externalRatesSchema = z.object({
  "24K Gold": parseNumberVal,
  "22K Gold": parseNumberVal,
  "18K Gold": parseNumberVal,
  "Silver": parseNumberVal,
}).passthrough();

let lastSyncAttemptTime = 0;

export interface SyncLogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'skip' | 'error';
  message: string;
  details?: any;
}

const syncLogBuffer: SyncLogEntry[] = [];

function addSyncLog(message: string, type: 'info' | 'success' | 'skip' | 'error' = 'info', details?: any) {
  const entry: SyncLogEntry = {
    timestamp: new Date().toISOString(),
    type,
    message,
    details
  };
  syncLogBuffer.unshift(entry);
  if (syncLogBuffer.length > 50) syncLogBuffer.pop();
  console.log(`[Auto-Sync ${entry.timestamp}] [${type.toUpperCase()}] ${message}`);
}

export function getSyncLogs(): SyncLogEntry[] {
  return syncLogBuffer;
}

export function getSyncStatus(intervalMinutes = 5) {
  const now = Date.now();
  const timeSinceLastSync = lastSyncAttemptTime > 0 ? now - lastSyncAttemptTime : null;
  const intervalMs = intervalMinutes * 60 * 1000;
  const nextSyncInMs = lastSyncAttemptTime > 0 ? Math.max(0, intervalMs - timeSinceLastSync!) : 0;

  return {
    lastSyncAttemptTime: lastSyncAttemptTime > 0 ? new Date(lastSyncAttemptTime).toISOString() : null,
    secondsSinceLastSync: timeSinceLastSync ? Math.round(timeSinceLastSync / 1000) : null,
    nextSyncInSeconds: Math.round(nextSyncInMs / 1000),
    intervalMinutes,
    totalLogsRecorded: syncLogBuffer.length,
    latestLog: syncLogBuffer[0] || null
  };
}

function roundRate(value: number): number {
  // Round to nearest 10 (values ending in 5 will round up to 10)
  const result = Math.round(value / 10) * 10;
  if (!Number.isFinite(result)) return value;
  return result;
}

function calculateAllRates(
  gold24Sale: number,
  silverSale: number,
  settings: any,
  raw22kSale?: number | null,
  raw18kSale?: number | null,
) {
  const perc24Purchase = settings?.perc_24k_purchase ?? 0.985;
  const perc24Exchange = settings?.perc_24k_exchange ?? 0.99;
  const perc22Sale = settings?.perc_22k_sale ?? 0.92;
  const perc22Purchase = settings?.perc_22k_purchase ?? 0.9;
  const perc22Exchange = settings?.perc_22k_exchange ?? 0.91;
  const perc18Sale = settings?.perc_18k_sale ?? 0.86;
  const perc18Purchase = settings?.perc_18k_purchase ?? 0.80;
  const perc18Exchange = settings?.perc_18k_exchange ?? 0.85;
  const silverPurchaseOffset = settings?.silver_purchase_offset ?? -5000;
  const silverExchangeOffset = settings?.silver_exchange_offset ?? -3000;

  // Use raw values from API payload if provided, otherwise compute from 24K sale
  const gold22Sale = (raw22kSale && raw22kSale > 0)
    ? roundRate(raw22kSale)
    : roundRate(gold24Sale * perc22Sale);

  const gold18Sale = (raw18kSale && raw18kSale > 0)
    ? roundRate(raw18kSale)
    : roundRate(gold24Sale * perc18Sale);

  // Calculate and round all values
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
    silver_per_kg_exchange: roundRate(silverSale + silverExchangeOffset),
  };
  
  console.log("Calculated rates:", JSON.stringify(result));
  return result;
}

export async function syncRatesFromExternal(
  storage: IStorage,
  opts: { force: boolean },
) {
  const settings = await storage.getRateSettings();
  const intervalMinutes = settings?.check_interval_minutes ?? 5;
  const intervalMs = intervalMinutes * 60 * 1000;

  const current = await storage.getCurrentRates();
  const now = Date.now();
  
  if (!opts.force && current && current.source !== 'default') {
    const elapsed = now - lastSyncAttemptTime;
    if (elapsed < intervalMs) {
      const remainingSec = Math.round((intervalMs - elapsed) / 1000);
      addSyncLog(`Within ${intervalMinutes}-minute sync interval (${remainingSec}s remaining). Returning active database rates.`, 'skip', {
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

  addSyncLog(`Interval due or force requested. Fetching external rates from ${url}`, 'info');

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    response = await fetch(url, {
      headers: {
        "accept": "application/json, text/plain, */*",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (err: any) {
    const errMsg = `Unable to reach external rates URL (${url}): ${err?.message || err}`;
    addSyncLog(errMsg, 'error');
    if (current) return current;
    throw new Error(errMsg);
  }

  if (!response.ok) {
    const errMsg = `External rates URL returned HTTP status ${response.status}`;
    addSyncLog(errMsg, 'error');
    if (current) return current;
    throw new Error(errMsg);
  }

  const rawText = await response.text();
  let parsedJson: any;
  try {
    parsedJson = JSON.parse(rawText);
  } catch (e) {
    const errMsg = `Failed to parse external API JSON: ${rawText.slice(0, 100)}`;
    addSyncLog(errMsg, 'error');
    if (current) return current;
    throw new Error("Invalid JSON received from external rates API");
  }

  const payload = externalRatesSchema.parse(parsedJson);

  // Get values from the businessmantra API format
  // Silver API returns per 10 grams, convert to per kg by multiplying by 100 if < 10000
  const gold24Raw = payload["24K Gold"];
  const gold22Raw = payload["22K Gold"];
  const gold18Raw = payload["18K Gold"];
  const silverRaw = payload["Silver"];

  const gold24Sale = gold24Raw ? roundRate(gold24Raw) : null;
  const gold22Sale = gold22Raw ? roundRate(gold22Raw) : null;
  const gold18Sale = gold18Raw ? roundRate(gold18Raw) : null;
  const silverSale = silverRaw ? roundRate(silverRaw < 10000 ? silverRaw * 100 : silverRaw) : null;

  // Validate we got the required data
  if (!gold24Sale || !silverSale) {
    const errMsg = "Missing 24K Gold or Silver in API response payload";
    addSyncLog(errMsg, 'error', payload);
    if (current) {
      return current;
    }
    throw new Error("Invalid response from external API: missing 24K Gold or Silver rates");
  }

  // Calculate all rates from external data (passing explicit 22K and 18K values if present)
  const newRates = calculateAllRates(gold24Sale, silverSale, settings, gold22Sale, gold18Sale);

  const created = await storage.createGoldRate({
    ...newRates,
    is_active: true,
    source: 'api',
  });

  if (current && created.id === current.id) {
    addSyncLog(`Fetched external rates (24K: ₹${newRates.gold_24k_sale}, 22K: ₹${newRates.gold_22k_sale}, 18K: ₹${newRates.gold_18k_sale}, Silver/kg: ₹${newRates.silver_per_kg_sale}) match existing database. Ignored duplicate values.`, 'info', {
      rateId: created.id,
      rates: newRates
    });
  } else {
    addSyncLog(`Rates CHANGED! Stored new rate entry in database (Record ID #${created.id}, 24K: ₹${newRates.gold_24k_sale}, 22K: ₹${newRates.gold_22k_sale}, 18K: ₹${newRates.gold_18k_sale}, Silver/kg: ₹${newRates.silver_per_kg_sale})`, 'success', {
      rateId: created.id,
      rates: newRates
    });
  }

  await writeCurrentRatesToFile(created);

  return created;
}

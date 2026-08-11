import type { 
  GoldRate, 
  InsertGoldRate, 
  DisplaySettings, 
  InsertDisplaySettings,
  MediaItem,
  PromoImage,
  BannerSettings,
  RateSettings,
  InsertRateSettings
} from "@shared/schema";
import { apiUrl } from "./config";

// Helper function for API requests
const apiRequest = async (method: string, url: string, data?: any): Promise<Response> => {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data && method !== 'GET' && method !== 'HEAD') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(apiUrl(url), options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error (${response.status}):`, errorText.slice(0, 200));
    
    // Try to parse error as JSON, otherwise use clean error message
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      if (errorText && !errorText.trim().startsWith("<")) {
        errorMessage = errorText;
      }
    }
    
    throw new Error(errorMessage);
  }

  return response;
};

// Default Fallback Gold Rate
const DEFAULT_GOLD_RATES: GoldRate = {
  id: 1,
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
  created_date: new Date().toISOString(),
};

// Default Display Settings Fallback
const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  id: 1,
  orientation: "horizontal",
  background_color: "#FFF8E1",
  text_color: "#212529",
  rate_number_font_size: "text-4xl",
  show_media: true,
  rates_display_duration_seconds: 15,
  refresh_interval: 30,
};

// Gold Rates API
export const ratesApi = {
  getCurrent: async (): Promise<GoldRate> => {
    try {
      const response = await apiRequest("GET", `/api/rates/current?t=${Date.now()}`);
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return DEFAULT_GOLD_RATES;
      }

      if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
        return DEFAULT_GOLD_RATES;
      }

      return {
        ...DEFAULT_GOLD_RATES,
        ...data,
      };
    } catch (err) {
      console.warn("Unable to fetch current rates (using fallback defaults):", err);
      return DEFAULT_GOLD_RATES;
    }
  },

  create: async (rates: InsertGoldRate): Promise<GoldRate> => {
    const response = await apiRequest("POST", "/api/rates", rates);
    return response.json();
  },

  sync: async (opts?: { force?: boolean }): Promise<{ message: string; rates: GoldRate }> => {
    const force = opts?.force ?? true;
    const url = force ? "/api/rates/sync" : "/api/rates/sync?force=0";
    const response = await apiRequest("GET", url);
    return response.json();
  },

  syncScheduled: async (): Promise<{ message: string; rates: GoldRate | null }> => {
    try {
      const response = await apiRequest("GET", "/api/rates/sync-scheduled");
      return await response.json();
    } catch {
      return { message: "Sync failed", rates: null };
    }
  }
};

// Display Settings API - Improved Error Handling
export const settingsApi = {
  getDisplay: async (): Promise<DisplaySettings> => {
    try {
      const response = await apiRequest("GET", "/api/settings/display");
      const text = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        return DEFAULT_DISPLAY_SETTINGS;
      }

      if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
        return DEFAULT_DISPLAY_SETTINGS;
      }

      return {
        ...DEFAULT_DISPLAY_SETTINGS,
        ...data,
      };
    } catch (error: any) {
      console.warn("Display settings request unavailable, using defaults");
      return DEFAULT_DISPLAY_SETTINGS;
    }
  },

  createDisplay: async (settings: InsertDisplaySettings): Promise<DisplaySettings> => {
    const response = await apiRequest("POST", "/api/settings/display", settings);
    return (await response.json()) as DisplaySettings;
  },

  updateDisplay: async (id: number, settings: Partial<InsertDisplaySettings>): Promise<DisplaySettings> => {
    if (!id || isNaN(id)) {
      throw new Error("Invalid settings ID");
    }
    const response = await apiRequest("PUT", `/api/settings/display/${id}`, settings);
    return (await response.json()) as DisplaySettings;
  },

  // Rate Calculation Settings API
  getRate: async (): Promise<RateSettings | null> => {
    try {
      const response = await apiRequest("GET", "/api/settings/rates");
      return response.json();
    } catch (error) {
      return null;
    }
  },

  createRate: async (settings: InsertRateSettings): Promise<RateSettings> => {
    const response = await apiRequest("POST", "/api/settings/rates", settings);
    return response.json();
  },

  updateRate: async (id: number, settings: Partial<InsertRateSettings>): Promise<RateSettings> => {
    const response = await apiRequest("PUT", `/api/settings/rates/${id}`, settings);
    return response.json();
  }
};
// Media API
export const mediaApi = {
  getAll: async (activeOnly = false): Promise<MediaItem[]> => {
    const response = await apiRequest("GET", `/api/media?active=${activeOnly}`);
    return response.json();
  },

  upload: async (files: FileList, options: { duration_seconds: number; autoActivate: boolean }): Promise<MediaItem[]> => {
    const formData = new FormData();
    const filesArray = Array.from(files);
    
    // Validate file sizes before upload (50MB limit for cloud deployment)
    for (const file of filesArray) {
      if (file.size > 50 * 1024 * 1024) {
        throw new Error(`File ${file.name} is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 50MB.`);
      }
    }
    
    filesArray.forEach(file => formData.append('files', file));
    formData.append('duration_seconds', options.duration_seconds.toString());
    formData.append('autoActivate', options.autoActivate.toString());

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    
    try {
      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || `Upload failed: ${response.status}`;
        } catch {
          errorMessage = `Upload failed: ${response.status} - ${errorText}`;
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Upload timed out. Please try uploading smaller files or fewer files at once.');
      }
      throw error;
    }
  },

  update: async (id: number, updates: Partial<MediaItem>): Promise<MediaItem> => {
    const response = await apiRequest("PUT", `/api/media/${id}`, updates);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/media/${id}`);
  }
};

// Promo API
export const promoApi = {
  getAll: async (activeOnly = false): Promise<PromoImage[]> => {
    const response = await apiRequest("GET", `/api/promo?active=${activeOnly}`);
    return response.json();
  },

  upload: async (files: FileList, options: { duration_seconds: number; transition: string; autoActivate: boolean }): Promise<PromoImage[]> => {
    const formData = new FormData();
    const filesArray = Array.from(files);
    
    // Validate file sizes before upload (10MB limit for promo images)
    for (const file of filesArray) {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`Image ${file.name} is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 10MB.`);
      }
    }
    
    filesArray.forEach(file => formData.append('files', file));
    formData.append('duration_seconds', options.duration_seconds.toString());
    formData.append('transition', options.transition);
    formData.append('autoActivate', options.autoActivate.toString());

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout for images
    
    try {
      const response = await fetch("/api/promo/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || `Upload failed: ${response.status}`;
        } catch {
          errorMessage = `Upload failed: ${response.status} - ${errorText}`;
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Upload timed out. Please try uploading smaller images or fewer images at once.');
      }
      throw error;
    }
  },

  update: async (id: number, updates: Partial<PromoImage>): Promise<PromoImage> => {
    const response = await apiRequest("PUT", `/api/promo/${id}`, updates);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/promo/${id}`);
  }
};

// Banner API
export const bannerApi = {
  getCurrent: async (): Promise<BannerSettings | null> => {
    const response = await apiRequest("GET", "/api/banner");
    return response.json();
  },

  upload: async (file: File): Promise<{ banner_image_url: string; message: string }> => {
    const formData = new FormData();
    formData.append('banner', file);

    const response = await fetch("/api/banner/upload", {
      method: "POST",
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    return response.json();
  }
};

// System API
export const systemApi = {
  getInfo: async () => {
    const response = await apiRequest("GET", "/api/system/info");
    return response.json();
  }
};

// Gemini AI API
export const geminiApi = {
  generateStatusBg: async (data: { promptType: string; customPrompt?: string }) => {
    try {
      const response = await apiRequest("POST", "/api/generate-status-bg", data);
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error("Invalid response format from server");
      }
    } catch (err: any) {
      console.error("Gemini AI API generateStatusBg error:", err);
      return {
        success: false,
        error: err?.message || "Failed to generate AI background image",
      };
    }
  }
};

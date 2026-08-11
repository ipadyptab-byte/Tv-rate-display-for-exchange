import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ratesApi, settingsApi, geminiApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function SaleStatus() {
  // Indian time
  const getIndianTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  };

  const [currentTime, setCurrentTime] = useState<Date>(getIndianTime());
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isWorking, setIsWorking] = useState<"idle" | "saving" | "sharing">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Optional directory handle if user selects a folder (File System Access API)
  const [dirHandle, setDirHandle] = useState<any>(null);

  // Gemini AI Background states
  const [aiBgUrl, setAiBgUrl] = useState<string | null>(null);
  const [aiPromptType, setAiPromptType] = useState<"plain_gold" | "marathi_lady" | "royal_gold" | "custom">("plain_gold");
  const [customPromptText, setCustomPromptText] = useState<string>("");
  const [isGeneratingAiBg, setIsGeneratingAiBg] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [aspectRatioMode, setAspectRatioMode] = useState<"whatsapp_status" | "full_screen">("whatsapp_status");
  const [showAiControls, setShowAiControls] = useState<boolean>(true);

  const handleGenerateAiBg = async () => {
    try {
      setIsGeneratingAiBg(true);
      setAiError(null);
      setAiNotice(null);
      const res = await geminiApi.generateStatusBg({
        promptType: aiPromptType,
        customPrompt: customPromptText,
      });

      if (res.imageUrl) {
        setAiBgUrl(res.imageUrl);
        if (res.notice) {
          setAiNotice(res.notice);
        }
      } else {
        setAiError(res.error || "Could not generate AI background.");
      }
    } catch (err: any) {
      console.error("AI Generation failed:", err);
      setAiError(err?.message || "Failed to call Gemini AI image API.");
    } finally {
      setIsGeneratingAiBg(false);
    }
  };

  const isIOS = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }, []);

  // Try modern file picker (lets user choose exact save location and filename)
  const saveWithPicker = async (blob: Blob, suggestedName: string) => {
    try {
      // @ts-expect-error
      if (window?.showSaveFilePicker) {
        // @ts-expect-error
        const handle = await window.showSaveFilePicker({
          suggestedName,
          types: [{ description: "PNG Image", accept: { "image/png": [".png"] } }],
        });
        // @ts-expect-error
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Let user choose a folder and remember it (for capable browsers)
  const chooseFolder = async () => {
    try {
      // @ts-expect-error
      if (window?.showDirectoryPicker) {
        // @ts-expect-error
        const handle = await window.showDirectoryPicker();
        setDirHandle(handle);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Save directly into a chosen folder (File System Access API)
  const saveToChosenFolder = async (blob: Blob, filename: string) => {
    try {
      if (!dirHandle) return false;
      // @ts-expect-error
      const hasPerm = (await dirHandle.queryPermission?.({ mode: "readwrite" })) === "granted"
        // @ts-expect-error
        || (await dirHandle.requestPermission?.({ mode: "readwrite" })) === "granted";
      if (!hasPerm) return false;
      // @ts-expect-error
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      // @ts-expect-error
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch {
      return false;
    }
  };

  // Download from preview overlay (picker/folder if possible, else anchor/dataUrl)
  const handleDownloadFromPreview = async () => {
    try {
      if (!imageBlob && !previewUrl) return;
      const blob = imageBlob || (await (await fetch(previewUrl as string)).blob());
      // Prefer picker, then chosen folder, then anchor/dataUrl via saveBlobToGallery fallbacks
      if (await saveWithPicker(blob, FILENAME)) {
        setPreviewUrl(null);
        return;
      }
      if (await saveToChosenFolder(blob, FILENAME)) {
        setPreviewUrl(null);
        return;
      }
      await saveBlobToGallery(blob, FILENAME, previewUrl || undefined);
      setPreviewUrl(null);
    } catch {
      // ignore; overlay remains
    }
  };

  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getIndianTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: currentRates } = useQuery({
    queryKey: ["/api/rates/current"],
    queryFn: ratesApi.getCurrent,
    refetchInterval: 30000,
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings/display"],
    queryFn: settingsApi.getDisplay,
    refetchInterval: 30000,
  });

  const theme = useMemo(() => {
    return {
      background: settings?.background_color || "#FFF8E1",
      text: settings?.text_color || "#212529",
    };
  }, [settings]);

  const FILENAME = `dj_daily_rate-${format(getIndianTime(), "yyyyMMdd")}.png`;

  // Generate PNG from the on-screen node to preserve computed layout
  const generateImage = async (): Promise<{ blob: Blob; url: string; dataUrl: string } | null> => {
    if (!captureRef.current) return null;

    const node = captureRef.current;

    const { toPng } = await import("html-to-image");

    // Use actual rendered size to avoid blank outputs on some Android browsers
    const rect = node.getBoundingClientRect();
    const width = Math.max(1, Math.ceil(rect.width));
    const height = Math.max(1, Math.ceil(rect.height));

    const options: any = {
      cacheBust: true,
      pixelRatio: 2,
      skipFonts: true,
      fontEmbedCSS: "",
      backgroundColor: theme.background,
      width,
      height,
      style: {
        transform: "none",
      },
      // Exclude footer (buttons), AI control panel, and preview overlay from the captured image
      filter: (n: HTMLElement) =>
        !n.closest?.("#action-footer") &&
        !n.closest?.("#preview-overlay") &&
        !n.closest?.("#ai-control-panel"),
    };
    // Explicitly specify canvas dimensions for some WebViews
    options.canvasWidth = width * 2;
    options.canvasHeight = height * 2;

    const dataUrl = await toPng(node, options);

    // Convert data URL to Blob for saving/sharing
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setImageBlob(blob);
    setPreviewUrl(dataUrl);
    return { blob, url, dataUrl };
  };

  // Save/share image across Android/iOS browsers and in-app WebViews
  const saveBlobToGallery = async (blob: Blob, filename: string, dataUrl?: string) => {
    try {
      const file = new File([blob], filename, { type: "image/png" });

      // 1) Prefer native share with files where supported
      // @ts-expect-error
      if (navigator?.canShare && navigator.canShare({ files: [file] })) {
        // @ts-expect-error
        await navigator.share({ files: [file], title: "Today's Sale Rates" });
        return;
      }

      // 2) iOS Safari: download attribute is ignored; navigate to data URL so user can save
      if (isIOS && dataUrl) {
        try {
          window.location.href = dataUrl;
          return;
        } catch {}
      }

      // 3) Anchor download for full browsers (mostly Android)
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      if ("download" in a && !isIOS) {
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        return;
      }

      // 4) New tab with image (long-press to save)
      const newTab = window.open();
      if (newTab) {
        newTab.document.title = filename;
        const img = newTab.document.createElement("img");
        img.src = dataUrl || blobUrl;
        img.style.width = "100%";
        img.style.height = "auto";
        img.style.display = "block";
        newTab.document.body.style.margin = "0";
        newTab.document.body.appendChild(img);
        return;
      }

      // 5) Last resort: force navigation to data URL derived from blob
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          window.location.href = reader.result as string;
        } catch {
          // show inline preview overlay
          setPreviewUrl((reader.result as string) || dataUrl || blobUrl);
        }
      };
      reader.readAsDataURL(blob);

      // Also show inline preview overlay as a UX fallback
      setPreviewUrl(dataUrl || blobUrl);
    } catch (err) {
      console.error("Save image failed", err);
      // Inline preview overlay so users can long-press save in restrictive envs
      try {
        const blobUrl = URL.createObjectURL(blob);
        setPreviewUrl(dataUrl || blobUrl);
      } catch {
        // ignore
      }
    }
  };

  const handleSaveImage = async () => {
    try {
      setIsWorking("saving");
      const generated = await generateImage();
      if (!generated) throw new Error("Failed to render image");
      await saveBlobToGallery(generated.blob, FILENAME, generated.dataUrl);
    } catch (e) {
      console.error("Failed to save image", e);
      // No alert; a preview overlay will appear in restrictive WebViews to allow long-press save
    } finally {
      setIsWorking("idle");
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      setIsWorking("sharing");
      const generated = await generateImage();
      if (!generated) throw new Error("Failed to render image for sharing");
      const { blob, dataUrl } = generated;

      const file = new File([blob], FILENAME, { type: "image/png" });
      // 1) Try full Web Share with files (Android Chrome/Edge/Samsung, modern iOS)
      // @ts-expect-error
      if (navigator?.canShare && navigator.canShare({ files: [file] })) {
        // @ts-expect-error
        await navigator.share({ files: [file], title: "Today's Sale Rates" });
        return;
      }

      // 2) Try basic Web Share with text/url (older Safari/Android)
      // @ts-expect-error
      if (navigator?.share) {
        // Some browsers cannot share files but can share text/url
        // We include a short caption and instruct to save from preview if needed
        await navigator.share({
          title: "Today's Sale Rates",
          text: "Today's sale rates from Devi Jewellers. If the image didn't attach, long-press the preview to save first.",
        });
        // Also show preview to allow user to save image if file-sharing wasn't supported
        setPreviewUrl(dataUrl);
        return;
      }

      // 3) WhatsApp web deep-link fallback (cannot attach image programmatically)
      const message = "Today's sale rates from Devi Jewellers. Please see the attached image.";
      const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");

      // Show preview so user can long-press/save and attach in WhatsApp
      setPreviewUrl(dataUrl);
    } catch (e) {
      console.error("Share failed", e);
      // Show preview so user can save manually
      try {
        setPreviewUrl((await generateImage())?.dataUrl || null);
      } catch {
        // ignore
      }
    } finally {
      setIsWorking("idle");
    }
  };

  if (!currentRates) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gold-50">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-jewelry-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-700">Loading current rates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-between overflow-y-auto">
      {/* Top AI Control Panel */}
      <div id="ai-control-panel" className="w-full max-w-2xl bg-gray-800/95 border-b border-gold-500/30 p-2 sm:p-3 shadow-lg shrink-0 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-amber-400 to-gold-500 text-black text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <i className="fas fa-wand-magic-sparkles"></i> Gemini AI
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-gold-200">AI Status Background</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAspectRatioMode(prev => prev === "whatsapp_status" ? "full_screen" : "whatsapp_status")}
              className="text-[11px] h-7 px-2 border-gold-500/40 bg-gray-700/60 hover:bg-gray-700 text-gold-200"
              title="Toggle WhatsApp Status Aspect Ratio Fit"
            >
              <i className={`fas ${aspectRatioMode === "whatsapp_status" ? "fa-mobile-screen" : "fa-expand"} mr-1 text-gold-400`}></i>
              {aspectRatioMode === "whatsapp_status" ? "9:16 WhatsApp Fit" : "Full Screen"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAiControls(!showAiControls)}
              className="text-xs h-7 px-2 text-gray-400 hover:text-white"
            >
              <i className={`fas ${showAiControls ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
            </Button>
          </div>
        </div>

        {showAiControls && (
          <div className="space-y-2 text-xs">
            {/* Theme selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setAiPromptType("plain_gold")}
                className={`px-2 py-1.5 rounded-lg border text-left transition-all flex items-center gap-1.5 ${
                  aiPromptType === "plain_gold"
                    ? "bg-amber-500/20 border-gold-400 text-amber-200 font-bold"
                    : "bg-gray-700/40 border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <span>🌟</span>
                <span className="truncate">Plain Gold</span>
              </button>

              <button
                type="button"
                onClick={() => setAiPromptType("marathi_lady")}
                className={`px-2 py-1.5 rounded-lg border text-left transition-all flex items-center gap-1.5 ${
                  aiPromptType === "marathi_lady"
                    ? "bg-amber-500/20 border-gold-400 text-amber-200 font-bold"
                    : "bg-gray-700/40 border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <span>💃</span>
                <span className="truncate">Marathi Lady</span>
              </button>

              <button
                type="button"
                onClick={() => setAiPromptType("royal_gold")}
                className={`px-2 py-1.5 rounded-lg border text-left transition-all flex items-center gap-1.5 ${
                  aiPromptType === "royal_gold"
                    ? "bg-amber-500/20 border-gold-400 text-amber-200 font-bold"
                    : "bg-gray-700/40 border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <span>🏛️</span>
                <span className="truncate">Royal Palace</span>
              </button>

              <button
                type="button"
                onClick={() => setAiPromptType("custom")}
                className={`px-2 py-1.5 rounded-lg border text-left transition-all flex items-center gap-1.5 ${
                  aiPromptType === "custom"
                    ? "bg-amber-500/20 border-gold-400 text-amber-200 font-bold"
                    : "bg-gray-700/40 border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <span>🎨</span>
                <span className="truncate">Custom Prompt</span>
              </button>
            </div>

            {/* Custom prompt text area */}
            {aiPromptType === "custom" && (
              <div>
                <input
                  type="text"
                  placeholder="e.g., Maharashtrian bride with gold thushi & nath..."
                  value={customPromptText}
                  onChange={(e) => setCustomPromptText(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                onClick={handleGenerateAiBg}
                disabled={isGeneratingAiBg}
                className="flex-1 bg-gradient-to-r from-amber-500 via-gold-500 to-amber-600 hover:from-amber-600 hover:to-gold-600 text-black font-bold h-8 text-xs rounded-lg shadow-md"
              >
                {isGeneratingAiBg ? (
                  <span className="flex items-center gap-1.5">
                    <i className="fas fa-circle-notch animate-spin"></i> Generating AI Image...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <i className="fas fa-sparkles"></i> Generate New AI Background
                  </span>
                )}
              </Button>

              {aiBgUrl && (
                <Button
                  onClick={() => setAiBgUrl(null)}
                  variant="outline"
                  className="h-8 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10 px-3"
                  title="Remove AI Background"
                >
                  <i className="fas fa-rotate-left mr-1"></i> Reset
                </Button>
              )}
            </div>

            {aiError && (
              <div className="bg-red-900/40 border border-red-500/50 text-red-200 p-2 rounded-md text-[11px] flex items-center justify-between">
                <span><i className="fas fa-exclamation-circle mr-1"></i> {aiError}</span>
                <button onClick={() => setAiError(null)} className="text-red-300 hover:text-white ml-2">×</button>
              </div>
            )}

            {aiNotice && (
              <div className="bg-amber-900/30 border border-amber-500/40 text-amber-200 p-2 rounded-md text-[11px] flex items-center justify-between">
                <span><i className="fas fa-info-circle mr-1 text-gold-400"></i> {aiNotice}</span>
                <button onClick={() => setAiNotice(null)} className="text-amber-300 hover:text-white ml-2">×</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Poster Container (Captured for Image/WhatsApp) */}
      <div className="flex-1 w-full flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-hidden">
        <div
          ref={captureRef}
          className={`relative flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ${
            aspectRatioMode === "whatsapp_status"
              ? "w-full max-w-[420px] aspect-[9/16] rounded-2xl border-2 border-gold-400/80 my-auto"
              : "w-full h-full rounded-2xl border border-gold-400/30"
          }`}
          style={{
            backgroundColor: aiBgUrl ? "#0f172a" : theme.background,
            color: aiBgUrl ? "#ffffff" : theme.text,
          }}
        >
          {/* AI Background Image */}
          {aiBgUrl && (
            <>
              <img
                src={aiBgUrl}
                alt="AI Jewellery Background"
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              {/* Soft dark gradient vignette to make rates stand out crystal clear */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70 z-0 pointer-events-none" />
            </>
          )}

          {/* Header */}
          <div className="relative z-10 shrink-0 bg-gradient-to-r from-gold-600 via-amber-500 to-gold-700 text-black px-3 py-2 flex justify-center items-center shadow-md">
            <img
              src="/logo.png"
              alt="Devi Jewellers Logo"
              className="h-14 md:h-18 w-[200px] md:w-[280px] object-contain drop-shadow"
            />
          </div>

          {/* Capture Area */}
          <div className="relative z-10 flex-1 flex flex-col w-full min-h-0 overflow-hidden">
            {/* Top bar */}
            <div className="shrink-0 bg-gradient-to-r from-jewelry-primary/95 to-jewelry-secondary/95 text-white py-1.5 px-3 flex items-center justify-center shadow-md border-b border-gold-400/40 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-xs md:text-sm font-semibold text-gold-200">
                  {format(currentTime, "EEEE dd-MMM-yyyy")}
                </div>
                <div className="text-base md:text-xl font-extrabold text-white tracking-wider">
                  {format(currentTime, "HH:mm")}
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="shrink-0 bg-gradient-to-r from-gold-600 via-amber-500 to-gold-700 text-white text-center py-1 md:py-1.5 shadow">
              <h2 className="font-display font-black text-sm sm:text-base md:text-2xl drop-shadow text-amber-950 tracking-wider">
                TODAY'S SALE RATES
              </h2>
            </div>

            {/* Rate Cards */}
            <div className="flex-1 min-h-0 flex flex-col gap-2 p-2 sm:p-2.5 overflow-hidden">
              <RateCard title="24K GOLD (Per 10 gms)" value={currentRates.gold_24k_sale} hasBg={!!aiBgUrl} />
              <RateCard title="22K GOLD (Per 10 gms)" value={currentRates.gold_22k_sale} hasBg={!!aiBgUrl} />
              <RateCard title="18K GOLD (Per 10 gms)" value={currentRates.gold_18k_sale} hasBg={!!aiBgUrl} />
              <RateCard title="SILVER (Per KG)" value={currentRates.silver_per_kg_sale} hasBg={!!aiBgUrl} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div
        id="action-footer"
        className="shrink-0 w-full border-t border-gray-800 bg-gray-900/95 shadow-inner z-30"
      >
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
          <Button
            onClick={handleSaveImage}
            className="bg-gradient-to-r from-amber-500 to-gold-600 hover:from-amber-600 hover:to-gold-700 text-black px-5 py-2.5 text-sm sm:text-base font-bold rounded-lg shadow-md border border-gold-300/40"
            disabled={isWorking !== "idle"}
          >
            <i className="fas fa-download mr-2"></i>
            {isWorking === "saving" ? "Saving..." : "Save Image"}
          </Button>
          <Button
            onClick={handleShareWhatsApp}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 text-sm sm:text-base font-bold rounded-lg shadow-md border border-green-400/30"
            disabled={isWorking !== "idle"}
          >
            <i className="fab fa-whatsapp mr-2 text-lg"></i>
            {isWorking === "sharing" ? "Opening Share..." : "Share on WhatsApp"}
          </Button>
        </div>
      </div>

      {/* Preview Overlay */}
      {previewUrl && (
        <div
          id="preview-overlay"
          className="fixed inset-0 z-50 bg-black/90 p-0 flex items-center justify-center"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-full max-w-full w-auto h-auto object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} /* allow long-press without closing */
            />
            <div className="absolute top-4 right-4 z-50">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setPreviewUrl(null)}
                className="rounded-full w-9 h-9 p-0 flex items-center justify-center"
              >
                <i className="fas fa-times text-lg"></i>
              </Button>
            </div>
            <div className="absolute bottom-6 inset-x-0 flex items-center justify-center pointer-events-none px-4">
              <div
                className="pointer-events-auto bg-gray-900/90 border border-gold-500/50 rounded-xl px-5 py-3 text-gold-100 shadow-xl text-center backdrop-blur-md"
                onClick={() => setPreviewUrl(null)}
              >
                <div className="text-sm font-bold flex items-center justify-center gap-2">
                  <i className="fas fa-hand-pointer text-amber-400"></i> Long press the image to Save/Download
                </div>
                <div className="text-[11px] mt-1 text-gray-400">Tap anywhere to close</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Rate Card Component
function RateCard({ title, value, hasBg }: { title: string; value: number | string; hasBg?: boolean }) {
  const text = `₹${value ?? 0}`;
  const charLen = text.length;
  const viewBoxWidth = Math.max(100, charLen * 18);

  return (
    <div
      className={`flex-1 min-h-0 w-full border-2 border-gold-400 flex flex-col shadow-lg rounded-2xl overflow-hidden transition-all ${
        hasBg
          ? "bg-white/90 backdrop-blur-md shadow-amber-950/30"
          : "bg-white shadow-md"
      }`}
    >
      <div className="flex items-center justify-between w-full px-3 py-1 sm:py-1.5 shrink-0 bg-gradient-to-r from-amber-100/90 via-gold-50/80 to-amber-100/90 border-b border-gold-300">
        <h4 className="text-xs sm:text-sm md:text-lg font-black text-gray-950 uppercase tracking-wide">{title}</h4>
        <div className="w-6 h-6 md:w-8 md:h-8 bg-jewelry-primary rounded-full gold-shimmer flex items-center justify-center shadow-sm">
          <i className="fas fa-rupee-sign text-white text-xs sm:text-sm"></i>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden p-1">
        <svg
          className="w-full h-full max-h-12 sm:max-h-16 md:max-h-20"
          viewBox={`0 0 ${viewBoxWidth} 40`}
          preserveAspectRatio="xMidYMid meet"
        >
          <text
            x="50%"
            y="50%"
            dominantBaseline="central"
            textAnchor="middle"
            fill="#1e3a8a"
            stroke="#1e3a8a"
            strokeWidth="0.8"
            strokeLinejoin="round"
            className="font-black"
            fontFamily="'League Spartan', 'Gill Sans Ultra Bold', 'Arial Black', sans-serif"
            fontWeight="900"
            fontSize="28"
          >
            {text}
          </text>
        </svg>
      </div>
    </div>
  );
}
import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ratesApi, settingsApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { RateSettings } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const rateSettingsSchema = z.object({
  external_rates_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  perc_24k_purchase: z.number().min(0).max(1),
  perc_24k_exchange: z.number().min(0).max(1),
  perc_22k_sale: z.number().min(0).max(1),
  perc_22k_purchase: z.number().min(0).max(1),
  perc_22k_exchange: z.number().min(0).max(1),
  perc_18k_sale: z.number().min(0).max(1),
  perc_18k_purchase: z.number().min(0).max(1),
  perc_18k_exchange: z.number().min(0).max(1),
  silver_purchase_offset: z.number(), // can be negative, e.g. -5000
  silver_exchange_offset: z.number(), // can be negative, e.g. -3000
  check_interval_minutes: z.number().min(1).max(120).default(5),
});

export default function RateSync() {
  const { toast } = useToast();

  const { data: currentRates } = useQuery({
    queryKey: ["/api/rates/current"],
    queryFn: ratesApi.getCurrent,
    refetchInterval: 30000,
  });

  const { data: rateSettings } = useQuery<RateSettings | null>({
    queryKey: ["/api/settings/rates"],
    queryFn: settingsApi.getRate,
  });

  const form = useForm<z.infer<typeof rateSettingsSchema>>({
    resolver: zodResolver(rateSettingsSchema),
    defaultValues: {
      external_rates_url: "https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php",
      perc_24k_purchase: 0.985,
      perc_24k_exchange: 0.990,
      perc_22k_sale: 0.920,
      perc_22k_purchase: 0.900,
      perc_22k_exchange: 0.910,
      perc_18k_sale: 0.860,
      perc_18k_purchase: 0.800,
      perc_18k_exchange: 0.850,
      silver_purchase_offset: -5000,
      silver_exchange_offset: -3000,
      check_interval_minutes: 1,
    },
  });

  React.useEffect(() => {
    if (rateSettings) {
      form.reset({
        external_rates_url: rateSettings.external_rates_url ?? "https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php",
        perc_24k_purchase: rateSettings.perc_24k_purchase ?? 0.985,
        perc_24k_exchange: rateSettings.perc_24k_exchange ?? 0.990,
        perc_22k_sale: rateSettings.perc_22k_sale ?? 0.920,
        perc_22k_purchase: rateSettings.perc_22k_purchase ?? 0.900,
        perc_22k_exchange: rateSettings.perc_22k_exchange ?? 0.910,
        perc_18k_sale: rateSettings.perc_18k_sale ?? 0.860,
        perc_18k_purchase: rateSettings.perc_18k_purchase ?? 0.800,
        perc_18k_exchange: rateSettings.perc_18k_exchange ?? 0.850,
        silver_purchase_offset: rateSettings.silver_purchase_offset ?? -5000,
        silver_exchange_offset: rateSettings.silver_exchange_offset ?? -3000,
        check_interval_minutes: rateSettings.check_interval_minutes ?? 1,
      });
    }
  }, [rateSettings, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: z.infer<typeof rateSettingsSchema>) => {
      if (rateSettings?.id) {
        return await settingsApi.updateRate(rateSettings.id, data);
      } else {
        return await settingsApi.createRate(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/rates"] });
      toast({ title: "Saved", description: "Rate settings updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      return await ratesApi.sync({ force: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rates/current"] });
      toast({ title: "Synced", description: "Rates fetched and stored" });
    },
    onError: (error: Error) => {
      toast({ title: "Sync failed", description: error.message, variant: "destructive" });
    }
  });

  const autoSyncMutation = useMutation({
    mutationFn: async () => {
      return await ratesApi.sync({ force: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rates/current"] });
    },
  });

  // Auto sync while this page is open (respects interval)
  React.useEffect(() => {
    const minutes = rateSettings?.check_interval_minutes ?? 5;
    const delayMs = Math.max(1, minutes) * 60_000;

    const tick = () => {
      if (!autoSyncMutation.isPending) {
        autoSyncMutation.mutate();
      }
    };

    // Run once immediately when settings are known, then on interval.
    if (rateSettings) {
      tick();
    }

    const interval = setInterval(tick, delayMs);

    return () => clearInterval(interval);
  }, [rateSettings?.check_interval_minutes, rateSettings?.id]);

  const { data: syncLogData, refetch: refetchSyncLogs } = useQuery({
    queryKey: ["/api/rates/sync-logs"],
    queryFn: async () => {
      const res = await fetch("/api/rates/sync-logs");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const onSubmit = (data: z.infer<typeof rateSettingsSchema>) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Rate Sync</h2>
          <p className="text-gray-600">Fetch 24K sale and Silver sale, compute rest via percentages</p>
        </div>

        <Card>
          <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            <CardTitle className="flex items-center">
              <i className="fas fa-percentage mr-2"></i>Calculation Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="external_rates_url"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel className="font-semibold text-gray-800">External Rate API URL</FormLabel>
                      <FormControl>
                        <Input 
                          type="url" 
                          placeholder="https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php" 
                          value={field.value ?? ""} 
                          onChange={field.onChange}
                          className="font-mono text-sm bg-gray-50 border-gray-300"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">API endpoint providing live gold & silver rates in JSON format.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="perc_24k_purchase"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>24K Purchase (% of 24K Sale)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.001" min="0" max="1" value={field.value ?? 0.985} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="perc_24k_exchange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>24K Exchange (% of 24K Sale)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.001" min="0" max="1" value={field.value ?? 0.990} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="perc_22k_sale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>22K Sale (% of 24K Sale)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.001" min="0" max="1" value={field.value ?? 0.920} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="perc_22k_purchase"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>22K Purchase (% of 24K Sale)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            max="1"
                            value={field.value ?? 0.900}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="perc_22k_exchange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>22K Exchange (% of 24K Sale)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            max="1"
                            value={field.value ?? 0.910}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="perc_18k_sale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>18K Sale (% of 24K Sale)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            max="1"
                            value={field.value ?? 0.860}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="perc_18k_purchase"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>18K Purchase (% of 24K Sale)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.001" min="0" max="1" value={field.value ?? 0.800} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="perc_18k_exchange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>18K Exchange (% of 24K Sale)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.001" min="0" max="1" value={field.value ?? 0.850} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="silver_purchase_offset"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Silver Purchase Offset (added to Silver Sale)</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" value={field.value ?? -5000} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <p className="text-xs text-gray-600">Example: -5000 means Silver purchase = Silver sale - 5000</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="silver_exchange_offset"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Silver Exchange Offset (added to Silver Sale)</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" value={field.value ?? -3000} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <p className="text-xs text-gray-600">Example: -3000 means Silver exchange = Silver sale - 3000</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="check_interval_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auto Sync Interval (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="120" value={field.value ?? 5} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <p className="text-xs text-gray-600">Server will check and store new rates every N minutes.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-jewelry-primary text-white" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                  <Button type="button" variant="outline" className="text-orange-700 border-orange-300" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
                    <i className="fas fa-sync mr-2"></i>
                    {syncMutation.isPending ? "Syncing..." : "Fetch & Store"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {currentRates && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Current Stored Rates</CardTitle>
              <span className="text-xs text-gray-500 font-mono">
                Source: {currentRates.source ?? 'api'} | ID: #{currentRates.id}
              </span>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div>24K Sale: <span className="font-semibold">{currentRates.gold_24k_sale}</span></div>
              <div>24K Exchange: <span className="font-semibold">{currentRates.gold_24k_exchange ?? 0}</span></div>
              <div>24K Purchase: <span className="font-semibold">{currentRates.gold_24k_purchase}</span></div>
              <div>22K Sale: <span className="font-semibold">{currentRates.gold_22k_sale}</span></div>
              <div>22K Exchange: <span className="font-semibold">{currentRates.gold_22k_exchange}</span></div>
              <div>22K Purchase: <span className="font-semibold">{currentRates.gold_22k_purchase}</span></div>
              <div>18K Sale: <span className="font-semibold">{currentRates.gold_18k_sale}</span></div>
              <div>18K Exchange: <span className="font-semibold">{currentRates.gold_18k_exchange}</span></div>
              <div>18K Purchase: <span className="font-semibold">{currentRates.gold_18k_purchase}</span></div>
              <div>Silver Sale: <span className="font-semibold">{currentRates.silver_per_kg_sale}</span></div>
              <div>Silver Exchange: <span className="font-semibold">{currentRates.silver_per_kg_exchange}</span></div>
              <div>Silver Purchase: <span className="font-semibold">{currentRates.silver_per_kg_purchase}</span></div>
            </CardContent>
          </Card>
        )}

        {/* Live Auto Sync Logs & Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <i className="fas fa-clock text-amber-600"></i>
                Automated 5-Minute Sync Logs
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Background runner checks external URL every {syncLogData?.status?.intervalMinutes ?? 5} minutes and updates database only when rates change.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetchSyncLogs()}>
              <i className="fas fa-sync-alt mr-1"></i> Refresh Logs
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {syncLogData?.status && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-amber-50/60 p-3 rounded-lg text-xs border border-amber-200/60">
                <div>
                  <span className="text-gray-500 block">Sync Interval:</span>
                  <span className="font-medium text-amber-900">{syncLogData.status.intervalMinutes} Minutes</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Next Sync Check:</span>
                  <span className="font-medium text-amber-900">
                    {syncLogData.status.nextSyncInSeconds > 0
                      ? `${syncLogData.status.nextSyncInSeconds}s remaining`
                      : "Due now"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Last Attempt:</span>
                  <span className="font-medium text-amber-900">
                    {syncLogData.status.lastSyncAttemptTime
                      ? new Date(syncLogData.status.lastSyncAttemptTime).toLocaleTimeString()
                      : "Not attempted yet"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Total Logs:</span>
                  <span className="font-medium text-amber-900">{syncLogData.status.totalLogsRecorded} entries</span>
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2 bg-slate-900 text-slate-100 text-xs font-mono">
              {syncLogData?.logs && syncLogData.logs.length > 0 ? (
                syncLogData.logs.map((log: any, idx: number) => {
                  const time = new Date(log.timestamp).toLocaleTimeString();
                  let badgeColor = "text-blue-400";
                  if (log.type === "success") badgeColor = "text-emerald-400 font-bold";
                  if (log.type === "skip") badgeColor = "text-slate-400";
                  if (log.type === "error") badgeColor = "text-rose-400 font-bold";

                  return (
                    <div key={idx} className="border-b border-slate-800 pb-1.5 pt-1 last:border-0 flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[10px]">{time}</span>
                        <span className={`uppercase text-[10px] px-1 py-0.5 rounded bg-slate-800 ${badgeColor}`}>
                          [{log.type}]
                        </span>
                        <span className="text-slate-200">{log.message}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-slate-500 italic text-center py-4">No sync logs recorded yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

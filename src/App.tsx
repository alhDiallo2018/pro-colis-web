import { PageLoadBoundary } from "@/components/PageLoadBoundary";
import { Suspense, useEffect } from "react";
import { OfflineHistoryRecorder } from "@/features/pwa/OfflineHistoryRecorder";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import { router } from "@/routes";
import { SessionBootstrap } from "@/features/auth/SessionBootstrap";
import { PwaProvider } from "@/features/pwa/PwaProvider";
import {
  primeBrandingCache,
  primeNotificationsCache,
  useBranding,
  useNotificationsConfig,
  useSyncLimitsCache,
  useSyncTimingsCache,
} from "@/lib/usePublicConfig";
import { applyBranding } from "@/lib/applyBranding";

/** Monté une fois : écoute `/public/config` et pousse `timings` vers le
 *  cache synchrone (`getTimings()`), consommé par les helpers hors-React
 *  (axios client, Google Identity, PWA sync…). Ne rend rien. */
function TimingsBootstrap() {
  useSyncTimingsCache();
  return null;
}

/** Monté une fois : écoute `/public/config` et pousse `limits` vers le
 *  cache synchrone (`getLimits()`), consommé par les helpers hors-React
 *  (parseurs CSV, compression photo). Ne rend rien. */
function LimitsBootstrap() {
  useSyncLimitsCache();
  return null;
}

/** Phase 6 — monté une fois : applique le branding reçu de `/public/config`
 *  (CSS variables, meta theme-color, favicon) et amorce le cache synchrone.
 *  Null-safe : tant que la config n'est pas chargée, `DEFAULT_BRANDING` est
 *  appliqué, ce qui évite un flash of unstyled content. La propagation vers
 *  le Service Worker passe par `BrandingBridge` (dans `PwaProvider`). */
function BrandingBootstrap() {
  const branding = useBranding();
  const notifications = useNotificationsConfig();
  useEffect(() => {
    applyBranding(branding);
    primeBrandingCache(branding);
  }, [branding]);
  useEffect(() => {
    primeNotificationsCache(notifications);
  }, [notifications]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PwaProvider>
        <SessionBootstrap />
        <TimingsBootstrap />
        <LimitsBootstrap />
        <BrandingBootstrap />
        <OfflineHistoryRecorder />
        <PageLoadBoundary>
          <Suspense
            fallback={
              <main role="status" style={{ padding: 24 }}>
                Chargement de votre espace…
              </main>
            }
          >
            <RouterProvider router={router} />
          </Suspense>
        </PageLoadBoundary>
      </PwaProvider>
    </QueryClientProvider>
  );
}

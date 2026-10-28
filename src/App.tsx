import { PageLoadBoundary } from "@/components/PageLoadBoundary";
import { Suspense } from "react";
import { OfflineHistoryRecorder } from "@/features/pwa/OfflineHistoryRecorder";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import { router } from "@/routes";
import { SessionBootstrap } from "@/features/auth/SessionBootstrap";
import { PwaProvider } from "@/features/pwa/PwaProvider";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PwaProvider>
        <SessionBootstrap />
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

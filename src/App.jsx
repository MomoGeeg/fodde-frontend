import AppRoutes from "@/routes/index";
import useAuthStore from "@/stores/auth.store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { Agentation } from "agentation";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5 * 60 * 1000 } },
});

export default function App() {
  const init = useAuthStore((s) => s.init);
  const loading = useAuthStore((s) => s.loading);

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
      <Toaster position="top-right" richColors />
      {import.meta.env.DEV && <Agentation />}
    </QueryClientProvider>
  );
}

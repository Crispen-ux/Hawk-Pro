import { CatalogueProvider } from "@/hooks/use-catalogue.tsx";
import { SiteSettingsProvider } from "@/hooks/use-settings.tsx";
import { CartProvider } from "@/hooks/use-cart.tsx";
import { AuthProvider } from "./auth.tsx";
import { ConvexProvider } from "./convex.tsx";
import { QueryClientProvider } from "./query-client.tsx";
import { ThemeProvider } from "./theme.tsx";
import { Toaster } from "../ui/sonner.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";

// Order matters: the cart resolves product ids against the catalogue, so the
// catalogue has to be mounted above it.
export function DefaultProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ConvexProvider>
        <QueryClientProvider>
          <TooltipProvider>
            <ThemeProvider>
              <SiteSettingsProvider>
                <CatalogueProvider>
                  <CartProvider>
                    <Toaster />
                    {children}
                  </CartProvider>
                </CatalogueProvider>
              </SiteSettingsProvider>
            </ThemeProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ConvexProvider>
    </AuthProvider>
  );
}

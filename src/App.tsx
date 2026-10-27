import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import SiteLayout from "./components/layout/site-layout.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import { useServiceWorker } from "./hooks/use-service-worker.ts";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ShopPage from "./pages/shop/page.tsx";
import ProductPage from "./pages/shop/[slug]/page.tsx";
import RentalsPage from "./pages/rentals/page.tsx";
import RepairsPage from "./pages/repairs/page.tsx";
import AboutPage from "./pages/about/page.tsx";
import StudioPage from "./pages/studio/page.tsx";
import ToolsPage from "./pages/tools/page.tsx";
import ResourcesPage from "./pages/resources/page.tsx";
import ArticlePage from "./pages/resources/[slug]/page.tsx";
import LegalPage from "./pages/legal/page.tsx";
import AdminLogin from "./pages/admin/login.tsx";
import AdminLayout from "./pages/admin/layout.tsx";
const AdminDashboard = lazy(() => import("./pages/admin/dashboard/page.tsx"));
import AdminProducts from "./pages/admin/products/page.tsx";
import AdminProductEditor from "./pages/admin/products/[id]/page.tsx";
import AdminEnquiries from "./pages/admin/enquiries/page.tsx";
import AdminSettings from "./pages/admin/settings/page.tsx";
import StoreOnboarding from "./pages/admin/onboarding/page";

const CommercePage = lazy(() => import("./pages/admin/commerce-page"));
import AccountAccess from "./pages/auth/AccountAccess";
import CustomerAccount from "./pages/auth/CustomerAccount";
const CheckoutPage = lazy(() => import("./pages/checkout/page"));
const CheckoutReturn = lazy(() => import("./pages/checkout/return"));
export default function App() {
  useServiceWorker();
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Suspense
          fallback={<div className="p-12 text-center">Loading workspace…</div>}
        >
          <Routes>
            <Route
              path="/account/login"
              element={<AccountAccess key="customer-login" />}
            />
            <Route
              path="/account/signup"
              element={
                <AccountAccess key="customer-signup" initialMode="register" />
              }
            />
            <Route
              path="/account/reset-password"
              element={
                <AccountAccess key="customer-reset" initialMode="reset" />
              }
            />
            <Route
              path="/login"
              element={<Navigate to="/account/login" replace />}
            />
            <Route
              path="/signup"
              element={<Navigate to="/account/signup" replace />}
            />
            <Route
              path="/forgot-password"
              element={<Navigate to="/account/reset-password" replace />}
            />
            <Route
              path="/reset-password"
              element={<Navigate to="/account/reset-password" replace />}
            />
            <Route path="/account" element={<CustomerAccount />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/reset-password"
              element={
                <AccountAccess key="admin-reset" admin initialMode="reset" />
              }
            />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/:id" element={<AdminProductEditor />} />
              <Route path="enquiries" element={<AdminEnquiries />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="onboarding" element={<StoreOnboarding />} />
              <Route path="orders" element={<CommercePage kind="orders" />} />
              <Route
                path="inventory"
                element={<CommercePage kind="inventory" />}
              />
              <Route
                path="customers"
                element={<CommercePage kind="customers" />}
              />
              <Route
                path="campaigns"
                element={<CommercePage kind="campaigns" />}
              />
              <Route path="reports" element={<AdminDashboard reports />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route
                path="/checkout/return/:orderId/:access"
                element={<CheckoutReturn />}
              />
              <Route path="/checkout/return" element={<CheckoutReturn />} />
              <Route path="/shop/:slug" element={<ProductPage />} />
              <Route path="/rentals" element={<RentalsPage />} />
              <Route path="/repairs" element={<RepairsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/resources/:slug" element={<ArticlePage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/studio" element={<StudioPage />} />
              <Route path="/legal/:doc" element={<LegalPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DefaultProviders>
  );
}

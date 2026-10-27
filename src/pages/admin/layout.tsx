import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Users,
  ChartNoAxesCombined,
  Megaphone,
  Settings,
  Mail,
  ExternalLink,
  LogOut,
  Menu,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { request } from "@/lib/api";
import { useSiteSettings } from "@/hooks/use-settings";
import { clearAdminPasscode } from "@/lib/admin-session";
const nav = [
  ["Overview", "/admin", LayoutDashboard],
  ["Products", "/admin/products", Package],
  ["Inventory", "/admin/inventory", Boxes],
  ["Orders", "/admin/orders", ShoppingBag],
  ["Customers", "/admin/customers", Users],
  ["Reports & insights", "/admin/reports", ChartNoAxesCombined],
  ["Marketing", "/admin/campaigns", Megaphone],
  ["Enquiries", "/admin/enquiries", Mail],
  ["Store setup", "/admin/onboarding", ShieldCheck],
  ["Store settings", "/admin/settings", Settings],
] as const;
export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    settings,
    ready: settingsReady,
    error: settingsError,
  } = useSiteSettings();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [verifiedPath, setVerifiedPath] = useState<string | null>(null);
  const [failed, setFailed] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let active = true;
    const verify = () =>
      request<{ user: { name: string; role: string } }>("/api/account")
        .then((r) => {
          if (!active) return;
          if (r.user.role !== "admin") {
            setUser(null);
            navigate("/admin/login", {
              replace: true,
              state: {
                returnTo: location.pathname,
                authError: "An administrator account is required.",
              },
            });
            return;
          }
          setUser(r.user);
          setVerifiedPath(location.pathname);
        })
        .catch((e) => {
          if (active) {
            setUser(null);
            navigate("/admin/login", {
              replace: true,
              state: {
                returnTo: location.pathname,
                authError:
                  e.status === 401
                    ? "Please sign in to access administration."
                    : "We could not verify your session. Please sign in again. If this continues, check the server configuration.",
              },
            });
          }
        });
    void verify();
    const interval = window.setInterval(verify, 60_000);
    window.addEventListener("focus", verify);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", verify);
    };
  }, [navigate, location.pathname]);
  const signOut = async () => {
    try {
      await request("/api/account", {
        method: "POST",
        body: { action: "logout" },
      });
      clearAdminPasscode();
      navigate("/admin/login");
    } catch (e) {
      setFailed(e instanceof Error ? e.message : "Could not sign out");
    }
  };
  if (!user || verifiedPath !== location.pathname)
    return (
      <main
        className="admin-theme min-h-screen bg-muted flex items-center justify-center"
        aria-busy="true"
      >
        <p role="status" className="text-sm text-muted-foreground">
          Checking administrator access…
        </p>
      </main>
    );
  if (
    settingsReady &&
    !settingsError &&
    !settings.onboardingCompleted &&
    !["/admin/onboarding", "/admin/settings"].includes(location.pathname)
  )
    return <Navigate to="/admin/onboarding" replace />;
  return (
    <div className="admin-theme min-h-screen bg-background text-foreground">
      <a href="#admin-main" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 border-r bg-card flex flex-col overflow-y-auto transition-transform ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <Link
          to="/admin"
          className="h-24 border-b border-primary/40 shrink-0 flex items-center justify-center px-7 py-3"
        >
          <img
            src="/brand/hawk-white.png"
            alt="Hawk Pro Audio administration"
            width={2000}
            height={1250}
            className="h-16 w-auto object-contain invert dark:invert-0"
          />
        </Link>
        <div className="px-6 pt-7 pb-3 text-[10px] font-semibold tracking-[.18em] text-muted-foreground">
          WORKSPACE
        </div>
        <nav aria-label="Administration" className="px-3 flex-1 space-y-1">
          {nav.map(([label, to, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${isActive ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="m-4 rounded-xl bg-muted p-4">
          <ShieldCheck className="text-primary mb-2" size={22} />
          <p className="text-xs font-semibold">Engineered for sound.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Built for performance.
          </p>
        </div>
        <Button
          onClick={signOut}
          variant="ghost"
          className="justify-start mx-4 mb-4"
        >
          <LogOut />
          Sign out
        </Button>
      </aside>
      <div className="lg:ml-60">
        <header className="h-20 px-5 lg:px-9 bg-card border-b flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu />
            </Button>
            <span className="text-sm text-muted-foreground">Workspace</span>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="text-sm font-medium">Administration</span>
          </div>
          <div className="flex gap-5 items-center">
            <Link
              to="/"
              className="text-xs text-muted-foreground flex gap-2 items-center"
            >
              <ExternalLink size={14} />
              View storefront
            </Link>
            <div className="border-l pl-5 flex items-center gap-3">
              <div className="size-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
                {user?.name.charAt(0) || "H"}
              </div>
              <div className="hidden sm:block text-xs">
                <p className="font-semibold">{user?.name ?? "Hawk admin"}</p>
                <p className="text-muted-foreground mt-1">Administrator</p>
              </div>
            </div>
          </div>
        </header>
        <main id="admin-main">
          {failed ? (
            <div
              className="m-8 p-6 bg-card rounded-xl text-red-600"
              role="alert"
            >
              {failed}
              <Button className="ml-4" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : user ? (
            <Outlet />
          ) : (
            <p className="p-12 text-muted-foreground">
              Verifying your secure session…
            </p>
          )}
        </main>
      </div>
    </div>
  );
}

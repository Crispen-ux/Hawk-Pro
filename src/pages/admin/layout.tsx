import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
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
  ["Settings", "/admin/settings", Settings],
] as const;
export default function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [failed, setFailed] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let active = true;
    request<{ user: { name: string; role: string } }>("/api/account")
      .then((r) => {
        if (!active) return;
        if (r.user.role !== "admin") {
          navigate("/admin/login", { replace: true });
          return;
        }
        setUser(r.user);
      })
      .catch((e) => {
        if (active) {
          if (e.status === 401) navigate("/admin/login", { replace: true });
          else setFailed(e.message);
        }
      });
    return () => {
      active = false;
    };
  }, [navigate]);
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
  return (
    <div className="admin-theme min-h-screen bg-[#f5f7fb] text-slate-800">
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
        className={`fixed inset-y-0 left-0 z-40 w-60 border-r bg-white flex flex-col transition-transform ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <Link
          to="/admin"
          className="h-24 shrink-0 flex items-center justify-center px-7 py-3"
        >
          <img src="/brand/hawk-black.png" alt="Hawk Pro Audio administration" width={2000} height={1250} className="h-16 w-auto object-contain" />
        </Link>
        <div className="px-6 pt-7 pb-3 text-[10px] font-semibold tracking-[.18em] text-slate-400">
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
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${isActive ? "bg-blue-50 text-blue-600 font-semibold" : "text-slate-500 hover:bg-slate-50"}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="m-4 rounded-xl bg-slate-50 p-4">
          <ShieldCheck className="text-blue-600 mb-2" size={22} />
          <p className="text-xs font-semibold">Your business, connected.</p>
          <p className="text-xs text-slate-500 mt-1">
            Small catalogue. Big possibilities.
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
        <header className="h-20 px-5 lg:px-9 bg-white border-b flex items-center justify-between gap-4">
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
            <span className="text-sm text-slate-400">Workspace</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-sm font-medium">Administration</span>
          </div>
          <div className="flex gap-5 items-center">
            <Link
              to="/"
              className="text-xs text-slate-500 flex gap-2 items-center"
            >
              <ExternalLink size={14} />
              View store
            </Link>
            <div className="border-l pl-5 flex items-center gap-3">
              <div className="size-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                {user?.name.charAt(0) || "H"}
              </div>
              <div className="hidden sm:block text-xs">
                <p className="font-semibold">{user?.name ?? "Hawk admin"}</p>
                <p className="text-slate-400 mt-1">Administrator</p>
              </div>
            </div>
          </div>
        </header>
        <main id="admin-main">
          {failed ? (
            <div
              className="m-8 p-6 bg-white rounded-xl text-red-600"
              role="alert"
            >
              {failed}
              <Button className="ml-4" onClick={() => location.reload()}>
                Retry
              </Button>
            </div>
          ) : user ? (
            <Outlet />
          ) : (
            <p className="p-12 text-slate-500">
              Verifying your secure session…
            </p>
          )}
        </main>
      </div>
    </div>
  );
}



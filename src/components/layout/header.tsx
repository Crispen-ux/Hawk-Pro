import { useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { MenuIcon, MoonIcon, SearchIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet.tsx";
import { NAV_LINKS } from "@/data/site.ts";
import { useSiteSettings } from "@/hooks/use-settings.tsx";
import Logo from "./logo.tsx";
import CartSheet from "./cart-sheet.tsx";

function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onOpenChange(false);
    navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Search products</DialogTitle>
          <DialogDescription>
            Find speakers, subwoofers and accessories.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex gap-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. subwoofer"
            aria-label="Search products"
          />
          <Button type="submit">Search</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const { settings } = useSiteSettings();
  const isDark = resolvedTheme === "dark";
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <div className="bg-primary px-4 py-1.5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground">
        {settings.announcement}
      </div>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 lg:px-8">
          <Logo className="h-12" />

          <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                end={l.to === "/shop"}
                className="text-sm font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? (
                <SunIcon className="size-5" />
              ) : (
                <MoonIcon className="size-5" />
              )}
            </Button>
            <Button asChild variant="ghost" size="sm"><Link to="/account">Account</Link></Button>
            <CartSheet />
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open menu"
                >
                  <MenuIcon className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle className="font-serif text-2xl uppercase tracking-wide">
                    Menu
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Site navigation
                  </SheetDescription>
                </SheetHeader>
                <nav aria-label="Mobile" className="flex flex-col px-4">
                  {NAV_LINKS.map((l) => (
                    <SheetClose asChild key={l.label}>
                      <Link
                        to={l.to}
                        className="border-b py-3 font-serif text-xl uppercase tracking-wide hover:text-primary"
                      >
                        {l.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}


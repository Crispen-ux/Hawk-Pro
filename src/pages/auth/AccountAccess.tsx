import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { request } from "@/lib/api";
export default function AccountAccess({
  admin = false,
  initialMode = "login",
}: {
  admin?: boolean;
  initialMode?: "login" | "register" | "reset";
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = initialMode;
  const loginPath = admin ? "/admin/login" : "/account/login";
  const resetPath = admin ? "/admin/reset-password" : "/account/reset-password";
  const [stage, setStage] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState<string>(
    location.state?.authError ??
      (location.state?.passwordReset
        ? "Password updated. Sign in with your new password."
        : ""),
  );
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await request<{ role?: string }>("/api/account", {
        method: "POST",
        body: {
          action: stage
            ? mode === "reset"
              ? "reset"
              : "verify"
            : mode === "reset"
              ? "request"
              : mode,
          email,
          name: name || undefined,
          password: password || undefined,
          code: code || undefined,
          purpose:
            mode === "reset"
              ? "reset"
              : mode === "register"
                ? "verify"
                : "login",
        },
      });
      if (!stage) {
        setStage(true);
        setMessage("Check your inbox for your six-digit code.");
      } else if (mode === "reset") {
        navigate(loginPath, { replace: true, state: { passwordReset: true } });
      } else {
        if (admin && result.role !== "admin") {
          setError("This account does not have administrator access.");
          return;
        }
        const returnTo = location.state?.returnTo;
        navigate(
          admin &&
            typeof returnTo === "string" &&
            returnTo.startsWith("/admin/") &&
            !returnTo.startsWith("/admin/login") &&
            !returnTo.startsWith("/admin/reset-password")
            ? returnTo
            : admin
              ? "/admin"
              : "/account",
          { replace: true },
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-theme min-h-screen grid lg:grid-cols-2 bg-card">
      <section className="hidden lg:flex flex-col justify-between bg-[#171717] text-white p-16">
        <Link to="/" className="flex gap-3 items-center text-3xl font-bold">
          <img
            src="/brand/hawk-white.png"
            alt="Hawk Pro Audio"
            width={2000}
            height={1250}
            className="h-24 w-auto object-contain"
          />
        </Link>
        <div>
          <span className="text-primary text-sm tracking-widest">
            BUILT FOR PERFORMANCE
          </span>
          <h1 className="text-5xl leading-tight font-semibold mt-5">
            Great sound.
            <br />A stronger business.
          </h1>
          <p className="mt-6 max-w-sm text-white/70">
            Your products, customers and orders. The same Hawk experience,
            behind the scenes.
          </p>
        </div>
        <p className="text-white/60 text-sm">
          Hawk Pro Audio · South Africa
        </p>
      </section>
      <main className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-block mb-6">
            <img
              src="/brand/hawk-white.png"
              alt="Hawk Pro Audio"
              width={2000}
              height={1250}
              className="h-16 w-auto object-contain invert dark:invert-0"
            />
          </Link>
          <p className="text-sm text-muted-foreground mb-2">
            {admin ? "HAWK ADMINISTRATION" : "HAWK CUSTOMER ACCOUNT"}
          </p>
          <h1 className="text-3xl font-semibold mb-2">
            {stage
              ? "Check your inbox"
              : mode === "reset"
                ? "Reset your password"
                : mode === "register"
                  ? "Create your account"
                  : "Welcome back"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {stage
              ? "Enter the code we emailed you. It expires in 10 minutes."
              : mode === "reset"
                ? "Enter your email to receive a password reset code."
                : mode === "register"
                  ? "Create your customer account, then verify your email."
                  : "Secure access with your password and a one-time code."}
          </p>
          <form onSubmit={submit} className="space-y-5">
            {!stage && (
              <>
                {mode === "register" && (
                  <label className="block text-sm">
                    Full name
                    <Input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </label>
                )}
                <label className="block text-sm">
                  Email address
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </label>
              </>
            )}
            {((!stage && mode !== "reset") || (stage && mode === "reset")) && (
              <label className="block text-sm">
                {mode === "reset" ? "New password" : "Password"}
                <Input
                  type="password"
                  required
                  minLength={12}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
                <span className="text-xs text-muted-foreground">
                  At least 12 characters
                </span>
              </label>
            )}
            {stage && (
              <label className="block text-sm">
                Verification code
                <Input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="one-time-code"
                  className="text-center text-2xl tracking-[.4em]"
                />
              </label>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="text-sm text-primary">
                {message}
              </p>
            )}
            <Button
              disabled={busy}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {busy
                ? "Please wait…"
                : stage
                  ? mode === "reset"
                    ? "Reset password"
                    : "Verify and continue"
                  : mode === "reset"
                    ? "Send reset code"
                    : mode === "register"
                      ? "Create account"
                      : "Sign in"}
              <ArrowRight />
            </Button>
          </form>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link to={mode === "reset" ? loginPath : resetPath}>
              {mode === "reset" ? "Back to sign in" : "Forgot password?"}
            </Link>
            {!admin && (
              <Link to={mode === "register" ? loginPath : "/account/signup"}>
                {mode === "register"
                  ? "Already have an account?"
                  : "Create an account"}
              </Link>
            )}
            {stage && (
              <button
                onClick={() => {
                  setStage(false);
                  setCode("");
                }}
              >
                Request another code
              </button>
            )}
          </div>
          {admin && (
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              Administrator accounts are created by the store owner.{" "}
              <Link to="/account/signup" className="text-primary underline">
                Create a customer account
              </Link>{" "}
              or contact the owner for staff access.
            </p>
          )}
          <Link
            to={admin ? "/account/login" : "/admin/login"}
            className="mt-6 block text-xs text-muted-foreground underline"
          >
            {admin ? "Customer sign in" : "Staff sign in"}
          </Link>
          <Link
            to="/"
            className="mt-10 inline-block text-sm text-muted-foreground"
          >
            ← Back to store
          </Link>
        </div>
      </main>
    </div>
  );
}

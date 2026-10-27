import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { request } from "@/lib/api";
export default function AccountAccess({ admin = false }: { admin?: boolean }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [stage, setStage] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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
        setStage(false);
        setMode("login");
        setPassword("");
        setMessage("Password updated. Sign in with your new password.");
      } else {
        if (admin && result.role !== "admin") {
          setError("This account does not have administrator access.");
          return;
        }
        navigate(admin ? "/admin" : "/account");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-theme min-h-screen grid lg:grid-cols-2 bg-white">
      <section className="hidden lg:flex flex-col justify-between bg-[#17243b] text-white p-16">
        <Link to="/" className="flex gap-3 items-center text-3xl font-bold">
          <img src="/brand/hawk-white.png" alt="Hawk Pro Audio" width={2000} height={1250} className="h-24 w-auto object-contain" />
        </Link>
        <div>
          <span className="text-orange-300 text-sm tracking-widest">
            BUILT FOR PERFORMANCE
          </span>
          <h1 className="text-5xl leading-tight font-semibold mt-5">
            Great sound.
            <br />A stronger business.
          </h1>
          <p className="mt-6 max-w-sm text-slate-300">
            Your products, customers and orders. Everything connected in one
            place.
          </p>
        </div>
        <p className="text-slate-400 text-sm">Hawk Pro Audio · South Africa</p>
      </section>
      <main className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-block mb-6"><img src="/brand/hawk-red.png" alt="Hawk Pro Audio" width={2000} height={1250} className="h-16 w-auto object-contain" /></Link>
          <p className="text-sm text-slate-500 mb-2">
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
          <p className="text-slate-500 mb-8">
            {stage
              ? "Enter the code we emailed you. It expires in 10 minutes."
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
                <span className="text-xs text-slate-500">
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
              <p role="status" className="text-sm text-blue-600">
                {message}
              </p>
            )}
            <Button
              disabled={busy}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              {busy
                ? "Please wait…"
                : stage
                  ? "Verify and continue"
                  : mode === "reset"
                    ? "Send reset code"
                    : "Continue"}
              <ArrowRight />
            </Button>
          </form>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <button
              onClick={() => {
                setMode(mode === "reset" ? "login" : "reset");
                setStage(false);
                setError("");
                setMessage("");
              }}
            >
              {mode === "reset" ? "Back to sign in" : "Forgot password?"}
            </button>
            {!admin && (
              <button
                onClick={() => {
                  setMode(mode === "register" ? "login" : "register");
                  setStage(false);
                }}
              >
                {mode === "register"
                  ? "Already have an account?"
                  : "Create an account"}
              </button>
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
          <Link to="/" className="mt-10 inline-block text-sm text-slate-500">
            ← Back to store
          </Link>
        </div>
      </main>
    </div>
  );
}


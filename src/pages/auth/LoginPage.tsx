import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { authApi } from "../../api/auth";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Loader2, GraduationCap, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "../../components/ui/alert";

// ─── Geometry data ────────────────────────────────────────────────────────────

const NODES = [
  { x: 115, y: 175 },
  { x: 278, y: 118 },
  { x: 382, y: 248 },
  { x: 198, y: 348 },
  { x: 352, y: 422 },
  { x: 98, y: 478 },
  { x: 275, y: 558 },
  { x: 418, y: 338 },
  { x: 158, y: 622 },
  { x: 338, y: 680 },
];

const CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [2, 7],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [4, 7],
  [5, 8],
  [8, 9],
  [6, 9],
  [3, 5],
  [1, 7],
];

const ACCENT_DOTS = [
  { x: 52, y: 138, c: "#6366f1", d: "0s" },
  { x: 414, y: 158, c: "#0ea5e9", d: "1.1s" },
  { x: 442, y: 448, c: "#a855f7", d: "2.2s" },
  { x: 28, y: 658, c: "#6366f1", d: "0.6s" },
  { x: 402, y: 722, c: "#0ea5e9", d: "1.7s" },
  { x: 200, y: 58, c: "#a855f7", d: "0.3s" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.login(email, password);
      login(response.user, response.token, rememberMe);
      if (response.user.role === "admin") navigate("/admin");
      else if (response.user.role === "principal") navigate("/principal");
      else navigate("/teacher");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* ── Keyframes ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes lp-float-a {
          0%,100% { transform: translate(0,0) rotate(0deg); }
          33%     { transform: translate(-8px,-16px) rotate(3deg); }
          66%     { transform: translate(7px,-6px) rotate(-2deg); }
        }
        @keyframes lp-float-b {
          0%,100% { transform: translate(0,0) rotate(0deg); }
          50%     { transform: translate(12px,18px) rotate(-4deg); }
        }
        @keyframes lp-float-c {
          0%,100% { transform: translate(0,0); }
          50%     { transform: translate(-10px,13px); }
        }
        @keyframes lp-breathe {
          0%,100% { opacity:.25; } 50% { opacity:.8; }
        }
        @keyframes lp-glow {
          0%,100% { opacity:.14; } 50% { opacity:.32; }
        }
        @keyframes lp-spin  { from { transform:rotate(0deg);    } to { transform:rotate(360deg);  } }
        @keyframes lp-cspin { from { transform:rotate(0deg);    } to { transform:rotate(-360deg); } }
        @keyframes lp-draw  { from { stroke-dashoffset:600; }     to { stroke-dashoffset:0; }      }
        @keyframes lp-in    {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        .lp-node   { animation: lp-breathe 3s ease-in-out infinite; }
        .lp-line   { stroke-dasharray:600; animation: lp-draw 2.5s ease-out forwards; }
        .lp-enter  { animation: lp-in .65s cubic-bezier(.22,1,.36,1) both; }
        .lp-btn:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(99,102,241,.45) !important;
          transform: translateY(-1px);
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-eye:hover { color: #6366f1 !important; }
      `}</style>

      {/* ── LEFT PANEL ───────────────────────────────────────────────── */}
      <div
        className="hidden lg:block lg:w-[46%] relative overflow-hidden"
        style={{
          background:
            "linear-gradient(158deg,#060b18 0%,#0c1535 48%,#080e22 100%)",
        }}
      >
        {/* Glow orbs */}
        {[
          {
            t: "18%",
            l: "22%",
            sz: 360,
            c: "99,102,241",
            op: 0.18,
            dur: "5s",
            del: "0s",
          },
          {
            b: "22%",
            r: "8%",
            sz: 260,
            c: "14,165,233",
            op: 0.14,
            dur: "6s",
            del: "1.6s",
          },
          {
            t: "62%",
            l: "4%",
            sz: 200,
            c: "168,85,247",
            op: 0.12,
            dur: "7s",
            del: "3.1s",
          },
        ].map((o, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              ...(o.t ? { top: o.t } : {}),
              ...(o.b ? { bottom: o.b } : {}),
              ...(o.l ? { left: o.l } : {}),
              ...(o.r ? { right: o.r } : {}),
              width: o.sz,
              height: o.sz,
              borderRadius: "50%",
              background: `radial-gradient(circle,rgba(${o.c},${o.op}) 0%,transparent 65%)`,
              animation: `lp-glow ${o.dur} ease-in-out infinite ${o.del}`,
            }}
          />
        ))}

        {/* SVG art */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 460 780"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: "absolute", inset: 0 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="lp-lg1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity=".55" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity=".18" />
            </linearGradient>
            <linearGradient id="lp-lg2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity=".45" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity=".12" />
            </linearGradient>
            <radialGradient id="lp-ng" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity=".9" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
            <filter id="lp-gf">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Dot grid */}
          {Array.from({ length: 13 }).map((_, r) =>
            Array.from({ length: 9 }).map((_, c) => (
              <circle
                key={`dg-${r}-${c}`}
                cx={c * 52 + 26}
                cy={r * 62 + 31}
                r="1.2"
                fill="rgba(255,255,255,0.065)"
              />
            )),
          )}

          {/* Connection lines */}
          {CONNECTIONS.map(([a, b], i) => (
            <line
              key={`cl-${i}`}
              x1={NODES[a].x}
              y1={NODES[a].y}
              x2={NODES[b].x}
              y2={NODES[b].y}
              stroke="url(#lp-lg1)"
              strokeWidth="1"
              strokeOpacity=".55"
              className="lp-line"
              style={{ animationDelay: `${i * 0.13}s` }}
            />
          ))}

          {/* Node glows + dots */}
          {NODES.map((n, i) => (
            <g key={`nd-${i}`}>
              <circle
                cx={n.x}
                cy={n.y}
                r="11"
                fill="url(#lp-ng)"
                opacity=".28"
              />
              <circle
                cx={n.x}
                cy={n.y}
                r="3"
                fill="#6366f1"
                filter="url(#lp-gf)"
                className="lp-node"
                style={{ animationDelay: `${i * 0.28}s` }}
              />
            </g>
          ))}

          {/* Floating hexagon */}
          <g
            style={{
              animation: "lp-float-a 9s ease-in-out infinite",
              transformOrigin: "295px 195px",
            }}
          >
            <polygon
              points="295,144 339,169 339,219 295,244 251,219 251,169"
              fill="none"
              stroke="rgba(99,102,241,.28)"
              strokeWidth="1.5"
            />
            <polygon
              points="295,163 323,178 323,210 295,225 267,210 267,178"
              fill="rgba(99,102,241,.04)"
              stroke="rgba(99,102,241,.13)"
              strokeWidth="1"
            />
          </g>

          {/* Floating dashed ring cluster */}
          <g
            style={{
              animation: "lp-float-b 11s ease-in-out infinite",
              transformOrigin: "108px 400px",
            }}
          >
            <circle
              cx="108"
              cy="400"
              r="50"
              fill="none"
              stroke="rgba(168,85,247,.22)"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            <circle
              cx="108"
              cy="400"
              r="31"
              fill="none"
              stroke="rgba(168,85,247,.11)"
              strokeWidth="1"
            />
            <circle cx="108" cy="400" r="6" fill="rgba(168,85,247,.38)" />
          </g>

          {/* Floating diamond */}
          <g
            style={{
              animation: "lp-float-c 13s ease-in-out infinite",
              transformOrigin: "372px 582px",
            }}
          >
            <polygon
              points="372,541 412,581 372,621 332,581"
              fill="none"
              stroke="rgba(14,165,233,.24)"
              strokeWidth="1.5"
            />
            <polygon
              points="372,558 396,581 372,604 348,581"
              fill="rgba(14,165,233,.05)"
              stroke="rgba(14,165,233,.14)"
              strokeWidth="1"
            />
          </g>

          {/* Slow-spinning rings */}
          <g
            style={{
              animation: "lp-spin 32s linear infinite",
              transformOrigin: "230px 390px",
            }}
          >
            <circle
              cx="230"
              cy="390"
              r="142"
              fill="none"
              stroke="rgba(99,102,241,.055)"
              strokeWidth="1"
              strokeDasharray="3 9"
            />
          </g>
          <g
            style={{
              animation: "lp-cspin 22s linear infinite",
              transformOrigin: "230px 390px",
            }}
          >
            <circle
              cx="230"
              cy="390"
              r="112"
              fill="none"
              stroke="rgba(14,165,233,.045)"
              strokeWidth="1"
              strokeDasharray="4 13"
            />
          </g>

          {/* Accent scatter dots */}
          {ACCENT_DOTS.map((pt, i) => (
            <circle
              key={`ad-${i}`}
              cx={pt.x}
              cy={pt.y}
              r="2.5"
              fill={pt.c}
              opacity=".55"
              className="lp-node"
              style={{ animationDelay: pt.d }}
            />
          ))}
        </svg>

        {/* Bottom wordmark */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 48,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "rgba(99,102,241,.18)",
              border: "1px solid rgba(99,102,241,.28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GraduationCap size={14} color="rgba(99,102,241,.9)" />
          </div>
          <span
            style={{
              color: "rgba(255,255,255,.28)",
              fontSize: 11,
              letterSpacing: "0.2em",
              fontWeight: 500,
            }}
          >
            SCHOOL MANAGER
          </span>
        </div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: "#fff", padding: "48px 40px" }}
      >
        <div className="lp-enter w-full" style={{ maxWidth: 400 }}>
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-10">
            <GraduationCap size={22} className="text-primary" />
            <span
              style={{ fontSize: 15, fontWeight: 600, letterSpacing: "0.02em" }}
            >
              School Manager
            </span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 40 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 3,
                  borderRadius: 2,
                  background: "linear-gradient(90deg,#6366f1,#0ea5e9)",
                }}
              />
              <div
                style={{
                  width: 12,
                  height: 3,
                  borderRadius: 2,
                  background: "linear-gradient(90deg,#0ea5e9,#a855f7)",
                }}
              />
            </div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
                marginBottom: 10,
              }}
            >
              Welcome back
            </h1>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
              Sign in to access your school dashboard
            </p>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="mb-6 py-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            {/* Email */}
            <div>
              <Label
                htmlFor="email"
                style={{
                  display: "block",
                  marginBottom: 7,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#374151",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ height: 44, fontSize: 14 }}
              />
            </div>

            {/* Password */}
            <div>
              <Label
                htmlFor="password"
                style={{
                  display: "block",
                  marginBottom: 7,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#374151",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                Password
              </Label>
              <div style={{ position: "relative" }}>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ height: 44, fontSize: 14, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="lp-eye"
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                    transition: "color .15s",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(c) => setRememberMe(c as boolean)}
              />
              <Label
                htmlFor="remember"
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: "#6b7280",
                  cursor: "pointer",
                }}
              >
                Remember me for 30 days
              </Label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="lp-btn"
              style={{
                height: 46,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.025em",
                marginTop: 4,
                background: loading
                  ? undefined
                  : "linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)",
                border: "none",
                boxShadow: loading ? "none" : "0 4px 16px rgba(99,102,241,.32)",
                transition: "box-shadow .2s, transform .15s",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* Footer note */}
          <p
            style={{
              marginTop: 36,
              fontSize: 12,
              color: "#94a3b8",
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            Access restricted to authorised school personnel only
          </p>
        </div>
      </div>
    </div>
  );
}

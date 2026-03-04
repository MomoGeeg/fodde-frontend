import useAuthStore from "@/stores/auth.store";
import { Eye, EyeOff, Leaf, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Connexion réussie !");
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Email ou mot de passe incorrect";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* ── Fond image plein écran ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/bg-login.jpg')`,
        }}
      />
      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-black/50" />

      {/* ── Card centrale ── */}
      <div
        className="relative z-10 w-full max-w-md mx-4 rounded-2xl p-8 flex flex-col items-center"
        style={{
          background: "rgba(15, 30, 15, 0.10)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(74,124,47,0.3)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Logo */}
        <div className="mb-5">
          <img
            src="/fodde-logo.png"
            alt="FODDE Logo"
            className="w-20 h-20 object-contain rounded-xl"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          {/* Fallback logo si image absente */}
          <div
            className="w-20 h-20 rounded-xl items-center justify-content-center text-white font-bold text-2xl hidden"
            style={{
              background: "linear-gradient(135deg, #4A7C2F, #2F5420)",
              display: "none",
            }}
          >
            F
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-2xl font-bold text-white mb-1 tracking-wide">
          ONG FODDE
        </h1>

        {/* Sous-titre */}
        <div className="flex items-center gap-2 mb-8">
          <Leaf size={15} className="text-green-400" />
          <span className="text-sm font-medium" style={{ color: "#6AAF42" }}>
            Forum pour un Développement Durable Endogène
          </span>
          <Leaf size={15} className="text-green-400" />
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          {/* Email */}
          <div>
            <label
              className="block text-xs font-semibold tracking-widest mb-2"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              ADRESSE EMAIL
            </label>
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <Mail size={17} style={{ color: "rgba(255,255,255,0.4)" }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ongfodde.org"
                required
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className="text-xs font-semibold tracking-widest"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                MOT DE PASSE
              </label>
              <span
                className="text-xs cursor-pointer font-medium"
                style={{ color: "#6AAF42" }}
              >
                Mot de passe oublié ?
              </span>
            </div>
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <Lock size={17} style={{ color: "rgba(255,255,255,0.4)" }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div
              className="text-sm text-center py-2 px-4 rounded-lg"
              style={{
                background: "rgba(220,38,38,0.2)",
                color: "#fca5a5",
                border: "1px solid rgba(220,38,38,0.3)",
              }}
            >
              {error}
            </div>
          )}

          {/* Bouton connexion */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-base text-white tracking-wider mt-1 transition-all duration-200 disabled:opacity-60"
            style={{
              background: loading
                ? "#4A7C2F"
                : "linear-gradient(135deg, #5A9C3A 0%, #4A7C2F 100%)",
              boxShadow: "0 4px 20px rgba(74,124,47,0.5)",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Connexion en cours...
              </span>
            ) : (
              "SE CONNECTER"
            )}
          </button>
        </form>

        {/* Footer */}
        <p
          className="mt-6 text-xs text-center"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          FODDE © 2026 — Plateforme sécurisée
        </p>
      </div>
    </div>
  );
}

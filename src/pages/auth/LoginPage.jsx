import useAuthStore from "@/stores/auth.store";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/** Message lisible selon la réponse du serveur (ou son absence). */
function messageConnexion(err) {
  if (!err?.response) {
    return "Le serveur ne répond pas. Vérifiez votre connexion internet puis réessayez.";
  }
  if (err.response.status === 401) {
    // Compte suspendu, désactivé ou en attente : le backend le précise dans son message.
    const msg = err.response.data?.erreur ?? "";
    return /compte/i.test(msg)
      ? "Votre compte n'est pas actif. Adressez-vous à l'administrateur de la plateforme."
      : "Adresse e-mail ou mot de passe incorrect.";
  }
  if (err.response.status === 400) return "Renseignez votre adresse e-mail et votre mot de passe.";
  return "La connexion a échoué. Réessayez dans un instant.";
}

const champ =
  "mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

/**
 * Connexion : photo de l'équipe à gauche (bandeau en haut sur mobile),
 * formulaire sobre à droite.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [voirMotDePasse, setVoirMotDePasse] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [lent, setLent] = useState(false);
  const [erreur, setErreur] = useState("");
  const minuterie = useRef(null);

  useEffect(() => () => clearTimeout(minuterie.current), []);

  const seConnecter = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    // Le serveur gratuit peut mettre du temps à se réveiller : on le dit au lieu de laisser attendre.
    minuterie.current = setTimeout(() => setLent(true), 5000);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setErreur(messageConnexion(err));
    } finally {
      clearTimeout(minuterie.current);
      setLent(false);
      setEnvoi(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      {/* ── Photo de l'équipe ─────────────────────────────── */}
      <div className="relative h-48 shrink-0 overflow-hidden sm:h-64 lg:h-auto lg:w-[55%]">
        <img src="/bg-login.jpg" alt="L'équipe de FODDE à Kolda" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 hidden p-10 text-white lg:block">
          <p className="max-w-md text-2xl font-semibold leading-snug">
            Forum pour un Développement Durable Endogène
          </p>
          <p className="mt-2 max-w-md text-sm text-white/80">
            Gestion des projets, des finances, de l'équipe et du suivi-évaluation de l'ONG FODDE.
          </p>
          <p className="mt-6 text-xs text-white/60">Kolda, Sénégal</p>
        </div>
      </div>

      {/* ── Formulaire ────────────────────────────────────── */}
      <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <img src="/fodde-logo.png" alt="Logo FODDE" className="h-16 w-16 object-contain" />
          <h1 className="mt-6 text-2xl font-semibold text-gray-900">Connexion</h1>
          <p className="mt-1 text-sm text-gray-600">Accédez à votre espace de travail FODDE.</p>

          <form onSubmit={seConnecter} className="mt-8 space-y-5" noValidate>
            {erreur && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
                {erreur}
              </div>
            )}

            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Adresse e-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@ongfodde.org"
                className={champ}
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={voirMotDePasse ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${champ} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setVoirMotDePasse((v) => !v)}
                  className="absolute inset-y-0 right-0 mt-1.5 flex w-11 items-center justify-center text-gray-500 hover:text-gray-800"
                  aria-label={voirMotDePasse ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {voirMotDePasse ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={envoi || !email || !password}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[15px] font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {envoi && <LoaderCircle size={18} className="animate-spin" />}
              {envoi ? "Connexion…" : "Se connecter"}
            </button>

            {lent && (
              <p className="text-center text-xs text-gray-500" aria-live="polite">
                Le serveur démarre, cela peut prendre jusqu'à une minute.
              </p>
            )}
          </form>

          <p className="mt-8 text-sm text-gray-600">
            Mot de passe oublié ou compte bloqué ? Adressez-vous à l'administrateur de la plateforme.
          </p>
          <p className="mt-10 text-xs text-gray-400">© {new Date().getFullYear()} ONG FODDE</p>
        </div>
      </main>
    </div>
  );
}

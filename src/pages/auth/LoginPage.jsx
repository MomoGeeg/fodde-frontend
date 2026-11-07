import useAuthStore from "@/stores/auth.store";
import { ArrowRight, CircleAlert, Eye, EyeOff, LifeBuoy, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
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
  "block h-11 w-full rounded-xl border border-gray-200 bg-gray-50/60 pl-10 pr-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10";

const MODULES = ["Projets", "Finances", "Équipe", "Suivi-évaluation"];

/**
 * Connexion : photo de l'équipe teintée aux couleurs de FODDE (bandeau sur
 * mobile), formulaire sur une carte flottante.
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
    <div className="min-h-screen bg-gray-50 lg:grid lg:grid-cols-[1.15fr_1fr]">
      {/* ── Photo de l'équipe ─────────────────────────────── */}
      {/* Fond vert de la charte ; la photo y est posée en entier (aucune personne coupée). */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-dark via-[#24411a] to-black-fodde text-white">
        {/* Halos lumineux discrets */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary-light/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative flex h-full flex-col gap-6 p-5 sm:p-8 lg:min-h-screen lg:justify-center lg:gap-6 lg:p-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg shadow-black/20">
              <img src="/fodde-logo.png" alt="" className="h-8 w-8 object-contain" />
            </span>
            <span className="text-lg font-semibold tracking-tight">ONG FODDE</span>
          </div>

          {/* Photo entière : même proportion que l'image d'origine (2560 × 1751) */}
          {/* Sur ordinateur, la largeur est plafonnée pour que la photo tienne dans ~40 % de la hauteur d'écran */}
          <figure className="overflow-hidden rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-white/15 lg:max-w-[calc(42vh*2560/1751)]">
            <img
              src="/bg-login.jpg"
              alt="L'équipe de FODDE à Kolda"
              className="aspect-[2560/1751] w-full object-cover"
            />
          </figure>

          <div className="hidden max-w-xl lg:block">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">Plateforme de gestion</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
              Forum pour un Développement Durable Endogène
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/80">
              Un seul espace pour piloter les projets, suivre les budgets, valider les demandes et rendre compte aux
              partenaires.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {MODULES.map((m) => (
                <li
                  key={m}
                  className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm"
                >
                  {m}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-white/60">Kolda · Sénégal</p>
          </div>
        </div>
      </section>

      {/* ── Formulaire ────────────────────────────────────── */}
      <main className="relative flex justify-center px-4 pb-16 pt-6 sm:pt-8 lg:items-center lg:px-12 lg:py-12">
        {/* Halo discret aux couleurs de la charte */}
        <div className="pointer-events-none absolute right-0 top-1/4 hidden h-72 w-72 rounded-full bg-primary/10 blur-3xl lg:block" />

        <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-xl shadow-gray-900/5 ring-1 ring-gray-900/5 sm:p-10">
          <h1 className="text-[26px] font-semibold tracking-tight text-gray-900">Connexion</h1>
          <p className="mt-1.5 text-sm text-gray-500">Heureux de vous revoir. Connectez-vous à votre espace de travail.</p>

          <form onSubmit={seConnecter} className="mt-8 space-y-5" noValidate>
            {erreur && (
              <div role="alert" className="flex gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-800">
                <CircleAlert size={18} className="mt-px shrink-0" />
                <span>{erreur}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
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
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="relative">
                <LockKeyhole size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
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
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-gray-400 transition hover:text-gray-700"
                  aria-label={voirMotDePasse ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {voirMotDePasse ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={envoi || !email || !password}
              className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary-light to-primary text-[15px] font-medium text-white shadow-md shadow-primary/25 transition hover:shadow-lg hover:shadow-primary/30 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {envoi ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" /> Connexion…
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            {lent && (
              <p className="text-center text-xs text-gray-500" aria-live="polite">
                Le serveur démarre, cela peut prendre jusqu'à une minute.
              </p>
            )}
          </form>

          <div className="mt-8 flex gap-3 rounded-xl bg-gray-50 px-4 py-3.5 text-sm text-gray-600">
            <LifeBuoy size={18} className="mt-0.5 shrink-0 text-primary" />
            <p>
              <span className="font-medium text-gray-800">Mot de passe oublié ou compte bloqué ?</span>
              <br />
              Adressez-vous à l'administrateur de la plateforme.
            </p>
          </div>
        </div>

        <p className="absolute bottom-5 left-0 right-0 text-center text-xs text-gray-400">© {new Date().getFullYear()} ONG FODDE</p>
      </main>
    </div>
  );
}

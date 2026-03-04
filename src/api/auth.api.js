// DEPRECATED — L'authentification utilise désormais useAuthStore().login()
// Ce fichier est conservé pour éviter les erreurs d'import résiduelles
export const authApi = {
  login: () => {
    throw new Error(
      "authApi.login() est déprécié. Utiliser useAuthStore().login()",
    );
  },
};

/** Message d'erreur lisible depuis une réponse du backend ({ erreur } ou { message }). */
export const messageErreur = (err, defaut = "Enregistrement impossible.") =>
  err?.response?.data?.erreur || err?.response?.data?.message || defaut;

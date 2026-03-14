import api from "@/api/axios";

export const dashboardApi = {
  getProjets: () => api.get("/api/projets").then((r) => r.data),

  getEmployes: () =>
    api
      .get("/api/employes")
      .then((r) => r.data)
      .catch(() => []), // 403 si rôle non autorisé (RH/Admin seulement)

  getDocuments: () =>
    api
      .get("/api/documents")
      .then((r) => r.data)
      .catch(() => []),

  getDepensesMoisCourant: () =>
    api
      .get("/api/depenses/stats/mois-courant")
      .then((r) => ({ total: r.data?.total ?? 0, count: r.data?.count ?? 0 }))
      .catch(() => ({ total: 0, count: 0 })),
};

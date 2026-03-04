import { supabase } from "@/lib/supabase";

export const dashboardApi = {
  getProjets: async () => {
    const { data, error } = await supabase
      .from("projets")
      .select("*")
      .order("code");
    if (error) throw new Error(error.message);
    return data;
  },

  getEmployes: async () => {
    const { data, error } = await supabase
      .from("employes")
      .select("*")
      .eq("statut", "ACTIF");
    if (error) throw new Error(error.message);
    return data;
  },

  getDocuments: async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .neq("statut", "ARCHIVE");
    if (error) throw new Error(error.message);
    return data;
  },

  getDepensesMoisCourant: async () => {
    const now = new Date();
    const debut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const fin = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).toISOString();
    const { data, error } = await supabase
      .from("depenses")
      .select("montant")
      .gte("date", debut)
      .lte("date", fin)
      .eq("statut", "VALIDEE");
    if (error) throw new Error(error.message);
    const total = (data ?? []).reduce((s, d) => s + (d.montant ?? 0), 0);
    return { total, count: data?.length ?? 0 };
  },
};

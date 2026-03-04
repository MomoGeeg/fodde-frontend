import * as us from "@/services/userService";

export const usersApi = {
  getAll: () => us.getAllUsers(),
  getActifs: () => us.getActiveUsers(),
  create: (data) => us.createUser(data),
  changerStatut: (id, statut) => us.changeUserStatut(id, statut),
  updateRoles: (id, roles) => us.updateUserRoles(id, roles),
};

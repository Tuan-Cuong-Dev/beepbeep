export interface Admin {
  id: string;
  userId: string;

  name: string;
  email: string;
  phone: string;

  systemPermission: string[]; // ['manage_users', 'approve_contributions', ...]

  createdAt: Date;
  updatedAt: Date;
}

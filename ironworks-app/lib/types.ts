export type UserRole = "coach" | "client";

export type UsersProfile = {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
};

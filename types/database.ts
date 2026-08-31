export type AppRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'TBM_MANAGER'
  | 'VIEWER'
  | 'EXTERNAL';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  status: UserStatus;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  description: string | null;
  created_at: string;
}

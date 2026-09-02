export type AppRole =
  | 'SUPER_ADMIN'
  | 'AUDIT_ADMIN'
  | 'APPR_ADMIN'
  | 'TBM_ADMIN'
  | 'VIEWER'
  | 'VISITER';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  status: UserStatus;
  approved_at: string | null;
  approved_by: string | null;
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

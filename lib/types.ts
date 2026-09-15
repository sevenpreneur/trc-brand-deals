export type StatusName =
  | "OK"
  | "CREATED"
  | "NO_CONTENT"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR";

const SUCCESS_STATUSES: StatusName[] = ["OK", "CREATED", "NO_CONTENT"];

export function isSuccessStatus(status?: StatusName) {
  return status !== undefined && SUCCESS_STATUSES.includes(status);
}

/** Turn mana yang diukur dan apakah jeda di luar jam kerja ikut dihitung. */
export type ResponseMode = "first" | "all_working" | "all_flat";

export type LeadStatus =
  | "cold"
  | "qualified"
  | "rate_card_sent"
  | "negotiation"
  | "closed";

export type Metapaging = {
  total_data: number;
  total_page: number;
  current_page: number;
  page_size: number;
};

/** Backend belum menegakkan peran — untuk sekarang UI yang membatasi. */
export type UserRole = "Super Admin" | "Administrator" | "Member";

/** Bentuk yang sama dikembalikan `login` dan `check-session`. */
export type SessionUser = {
  id: string;
  full_name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  /** Selalu "active" di respons; user inactive diperlakukan seperti tidak ada. */
  status: string;
  /** Tenant yang boleh diakses, urut waktu pemberian akses. Bisa kosong. */
  tenant_ids: string[];
};

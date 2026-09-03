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

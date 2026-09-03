import "server-only";

import type { StatusName } from "@/lib/types";

export type ApiEnvelope<T = unknown> = {
  success?: boolean;
  code?: number;
  status?: StatusName;
  message?: string;
  data?: T;
};

function statusNameFromCode(code: number): StatusName {
  switch (code) {
    case 200:
      return "OK";
    case 201:
      return "CREATED";
    case 204:
      return "NO_CONTENT";
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}

export async function callApi<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<ApiEnvelope<T>> {
  const baseUrl = process.env.BASE_URL;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!baseUrl) {
    return {
      code: 500,
      status: "INTERNAL_SERVER_ERROR",
      message: "BASE_URL is not configured",
    };
  }
  if (!clientSecret) {
    return {
      code: 500,
      status: "INTERNAL_SERVER_ERROR",
      message: "CLIENT_SECRET is not configured",
    };
  }

  const { method = "POST", body } = options;

  let response: Response;
  try {
    response = await fetch(new URL(path, baseUrl).toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientSecret}`,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    return {
      code: 500,
      status: "INTERNAL_SERVER_ERROR",
      message: "Tidak bisa menghubungi server API",
    };
  }

  const data = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;

  if (!data) {
    return {
      code: response.status,
      status: statusNameFromCode(response.status),
      message: "Respons server tidak valid",
    };
  }

  // fall back to the real HTTP status so callers don't misread a 2xx as a failure.
  return {
    ...data,
    status: data.status ?? statusNameFromCode(response.status),
  };
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:5000";

interface ApiOk<T> { data: T; error?: never }
interface ApiErr { data?: never; error: string }
export type ApiResult<T> = ApiOk<T> | ApiErr;

async function attemptRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json as { access_token?: string }).access_token ?? null;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("refresh_token");
  window.location.href = "/signin";
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const json = await res.json().catch(() => ({}));
    if (res.status === 401) {
      if (token) {
        const newToken = await attemptRefresh();
        if (newToken) {
          localStorage.setItem("token", newToken);
          const retryHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newToken}`,
          };
          const retryRes = await fetch(`${BASE_URL}${path}`, { ...options, headers: retryHeaders });
          const retryJson = await retryRes.json().catch(() => ({}));
          if (retryRes.status === 401) {
            clearSession();
            return { error: "Session expired" };
          }
          if (!retryRes.ok) {
            return { error: (retryJson as { error?: string; msg?: string }).error ?? (retryJson as { msg?: string }).msg ?? "Something went wrong" };
          }
          return { data: retryJson as T };
        }
        clearSession();
        return { error: "Session expired" };
      }
      return { error: (json as { error?: string }).error ?? "Invalid credentials" };
    }
    if (!res.ok) {
      return { error: (json as { error?: string; msg?: string }).error ?? (json as { msg?: string }).msg ?? "Something went wrong" };
    }
    return { data: json as T };
  } catch {
    return { error: "Network error — is the backend running?" };
  }
}

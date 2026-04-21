const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:5000";

interface ApiOk<T> { data: T; error?: never }
interface ApiErr { data?: never; error: string }
export type ApiResult<T> = ApiOk<T> | ApiErr;

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
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/signin";
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

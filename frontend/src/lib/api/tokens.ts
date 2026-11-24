const ACCESS_KEY = "abit.access";
const REFRESH_KEY = "abit.refresh";

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export const getAccessToken = (): string | null =>
  typeof window === "undefined" ? null : safe(() => window.localStorage.getItem(ACCESS_KEY), null);

export const getRefreshToken = (): string | null =>
  typeof window === "undefined" ? null : safe(() => window.localStorage.getItem(REFRESH_KEY), null);

export function setTokens(access: string, refresh?: string): void {
  safe(() => {
    window.localStorage.setItem(ACCESS_KEY, access);
    if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
  }, undefined);
}

export function clearTokens(): void {
  safe(() => {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  }, undefined);
}

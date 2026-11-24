import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, request } from "./client";
import { getAccessToken, setTokens } from "./tokens";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("api client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("returns parsed JSON and builds the query string", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const data = await request<{ ok: boolean }>("/projects/", { query: { page: 2, search: "", category: "web" } });
    expect(data).toEqual({ ok: true });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/projects/?");
    expect(url).toContain("page=2");
    expect(url).toContain("category=web");
    expect(url).not.toContain("search=");
  });

  it("throws ApiError with the server's detail message", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "Nope" }, 403));
    await expect(request("/admin/dashboard/")).rejects.toMatchObject({ name: "ApiError", status: 403, message: "Nope" });
  });

  it("turns network failures into a friendly ApiError", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    const error = await request("/projects/").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
  });

  it("refreshes the access token once on 401 and retries", async () => {
    setTokens("old-access", "refresh-token");
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: "expired" }, 401))
      .mockResolvedValueOnce(jsonResponse({ access: "new-access", refresh: "new-refresh" }))
      .mockResolvedValueOnce(jsonResponse({ stats: {} }));
    const data = await request("/admin/dashboard/", { auth: true });
    expect(data).toEqual({ stats: {} });
    expect(getAccessToken()).toBe("new-access");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const retryHeaders = fetchMock.mock.calls[2][1].headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe("Bearer new-access");
  });

  it("clears tokens and signals logout when refresh fails", async () => {
    setTokens("old", "bad-refresh");
    const onExpired = vi.fn();
    window.addEventListener("abit:auth-expired", onExpired);
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 401)).mockResolvedValueOnce(jsonResponse({}, 401)).mockResolvedValueOnce(jsonResponse({}, 401));
    await expect(request("/admin/dashboard/", { auth: true })).rejects.toBeInstanceOf(ApiError);
    expect(getAccessToken()).toBeNull();
    expect(onExpired).toHaveBeenCalled();
    window.removeEventListener("abit:auth-expired", onExpired);
  });
});

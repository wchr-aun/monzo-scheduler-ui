let refreshInFlight: Promise<boolean> | undefined;
let refreshGeneration = 0;

function redirectSignedOutConsole() {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/console/account/")) {
    window.location.replace("/console");
  }
}

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch("/api/auth/refresh", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
    })
      .then((response) => {
        if (!response.ok) {
          if ([400, 401, 403].includes(response.status)) redirectSignedOutConsole();
          return false;
        }
        refreshGeneration += 1;
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = undefined;
      });
  }

  return refreshInFlight;
}

export async function fetchWithSessionRefresh(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const requestGeneration = refreshGeneration;
  const response = await fetch(url, init);

  if (response.status !== 401) return response;

  // A delayed 401 may belong to a request sent before a completed refresh.
  // In that case, reuse the updated cookies instead of refreshing again.
  if (refreshInFlight || requestGeneration === refreshGeneration) {
    if (!(await refreshSession())) return response;
  }

  init?.signal?.throwIfAborted();
  const retriedResponse = await fetch(url, init);
  if (retriedResponse.status === 401) redirectSignedOutConsole();
  return retriedResponse;
}

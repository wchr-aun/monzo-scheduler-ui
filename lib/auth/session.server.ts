import "server-only";

export function getUserId(token: string): string | null {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const payload: unknown = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("sub" in payload) ||
      typeof payload.sub !== "string" ||
      !payload.sub.trim()
    ) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}

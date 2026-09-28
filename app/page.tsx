import { cookies } from "next/headers";
import { AccountsList } from "./accounts-list";

function getUserId(token: string): string | null {
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

export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "session";
  const sessionToken = cookieStore.get(sessionCookieName)?.value;
  const isLoggedIn = Boolean(sessionToken);
  const userId = sessionToken ? getUserId(sessionToken) : null;
  const baseUrl = process.env.BASE_URL?.replace(/\/+$/, "");
  const loginUrl = baseUrl ? `${baseUrl}/monzo-redirect` : null;

  return (
    <main className="screen">
      {isLoggedIn ? (
        <div className="logged-in-content">
          <div className="logged-in-status">
            <p className="status">Logged in</p>
            <p className="user-id">
              {userId ? `User ID: ${userId}` : "User ID unavailable"}
            </p>
          </div>
          <AccountsList />
        </div>
      ) : !loginUrl ? (
        <p className="status">Login is not configured.</p>
      ) : (
        <a className="button" href={loginUrl} target="_blank" rel="noopener noreferrer">
          Log in
        </a>
      )}
    </main>
  );
}

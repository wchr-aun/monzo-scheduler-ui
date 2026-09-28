import { cookies } from "next/headers";

export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "session";
  const isLoggedIn = Boolean(cookieStore.get(sessionCookieName)?.value);
  const baseUrl = process.env.BASE_URL?.replace(/\/+$/, "");
  const loginUrl = baseUrl ? `${baseUrl}/monzo-redirect` : null;

  return (
    <main className="screen">
      {isLoggedIn ? (
        <p className="status">Logged in</p>
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

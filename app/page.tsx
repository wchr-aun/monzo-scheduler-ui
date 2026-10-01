import {LoginButton} from "@/components/auth/login-button";
import {LogoutButton} from "@/components/auth/logout-button";
import {AccountsList} from "@/components/accounts/accounts-list";
import {PageContainer} from "@/components/layout/page-container";
import {getUserId} from "@/lib/auth/session.server";
import {cookies} from "next/headers";
import styles from "./page.module.css";

export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "session";
  const sessionToken = cookieStore.get(sessionCookieName)?.value;
  const isLoggedIn = Boolean(sessionToken);
  const userId = sessionToken ? getUserId(sessionToken) : null;
  const baseUrl = process.env.BASE_URL?.replace(/\/+$/, "");
  const loginUrl = baseUrl ? `${baseUrl}/monzo-redirect` : null;

  return (
    <PageContainer centered width={isLoggedIn ? "wide" : "narrow"}>
      {isLoggedIn ? (
        <div className={styles.loggedInContent}>
          <AccountsList userId={userId} />
          <LogoutButton />
        </div>
      ) : !loginUrl ? (
        <p className={styles.status}>Login is not configured.</p>
      ) : (
        <LoginButton href={loginUrl} />
      )}
    </PageContainer>
  );
}

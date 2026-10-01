import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Footer } from "@/components/layout/footer";
import { PotPreview } from "./pot-preview";
import styles from "./landing-page.module.css";

export function LandingPage() {
  return (
    <div id="top" className={styles.page}>
      <a className={styles.skipLink} href="#main">Skip to content</a>
      <header className={styles.header}>
        <nav className={styles.navigation} aria-label="Main navigation">
          <a className={styles.brand} href="#top" aria-label="Monzo Scheduler, back to top">
            <Image className={styles.lightLogo} src="/logo.png" alt="" width={56} height={56} priority />
            <Image className={styles.darkLogo} src="/logo-dark-mode.png" alt="" width={56} height={56} priority />
            <span>Monzo Scheduler<span className={styles.brandCaption}>A little side project.</span></span>
          </a>
          <div className={styles.navigationControls}>
            <Link className={styles.consoleLink} href="/console">
              Go to console <span aria-hidden="true">↗</span>
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main id="main">
        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span className={styles.dot} /> Small project. Everyday possibilities.</p>
            <h1 id="hero-heading">Your pots.<br />Your plans.<br /><span>On schedule.</span></h1>
            <p className={styles.introduction}>
              Give your Monzo pots a routine. Schedule money in or out,
              see what&apos;s coming next, and keep your plans in one place.
            </p>
            <a className={styles.inviteButton} href="#invite">Request your invite <span aria-hidden="true">→</span></a>
            <p className={styles.heroNote}>Built with curiosity. Made for the everyday.</p>
            <a className={styles.storyLink} href="#why">A little about the project <span aria-hidden="true">↓</span></a>
          </div>
          <PotPreview />
        </section>

        <section id="why" className={styles.storySection} aria-labelledby="why-heading">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>01 / The motivation</p>
            <h2 id="why-heading">Why I&apos;m<br />building this.</h2>
          </div>
          <div className={styles.storyContent}>
            <span className={styles.draftLabel}>A story in progress</span>
            <h3>Every side project starts somewhere.</h3>
            <p>
              This space is for the story behind Monzo Scheduler: the everyday
              problem that sparked the idea, why I wanted to solve it, and what
              I&apos;m learning along the way.
            </p>
            <p className={styles.placeholder}>More about the why, coming soon.</p>
          </div>
        </section>

        <section id="building" className={styles.buildSection} aria-labelledby="building-heading">
          <div className={styles.buildHeading}>
            <div>
              <p className={styles.eyebrow}>02 / From idea to app</p>
              <h2 id="building-heading">What I&apos;ve built.<br />What you can do.</h2>
            </div>
            <p className={styles.buildDescription}>
              A small console for your accounts, pots, and scheduled transfers.
              Here&apos;s what it can do so far.
            </p>
          </div>
          <div className={styles.features}>
            <article className={styles.feature}>
              <span className={styles.featureNumber}>01</span>
              <h3>See your pots.</h3>
              <p>Browse your Monzo accounts and pots, with their balances together in one place.</p>
            </article>
            <article className={styles.feature}>
              <span className={styles.featureNumber}>02</span>
              <h3>Make a plan.</h3>
              <p>Create recurring deposits or withdrawals, choosing the amount and when they happen.</p>
            </article>
            <article className={styles.feature}>
              <span className={styles.featureNumber}>03</span>
              <h3>Keep track.</h3>
              <p>Filter your scheduled transfers by status and cancel pending transfers when plans change.</p>
            </article>
          </div>
          <div className={styles.buildNote}>
            <span className={styles.draftLabel}>Behind the build</span>
            <p>A place for the technical decisions, things I tried, and lessons learned. Development notes coming soon.</p>
          </div>
        </section>

        <section id="invite" className={styles.inviteSection} aria-labelledby="invite-heading">
          <p className={styles.eyebrow}>Follow along</p>
          <h2 id="invite-heading">A little more order.<br />A little less remembering.</h2>
          <p>Want to try it? This is where you&apos;ll be able to request an invite.</p>
          <form className={styles.inviteForm} aria-label="Request an invite">
            <label htmlFor="invite-email">Email address</label>
            <div className={styles.inviteFields}>
              <input id="invite-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-describedby="invite-note" disabled />
              <button className={styles.inviteButton} type="submit" disabled>Request your invite <span aria-hidden="true">→</span></button>
            </div>
            <p id="invite-note">Coming soon. Invite requests aren&apos;t open yet.</p>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}

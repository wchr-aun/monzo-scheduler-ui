import {createPreviewTransfersPage} from "@/lib/scheduled-transfers/preview";
import Image from "next/image";
import Link from "next/link";
import {ArrowIcon} from "@/components/ui/icons/arrow-icon";
import {GitHubIcon} from "@/components/ui/icons/github-icon";
import {ThemeToggle} from "@/components/ui/theme-toggle";
import {Footer} from "@/components/layout/footer";
import {PotPreview} from "./pot-preview";
import {MonzoNotification} from "./monzo-notification";
import {InterestCalculation} from "./interest-calculation";
import {MonzoTransaction} from "./monzo-transaction";
import {PaymentFlow} from "./payment-flow";
import styles from "./landing-page.module.css";

const exampleRentAmount = 2_273;
const exampleRentTransferDate = "2026-09-14T23:00:00Z";

export function LandingPage() {
  const transfersPage = createPreviewTransfersPage();
  const storyTransfer = {
    ...transfersPage.scheduledTransfers[1],
    amount: exampleRentAmount * 100,
    scheduled_for: exampleRentTransferDate,
  };

  return (
    <div id="top" className={styles.page}>
      <a className={styles.skipLink} href="#main">Skip to content</a>
      <header className={styles.header}>
        <nav className={styles.navigation} aria-label="Main navigation">
          <a className={styles.brand} href="#top" aria-label="Monzo Scheduler, back to top">
            <Image className={styles.lightLogo} src="/logo.png" alt="" width={56} height={56} priority />
            <Image className={styles.darkLogo} src="/logo-dark-mode.png" alt="" width={56} height={56} priority />
            <span>Schedzo<span className={styles.brandCaption}>On schedule.</span></span>
          </a>
          <div className={styles.navigationControls}>
            <Link className={styles.consoleLink} href="/console" target="_blank" rel="noopener noreferrer">
              Go to console <ArrowIcon direction="up-right" />
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main id="main">
        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span className={styles.dot} /> Small project. Everyday possibilities.</p>
            <h1 id="hero-heading">Less remembering.<br /><span>More saving.</span></h1>
            <p className={styles.introduction}>
              Schedule money into and out of your Monzo pots, so there&apos;s one less
              thing to remember when life gets busy.
            </p>
            <a className={styles.primaryLink} href="#code">Explore the code <ArrowIcon /></a>
            <p className={styles.heroNote}>Built with curiosity. Made for the everyday.</p>
            <a className={styles.storyLink} href="#why">A little about the project <ArrowIcon direction="down" /></a>
          </div>
          <PotPreview transfersPage={transfersPage} />
        </section>

        <section id="why" className={styles.storySection} aria-labelledby="why-heading">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>01 / The motivation</p>
            <h2 id="why-heading">Why I&apos;m<br />building this.</h2>
            <PaymentFlow transfer={storyTransfer} />
          </div>
          <div className={styles.storyContent}>
            <div>
              <h3>The problem.</h3>
              <p>
                Monzo doesn&apos;t let us <strong>schedule withdrawals from savings pots</strong>. So, if we
                want to keep money earning interest until a scheduled payment is due, we have
                to remember to manually move it into the main balance ourselves.
              </p>
              <p>
                If payday is on the 28th and rent is due on the 15th of the following month,
                that&apos;s <strong>over two weeks of interest</strong> we could earn on the rent money.
              </p>
              <p>
                Using <strong>£{exampleRentAmount.toLocaleString("en-GB")}</strong>, the <a href="https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/privaterentandhousepricesuk/march2026#private-rents-by-english-region" target="_blank" rel="noopener noreferrer">average monthly private rent in London in February 2026 according to the ONS</a>,
                keeping that money in a savings pot for 17 days at 2.75% AER could earn roughly <InterestCalculation />. Do that each month and
                it&apos;s around <strong className={styles.interestHighlight}>£34 over a year</strong>. It&apos;s a small amount each time, but it adds
                up without having to put any extra money aside!
              </p>
              <p className={styles.rateNote}>
                Illustrative calculation using <a href="https://monzo.com/current-account" target="_blank" rel="noopener noreferrer">Monzo&apos;s Instant Access Savings rate</a> of
                2.75% AER variable on the free plan, checked on 2 October 2026. Rates can change.
              </p>
            </div>
            <div>
              <h3>The workaround.</h3>
              <p>
                The workaround is to schedule the payment from the main balance, then
                <strong> manually withdraw the money from the savings pot the day before</strong>.
                But life can sometimes be quite busy. Even with Monzo&apos;s reminder that
                there isn&apos;t enough money for the payment, <strong>it&apos;s easy to forget</strong>.
              </p>
              <figure className={styles.declinedPreview}>
                <MonzoTransaction kind="declined" amount={exampleRentAmount * 100} recipient="Landlord" initials="L" />
                <figcaption>Example of a declined scheduled payment.</figcaption>
              </figure>
              <p>
                I wanted to <strong>automate that last step</strong>, so the money can stay in
                the savings pot until it&apos;s needed, <strong>without me having to remember
                to move it myself</strong>.
              </p>
            </div>
            <div>
              <h3>Why I built this.</h3>
              <p>
                There&apos;s already a platform that can do this: <a href="https://ifttt.com/applets/d3xg75n8-move-money-daily-from-a-monzo-pot-to-your-account" target="_blank" rel="noopener noreferrer">IFTTT</a> lets
                us schedule withdrawals from pots to the main balance. But its free tier only
                allows <strong>two automations</strong>. So, I decided to build this to serve my needs.
              </p>
              <p>
                I also wanted <strong>a small project to play around with APIs in UK banking</strong>.
                Monzo already provides <a href="https://docs.monzo.com" target="_blank" rel="noopener noreferrer">APIs to move money into and out of pots</a>,
                so this felt like a good place to start.
              </p>
            </div>
          </div>
        </section>

        <section id="building" className={styles.buildSection} aria-labelledby="building-heading">
          <div className={styles.buildHeading}>
            <div>
              <p className={styles.eyebrow}>02 / From idea to app</p>
              <h2 id="building-heading">What I&apos;ve built.<br />What you can do.</h2>
            </div>
            <p className={styles.buildDescription}>
              I&apos;ve built a small web app that helps schedule transfers into and out of pots,
              without a limit on the number of scheduled transfers you can create.
            </p>
          </div>
          <div className={styles.features}>
            <article className={styles.feature}>
              <span className={styles.featureNumber}>01</span>
              <h3>Schedule money in or out.</h3>
              <p>Create recurring deposits or withdrawals between your pots and main balance.</p>
            </article>
            <article className={styles.feature}>
              <span className={styles.featureNumber}>02</span>
              <h3>Make as many plans as you need.</h3>
              <p>No limit on the number of scheduled transfers you can create.</p>
            </article>
            <article className={styles.feature}>
              <span className={styles.featureNumber}>03</span>
              <h3>Keep track of your plans.</h3>
              <p>See what&apos;s coming next, filter transfers by status, and cancel pending transfers.</p>
            </article>
          </div>
          <div className={styles.notificationFeature}>
            <div className={styles.notificationCopy}>
              <h3>Know what happened.</h3>
              <p>
                When a scheduled transfer runs, whether it succeeds or fails, the app sends
                a notification to your Monzo app so you know what happened.
              </p>
            </div>
            <figure className={styles.notificationPreview}>
                <MonzoNotification title="🎉 £50.00 deposited!" />
              <figcaption>Example notification</figcaption>
            </figure>
          </div>
        </section>

        <section id="code" className={styles.codeSection} aria-labelledby="code-heading">
          <p className={styles.eyebrow}>03 / Open source</p>
          <h2 id="code-heading">Built for my needs.<br />Open for yours.</h2>
          <div className={styles.codeDescription}>
            <p>
              Monzo&apos;s developer API is intended for personal projects and a small set of
              explicitly allowed users, so I can only let a small number of people in.
            </p>
            <p>But all the code is open source. Feel free to fork it, copy it, and run it on your own server.</p>
          </div>
          <div className={styles.repositories}>
            <a className={styles.repository} href="https://github.com/wchr-aun/monzo-scheduler-ui" target="_blank" rel="noopener noreferrer">
              <h3>Frontend code <ArrowIcon direction="up-right" /></h3>
              <p>The website and console for your accounts, pots, and scheduled transfers.</p>
              <span><GitHubIcon /> View on GitHub</span>
            </a>
            <a className={styles.repository} href="https://github.com/wchr-aun/monzo-scheduler" target="_blank" rel="noopener noreferrer">
              <h3>Backend code <ArrowIcon direction="up-right" /></h3>
              <p>The scheduler that runs your transfers and sends updates to Monzo.</p>
              <span><GitHubIcon /> View on GitHub</span>
            </a>
          </div>
        </section>
      </main>
      <Footer openLinksInNewTab />
    </div>
  );
}

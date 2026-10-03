import { ExternalLinkIcon } from "@/components/ui/icons/external-link-icon/external-link-icon";
import { GitHubIcon } from "@/components/ui/icons/github-icon";
import { ScaleIcon } from "@/components/ui/icons/scale-icon";
import { StatusBadge } from "@/components/ui/status-badge/status-badge";
import styles from "./repository-card.module.css";

type RepositoryCardProps = {
  href: string;
  title: string;
  description: string;
  stack: readonly string[];
  stackLabel: string;
  license?: string;
};

export function RepositoryCard({ href, title, description, stack, stackLabel, license }: RepositoryCardProps) {
  return (
    <a className={styles.repository} href={href} target="_blank" rel="noopener noreferrer">
      <h3>{title} <ExternalLinkIcon /></h3>
      <p>{description}</p>
      <ul className={styles.stackBadges} aria-label={stackLabel}>
        {stack.map((technology) => (
          <li key={technology}><StatusBadge tone="pending">{technology}</StatusBadge></li>
        ))}
      </ul>
      <div className={styles.footer}>
        <span className={styles.githubLink}><GitHubIcon /> View on GitHub</span>
        {license ? <span className={styles.license}><ScaleIcon /> {license}</span> : null}
      </div>
    </a>
  );
}

import { ArrowIcon } from "@/components/ui/icons/arrow-icon";
import { GitHubIcon } from "@/components/ui/icons/github-icon";
import { StatusBadge } from "@/components/ui/status-badge";
import styles from "./repository-card.module.css";

type RepositoryCardProps = {
  href: string;
  title: string;
  description: string;
  stack: readonly string[];
  stackLabel: string;
};

export function RepositoryCard({ href, title, description, stack, stackLabel }: RepositoryCardProps) {
  return (
    <a className={styles.repository} href={href} target="_blank" rel="noopener noreferrer">
      <h3>{title} <ArrowIcon direction="up-right" /></h3>
      <p>{description}</p>
      <ul className={styles.stackBadges} aria-label={stackLabel}>
        {stack.map((technology) => (
          <li key={technology}><StatusBadge tone="pending">{technology}</StatusBadge></li>
        ))}
      </ul>
      <span><GitHubIcon /> View on GitHub</span>
    </a>
  );
}

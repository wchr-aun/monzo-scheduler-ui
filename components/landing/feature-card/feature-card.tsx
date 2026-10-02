import styles from "./feature-card.module.css";

type FeatureCardProps = {
  number: string;
  title: string;
  description: string;
};

export function FeatureCard({ number, title, description }: FeatureCardProps) {
  return (
    <article className={styles.feature}>
      <span className={styles.featureNumber}>{number}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

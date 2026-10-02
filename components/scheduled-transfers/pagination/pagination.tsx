import { Button } from "@/components/ui/button/button";
import styles from "./pagination.module.css";

type PaginationProps = {
  limit: number;
  offset: number;
  onChange: (offset: number) => void;
  total: number;
};

export function Pagination({ limit, offset, onChange, total }: PaginationProps) {
  return (
    <nav className={styles.pagination} aria-label="Scheduled transfers pages">
      <Button
        type="button"
        disabled={offset === 0}
        onClick={() => onChange(Math.max(0, offset - limit))}
      >
        Previous
      </Button>
      <span>
        {offset + 1}–{Math.min(offset + limit, total)} of {total}
      </span>
      <Button
        type="button"
        disabled={offset + limit >= total}
        onClick={() => onChange(offset + limit)}
      >
        Next
      </Button>
    </nav>
  );
}

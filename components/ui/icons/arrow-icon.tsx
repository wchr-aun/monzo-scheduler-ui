type ArrowIconProps = {
  direction?: "right" | "left" | "down" | "up-right";
};

const paths = {
  right: "M5 12h14m-6-6 6 6-6 6",
  left: "M19 12H5m6-6-6 6 6 6",
  down: "M12 5v14m-6-6 6 6 6-6",
  "up-right": "M7 17 17 7M7 7h10v10",
};

export function ArrowIcon({ direction = "right" }: ArrowIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[direction]} />
    </svg>
  );
}

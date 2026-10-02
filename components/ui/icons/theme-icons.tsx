import { OutlineIcon } from "./outline-icon";

export function MoonIcon({className}: {className?: string}) {
  return (
    <OutlineIcon className={className} width="20" height="20">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </OutlineIcon>
  );
}

export function SunIcon({className}: {className?: string}) {
  return (
    <OutlineIcon className={className} width="20" height="20">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
    </OutlineIcon>
  );
}

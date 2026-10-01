const uuidPattern =
  /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i;

export function getDifferingUuidSections(firstId: string, secondId: string) {
  const firstSections = firstId.match(uuidPattern)?.slice(1);
  const secondSections = secondId.match(uuidPattern)?.slice(1);

  if (!firstSections || !secondSections) {
    return null;
  }

  const normalizedFirst = firstSections.map((section) => section.toLowerCase());
  const normalizedSecond = secondSections.map((section) =>
    section.toLowerCase(),
  );
  const hasMatchingOuterSection =
    normalizedFirst[0] === normalizedSecond[0] ||
    normalizedFirst.at(-1) === normalizedSecond.at(-1);

  if (!hasMatchingOuterSection) {
    return null;
  }

  return normalizedFirst.map(
    (section, index) => section !== normalizedSecond[index],
  );
}

// Match visible text even when it spans multiple elements, without matching ancestors.
export function textContent(value: string) {
  return (_content: string, element: Element | null) =>
    element?.textContent === value &&
    !Array.from(element.children).some((child) => child.textContent === value);
}

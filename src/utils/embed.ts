/**
 * True when Jólastjörnuspá runs inside another page, such as the Jólahorn window, or when the
 * address has `?embed`. Embedded, the site fits its frame exactly and never scrolls as a page:
 * the reading is split into tabs instead of one long column.
 */
export function detectEmbedded(search: string = window.location.search): boolean {
  if (new URLSearchParams(search).has('embed')) return true;
  try {
    return window.self !== window.top;
  } catch {
    // Reading window.top can throw in some sandboxes, which itself means we are framed.
    return true;
  }
}

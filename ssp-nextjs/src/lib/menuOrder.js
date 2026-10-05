/**
 * The order dishes are shown in within a menu section.
 * Sections that have sold enough are ranked by the nightly review (best sellers first, new dishes second);
 * every dish without a rank falls back to alphabetical, which is how the whole menu starts out.
 */
export const byMenuOrder = (a, b) =>
  ((a.sort_rank ?? 9999) - (b.sort_rank ?? 9999)) || a.name.localeCompare(b.name);

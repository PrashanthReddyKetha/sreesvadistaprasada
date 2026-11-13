/**
 * The tabs on each menu section page and the address each one lives at. The tab bar links to these — every
 * subsection is a page of its own, with its own title, description and heading, so it can be shared, bookmarked,
 * found on Google and counted in Analytics — and the subsection pages are built from the same list. "All" is the
 * section page itself. (owner, 13 Nov 2026)
 */
export const SECTIONS = {
  svadista: {
    base: '/svadista',
    tabs: [['Starters', 'starters'], ['Curries', 'curries'], ['Biryani', 'biryani'], ['Rice Bowls', 'rice-bowls'],
           ['Egg Specials', 'egg-specials'], ['Indo - Chinese', 'indo-chinese'], ['Ragi Specials', 'ragi-specials'],
           ['Protein & Healthy Bowls', 'protein-healthy-bowls']],
  },
  prasada: {
    base: '/prasada',
    tabs: [['Bites & Starters', 'bites-starters'], ['Curries', 'curries'], ['Biryanis & Rice', 'biryanis-rice'],
           ['Thalis & Rice Bowls', 'thalis-rice-bowls'], ['Indo Chinese', 'indo-chinese'], ['🪔 Naivedyam', 'naivedyam'],
           ['Ragi Specials', 'ragi-specials'], ['Protein & Healthy Bowls', 'protein-healthy-bowls']],
  },
  breakfast: {
    base: '/breakfast',
    tabs: [['Idli & Vada', 'idli-vada'], ['Dosas', 'dosas'], ['Chicken Curry Combos', 'chicken-curry-combos'],
           ['Poori & Others', 'poori-others'], ['English Breakfast', 'english-breakfast']],
  },
};

/** Spelling-tolerant match between a dish's subcategory and a tab: "Biriyani" data still lands on the "Biryani" tab. */
export const sameTab = (subcategory, tab) => (subcategory || '').replace(/Biriyani/gi, 'Biryani') === tab;

export const tabsOf = (section) => ['All', ...SECTIONS[section].tabs.map(([tab]) => tab)];

export const slugToTab = (section) => Object.fromEntries(SECTIONS[section].tabs.map(([tab, slug]) => [slug, tab]));

export const hrefOf = (section, tab) => {
  const found = SECTIONS[section].tabs.find(([t]) => t === tab);
  return found ? `${SECTIONS[section].base}/${found[1]}` : SECTIONS[section].base;
};

/** The address Google is told is the real one. The ragi dishes are the same on every section page, so those point at
 *  the Ragi Specials page rather than competing with it. */
export const canonicalOf = (section, slug) =>
  slug === 'ragi-specials' ? 'https://sreesvadistaprasada.com/ragi-specials' : `https://sreesvadistaprasada.com${SECTIONS[section].base}/${slug}`;

/**
 * SEO source of truth — keyword set frozen 2026-10-03.
 *
 * Every indexable page's title, meta description, meta keywords, H1 keyword
 * line and supporting copy is defined here and nowhere else. Pages import
 * from this file, so "what are we targeting?" has one answer.
 *
 * Rules this file follows (see docs/ops/seo/SEO_STRATEGY.md):
 *  - One primary search per page; no two pages lead with the same phrase.
 *  - Title: primary keyword first, then place, then brand. Aim ≤ 65 characters.
 *  - Description: 120–160 characters, keyword + what you get + action.
 *  - Only dishes that are on the live menu are named. No "only", "best" or
 *    health claims we cannot evidence.
 *  - Delivery wording stays (owner decision D-016); ordering screens show
 *    whether delivery is switched on right now.
 *  - Meta keywords are kept short and page-specific. Google ignores them;
 *    they are here as a record of intent and for engines that still read them.
 *
 * Do not change titles or primary keywords casually: rankings need weeks of
 * stability to settle. Record any change in docs/ops/seo/SEO_STATUS.md.
 */

export const SITE = 'https://sreesvadistaprasada.com';
export const BRAND = 'Sree Svadista Prasada';
const B = ` | ${BRAND}`;

export const PAGE_SEO = {
  '/': {
    primary: 'indian takeaway milton keynes',
    title: `Indian Takeaway Milton Keynes${B}`,
    description: 'Indian takeaway in Milton Keynes — authentic South Indian food: Andhra curries, dosas, biryani and Dabba Wala tiffin service. Order for delivery or collection.',
    keywords: ['Indian takeaway Milton Keynes', 'South Indian food Milton Keynes', 'South Indian restaurant Milton Keynes', 'Indian food delivery Milton Keynes', 'Andhra food Milton Keynes', 'Telugu restaurant Milton Keynes'],
    h1: 'Indian Takeaway in Milton Keynes — Authentic South Indian Food Delivery',
    content: {
      paragraphs: [
        'Sree Svadista Prasada is a South Indian takeaway kitchen in Greenleys, Milton Keynes. We cook the Telugu and Andhra food we grew up on — dosas and idli from slow-fermented batter, home-style curries, dum biryani and a full vegetarian Prasada menu — fresh to order, for delivery across Milton Keynes or collection near Wolverton and Stony Stratford.',
        'Looking for a South Indian restaurant in Milton Keynes, or a Telugu restaurant that cooks Andhra food the way it is made at home? We are a takeaway kitchen rather than a dine-in restaurant, so you order online: South Indian food in Milton Keynes to collect, Indian food delivery across Milton Keynes, or a weekly tiffin from our Dabba Wala service.',
      ],
      links: [
        ['South Indian breakfast', '/breakfast'], ['Dosa', '/breakfast/dosas'], ['Chicken biryani', '/svadista/biriyani'],
        ['Veg thali', '/prasada/thalis-rice-bowls'], ['Vegetarian South Indian food', '/prasada'], ['Andhra chicken curry', '/svadista/curries'],
        ['Indian tiffin service', '/subscriptions'], ['Indian catering', '/catering'], ['Indian food delivery', '/delivery'],
      ],
    },
  },

  '/menu': {
    primary: 'indian takeaway menu milton keynes',
    title: `Indian Takeaway Menu Milton Keynes${B}`,
    description: 'Our Indian takeaway menu in Milton Keynes — 130+ South Indian dishes: dosas, idli, Andhra curries, chicken biryani, veg thali and street food. Order online.',
    keywords: ['Indian takeaway menu', 'South Indian menu Milton Keynes', 'South Indian food menu', 'Indian food menu Milton Keynes', 'Andhra food menu'],
    h1: '130+ South Indian dishes — our Indian takeaway menu in Milton Keynes',
    content: {
      heading: 'Our Indian takeaway menu in Milton Keynes',
      paragraphs: [
        'This is the full South Indian menu from our Greenleys kitchen — more than 130 dishes, each cooked to order. Start the day with a South Indian breakfast of dosa, idli and vada; choose from the vegetarian Prasada menu or the non-veg Svadista menu of Andhra curries and chicken biryani; or try pani puri, momos and ragi specials. Order online for delivery in Milton Keynes or collection.',
        'If you are looking for an Indian food menu in Milton Keynes that goes beyond the usual curry-house list, this is it: a South Indian food menu, and an Andhra food menu of home-style dishes.',
      ],
      links: [['South Indian breakfast', '/breakfast'], ['Vegetarian menu', '/prasada'], ['Non-veg menu', '/svadista'], ['Indian street food', '/street-food'], ['Ragi specials', '/ragi-specials'], ['Drinks & lassi', '/drinks']],
    },
  },

  '/prasada': {
    primary: 'pure veg south indian food milton keynes',
    title: `Pure Veg South Indian Food Milton Keynes${B}`,
    description: 'Pure veg South Indian food in Milton Keynes — vegetarian Andhra curries, veg thali, rice dishes and temple-style naivedyam, cooked with separate utensils.',
    keywords: ['pure veg South Indian food Milton Keynes', 'vegetarian South Indian restaurant', 'vegetarian Indian takeaway Milton Keynes', 'South Indian veg meals', 'veg Indian food near me'],
    content: {
      heading: 'Vegetarian South Indian food in Milton Keynes',
      paragraphs: [
        'Prasada is our fully vegetarian South Indian menu — no meat, fish or eggs — cooked with its own separate utensils. If you are looking for a vegetarian South Indian restaurant or a veg Indian takeaway in Milton Keynes, this is the menu for you: Andhra pappu and sambar, gutti vankaya, veg pulao and rice dishes such as gongura rice and curd rice, crisp bhajji and punugulu, a full South Indian veg thali, and temple-style naivedyam made without onion or garlic.',
        'Order South Indian veg meals online from a vegetarian Indian takeaway in Milton Keynes — to collect from Greenleys or for delivery across MK. Vegetarian and non-vegetarian food is cooked in the same kitchen, with separate utensils for Prasada dishes, and each dish page lists its allergens.',
      ],
      links: [['Veg thali', '/prasada/thalis-rice-bowls'], ['Vegetarian curries', '/prasada/curries'], ['Veg pulao & rice', '/prasada/biriyanis-rice'], ['Veg starters & chaat', '/prasada/bites-starters'], ['Naivedyam', '/prasada/naivedyam'], ['About Prasada', '/prasada/about']],
    },
  },

  '/svadista': {
    primary: 'andhra curries and biryani milton keynes',
    title: `Andhra Curries & Biryani Milton Keynes${B}`,
    description: 'Non-veg South Indian food in Milton Keynes — slow-cooked Andhra chicken curries, dum biryani, Chicken 65 and egg specials. Bold village-style flavours.',
    keywords: ['non veg South Indian food Milton Keynes', 'Andhra chicken curry Milton Keynes', 'chicken biryani Milton Keynes', 'South Indian non veg restaurant', 'Andhra food Milton Keynes'],
    content: {
      heading: 'Non-veg South Indian food in Milton Keynes',
      paragraphs: [
        'Svadista is our non-vegetarian menu: Andhra chicken curries cooked on the bone, gongura chicken, dum biryani and fry piece biryani, Chicken 65 and ghee roast, plus egg dosa and omelettes. It is the bold, village-style side of South Indian cooking, made fresh to order for delivery in Milton Keynes or collection from our Greenleys kitchen.',
        'Looking for Andhra chicken curry or chicken biryani in Milton Keynes? This is Andhra food as a Telugu home cooks it — the menu you would want from a South Indian non-veg restaurant, cooked to order as takeaway.',
      ],
      links: [['Chicken biryani', '/svadista/biriyani'], ['Andhra chicken curry', '/svadista/curries'], ['Chicken starters', '/svadista/starters'], ['Egg specials', '/svadista/egg-specials'], ['Rice bowls', '/svadista/rice-bowls'], ['About Svadista', '/svadista/about']],
    },
  },

  '/breakfast': {
    primary: 'south indian breakfast milton keynes',
    title: `South Indian Breakfast Milton Keynes${B}`,
    description: 'South Indian breakfast in Milton Keynes — crispy masala dosa, idli sambar, medu vada, poori and upma, made fresh every morning. Delivery or collection.',
    keywords: ['South Indian breakfast Milton Keynes', 'Indian breakfast near me', 'best Indian breakfast Milton Keynes', 'Indian breakfast menu', 'dosa idli vada Milton Keynes'],
    content: {
      heading: 'Indian breakfast in Milton Keynes, the South Indian way',
      paragraphs: [
        'Looking for an Indian breakfast near you in Milton Keynes? Ours is the South Indian kind: dosas from batter we ferment ourselves, soft steamed idli, crisp medu vada with sambar and chutneys, plus poori, upma, poha and uggani. Everything is made fresh each morning in our Greenleys kitchen, close to Wolverton and Stony Stratford.',
        'Order your South Indian breakfast online — dosa, idli and vada in Milton Keynes, for collection or delivery. The breakfast menu also pairs idli, vada and dosa with Andhra chicken curry, for those who like to start the day strong.',
      ],
      links: [['Dosa in Milton Keynes', '/breakfast/dosas'], ['Idli & vada', '/breakfast/idli-vada'], ['Poori, upma & poha', '/breakfast/poori-others'], ['Dosa & idli with chicken curry', '/breakfast/chicken-curry-combos'], ['About our breakfast', '/breakfast/about']],
    },
  },

  '/street-food': {
    primary: 'indian street food milton keynes',
    title: `Indian Street Food & Pani Puri Milton Keynes${B}`,
    description: 'Indian street food in Milton Keynes — pani puri, chicken and veg momos, wraps and burgers with real street-style spice. Order online for delivery or collection.',
    keywords: ['Indian street food Milton Keynes', 'pani puri Milton Keynes', 'momos Milton Keynes', 'chicken momos near me', 'Indian chaat Milton Keynes'],
  },

  '/ragi-specials': {
    primary: 'ragi sangati milton keynes',
    title: `Ragi & Millet Specials Milton Keynes${B}`,
    description: 'Ragi specials in Milton Keynes — ragi sangati with chicken curry or pappu, ragi malt and ragi buttermilk. Traditional Andhra finger millet dishes. Order online.',
    keywords: ['ragi sangati Milton Keynes', 'ragi food UK', 'finger millet dishes', 'ragi malt', 'South Indian millet food'],
    h1: 'Ragi sangati & finger millet dishes in Milton Keynes',
    content: {
      heading: 'Ragi sangati in Milton Keynes',
      paragraphs: [
        'Ragi is finger millet — the everyday grain of rural Andhra. Our ragi specials are the dishes it is eaten as at home: ragi sangati (the finger millet ball some know as ragi mudde) with chicken curry or with pappu and pachi pulusu, warm ragi malt (ragi jaava), and ragi buttermilk.',
        'Ragi food is hard to find in the UK, and South Indian millet food rarely makes it onto a takeaway menu. We cook these finger millet dishes fresh in Milton Keynes — order ragi sangati online for delivery or collection.',
      ],
      links: [['What is ragi sangati?', '/ragi-specials/about'], ['Ragi health benefits', '/blog/ragi-health-benefits'], ['Order online', '/order']],
    },
  },

  '/drinks': {
    primary: 'mango lassi milton keynes',
    title: `Mango Lassi & Indian Drinks Milton Keynes${B}`,
    description: 'Mango lassi in Milton Keynes — plus sweet lassi, masala buttermilk, fresh juices and lemon water. Indian drinks made to order for delivery or collection.',
    keywords: ['mango lassi Milton Keynes', 'Indian drinks Milton Keynes', 'lassi near me', 'masala buttermilk', 'fresh juice Milton Keynes'],
  },

  '/snacks': {
    primary: 'andhra pickles uk',
    title: `Andhra Pickles & Podis UK — Coming Soon${B}`,
    description: 'Handmade Andhra pickles and podis — mango avakaya, gongura pickle, kandi podi and more — coming soon to order online in the UK. Tap Notify Me or WhatsApp us.',
    keywords: ['Andhra pickles UK', 'Indian pickles online UK', 'Telugu pickles UK', 'gongura pickle', 'mango avakaya', 'kandi podi'],
    h1: 'Andhra pickles & podis — coming soon',
  },

  '/subscriptions': {
    primary: 'indian tiffin service milton keynes',
    title: `Indian Tiffin Service Milton Keynes${B}`,
    description: 'Indian tiffin service in Milton Keynes — home-cooked South Indian meals delivered Monday to Friday. Veg or non-veg tiffin from £75 a week. No auto-renewal.',
    keywords: ['Indian tiffin service Milton Keynes', 'tiffin service near me', 'Indian vegetarian tiffin service', 'home made tiffin service', 'dabba service Milton Keynes', 'tiffin box delivery', 'Indian lunch delivery Milton Keynes'],
  },

  '/subscriptions/about': {
    primary: 'how the dabba wala tiffin service works',
    title: `How Our Tiffin Service Works — Dabba Wala${B}`,
    description: 'How the Dabba Wala tiffin service works in Milton Keynes — fresh home-cooked Andhra and Telugu meals, cooked each morning and delivered Monday to Friday.',
    keywords: ['how tiffin service works', 'Dabba Wala Milton Keynes', 'weekly Indian meal plan', 'home cooked Indian meals delivered'],
  },

  '/svadista/about': {
    primary: 'about svadista non-veg andhra cooking',
    title: `About Svadista — Andhra Non-Veg Cooking${B}`,
    description: 'The story behind Svadista — gongura chicken, whole grilled chicken and authentic Andhra and Telugu non-vegetarian cooking, made fresh in Milton Keynes.',
    keywords: ['Andhra non veg food', 'Telugu non veg cooking', 'gongura chicken', 'South Indian non veg food Milton Keynes'],
  },

  '/prasada/about': {
    primary: 'about prasada vegetarian andhra cooking',
    title: `About Prasada — Vegetarian Andhra Cooking${B}`,
    description: 'The story behind Prasada — gongura pappu, gutti vankaya, punugulu, naivedyam rice and the breadth of Andhra vegetarian cooking, made fresh in Milton Keynes.',
    keywords: ['Andhra vegetarian food', 'pure veg South Indian cooking', 'naivedyam', 'vegetarian Telugu food Milton Keynes'],
  },

  '/breakfast/about': {
    primary: 'about our south indian breakfast',
    title: `About Our South Indian Breakfast${B}`,
    description: 'The story behind our South Indian breakfast — dosas from fermented batter, Nellore ghee karam dosa, uggani and Andhra tiffin classics, made fresh daily.',
    keywords: ['South Indian breakfast', 'Andhra tiffins', 'Nellore karam dosa', 'uggani', 'Indian breakfast Milton Keynes'],
  },

  '/ragi-specials/about': {
    primary: 'what is ragi sangati',
    title: `What Is Ragi Sangati?${B}`,
    description: 'Ragi sangati is the soul food of Andhra — finger millet cooked into a wholesome ball and served with curry, pappu or pulusu. Made fresh in Milton Keynes.',
    keywords: ['what is ragi sangati', 'ragi sangati', 'ragi mudde', 'finger millet ball', 'Andhra ragi food'],
  },

  '/catering': {
    primary: 'indian catering milton keynes',
    title: `Indian Catering Milton Keynes${B}`,
    description: 'Indian catering in Milton Keynes — South Indian food for weddings, corporate events and family celebrations. Veg and non-veg menus tailored to you. Get a quote.',
    keywords: ['Indian catering Milton Keynes', 'South Indian catering', 'Indian wedding catering Milton Keynes', 'Indian corporate catering Milton Keynes', 'Indian vegetarian catering', 'Indian party catering Buckinghamshire'],
    content: {
      heading: 'An Indian catering service for Milton Keynes',
      paragraphs: [
        'We cater South Indian food for weddings, corporate lunches, house-warmings, temple functions and family celebrations in and around Milton Keynes. For Indian wedding catering in Milton Keynes we build the menu with you; for Indian corporate catering we can bring lunch for a whole team; and Indian vegetarian catering can be made without onion or garlic for religious events. Non-veg menus bring Andhra curries and biryani. Tell us your date, guest numbers and budget and we will send a quote.',
      ],
      links: [['Vegetarian menu', '/prasada'], ['Non-veg menu', '/svadista'], ['Contact us', '/contact']],
    },
  },

  '/delivery': {
    primary: 'indian food delivery milton keynes',
    title: `Indian Food Delivery Milton Keynes${B}`,
    description: 'South Indian food delivery across all MK postcodes in 30–60 minutes. Delivery fees from £2.49, free over £28, £15 minimum — or collect and save 10%.',
    keywords: ['Indian food delivery Milton Keynes', 'Indian delivery near me', 'South Indian food delivery', 'Indian takeaway delivery Milton Keynes', 'MK postcodes delivery'],
    h1: 'Indian Food Delivery in Milton Keynes',
  },

  '/milton-keynes': {
    primary: 'south indian restaurant milton keynes',
    title: `South Indian Restaurant & Takeaway Milton Keynes${B}`,
    description: 'South Indian takeaway kitchen in Greenleys, Milton Keynes — authentic Andhra food delivered to Wolverton, Stony Stratford, Bletchley and all MK postcodes.',
    keywords: ['South Indian restaurant Milton Keynes', 'South Indian food Milton Keynes', 'Indian takeaway Wolverton', 'Indian takeaway Stony Stratford', 'Telugu restaurant Milton Keynes', 'Andhra food Milton Keynes'],
    h1: 'South Indian Restaurant & Takeaway in Milton Keynes',
  },

  '/story': {
    primary: 'telugu and andhra food milton keynes',
    title: `Telugu & Andhra Food Milton Keynes — Our Story${B}`,
    description: 'The story behind Sree Svadista Prasada — one Telugu woman\'s dream of giving people far from home the food their amma made. Andhra cooking in Milton Keynes.',
    keywords: ['Telugu restaurant Milton Keynes', 'Andhra food Milton Keynes', 'Telugu food UK', 'authentic South Indian food', 'Sree Svadista Prasada'],
    h1: 'Telugu & Andhra home cooking in Milton Keynes',
  },

  '/faq': {
    primary: 'sree svadista prasada faqs',
    title: `FAQs — Ordering, Delivery, Tiffin & Allergens${B}`,
    description: 'Answers about ordering from Sree Svadista Prasada in Milton Keynes — delivery and collection, the Dabba Wala tiffin service, vegetarian food and allergens.',
    keywords: ['Indian takeaway FAQs', 'delivery postcodes Milton Keynes', 'tiffin service questions', 'vegetarian and allergen information'],
    h1: 'Ordering, delivery, tiffin service & allergens',
  },

  '/contact': {
    primary: 'indian takeaway greenleys milton keynes',
    title: `Contact Us — Greenleys, Milton Keynes MK12${B}`,
    description: 'Contact Sree Svadista Prasada — Indian takeaway kitchen at 24 Oxman Lane, Greenleys, Milton Keynes MK12 6LF, near Wolverton and Stony Stratford. WhatsApp us.',
    keywords: ['Indian takeaway Greenleys', 'Indian takeaway Wolverton', 'Indian takeaway Stony Stratford', 'Indian takeaway MK12', 'contact Sree Svadista Prasada'],
    h1: 'Indian takeaway kitchen in Greenleys, Milton Keynes — near Wolverton & Stony Stratford',
  },

  '/gallery': {
    primary: 'south indian food photos',
    title: `South Indian Food Gallery${B}`,
    description: 'Photos of our South Indian food and kitchen in Milton Keynes — dosas, biryani, Andhra curries, thali and the cooking behind them.',
    keywords: ['South Indian food photos', 'Andhra food gallery', 'Indian takeaway Milton Keynes photos'],
  },

  '/blog': {
    primary: 'south indian food blog',
    title: `South Indian Food Blog${B}`,
    description: 'Guides to South Indian and Andhra cuisine — dosa and biryani in Milton Keynes, what is Dabba Wala, ragi health benefits, South vs North Indian food and gongura.',
    keywords: ['South Indian food blog', 'Andhra cuisine guides', 'Telugu food', 'Indian food guides'],
  },

  '/blog/dosa-milton-keynes': {
    primary: 'dosa milton keynes guide',
    title: `Dosa in Milton Keynes — A Guide to Every Dosa We Make${B}`,
    description: 'Where to get proper dosa in Milton Keynes: every variety we make, from plain and ghee to Nellore karam, all from traditionally fermented batter. From £4.99.',
    keywords: ['dosa Milton Keynes', 'types of dosa', 'masala dosa', 'Nellore karam dosa', 'best dosa Milton Keynes'],
  },

  '/blog/biryani-milton-keynes': {
    primary: 'biryani milton keynes guide',
    title: `Biryani in Milton Keynes — The Andhra Way${B}`,
    description: 'Andhra-style chicken biryani in Milton Keynes — dum biryani, fry piece biryani, and the spiced rice plates that sit beside them. Order online.',
    keywords: ['biryani Milton Keynes', 'best biryani Milton Keynes', 'Andhra biryani', 'chicken dum biryani', 'fry piece biryani'],
  },

  '/blog/what-is-dabba-wala': {
    primary: 'what is dabba wala',
    title: `What Is Dabba Wala? Indian Tiffin Delivery Explained${B}`,
    description: 'Dabba Wala (dabbawala) is Mumbai’s legendary tiffin delivery system. Its history, how it works, and how our tiffin service brings it to Milton Keynes.',
    keywords: ['what is Dabba Wala', 'dabbawala meaning', 'Indian tiffin delivery', 'Mumbai dabbawala', 'tiffin service Milton Keynes'],
  },

  '/blog/south-indian-vs-north-indian-food': {
    primary: 'south indian vs north indian food',
    title: `South Indian vs North Indian Food${B}`,
    description: 'Rice vs wheat, tamarind vs cream, Guntur chilli vs Kashmiri — what really separates South Indian and North Indian food: ingredients, methods and breakfast.',
    keywords: ['South Indian vs North Indian food', 'difference between South and North Indian food', 'what is South Indian food', 'Andhra cuisine'],
  },

  '/blog/ragi-health-benefits': {
    primary: 'ragi health benefits',
    title: `Ragi Health Benefits — The South Indian Superfood${B}`,
    description: 'Ragi (finger millet) has more calcium than milk, a low glycaemic index and plenty of fibre. Its nutrition, health benefits and how we cook it in Andhra dishes.',
    keywords: ['ragi health benefits', 'finger millet benefits', 'ragi nutrition', 'what is ragi', 'ragi sangati'],
  },

  '/gongura': {
    primary: 'what is gongura',
    title: `What Is Gongura? The Andhra Sorrel Leaf Guide${B}`,
    description: 'Gongura is the tangy sorrel leaf of Andhra Pradesh. What gongura is, how it tastes, its name in English, and where to eat gongura chicken in the UK.',
    keywords: ['what is gongura', 'gongura in English', 'gongura taste', 'gongura leaves', 'gongura chicken UK', 'Andhra sorrel'],
  },
};

/** Next.js metadata for a static page listed above. `image` keeps the page's existing social image. */
export function pageMeta(path, { image, type = 'website', extra = {} } = {}) {
  const s = PAGE_SEO[path];
  if (!s) throw new Error(`No SEO entry for ${path}`);
  const url = path === '/' ? SITE : `${SITE}${path}`;
  const images = image ? [{ url: image, width: 1200, height: 630, alt: s.title.replace(B, '') }] : undefined;
  return {
    title: { absolute: s.title },
    description: s.description,
    keywords: s.keywords,
    alternates: { canonical: url },
    openGraph: { title: s.title, description: s.description, url, siteName: BRAND, locale: 'en_GB', type, ...(images ? { images } : {}) },
    twitter: { card: 'summary_large_image', title: s.title, description: s.description, ...(image ? { images: [image] } : {}) },
    ...extra,
  };
}

/* ── Dish pages ─────────────────────────────────────────────────────────────
 * One pattern for all ~130 dishes: "<Dish> in Milton Keynes | Brand".
 * The old pattern put "Indian Takeaway Milton Keynes" in every dish title,
 * which competed with the homepage for its own primary keyword and pushed
 * every title past 70 characters. Pickles and podis are not a Milton Keynes
 * product (UK-wide, coming soon), so they are labelled by what they are. */
const stripSize = (name) => name.replace(/\s*\(\s*\d[^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

export function dishSeo(item) {
  const name = stripSize(item.name || '');
  const cat = (item.category || '').toLowerCase();
  if (cat === 'pickles') return { name, title: `${name} — Andhra Pickle${B}`, keywords: [name, `${name} UK`, 'Andhra pickles UK', 'Indian pickles online'] };
  if (cat === 'podis') return { name, title: `${name} — Andhra Podi${B}`, keywords: [name, `${name} UK`, 'Andhra podi', 'South Indian spice powder'] };
  return {
    name,
    title: `${name} in Milton Keynes${B}`,
    keywords: [name, `${name} Milton Keynes`, `${name} near me`, `${name} takeaway`, 'Indian takeaway Milton Keynes'],
    line: `${name} in Milton Keynes — order online for delivery or collection`,
  };
}

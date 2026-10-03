/**
 * Search wording for each menu sub-page: the page title, the line under the
 * section name in the H1, and the meta description.
 *
 * Each sub-page targets the search people actually make for that food in
 * Milton Keynes ("biryani milton keynes", "dosa milton keynes" …) instead of
 * sharing its parent section's heading. Only dishes that are on the live menu
 * are named, and nothing here promises delivery — that depends on the admin
 * Delivery switch. Titles get " | Sree Svadista Prasada" appended by the layout.
 */
export const CATEGORY_SEO = {
  svadista: {
    'starters': {
      title: 'Chicken Starters Milton Keynes',
      h1: 'Andhra chicken starters in Milton Keynes — Chicken 65, lollipop & pepper chicken',
      description: 'Andhra chicken starters in Milton Keynes — Chicken 65, chicken lollipop, pepper chicken and ghee roast, cooked fresh to order. Order online for delivery or collection.',
    },
    'indo-chinese': {
      title: 'Indo-Chinese Takeaway Milton Keynes',
      h1: 'Indo-Chinese in Milton Keynes — chicken & egg fried rice',
      description: 'Indo-Chinese takeaway in Milton Keynes — chicken fried rice and Schezwan egg fried rice, wok-cooked to order. Order online from our Greenleys kitchen.',
    },
    'egg-specials': {
      title: 'Egg Dosa & Omelettes Milton Keynes',
      h1: 'Egg specials in Milton Keynes — egg dosa, omelettes & Andhra egg curry',
      description: 'Egg dosa, bread omelette, egg bhurji and Andhra egg curry in Milton Keynes — home-style egg dishes cooked fresh. Order online for delivery or collection.',
    },
    'curries': {
      title: 'Andhra Chicken Curry Milton Keynes',
      h1: 'Andhra chicken curry in Milton Keynes — gongura chicken & home-style curries',
      description: 'Andhra chicken curry in Milton Keynes — gongura chicken, spicy Andhra chicken and home-style bone-in curry, slow-cooked with freshly ground spices.',
    },
    'biriyani': {
      title: 'Chicken Biryani Milton Keynes',
      h1: 'Chicken biryani in Milton Keynes — Andhra dum & fry piece biryani',
      description: 'Chicken biryani in Milton Keynes, the Andhra way — dum biryani and fry piece biryani, layered and slow-cooked. Order online from our Greenleys kitchen.',
    },
    'rice-bowls': {
      title: 'Chicken Rice Bowls Milton Keynes',
      h1: 'Rice bowls in Milton Keynes — rice, chicken curry, pickle & omelette',
      description: 'A home-style Andhra meal in one bowl — rice, chicken curry, pickle and omelette. Fresh rice bowls in Milton Keynes. Order online for delivery or collection.',
    },
  },
  prasada: {
    'bites-starters': {
      title: 'Veg Starters & Chaat Milton Keynes',
      h1: 'Vegetarian starters in Milton Keynes — mirchi bhajji, punugulu & chaat',
      description: 'Vegetarian Indian starters in Milton Keynes — mirchi bhajji, punugulu, crispy corn and chaat, fried fresh to order. Order online for delivery or collection.',
    },
    'curries': {
      title: 'Vegetarian Curry Milton Keynes',
      h1: 'Vegetarian Andhra curries in Milton Keynes — pappu, sambar, rasam & gutti vankaya',
      description: 'Vegetarian South Indian curries in Milton Keynes — tomato pappu, sambar, rasam and gutti vankaya masala, cooked the Andhra home way. Order online.',
    },
    'biriyanis-rice': {
      title: 'Veg Biryani & Rice Milton Keynes',
      h1: 'Veg biryani & South Indian rice in Milton Keynes — pulihora, lemon rice & more',
      description: 'Veg biryani and South Indian rice dishes in Milton Keynes — pulihora, lemon rice, jeera rice, curd rice and veg pulao. Pure vegetarian. Order online.',
    },
    'thalis-rice-bowls': {
      title: 'Veg Thali Milton Keynes',
      h1: 'Veg thali in Milton Keynes — a full South Indian meal on one plate',
      description: 'South Indian veg thali in Milton Keynes — rice, pappu, sambar, curries, fries, pickle and more on one plate. Pure vegetarian. Order online for delivery or collection.',
    },
    'indo-chinese': {
      title: 'Veg Indo-Chinese Milton Keynes',
      h1: 'Vegetarian Indo-Chinese in Milton Keynes',
      description: 'Vegetarian Indo-Chinese in Milton Keynes — veg fried rice, wok-cooked to order with separate vegetarian utensils. Order online for delivery or collection.',
    },
    'naivedyam': {
      title: 'Naivedyam & Temple Food Milton Keynes',
      h1: 'Naivedyam in Milton Keynes — temple-style pulihora & pongal',
      description: 'Naivedyam in Milton Keynes — temple-style pulihora and pongal, prepared without onion or garlic in the sattvic tradition. Order online for delivery or collection.',
    },
  },
  breakfast: {
    'idli-vada': {
      title: 'Idli & Vada Milton Keynes',
      h1: 'Idli & vada in Milton Keynes — steamed idli, medu vada & sambar',
      description: 'Idli and vada in Milton Keynes — soft steamed idli, crisp medu vada, sambar and chutneys, made fresh every morning. Order online for delivery or collection.',
    },
    'dosas': {
      title: 'Dosa Milton Keynes — Masala, Ghee & Karam',
      h1: 'Dosa in Milton Keynes — masala, ghee, onion & Nellore karam dosa',
      description: 'Dosa in Milton Keynes — masala dosa, ghee dosa, onion dosa and fiery Nellore karam dosa, from traditionally fermented batter. Order online for delivery or collection.',
    },
    'chicken-curry-combos': {
      title: 'Dosa & Idli with Chicken Curry Milton Keynes',
      h1: 'Idli, vada & dosa with Andhra chicken curry in Milton Keynes',
      description: 'The Andhra breakfast classic in Milton Keynes — idli, vada or dosa with a bowl of spicy chicken curry. Cooked fresh. Order online for delivery or collection.',
    },
    'poori-others': {
      title: 'Poori, Upma & Poha Milton Keynes',
      h1: 'Poori, upma & poha in Milton Keynes',
      description: 'Poori, upma and poha in Milton Keynes — light South Indian breakfast plates made fresh every morning. Order online for delivery or collection.',
    },
    'english-breakfast': {
      title: 'Bread Omelette & Breakfast Milton Keynes',
      h1: 'Bread omelette, avocado toast & overnight oats in Milton Keynes',
      description: 'Bread omelette, cheese bread omelette, avocado toast and overnight oats in Milton Keynes — breakfast plates made fresh. Order online for delivery or collection.',
    },
  },
};

export const categorySeo = (section, slug) => CATEGORY_SEO[section]?.[slug] || null;

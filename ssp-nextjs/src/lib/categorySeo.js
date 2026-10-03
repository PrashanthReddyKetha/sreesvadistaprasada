/**
 * Search wording for each menu sub-page — keyword set frozen 2026-10-03
 * (see src/lib/seo/pages.js for the rules and docs/ops/seo/ for the record).
 *
 * Each sub-page targets the search people actually make for that food in
 * Milton Keynes ("chicken biryani milton keynes", "dosa milton keynes" …)
 * instead of sharing its parent section's heading. Only dishes on the live
 * menu are named. Titles get " | Sree Svadista Prasada" appended by the layout.
 *
 *   title       → <title>
 *   h1          → the keyword line under the section name in the H1
 *   description → meta description (≤ 160 characters)
 *   keywords    → meta keywords (record of intent; Google ignores the tag)
 *   body        → a short paragraph rendered at the foot of the sub-page, so
 *                 each one has copy of its own
 */
export const CATEGORY_SEO = {
  svadista: {
    'starters': {
      title: 'Chicken Starters Milton Keynes',
      h1: 'Andhra chicken starters in Milton Keynes — Chicken 65, lollipop & pepper chicken',
      description: 'Andhra chicken starters in Milton Keynes — Chicken 65, chicken lollipop, pepper chicken and ghee roast, cooked fresh. Order for delivery or collection.',
      keywords: ['chicken starters Milton Keynes', 'Chicken 65 Milton Keynes', 'chicken lollipop near me', 'pepper chicken', 'chicken ghee roast'],
      body: 'Our chicken starters are the Andhra kind: Chicken 65, chicken lollipop, pepper chicken, garlic pepper chicken, chicken ghee roast, tandoori chicken and crisp chicken pakoda, with prawns ghee roast and a whole grilled chicken for sharing. Each is cooked to order in our Milton Keynes kitchen — good with a biryani, or on their own.',
    },
    'indo-chinese': {
      title: 'Indo-Chinese Takeaway Milton Keynes',
      h1: 'Indo-Chinese in Milton Keynes — chicken & egg fried rice',
      description: 'Indo-Chinese takeaway in Milton Keynes — chicken fried rice and Schezwan egg fried rice, wok-cooked to order. Order online from our Greenleys kitchen.',
      keywords: ['Indo-Chinese Milton Keynes', 'chicken fried rice Milton Keynes', 'egg fried rice near me', 'Schezwan fried rice'],
      body: 'Indo-Chinese is the food of Indian street corners: rice tossed hard and fast in a hot wok with garlic, soy and chilli. We make chicken fried rice and a fiery Schezwan egg fried rice, cooked to order in Milton Keynes. Order chicken fried rice in Milton Keynes on its own, or beside Chicken 65 or pepper chicken from our starters — Indo-Chinese takeaway the way Indian street stalls make it, and Schezwan fried rice with real heat.',
    },
    'egg-specials': {
      title: 'Egg Dosa & Omelettes Milton Keynes',
      h1: 'Egg specials in Milton Keynes — egg dosa, egg bhurji & omelettes',
      description: 'Egg dosa, egg bhurji, bread omelette and cheese omelette in Milton Keynes — home-style egg dishes cooked fresh. Order online for delivery or collection.',
      keywords: ['egg dosa Milton Keynes', 'bread omelette Milton Keynes', 'egg bhurji', 'Indian omelette near me'],
      body: 'Egg dosa, egg bhurji, bread omelette, cheese bread omelette and cheese omelette — the egg dishes of an Indian home kitchen, cooked fresh to order in Milton Keynes. Our egg dosa is made on the same fermented batter as the breakfast dosas, and the bread omelette is the Indian street-side kind. Order egg dosa or a bread omelette in Milton Keynes for collection or delivery. For Andhra egg curry, see our curries.',
    },
    'curries': {
      title: 'Andhra Chicken Curry Milton Keynes',
      h1: 'Andhra chicken curry in Milton Keynes — gongura chicken & home-style curries',
      description: 'Andhra chicken curry in Milton Keynes — gongura chicken, spicy Andhra chicken and home-style bone-in curry, slow-cooked with freshly ground spices.',
      keywords: ['Andhra chicken curry Milton Keynes', 'gongura chicken Milton Keynes', 'chicken curry takeaway Milton Keynes', 'fish pulusu', 'Andhra egg curry'],
      body: 'These are Andhra curries as they are made at home: chicken cooked on the bone with freshly ground spices, a fiery spicy Andhra chicken curry, gongura chicken soured with sorrel leaves, fish pulusu in tamarind gravy and Andhra egg curry. Order a chicken curry takeaway in Milton Keynes with rice, or pair it with idli or dosa.',
    },
    'biriyani': {
      title: 'Chicken Biryani Milton Keynes',
      h1: 'Chicken biryani in Milton Keynes — Andhra dum & fry piece biryani',
      description: 'Chicken biryani in Milton Keynes, the Andhra way — dum biryani and fry piece biryani, layered and slow-cooked. Order online from our Greenleys kitchen.',
      keywords: ['chicken biryani Milton Keynes', 'biryani Milton Keynes', 'best biryani Milton Keynes', 'chicken dum biryani', 'fry piece biryani'],
      body: 'We make chicken biryani two ways. Chicken dum biryani is layered with rice and slow-cooked under a sealed lid; chicken fry piece biryani tops spiced rice with crisp-fried chicken, the Andhra favourite. Both are cooked fresh in Milton Keynes — read our guide to biryani the Andhra way for the difference. Order chicken biryani in Milton Keynes to collect from Greenleys or have delivered, and add Chicken 65 or a cooling curd rice alongside.',
    },
    'rice-bowls': {
      title: 'Chicken Rice Bowls Milton Keynes',
      h1: 'Rice bowls in Milton Keynes — rice, chicken curry, pickle & omelette',
      description: 'A home-style Andhra meal in one bowl — rice, chicken curry, pickle and omelette. Fresh rice bowls in Milton Keynes for delivery or collection.',
      keywords: ['chicken rice bowl Milton Keynes', 'South Indian meals Milton Keynes', 'non veg meal Milton Keynes', 'Indian lunch Milton Keynes'],
      body: 'A South Indian non-veg meal in one bowl: steamed rice, chicken curry, pickle and an omelette — what a Telugu home puts on the table for lunch. Made fresh in Milton Keynes. If you want an Indian lunch in Milton Keynes without choosing four dishes, this chicken rice bowl is the non-veg meal to order — one of our South Indian meals in Milton Keynes, ready to collect or have delivered.',
    },
  },
  prasada: {
    'bites-starters': {
      title: 'Veg Starters & Chaat Milton Keynes',
      h1: 'Vegetarian starters in Milton Keynes — mirchi bhajji, punugulu & chaat',
      description: 'Vegetarian Indian starters in Milton Keynes — mirchi bhajji, punugulu, crispy corn and chaat, fried fresh to order. Order for delivery or collection.',
      keywords: ['veg starters Milton Keynes', 'mirchi bhajji Milton Keynes', 'punugulu', 'Indian chaat Milton Keynes', 'vegetarian Indian snacks'],
      body: 'Evening snacks the Andhra way: mirchi bhajji, onion mirchi bhajji, punugulu, crispy corn, crispy bhindi, zucchini fritters, and channa chat and peanut chat. All vegetarian, fried fresh to order in Milton Keynes. These are the vegetarian Indian snacks of an Andhra evening — veg starters and Indian chaat in Milton Keynes, good with tea or before a thali.',
    },
    'curries': {
      title: 'Vegetarian Curry Milton Keynes',
      h1: 'Vegetarian Andhra curries in Milton Keynes — pappu, sambar, rasam & gutti vankaya',
      description: 'Vegetarian South Indian curries in Milton Keynes — tomato pappu, sambar, rasam and gutti vankaya masala, cooked the Andhra home way. Order online.',
      keywords: ['vegetarian curry Milton Keynes', 'sambar Milton Keynes', 'rasam near me', 'gutti vankaya', 'Andhra pappu'],
      body: 'The vegetarian curries of an Andhra kitchen: tomato pappu and gongura pappu, sambar and rasam, gutti vankaya masala, aloo kurma, perugu pulusu, bhindi pulusu, and drumstick or brinjal cooked with tomato. Order vegetarian curry in Milton Keynes with rice from the same menu. Sambar in Milton Keynes should taste like this: slow-cooked dal, tamarind and vegetables, with rasam beside it.',
    },
    'biriyanis-rice': {
      title: 'Veg Pulao & South Indian Rice Milton Keynes',
      h1: 'South Indian veg rice in Milton Keynes — veg pulao, gongura rice, curd rice & more',
      description: 'Veg pulao and South Indian rice dishes in Milton Keynes — gongura rice, jeera rice, sambar rice and curd rice. Our vegetarian answer to biryani. Order online.',
      keywords: ['veg pulao Milton Keynes', 'veg biryani Milton Keynes', 'jeera rice near me', 'curd rice', 'South Indian rice dishes'],
      body: 'Looking for veg biryani in Milton Keynes? Our vegetarian menu makes veg pulao and Andhra spiced rice instead: gongura rice, ghee pappu avakaya rice, sambar rice, rasam rice, jeera rice, tomato, coconut, pudina and coriander rice, and cooling curd rice. Every one is vegetarian and cooked to order.',
    },
    'thalis-rice-bowls': {
      title: 'Veg Thali Milton Keynes',
      h1: 'Veg thali in Milton Keynes — a full South Indian meal on one plate',
      description: 'South Indian veg thali in Milton Keynes — rice, pappu, sambar, curries, fries, pickle and more on one plate. Vegetarian. Order for delivery or collection.',
      keywords: ['veg thali Milton Keynes', 'South Indian thali near me', 'vegetarian thali', 'South Indian veg meals', 'Indian thali takeaway'],
      body: 'Our South Indian veg thali is a complete meal: rice with pappu, sambar and majjiga pulusu, vegetable fries, pickle and more. There is also a simpler plate of pappu, pappadam, roti pachadi, rice and yoghurt. If you are searching for a South Indian thali near you in Milton Keynes, this is the vegetarian one to order — an Indian thali takeaway for collection or delivery.',
    },
    'indo-chinese': {
      title: 'Veg Indo-Chinese Milton Keynes',
      h1: 'Vegetarian Indo-Chinese in Milton Keynes',
      description: 'Vegetarian Indo-Chinese in Milton Keynes — veg fried rice, wok-cooked to order with separate vegetarian utensils. Order for delivery or collection.',
      keywords: ['veg fried rice Milton Keynes', 'vegetarian Indo-Chinese', 'veg Indo-Chinese takeaway'],
      body: 'Vegetarian Indo-Chinese from our Prasada menu: veg fried rice, wok-cooked to order with its own vegetarian utensils. It is veg fried rice in Milton Keynes the Indo-Chinese way — rice tossed fast in a hot wok with vegetables, garlic, soy and chilli. A veg Indo-Chinese takeaway dish that goes well with crispy corn or mirchi bhajji from our starters.',
    },
    'naivedyam': {
      title: 'Naivedyam & Temple Food Milton Keynes',
      h1: 'Naivedyam in Milton Keynes — temple-style pulihora & lemon rice',
      description: 'Naivedyam in Milton Keynes — temple-style pulihora, prasadam pulihora and lemon rice, prepared without onion or garlic in the sattvic tradition.',
      keywords: ['naivedyam Milton Keynes', 'pulihora Milton Keynes', 'prasadam pulihora', 'temple food UK', 'no onion no garlic food'],
      body: 'Naivedyam is food first prepared as an offering. Ours is pulihora, prasadam pulihora and lemon rice, made without onion or garlic in the sattvic tradition — for festivals, poojas, or simply because tamarind rice is what home tastes like. Order pulihora in Milton Keynes for a pooja or a festival — temple food with no onion and no garlic — and tell us in advance if you need larger quantities.',
    },
  },
  breakfast: {
    'idli-vada': {
      title: 'Idli & Vada Milton Keynes',
      h1: 'Idli & vada in Milton Keynes — steamed idli, medu vada & sambar',
      description: 'Idli and vada in Milton Keynes — soft steamed idli, crisp medu vada, sambar and chutneys, made fresh every morning. Order for delivery or collection.',
      keywords: ['idli Milton Keynes', 'vada Milton Keynes', 'idli sambar near me', 'medu vada', 'ghee karam idli'],
      body: 'Soft steamed idli from slow-fermented batter and crisp medu vada, served with sambar and chutneys. Try sambar idli, sambar vada, button idli, ghee karam idli or perugu vada in yoghurt — idli and vada in Milton Keynes, made fresh each morning.',
    },
    'dosas': {
      title: 'Dosa Milton Keynes — Masala, Ghee & Karam',
      h1: 'Dosa in Milton Keynes — masala, ghee, onion & Nellore karam dosa',
      description: 'Dosa in Milton Keynes — masala dosa, ghee dosa, onion dosa and fiery Nellore karam dosa, from traditionally fermented batter. Order online.',
      keywords: ['dosa Milton Keynes', 'masala dosa Milton Keynes', 'dosa near me', 'ghee dosa', 'Nellore karam dosa'],
      body: 'Every dosa starts with batter we ferment ourselves. Choose plain, masala, ghee, butter, onion, cheese or paneer dosa, the fiery Nellore ghee karam dosa, or carrot, beetroot and upma dosa. If you are searching for a masala dosa near you in Milton Keynes, order online — and read our dosa guide to tell them apart.',
    },
    'chicken-curry-combos': {
      title: 'Dosa & Idli with Chicken Curry Milton Keynes',
      h1: 'Idli, vada & dosa with Andhra chicken curry in Milton Keynes',
      description: 'The Andhra breakfast classic in Milton Keynes — idli, vada or dosa with a bowl of spicy chicken curry. Cooked fresh. Order for delivery or collection.',
      keywords: ['dosa with chicken curry', 'idli chicken curry Milton Keynes', 'non veg breakfast Milton Keynes', 'Andhra breakfast'],
      body: 'In Andhra, idli and dosa are as likely to meet chicken curry as chutney. Order idli, vada or plain dosa with a bowl of our spicy Andhra chicken curry — a non-veg South Indian breakfast in Milton Keynes. Dosa with chicken curry is how many Telugu homes do a weekend breakfast, and idli with chicken curry in Milton Keynes is not easy to find, so we put both on the menu.',
    },
    'poori-others': {
      title: 'Poori, Upma & Poha Milton Keynes',
      h1: 'Poori, upma, poha & uggani in Milton Keynes',
      description: 'Poori, upma, poha and uggani in Milton Keynes — light South Indian breakfast plates made fresh every morning. Order online for delivery or collection.',
      keywords: ['poori Milton Keynes', 'upma near me', 'poha Milton Keynes', 'uggani', 'Indian breakfast Milton Keynes'],
      body: 'Lighter South Indian breakfast plates: puffed poori, upma, poha and uggani, the puffed-rice breakfast of Rayalaseema. Made fresh each morning in Milton Keynes. Order poori in Milton Keynes, or upma and poha for a lighter Indian breakfast in Milton Keynes.',
    },
    'english-breakfast': {
      title: 'Bread Omelette & Breakfast Milton Keynes',
      h1: 'Bread omelette, avocado toast & overnight oats in Milton Keynes',
      description: 'Bread omelette, cheese bread omelette, avocado toast and overnight oats in Milton Keynes — breakfast plates made fresh. Order for delivery or collection.',
      keywords: ['bread omelette Milton Keynes', 'avocado toast Milton Keynes', 'overnight oats', 'breakfast takeaway Milton Keynes'],
      body: 'For a simpler start: bread omelette and cheese bread omelette, avocado toast and an overnight oats bowl, made fresh in Milton Keynes. A breakfast takeaway in Milton Keynes for the days you want something plain — a bread omelette or avocado toast in Milton Keynes, alongside the dosa and idli.',
    },
  },
};

export const categorySeo = (section, slug) => CATEGORY_SEO[section]?.[slug] || null;

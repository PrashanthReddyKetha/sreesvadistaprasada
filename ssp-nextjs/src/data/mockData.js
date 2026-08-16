// Comprehensive mock data for Sree Svadista Prasada

export const heroSlides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1587409059079-e1f9f840caa0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920',
    title: "Welcome Home.",
    subtitle: "The authentic taste you missed, carried forward with love.",
    description: "Now serving Milton Keynes, Edinburgh & Glasgow.",
    cta: "Explore Our Kitchen",
    link: "/menu"
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1606791422814-b32c705e3e2f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920',
    title: "Two Kitchens.\nOne Soul.",
    subtitle: "Divinity for the soul. Spice for the heart.",
    description: "Prasada & Svadista — choose your world.",
    cta: "Discover Our Menus",
    link: "#two-worlds"
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1727404679933-99daa2a7573a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920',
    title: "Your Daily Dose\nof Home.",
    subtitle: "Wholesome meal subscriptions delivered to your door.",
    description: "The Dabba Wala service — just like mother used to pack.",
    cta: "Start Your Subscription",
    link: "/subscriptions"
  }
];

export const featuredDishes = [
  {
    id: 1,
    name: "Andhra Kodi Pulusu",
    category: "Non-Veg",
    type: "svadista",
    description: "Slow-cooked country chicken simmered in roasted coriander and red chillies. The aroma will remind you of Sunday lunches at your grandmother's house.",
    price: "£12.99",
    spiceLevel: 3,
    image: "https://images.unsplash.com/photo-1773209927959-b2959be5e684?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    tag: "Bestseller",
    allergens: ["none"]
  },
  {
    id: 2,
    name: "Pulihora (Tamarind Rice)",
    category: "Prasada",
    type: "prasada",
    description: "Temple-style tangy tamarind rice, prepared with hand-pounded spices and pure devotion.",
    price: "£8.99",
    spiceLevel: 1,
    image: "https://images.unsplash.com/photo-1752673508949-f4aeeaef75f0?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    tag: "Chef's Pick",
    allergens: ["nuts"]
  },
  {
    id: 3,
    name: "Natu Kodi Biriyani",
    category: "Non-Veg",
    type: "svadista",
    description: "Country chicken biriyani with aromatic basmati rice, slow-cooked in earthen pots the village way.",
    price: "£15.99",
    spiceLevel: 3,
    image: "https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    tag: "Popular",
    allergens: ["dairy"]
  },
  {
    id: 4,
    name: "Masala Dosa",
    category: "Breakfast",
    type: "prasada",
    description: "Crispy rice crepe with spiced potato filling, served with sambar and three chutneys on a banana leaf.",
    price: "£8.99",
    spiceLevel: 2,
    image: "https://images.unsplash.com/photo-1743615467363-250466982515?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    tag: "Morning Favourite",
    allergens: ["none"]
  },
  {
    id: 5,
    name: "Gutti Vankaya",
    category: "Veg",
    type: "prasada",
    description: "Stuffed brinjal curry with peanut and sesame paste, a treasured Andhra delicacy.",
    price: "£9.99",
    spiceLevel: 2,
    image: "https://images.unsplash.com/photo-1680529672551-16132239d69b?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    tag: "",
    allergens: ["nuts", "sesame"]
  },
  {
    id: 6,
    name: "Sakkarai Pongal",
    category: "Prasada",
    type: "prasada",
    description: "Sweet rice with jaggery, ghee and cashews — the divine offering that melts on your tongue.",
    price: "£7.99",
    spiceLevel: 0,
    image: "https://images.unsplash.com/photo-1666251214695-405f673b396a?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    tag: "Divine",
    allergens: ["dairy", "nuts"]
  }
];

export const mealMoments = [
  {
    id: 1,
    name: 'Breakfast',
    image: 'https://images.unsplash.com/photo-1694849789325-914b71ab4075?crop=entropy&cs=srgb&fm=jpg&q=85&w=400',
    link: '/breakfast'
  },
  {
    id: 2,
    name: 'Main Course',
    image: 'https://images.unsplash.com/photo-1742281257707-0c7f7e5ca9c6?crop=entropy&cs=srgb&fm=jpg&q=85&w=400',
    link: '/menu'
  },
  {
    id: 3,
    name: 'Snacks',
    image: 'https://images.unsplash.com/photo-1572442568216-e4a31af30b69?crop=entropy&cs=srgb&fm=jpg&q=85&w=400',
    link: '/snacks'
  },
  {
    id: 4,
    name: 'Specials',
    image: 'https://images.unsplash.com/photo-1628690570327-14e16dca1518?crop=entropy&cs=srgb&fm=jpg&q=85&w=400',
    link: '/svadista'
  }
];

export const menuItems = {
  nonVeg: [
    {
      id: 1,
      name: "Andhra Kodi Pulusu",
      description: "Traditional chicken curry with tamarind, slow-cooked in earthen pots",
      price: "£12.99",
      spiceLevel: 3,
      subcategory: "Curries",
      image: "https://images.unsplash.com/photo-1773209927959-b2959be5e684?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    },
    {
      id: 2,
      name: "Chettinad Chicken",
      description: "Spicy Tamil Nadu style chicken with roasted spices and fresh curry leaves",
      price: "£13.99",
      spiceLevel: 4,
      subcategory: "Curries",
      image: "https://images.unsplash.com/photo-1680529672551-16132239d69b?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    },
    {
      id: 3,
      name: "Natu Kodi Biriyani",
      description: "Country chicken biriyani with aromatic basmati rice, the village way",
      price: "£15.99",
      spiceLevel: 3,
      subcategory: "Biriyanis",
      image: "https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    },
    {
      id: 4,
      name: "Mutton Ghee Roast",
      description: "Slow-cooked mutton in clarified butter with aromatic Mangalorean spices",
      price: "£16.99",
      spiceLevel: 3,
      subcategory: "Starters",
      image: "https://images.unsplash.com/photo-1628690570327-14e16dca1518?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    }
  ],
  veg: [
    {
      id: 5,
      name: "Gutti Vankaya",
      description: "Stuffed brinjal curry with peanut and sesame paste, a treasured Andhra recipe",
      price: "£9.99",
      spiceLevel: 2,
      subcategory: "Curries",
      image: "https://images.unsplash.com/photo-1680529672551-16132239d69b?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    },
    {
      id: 6,
      name: "Bendakaya Pulusu",
      description: "Okra in tangy tamarind gravy, a comfort dish for every Telugu household",
      price: "£8.99",
      spiceLevel: 2,
      subcategory: "Curries",
      image: "https://images.unsplash.com/photo-1752673508949-f4aeeaef75f0?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    },
    {
      id: 7,
      name: "Veg Biriyani",
      description: "Fragrant vegetable biriyani with seasonal vegetables and raita",
      price: "£11.99",
      spiceLevel: 2,
      subcategory: "Biriyanis",
      image: "https://images.unsplash.com/photo-1727404746799-253aa9a8ace6?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    }
  ],
  prasada: [
    {
      id: 8,
      name: "Pulihora",
      description: "Temple-style tamarind rice prepared with devotion and hand-pounded spices",
      price: "£8.99",
      spiceLevel: 1,
      subcategory: "Rice",
      image: "https://images.unsplash.com/photo-1752673508949-f4aeeaef75f0?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    },
    {
      id: 9,
      name: "Sakkarai Pongal",
      description: "Sweet rice with jaggery, ghee and cashews - the divine temple offering",
      price: "£7.99",
      spiceLevel: 0,
      subcategory: "Rice",
      image: "https://images.unsplash.com/photo-1666251214695-405f673b396a?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    },
    {
      id: 10,
      name: "Sundal",
      description: "Steamed chickpea with coconut and curry leaves, a beloved temple prasadam",
      price: "£5.99",
      spiceLevel: 1,
      subcategory: "Prasadam Specials",
      image: "https://images.unsplash.com/photo-1708963993351-e30633c102ce?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    }
  ],
  breakfast: [
    {
      id: 11,
      name: "Idli (4 pcs)",
      description: "Soft steamed rice cakes with sambar and chutneys, the perfect start to your day",
      price: "£6.99",
      spiceLevel: 1,
      subcategory: "Tiffins",
      image: "https://images.unsplash.com/photo-1736239093051-508a8472a934?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    },
    {
      id: 12,
      name: "Masala Dosa",
      description: "Crispy rice crepe with spiced potato filling on a banana leaf",
      price: "£8.99",
      spiceLevel: 2,
      subcategory: "Tiffins",
      image: "https://images.unsplash.com/photo-1743615467363-250466982515?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    },
    {
      id: 13,
      name: "Upma",
      description: "Semolina porridge with vegetables and spices, a nostalgic village morning",
      price: "£6.99",
      spiceLevel: 1,
      subcategory: "Tiffins",
      image: "https://images.unsplash.com/photo-1694849789325-914b71ab4075?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    },
    {
      id: 14,
      name: "Punugulu",
      description: "Crispy idli batter fritters, perfect with coconut chutney",
      price: "£5.99",
      spiceLevel: 2,
      subcategory: "Snacks",
      image: "https://images.unsplash.com/photo-1572442568216-e4a31af30b69?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    }
  ],
  pickles: [
    {
      id: 15,
      name: "Gongura Pickle",
      description: "Tangy sorrel leaves pickle - grandmother's treasured recipe",
      price: "£4.99",
      spiceLevel: 3,
      image: "https://images.unsplash.com/photo-1621427017774-f0e7ebbda11f?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    },
    {
      id: 16,
      name: "Mango Avakaya",
      description: "Spicy raw mango pickle with mustard, the king of Telugu pickles",
      price: "£4.99",
      spiceLevel: 4,
      image: "https://images.unsplash.com/photo-1621427017774-f0e7ebbda11f?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    },
    {
      id: 17,
      name: "Lemon Pickle",
      description: "Traditional lemon pickle aged in ceramic jars",
      price: "£4.49",
      spiceLevel: 2,
      image: "https://images.unsplash.com/photo-1621427017774-f0e7ebbda11f?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"
    }
  ],
  podis: [
    {
      id: 18,
      name: "Kandi Podi",
      description: "Roasted dal powder with spices, magic on hot rice with ghee",
      price: "£3.99",
      spiceLevel: 2
    },
    {
      id: 19,
      name: "Nalla Karam",
      description: "Sesame seed chutney powder, a Telugu kitchen essential",
      price: "£3.99",
      spiceLevel: 3
    },
    {
      id: 20,
      name: "Karivepaku Podi",
      description: "Curry leaves gun powder, aromatic and soul-warming",
      price: "£3.99",
      spiceLevel: 2
    }
  ]
};

export const subscriptionPlans = [
  {
    id: 1,
    name: "Weekly Trial",
    subtitle: "5 Days",
    price: "£75",
    pricePerMeal: "£15/meal",
    duration: "per week",
    meals: "5 meals",
    description: "Pure vegetarian homely meals delivered daily — taste the difference before you commit.",
    features: [
      "One meal per day (Mon-Fri)",
      "Rotating weekly menu",
      "Fresh preparation daily",
      "Includes rice, curry, dal, and accompaniments"
    ]
  },
  {
    id: 2,
    name: "Monthly Saver",
    subtitle: "20 Days - Best Value",
    price: "£250",
    pricePerMeal: "£12.50/meal",
    duration: "per month",
    meals: "20 meals",
    description: "The complete home-food experience. Save more, eat better.",
    features: [
      "One meal per day (weekdays)",
      "Choose Veg, Non-Veg, or Mixed box",
      "Sunday special biriyani included",
      "Flexible pause & resume anytime",
      "Priority delivery slots"
    ],
    popular: true
  },
  {
    id: 3,
    name: "Family Plan",
    subtitle: "For 2-4 people",
    price: "£280",
    pricePerMeal: "£7/meal",
    duration: "per month",
    meals: "40 meals",
    description: "Feed the whole family with the taste of home. Best value per meal.",
    features: [
      "Two meals per day (weekdays)",
      "Family-sized portions",
      "Weekend specials included",
      "Custom dietary preferences",
      "Free delivery always"
    ]
  }
];

export const testimonials = [
  {
    id: 1,
    name: "Priya Sharma",
    location: "Edinburgh",
    text: "Finally found authentic Andhra food in the UK! The pulihora reminds me of my grandmother's cooking. I cried happy tears.",
    rating: 5
  },
  {
    id: 2,
    name: "Rajesh Kumar",
    location: "Glasgow",
    text: "The prasada is so pure and divine. Perfect for our weekly poojas. My mother-in-law gave it her stamp of approval!",
    rating: 5
  },
  {
    id: 3,
    name: "Anitha Reddy",
    location: "Milton Keynes",
    text: "As a student in MK, the weekly subscription is a lifesaver. Tastes exactly like home food. Amma would be proud.",
    rating: 5
  }
];

export const chefSpecial = {
  name: "Nellore Ghee Karam Dosa",
  tagline: "Crispy, fiery, and finished with hand-churned ghee — this is the dosa Nellore is famous for.",
  description: "Thin, lacy rice crepe slathered in Nellore's legendary red karam chutney and finished generously with hand-churned ghee. Served with coconut chutney, sambar, and butter. The kind of breakfast that makes you close your eyes on the first bite.",
  price: "£8.99",
  link: "/breakfast",
  category: "breakfast",
  image: "https://images.unsplash.com/photo-1743615467363-250466982515?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
};

export const images = {
  svadistaCinema: "https://images.unsplash.com/photo-1588594907301-823478af8be5?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  picklesShelf: "https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  storyTeaser: "https://images.unsplash.com/photo-1748323123788-87a32949f4b0?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  tiffin: "https://images.unsplash.com/photo-1657205937707-940bf77b2602?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  svadista: "https://images.unsplash.com/photo-1773209927959-b2959be5e684?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  prasada: "https://images.unsplash.com/photo-1742281257687-092746ad6021?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  cooking: "https://images.unsplash.com/photo-1652250406978-622a4d19e7e3?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
};

export const deliveryAreas = [
  { city: 'Milton Keynes', postcodes: 'MK1–MK19', status: 'Full Menu + Subscriptions', deliveryFee: 'Free over £30', minOrder: '£15', timing: '30-60 mins' },
  { city: 'Edinburgh', postcodes: 'EH1–EH17', status: 'Full Menu + Subscriptions', deliveryFee: 'Free over £30', minOrder: '£15', timing: '45-75 mins' },
  { city: 'Glasgow', postcodes: 'G1–G15', status: 'Full Menu + Subscriptions', deliveryFee: 'Free over £30', minOrder: '£15', timing: '45-75 mins' },
  { city: 'Rest of UK', postcodes: 'All postcodes', status: 'Snacks, Pickles & Podis Only', deliveryFee: 'Free over £25', minOrder: '£10', timing: '2-3 business days' },
];

export const faqData = [
  {
    category: 'Ordering & Delivery',
    items: [
      { q: 'Where do you deliver?', a: 'We deliver full meals and subscriptions in Milton Keynes, Edinburgh, and Glasgow. Snacks, pickles, and podis ship UK-wide.' },
      { q: 'What are the delivery charges?', a: 'Delivery is free for orders over £30 in MK, Edinburgh & Glasgow. Below £30, a flat £3.99 delivery fee applies. UK-wide snack shipping is free over £25.' },
      { q: 'What is the minimum order?', a: '£15 for meal delivery in MK/Edinburgh/Glasgow. £10 for UK-wide snack orders.' },
      { q: 'How long does delivery take?', a: '30-60 minutes in Milton Keynes, 45-75 minutes in Edinburgh/Glasgow. UK-wide snack orders arrive in 2-3 business days.' },
      { q: 'What are your delivery hours?', a: 'Mon-Fri: 11am-10pm, Sat-Sun: 10am-11pm. Breakfast delivery available from 8am on weekends.' },
    ]
  },
  {
    category: 'Subscriptions (Dabba Wala)',
    items: [
      { q: 'How does the Dabba Wala subscription work?', a: 'Choose your plan (Weekly/Monthly/Family), select your box type (Prasada/Svadista/Mixed), set any dietary preferences, and pick your start date. Freshly cooked meals are delivered to your door on your chosen days.' },
      { q: 'Can I pause or cancel my subscription?', a: 'Yes! You can pause, resume, or cancel anytime with 24 hours notice. No penalty.' },
      { q: 'What comes in a typical dabba (tiffin)?', a: 'Each meal includes rice/roti, a main curry, dal or sambar, a side dish, pickle/chutney, and papad. Portions are generous for one adult.' },
      { q: 'Can I switch between Prasada and Svadista boxes?', a: 'Absolutely. With the Mixed Box option, we alternate between veg and non-veg meals. You can also switch your box type at any time.' },
    ]
  },
  {
    category: 'Food & Dietary',
    items: [
      { q: 'Is the Prasada menu truly 100% vegetarian?', a: 'Yes. Our Prasada kitchen is completely separate with different utensils, cooking oils, and preparation areas. No cross-contamination whatsoever. Suitable for strict vegetarians and Jain preferences.' },
      { q: 'Do you cater for allergies?', a: 'We clearly mark allergens (nuts, dairy, gluten, sesame) on all our dishes. For severe allergies, please contact us directly and we will accommodate your needs.' },
      { q: 'Are your dishes spicy?', a: 'Spice levels vary. Each dish has a spice meter (1-5 flames). You can request "less spicy" in your subscription preferences or while ordering.' },
      { q: 'Do you use MSG or artificial flavours?', a: 'Never. All our food is cooked with fresh, natural ingredients using traditional methods. No preservatives, no shortcuts.' },
    ]
  },
  {
    category: 'Catering & Events',
    items: [
      { q: 'How far in advance should I book catering?', a: 'We recommend at least 7 days for small events and 2-3 weeks for large functions (50+ guests). For temple poojas, 3-5 days notice is usually sufficient.' },
      { q: 'Do you provide utensils and serving?', a: 'Yes, we offer full-service catering including crockery, serving staff, and setup. This can be discussed when you submit your enquiry.' },
      { q: 'What is the minimum guest count for catering?', a: 'We cater for events starting from 10 guests. No event is too small or too large.' },
    ]
  },
  {
    category: 'Payment & General',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards, Apple Pay, Google Pay, and bank transfers. Cash on delivery available in Milton Keynes.' },
      { q: 'How do I contact you?', a: 'Call us at +44 73 0711 9962, WhatsApp the same number, or email hello@sreesvadista.co.uk. You can also use the contact form on our website.' },
    ]
  },
  {
    category: 'South Indian Food Guide',
    items: [
      {
        q: 'What is gongura?',
        a: 'Gongura is a leafy green (Hibiscus sabdariffa / sorrel) native to Andhra Pradesh, South India, prized for its intense tangy-sour flavour. Known as the "pride of Andhra", it is used in chutneys, curries (Gongura Chicken, Gongura Mutton), pickles (gongura pachadi), and dals. Rich in iron, calcium, and folate, it is also one of the most nutritionally dense leafy greens in South Indian cooking. No other regional Indian cuisine uses it as extensively as Telugu cuisine.',
      },
      {
        q: 'What makes Andhra food different from other Indian cuisines?',
        a: 'Andhra Pradesh (Telugu) cuisine is distinguished by its exceptional heat — it uses Guntur chillies, among the hottest varieties in the world. Flavour profiles are built on a combination of tamarind (sourness), Guntur chilli (heat), and sesame or peanut (richness), a combination not found elsewhere. Signature ingredients like gongura (sorrel), raw mango, and tamarind feature heavily. Unlike Mughal-influenced North Indian cooking, Andhra cuisine relies on dry tempering (talimpu/tadka) rather than cream-based gravies, and rice is the staple grain.',
      },
      {
        q: 'What are the health benefits of ragi (finger millet)?',
        a: 'Ragi (finger millet / Eleusine coracana) is one of the most nutritious grains in South India. It contains more calcium than milk gram-for-gram, is exceptionally high in dietary fibre, has a low glycaemic index making it suitable for diabetics, and is naturally gluten-free. It is rich in the amino acid methionine and has been a dietary staple in rural Andhra and Karnataka for centuries. At Sree Svadista Prasada, ragi features in our Ragi Dosa, Ragi Sangati, and Ragi Laddu.',
      },
      {
        q: 'What is sambar?',
        a: 'Sambar is a South Indian lentil-based vegetable stew — a cornerstone of the cuisine. Made with toor dal (split pigeon peas), tamarind, tomatoes, and sambar powder (a blend of coriander, cumin, pepper, and dried chillies), it is served daily alongside idli, dosa, vada, and rice. It is naturally vegan and an excellent source of plant protein and fibre. Every household has its own recipe; ours uses a slow-cooked tamarind base with a fresh curry leaf and mustard seed tadka.',
      },
      {
        q: 'What is rasam?',
        a: 'Rasam is a thin, peppery South Indian soup served at the end of a meal to aid digestion. Made from tamarind water, tomatoes, black pepper, cumin, and curry leaves, it is lighter than sambar and distinctly peppery. It is drunk directly like a soup or poured over rice. In South Indian homes, rasam is the go-to remedy for colds, sore throats, and digestive discomfort — the pepper, cumin, and tamarind combination has well-documented digestive and antimicrobial properties.',
      },
      {
        q: 'What is pulihora?',
        a: 'Pulihora (also called tamarind rice or puliyodarai) is a tangy, spiced rice dish from Andhra Pradesh and Tamil Nadu. Cooked rice is mixed with a tamarind paste tempered with mustard seeds, dried red chillies, curry leaves, peanuts, and turmeric. It is one of the oldest South Indian dishes — historically prepared as temple prasadam (sacred offering). The tangy-spicy-nutty flavour is completely unlike any North Indian rice preparation. It also keeps well at room temperature, making it a traditional travel food.',
      },
      {
        q: 'What does "Prasada" mean?',
        a: 'In Sanskrit and Telugu, "Prasada" (Prasad) means blessing or divine grace — specifically food offered to a deity and then distributed to devotees as a sacred gift. Our Prasada kitchen honours this tradition: it serves only pure vegetarian food, prepared in a completely separate kitchen with dedicated utensils and cooking oils, in the spirit of clean, wholesome, sattvic cooking. It is suitable for strict vegetarians, Jains, and those following temple dietary practices.',
      },
      {
        q: 'What does "Svadista" mean?',
        a: '"Svadista" (Sanskrit: स्वादिष्ट) means delicious or tasty — literally "having good taste". Our Svadista kitchen represents the full, bold flavour range of Andhra non-vegetarian cooking: Chicken 65, Gongura Chicken Curry, Gongura Mutton, Pesarattu, and slow-cooked biryani. The name reflects our commitment to genuine Andhra flavour — no shortcuts, no shortcuts to heat, no watered-down spicing for mass-market appeal.',
      },
      {
        q: 'What is a Dabba Wala?',
        a: 'Dabba Wala (also spelled Dabbawala) refers to the legendary Mumbai tiffin delivery network, where carriers collect home-cooked food in metal tiffin boxes (dabbas) and deliver them to offices across the city with near-zero error rates — a system studied by Harvard Business School. Our Dabba Wala subscription honours this tradition: weekly or monthly subscriptions of freshly cooked South Indian home-style meals delivered to your door in Milton Keynes, Edinburgh, and Glasgow.',
      },
      {
        q: 'Is South Indian food gluten-free?',
        a: 'Most traditional South Indian food is naturally gluten-free. The primary grains are rice, ragi (finger millet), and jowar (sorghum) — all gluten-free. Idli, dosa, vada, sambar, rasam, most chutneys, rice-based curries, pickles, and podis contain no wheat. The exceptions are dishes using wheat flour (paratha, maida-based items) or semolina (rava dosa, upma). At Sree Svadista Prasada, the majority of our menu is naturally gluten-free — allergens including gluten are clearly marked on every dish.',
      },
      {
        q: 'Is South Indian food vegan?',
        a: 'The majority of our Prasada (vegetarian) menu is vegan. Traditional South Indian temple food is entirely plant-based — no dairy, no eggs, no onion, no garlic. Sambar, rasam, pulihora, all rice dishes, most dals, pickles, and podis are 100% vegan. Our Svadista (non-vegetarian) menu includes meat and some dairy-based preparations. We clearly mark vegan options across our menu, and our Prasada kitchen is entirely separate from the non-vegetarian kitchen.',
      },
      {
        q: 'What is Chicken 65?',
        a: 'Chicken 65 is one of India\'s most beloved fried chicken dishes, originating in Chennai in 1965 (hence the name). Bite-sized chicken pieces are marinated in yoghurt, red chilli, ginger-garlic paste, and South Indian spices, then deep-fried until crispy and tossed with curry leaves, green chillies, and lime. The result is a fiery, aromatic starter — crunchy outside, juicy inside. It is the most-ordered starter on our Svadista menu and one of the defining dishes of South Indian restaurant cooking worldwide.',
      },
      {
        q: 'What is Gutti Vankaya?',
        a: 'Gutti Vankaya Kura is a classic Andhra stuffed baby aubergine curry. Small, tender brinjals are slit and stuffed with a dry masala paste made from roasted peanuts, sesame seeds, coconut, tamarind, and Andhra spices, then slow-cooked in a rich gravy. It is considered one of the signature dishes of Telugu cuisine and a vegetarian centrepiece. "Gutti" means stuffed and "vankaya" means brinjal/aubergine in Telugu. It is entirely vegan and a staple of festive Andhra meals.',
      },
      {
        q: 'What is Avakaya pickle?',
        a: 'Avakaya (Avakai) is the most iconic pickle of Andhra Pradesh — a raw mango pickle made with coarsely ground mustard seeds, Guntur red chilli powder, salt, and sesame or groundnut oil. Unlike North Indian mango pickles, Avakaya uses large pieces of unripe green mango, giving it a chunky texture and an intensely sour-spicy-pungent flavour. It is a daily fixture on every Andhra dining table, eaten with plain rice and ghee or yoghurt rice. Our Avakaya is made using traditional stone-ground mustard and whole spices.',
      },
      {
        q: 'What is the difference between South Indian and North Indian food?',
        a: 'South Indian food is rice-based, uses coconut, tamarind, curry leaves, and mustard seeds, and features lighter, tangier flavour profiles. North Indian food is predominantly wheat-based (chapati, naan, paratha), uses cream, butter, and tomato-based gravies (butter chicken, korma, paneer makhani), and has a richer, sweeter, Mughal-influenced character. South Indian breakfasts — idli, dosa, vada, upma — are entirely different from North Indian parathas. Spice blends also differ: South India uses pepper, Guntur chillies, and tempering techniques that create fundamentally different flavour outcomes.',
      },
    ]
  }
];

export const galleryImages = [
  { id: 1, src: 'https://images.unsplash.com/photo-1587409059079-e1f9f840caa0?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'Traditional brass vessels with sweets', category: 'Kitchen' },
  { id: 2, src: 'https://images.unsplash.com/photo-1773209927959-b2959be5e684?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'Chicken curry in clay pot', category: 'Svadista' },
  { id: 3, src: 'https://images.unsplash.com/photo-1742281257687-092746ad6021?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'Traditional South Indian thali', category: 'Prasada' },
  { id: 4, src: 'https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'Fragrant biriyani', category: 'Svadista' },
  { id: 5, src: 'https://images.unsplash.com/photo-1743615467363-250466982515?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'Masala Dosa on banana leaf', category: 'Breakfast' },
  { id: 6, src: 'https://images.unsplash.com/photo-1588594907301-823478af8be5?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'Spices tempering in oil', category: 'Kitchen' },
  { id: 7, src: 'https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'Pickle jars on wooden shelf', category: 'Snacks' },
  { id: 8, src: 'https://images.unsplash.com/photo-1652250406978-622a4d19e7e3?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'Traditional cooking process', category: 'Kitchen' },
  { id: 9, src: 'https://images.unsplash.com/photo-1752673508949-f4aeeaef75f0?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'Rice in clay bowl', category: 'Prasada' },
  { id: 10, src: 'https://images.unsplash.com/photo-1666251214695-405f673b396a?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'Temple prasadam offering', category: 'Prasada' },
  { id: 11, src: 'https://images.unsplash.com/photo-1606791422814-b32c705e3e2f?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'Cooking in traditional pan', category: 'Kitchen' },
  { id: 12, src: 'https://images.unsplash.com/photo-1748323123788-87a32949f4b0?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'Traditional Indian kitchen', category: 'Kitchen' },
];


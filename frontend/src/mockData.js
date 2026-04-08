// Comprehensive mock data for Sree Svadista Prasada

export const heroSlides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1742281258189-3b933879867a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920',
    title: "Welcome Home.",
    subtitle: "The authentic taste you missed, carried forward with love.",
    description: "Now serving Edinburgh & Glasgow.",
    cta: "Explore Our Kitchen",
    link: "/menu"
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1742281257687-092746ad6021?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920',
    title: "Divinity for the Soul.\nSpice for the Heart.",
    subtitle: "Two separate kitchens, one authentic taste.",
    description: "Prasada & Svadista — choose your world.",
    cta: "Discover Our Menus",
    link: "/menu"
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1657205937707-940bf77b2602?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920',
    title: "Your Daily Dose of Home.",
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
    tag: "Bestseller"
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
    tag: "Chef's Pick"
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
    tag: "Popular"
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
    tag: "Morning Favourite"
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
    tag: ""
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
    tag: "Divine"
  }
];

export const mealMoments = [
  {
    id: 1,
    name: 'Breakfast',
    image: 'https://images.unsplash.com/photo-1694849789325-914b71ab4075?crop=entropy&cs=srgb&fm=jpg&q=85&w=400',
    link: '/menu'
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
    link: '/menu'
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
    price: "£45",
    pricePerMeal: "£9/meal",
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
    price: "£160",
    pricePerMeal: "£8/meal",
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
    location: "Edinburgh",
    text: "As a student, the weekly subscription is a lifesaver. Tastes exactly like home food. Amma would be proud.",
    rating: 5
  }
];

export const chefSpecial = {
  name: "Prasadam Pulihora",
  tagline: "Taste for your heart. If you can touch someone's heart, that is limitless.",
  description: "Tangy, temple-style tamarind rice prepared with hand-pounded spices. Each grain carries the devotion of a thousand-year tradition. Served on fresh banana leaf with coconut chutney and papad.",
  price: "£8.99",
  image: "https://images.unsplash.com/photo-1752673508949-f4aeeaef75f0?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
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

// Mock data for Sree Svadista Prasada

export const featuredDishes = [
  {
    id: 1,
    name: "Andhra Kodi Pulusu",
    category: "Non-Veg",
    description: "Traditional Andhra-style chicken curry with tamarind and aromatic spices",
    price: "£12.99",
    spiceLevel: 3,
    image: ""
  },
  {
    id: 2,
    name: "Pulihora (Tamarind Rice)",
    category: "Prasada",
    description: "Temple-style tangy tamarind rice, pure and divine",
    price: "£8.99",
    spiceLevel: 1,
    image: ""
  },
  {
    id: 3,
    name: "Idli with Sambar",
    category: "Breakfast",
    description: "Soft steamed rice cakes with traditional sambar and chutneys",
    price: "£6.99",
    spiceLevel: 2,
    image: ""
  },
  {
    id: 4,
    name: "Gongura Pickle",
    category: "Pickle",
    description: "Grandmother's recipe of tangy sorrel leaves pickle",
    price: "£4.99",
    spiceLevel: 3,
    image: ""
  }
];

export const menuItems = {
  nonVeg: [
    {
      id: 1,
      name: "Andhra Kodi Pulusu",
      description: "Traditional chicken curry with tamarind",
      price: "£12.99",
      spiceLevel: 3,
      subcategory: "Curries"
    },
    {
      id: 2,
      name: "Chettinad Chicken",
      description: "Spicy Tamil Nadu style chicken with roasted spices",
      price: "£13.99",
      spiceLevel: 4,
      subcategory: "Curries"
    },
    {
      id: 3,
      name: "Natu Kodi Biriyani",
      description: "Country chicken biriyani with aromatic basmati rice",
      price: "£15.99",
      spiceLevel: 3,
      subcategory: "Biriyanis"
    },
    {
      id: 4,
      name: "Mutton Ghee Roast",
      description: "Slow-cooked mutton in clarified butter with spices",
      price: "£16.99",
      spiceLevel: 3,
      subcategory: "Starters"
    }
  ],
  veg: [
    {
      id: 5,
      name: "Gutti Vankaya",
      description: "Stuffed brinjal curry with peanut and sesame paste",
      price: "£9.99",
      spiceLevel: 2,
      subcategory: "Curries"
    },
    {
      id: 6,
      name: "Bendakaya Pulusu",
      description: "Okra in tangy tamarind gravy",
      price: "£8.99",
      spiceLevel: 2,
      subcategory: "Curries"
    },
    {
      id: 7,
      name: "Veg Biriyani",
      description: "Fragrant vegetable biriyani with raita",
      price: "£11.99",
      spiceLevel: 2,
      subcategory: "Biriyanis"
    }
  ],
  prasada: [
    {
      id: 8,
      name: "Pulihora",
      description: "Temple-style tamarind rice",
      price: "£8.99",
      spiceLevel: 1,
      subcategory: "Rice"
    },
    {
      id: 9,
      name: "Sakkarai Pongal",
      description: "Sweet rice with jaggery, ghee and cashews",
      price: "£7.99",
      spiceLevel: 0,
      subcategory: "Rice"
    },
    {
      id: 10,
      name: "Sundal",
      description: "Steamed chickpea with coconut and curry leaves",
      price: "£5.99",
      spiceLevel: 1,
      subcategory: "Prasadam Specials"
    }
  ],
  breakfast: [
    {
      id: 11,
      name: "Idli (4 pcs)",
      description: "Soft steamed rice cakes with sambar and chutneys",
      price: "£6.99",
      spiceLevel: 1,
      subcategory: "Tiffins"
    },
    {
      id: 12,
      name: "Masala Dosa",
      description: "Crispy rice crepe with spiced potato filling",
      price: "£8.99",
      spiceLevel: 2,
      subcategory: "Tiffins"
    },
    {
      id: 13,
      name: "Upma",
      description: "Semolina porridge with vegetables and spices",
      price: "£6.99",
      spiceLevel: 1,
      subcategory: "Tiffins"
    },
    {
      id: 14,
      name: "Punugulu",
      description: "Crispy idli batter fritters",
      price: "£5.99",
      spiceLevel: 2,
      subcategory: "Snacks"
    }
  ],
  pickles: [
    {
      id: 15,
      name: "Gongura Pickle",
      description: "Tangy sorrel leaves pickle",
      price: "£4.99",
      spiceLevel: 3
    },
    {
      id: 16,
      name: "Mango Avakaya",
      description: "Spicy raw mango pickle",
      price: "£4.99",
      spiceLevel: 4
    },
    {
      id: 17,
      name: "Lemon Pickle",
      description: "Traditional lemon pickle with spices",
      price: "£4.49",
      spiceLevel: 2
    }
  ],
  podis: [
    {
      id: 18,
      name: "Kandi Podi",
      description: "Roasted dal powder with spices",
      price: "£3.99",
      spiceLevel: 2
    },
    {
      id: 19,
      name: "Nalla Karam",
      description: "Sesame seed chutney powder",
      price: "£3.99",
      spiceLevel: 3
    },
    {
      id: 20,
      name: "Karivepaku Podi",
      description: "Curry leaves gun powder",
      price: "£3.99",
      spiceLevel: 2
    }
  ]
};

export const subscriptionPlans = [
  {
    id: 1,
    name: "Weekly Veg Plan",
    price: "£45",
    duration: "per week",
    meals: "7 meals",
    description: "Pure vegetarian homely meals delivered daily",
    features: [
      "One meal per day",
      "Rotating menu",
      "Fresh preparation daily",
      "Includes rice, curry, dal, and accompaniments"
    ]
  },
  {
    id: 2,
    name: "Weekly Non-Veg Plan",
    price: "£55",
    duration: "per week",
    meals: "7 meals",
    description: "Traditional non-veg meals with authentic recipes",
    features: [
      "One meal per day",
      "3 non-veg + 4 veg dishes per week",
      "Sunday special biriyani",
      "Includes rice, curry, and sides"
    ]
  },
  {
    id: 3,
    name: "Monthly Mixed Plan",
    price: "£180",
    duration: "per month",
    meals: "30 meals",
    description: "Best of both worlds - veg and non-veg",
    features: [
      "One meal per day",
      "15 veg + 15 non-veg meals",
      "Flexible delivery schedule",
      "Weekend specials included"
    ]
  }
];

export const testimonials = [
  {
    id: 1,
    name: "Priya Sharma",
    location: "London",
    text: "Finally found authentic Andhra food in UK! The pulihora reminds me of my grandmother's cooking.",
    rating: 5
  },
  {
    id: 2,
    name: "Rajesh Kumar",
    location: "Manchester",
    text: "The prasada is so pure and divine. Perfect for our weekly poojas. Highly recommended!",
    rating: 5
  },
  {
    id: 3,
    name: "Anitha Reddy",
    location: "Birmingham",
    text: "As a student, the weekly subscription is a lifesaver. Tastes exactly like home food!",
    rating: 5
  }
];
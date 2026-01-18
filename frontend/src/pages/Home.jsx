import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Utensils, CheckCircle, Leaf, Flame, Play, Star, ShoppingCart } from 'lucide-react';
import { featuredDishes, testimonials } from '../mockData';
import HeroSlider from '../components/HeroSlider';

const Home = () => {
  const getSpiceIndicator = (level) => {
    return (
      <div className="flex gap-0.5">
        {Array(level).fill(0).map((_, i) => (
          <Flame key={i} size={14} className="text-red-500 fill-red-500" />
        ))}
      </div>
    );
  };

  const mealMoments = [
    { id: 1, name: 'Breakfast', icon: '🌅', image: 'https://images.unsplash.com/photo-1668236499396-a62d2d1cb0cf?crop=entropy&cs=srgb&fm=jpg&q=85' },
    { id: 2, name: 'Lunch', icon: '🍛', image: 'https://images.unsplash.com/photo-1742281258189-3b933879867a?crop=entropy&cs=srgb&fm=jpg&q=85' },
    { id: 3, name: 'Evening Cravings', icon: '☕', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?crop=entropy&cs=srgb&fm=jpg&q=85' },
    { id: 4, name: 'Weekend Feasts', icon: '🎉', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?crop=entropy&cs=srgb&fm=jpg&q=85' }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Announcement Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm" style={{ backgroundColor: '#FFD580' }}>
        <p className="font-medium" style={{ color: '#800020' }}>
          Now serving authentic hot meals in London | Free Delivery over £30
        </p>
      </div>

      {/* Hero Section - Full Width */}
      <section className="pt-32 pb-0">
        <HeroSlider />
      </section>

      {/* Main Two-Column Layout */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN - 2/3 width */}
          <div className="lg:col-span-2 space-y-12">
            {/* Two Worlds Section */}
            <section>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Svadista Card */}
                <Link to="/svadista" className="group block">
                  <Card className="overflow-hidden border-0 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ backgroundColor: '#FFD580' }}>
                    <div className="relative h-72">
                      <img 
                        src="https://images.unsplash.com/photo-1708782344490-9026aaa5eec7?crop=entropy&cs=srgb&fm=jpg&q=85"
                        alt="Non-Veg Specialties"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <div className="absolute bottom-0 p-6 text-white w-full">
                        <div className="flex items-center gap-2 mb-3">
                          <Flame size={24} className="text-red-400" />
                          <Badge className="bg-white text-gray-900 text-xs">Non-Veg</Badge>
                        </div>
                        <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                          Explore Non-Veg Specialties
                        </h3>
                        <p className="text-sm text-gray-200 mb-3">Svadista - The Traditional</p>
                        <div className="flex items-center gap-2 group-hover:gap-3 transition-all">
                          <span className="text-sm font-semibold">Explore Menu</span>
                          <span>→</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>

                {/* Prasada Card */}
                <Link to="/prasada" className="group block">
                  <Card className="overflow-hidden border-0 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ backgroundColor: '#90EE90' }}>
                    <div className="relative h-72">
                      <img 
                        src="https://images.unsplash.com/photo-1625398407796-82650a8c135f?crop=entropy&cs=srgb&fm=jpg&q=85"
                        alt="Pure Veg Bliss"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <div className="absolute bottom-0 p-6 text-white w-full">
                        <div className="flex items-center gap-2 mb-3">
                          <Leaf size={24} className="text-green-300" />
                          <Badge className="bg-white text-gray-900 text-xs">Pure Veg</Badge>
                        </div>
                        <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                          Explore Pure Veg Bliss
                        </h3>
                        <p className="text-sm text-gray-200 mb-3">Prasada - The Divine</p>
                        <div className="flex items-center gap-2 group-hover:gap-3 transition-all">
                          <span className="text-sm font-semibold">Explore Menu</span>
                          <span>→</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            </section>

            {/* Trending & Loved Section */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 
                  className="text-3xl font-bold"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
                >
                  Trending & Loved
                </h2>
                <Link to="/menu" className="text-sm font-semibold hover:underline" style={{ color: '#800020' }}>
                  View All →
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {featuredDishes.map((dish) => (
                  <Card key={dish.id} className="hover:shadow-xl transition-all duration-300 bg-white border-0 overflow-hidden">
                    <div className="grid grid-cols-5 gap-0">
                      <div className="col-span-2 h-full">
                        <img 
                          src={dish.image} 
                          alt={dish.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="col-span-3 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge 
                            variant={dish.category === 'Non-Veg' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {dish.category}
                          </Badge>
                          {getSpiceIndicator(dish.spiceLevel)}
                        </div>
                        <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {dish.name}
                        </h3>
                        <div className="flex items-center gap-1 mb-3">
                          {Array(5).fill(0).map((_, i) => (
                            <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                          ))}
                          <span className="text-xs text-gray-500 ml-1">(24)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xl font-bold" style={{ color: '#800020' }}>{dish.price}</p>
                          <Button size="sm" className="text-white" style={{ backgroundColor: '#800020' }}>
                            <ShoppingCart size={16} className="mr-1" /> Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN - 1/3 width */}
          <div className="lg:col-span-1 space-y-8">
            {/* Explore by Meal Moment */}
            <Card className="border-0 shadow-md" style={{ backgroundColor: '#FFFFF0' }}>
              <CardHeader>
                <CardTitle className="text-2xl" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                  Explore by Meal Moment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {mealMoments.map((moment) => (
                    <Link key={moment.id} to="/menu" className="group text-center">
                      <div className="w-full aspect-square rounded-full overflow-hidden mb-3 hover:scale-105 transition-transform duration-300">
                        <img 
                          src={moment.image}
                          alt={moment.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm font-semibold group-hover:underline" style={{ color: '#800020' }}>
                        {moment.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chef's Special */}
            <Card className="border-0 shadow-md overflow-hidden" style={{ backgroundColor: '#FFD580' }}>
              <div className="relative h-48">
                <img 
                  src="https://images.unsplash.com/photo-1589302168068-964664d93dc0?crop=entropy&cs=srgb&fm=jpg&q=85"
                  alt="Chef's Special"
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-4 left-4 bg-white text-gray-900">Chef's Special</Badge>
              </div>
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                  Prasadam Pulihora
                </h3>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  Traditional temple-style tamarind rice, blessed with authentic spices and prepared with devotion.
                </p>
                <Button className="w-full text-white" style={{ backgroundColor: '#800020' }}>
                  Learn More
                </Button>
              </CardContent>
            </Card>

            {/* Dabba Wala Service */}
            <Card className="border-0 shadow-md" style={{ backgroundColor: '#FFFFF0' }}>
              <CardHeader>
                <CardTitle className="text-2xl" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                  Dabba Wala
                </CardTitle>
                <p className="text-sm text-gray-600">Your Daily Homely Meal, Delivered</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#800020' }}>
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <p className="text-sm text-gray-700">Choose your meal plan</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#800020' }}>
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <p className="text-sm text-gray-700">Select delivery schedule</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#800020' }}>
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <p className="text-sm text-gray-700">Enjoy fresh homely food</p>
                  </div>
                </div>
                <Link to="/subscriptions">
                  <Button className="w-full mt-6 text-white" style={{ backgroundColor: '#800020' }}>
                    View Plans
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* The Svadista Cinema */}
            <Card className="border-0 shadow-md overflow-hidden" style={{ backgroundColor: '#F5F5F5' }}>
              <div className="relative h-48">
                <img 
                  src="https://images.unsplash.com/photo-1633536704679-de310869515b?crop=entropy&cs=srgb&fm=jpg&q=85"
                  alt="The Svadista Cinema"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#800020' }}>
                    <Play className="text-white" size={28} />
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                  The Svadista Cinema
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Watch our chefs create magic with traditional cooking techniques
                </p>
              </CardContent>
            </Card>

            {/* Offers & Specials */}
            <Card className="border-0 shadow-md text-center" style={{ backgroundColor: '#800020' }}>
              <CardContent className="p-8">
                <h3 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Flat 15% OFF
                </h3>
                <p className="text-white text-sm mb-4">On your first order</p>
                <Badge className="bg-white text-gray-900">Limited Time Offer</Badge>
              </CardContent>
            </Card>

            {/* Snacks & Pickles */}
            <Card className="border-0 shadow-md" style={{ backgroundColor: '#90EE90' }}>
              <div className="p-6">
                <div className="flex gap-3 mb-4">
                  <img 
                    src="https://images.unsplash.com/photo-1617854307432-13950e24ba07?crop=entropy&cs=srgb&fm=jpg&q=85"
                    alt="Pickles"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                      Snacks & Pickles
                    </h3>
                    <p className="text-sm text-gray-700">Shipped UK-Wide</p>
                  </div>
                </div>
                <Link to="/menu">
                  <Button variant="outline" className="w-full border-2" style={{ borderColor: '#800020', color: '#800020' }}>
                    Shop Now
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Our Story Teaser */}
            <Card className="border-0 shadow-md overflow-hidden" style={{ backgroundColor: '#FFFFF0' }}>
              <div className="h-32">
                <img 
                  src="https://images.unsplash.com/photo-1758874960394-afd9ead46eba?crop=entropy&cs=srgb&fm=jpg&q=85"
                  alt="Our Story"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                  Our Story
                </h3>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  A journey from grandmother's kitchen to bringing authentic South Indian flavors to the UK.
                </p>
                <Link to="/story">
                  <Button variant="outline" className="w-full border-2" style={{ borderColor: '#800020', color: '#800020' }}>
                    Learn More
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

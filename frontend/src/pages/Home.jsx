import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Leaf, Flame, Play, Star, ShoppingCart } from 'lucide-react';
import { featuredDishes } from '../mockData';
import HeroSlider from '../components/HeroSlider';

const Home = () => {
  const mealMoments = [
    { id: 1, name: 'Breakfast', image: 'https://images.unsplash.com/photo-1668236499396-a62d2d1cb0cf?crop=entropy&cs=srgb&fm=jpg&q=85&w=300' },
    { id: 2, name: 'Lunch', image: 'https://images.unsplash.com/photo-1742281258189-3b933879867a?crop=entropy&cs=srgb&fm=jpg&q=85&w=300' },
    { id: 3, name: 'Evening Cravings', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?crop=entropy&cs=srgb&fm=jpg&q=85&w=300' },
    { id: 4, name: 'Weekend Feasts', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?crop=entropy&cs=srgb&fm=jpg&q=85&w=300' }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Announcement Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium" style={{ backgroundColor: '#FFD580', color: '#800020' }}>
        Now serving authentic hot meals in Edinburgh & Glasgow | Free Delivery over £30
      </div>

      {/* Hero Section */}
      <section className="pt-20">
        <HeroSlider />
      </section>

      {/* Main Content - Two Column Layout */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN - Takes 8 columns */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Two Specialties Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Svadista Card */}
              <Link to="/svadista" className="group">
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300" style={{ backgroundColor: '#FFD580' }}>
                  <div className="relative h-80">
                    <img 
                      src="https://images.unsplash.com/photo-1708782344490-9026aaa5eec7?crop=entropy&cs=srgb&fm=jpg&q=85"
                      alt="Non-Veg Specialties"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <div className="flex items-center gap-2 mb-3">
                        <Flame size={20} className="text-red-400" />
                        <Badge className="bg-white text-gray-900 text-xs border-0">Non-Veg</Badge>
                      </div>
                      <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Explore Non-Veg Specialties
                      </h3>
                      <p className="text-xs text-gray-300 mb-3">(Svadista)</p>
                    </div>
                  </div>
                </Card>
              </Link>

              {/* Prasada Card */}
              <Link to="/prasada" className="group">
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300" style={{ backgroundColor: '#90EE90' }}>
                  <div className="relative h-80">
                    <img 
                      src="https://images.unsplash.com/photo-1625398407796-82650a8c135f?crop=entropy&cs=srgb&fm=jpg&q=85"
                      alt="Pure Veg Bliss"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <div className="flex items-center gap-2 mb-3">
                        <Leaf size={20} className="text-green-300" />
                        <Badge className="bg-white text-gray-900 text-xs border-0">Pure Veg</Badge>
                      </div>
                      <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Explore Pure Veg Bliss
                      </h3>
                      <p className="text-xs text-gray-300 mb-3">(Prasada)</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>

            {/* Trending & Loved Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                  Trending & Loved
                </h2>
                <Link to="/menu" className="text-sm font-semibold hover:underline" style={{ color: '#800020' }}>
                  View All →
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredDishes.map((dish) => (
                  <Card key={dish.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white">
                    <div className="flex h-full">
                      <div className="w-2/5">
                        <img 
                          src={dish.image} 
                          alt={dish.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="w-3/5 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <Badge 
                              variant={dish.category === 'Non-Veg' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {dish.category}
                            </Badge>
                            <div className="flex gap-0.5">
                              {Array(dish.spiceLevel).fill(0).map((_, i) => (
                                <Flame key={i} size={12} className="text-red-500 fill-red-500" />
                              ))}
                            </div>
                          </div>
                          <h3 className="font-bold text-base mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                            {dish.name}
                          </h3>
                          <div className="flex items-center gap-1 mb-2">
                            {Array(5).fill(0).map((_, i) => (
                              <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="text-xs text-gray-500 ml-1">(24)</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-lg font-bold" style={{ color: '#800020' }}>{dish.price}</p>
                          <Button size="sm" className="text-white text-xs px-3" style={{ backgroundColor: '#800020' }}>
                            <ShoppingCart size={14} className="mr-1" /> Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN - Takes 4 columns */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Explore by Meal Moment */}
            <Card className="border-0 shadow-md" style={{ backgroundColor: '#FFFFF0' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                  Explore by Meal Moment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {mealMoments.map((moment) => (
                    <Link key={moment.id} to="/menu" className="group text-center">
                      <div className="w-full aspect-square rounded-full overflow-hidden mb-2 hover:scale-105 transition-transform duration-300 border-4 border-white shadow-md">
                        <img 
                          src={moment.image}
                          alt={moment.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs font-semibold group-hover:underline" style={{ color: '#800020' }}>
                        {moment.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chef's Special */}
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="relative h-40">
                <img 
                  src="https://images.unsplash.com/photo-1589302168068-964664d93dc0?crop=entropy&cs=srgb&fm=jpg&q=85"
                  alt="Chef's Special"
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-3 left-3 bg-white text-gray-900 text-xs">Chef's Special</Badge>
              </div>
              <CardContent className="p-4" style={{ backgroundColor: '#FFD580' }}>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                  Prasadam Pulihora
                </h3>
                <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                  Traditional temple-style tamarind rice, prepared with devotion.
                </p>
                <Button className="w-full text-white text-sm py-2" style={{ backgroundColor: '#800020' }}>
                  Learn Over More
                </Button>
              </CardContent>
            </Card>

            {/* Dabba Wala */}
            <Card className="border-0 shadow-md" style={{ backgroundColor: '#FFFFF0' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                  Dabba Wala
                </CardTitle>
                <p className="text-xs text-gray-600">Explained in 3 Simple Steps</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { num: '1', text: 'Choose your plan' },
                    { num: '2', text: 'Schedule delivery' },
                    { num: '3', text: 'Enjoy daily meals' }
                  ].map((step) => (
                    <div key={step.num} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#800020' }}>
                        <span className="text-white text-xs font-bold">{step.num}</span>
                      </div>
                      <p className="text-xs text-gray-700">{step.text}</p>
                    </div>
                  ))}
                </div>
                <Link to="/subscriptions">
                  <Button className="w-full mt-4 text-white text-sm py-2" style={{ backgroundColor: '#800020' }}>
                    Subscribe Now
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* The Svadista Cinema */}
            <Card className="border-0 shadow-md overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
              <div className="relative h-40">
                <img 
                  src="https://images.unsplash.com/photo-1633536704679-de310869515b?crop=entropy&cs=srgb&fm=jpg&q=85"
                  alt="The Svadista Cinema"
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: '#800020' }}>
                    <Play className="text-white ml-1" size={24} />
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="text-base font-bold mb-1 text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  The Svadista Cinema
                </h3>
                <p className="text-xs text-gray-400">
                  Watch us cook with traditional methods
                </p>
              </CardContent>
            </Card>

            {/* Offers & Specials */}
            <Card className="border-0 shadow-md text-center py-6" style={{ backgroundColor: '#800020' }}>
              <CardContent>
                <h3 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Flat 15% OFF
                </h3>
                <p className="text-white text-xs mb-3">On Your First Order</p>
                <Badge className="bg-white text-gray-900 text-xs">Limited Time</Badge>
              </CardContent>
            </Card>

            {/* Snacks & Pickles */}
            <Card className="border-0 shadow-md" style={{ backgroundColor: '#90EE90' }}>
              <CardContent className="p-4">
                <div className="flex gap-3 mb-3">
                  <img 
                    src="https://images.unsplash.com/photo-1617854307432-13950e24ba07?crop=entropy&cs=srgb&fm=jpg&q=85"
                    alt="Pickles"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-base font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                      Snacks & Pickles
                    </h3>
                    <p className="text-xs text-gray-700">Shipped UK-Wide</p>
                  </div>
                </div>
                <Link to="/menu">
                  <Button variant="outline" className="w-full border-2 text-xs py-2" style={{ borderColor: '#800020', color: '#800020' }}>
                    Explore Range
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Our Story Teaser */}
            <Card className="border-0 shadow-md overflow-hidden" style={{ backgroundColor: '#FFFFF0' }}>
              <div className="h-28">
                <img 
                  src="https://images.unsplash.com/photo-1758874960394-afd9ead46eba?crop=entropy&cs=srgb&fm=jpg&q=85"
                  alt="Our Story"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="text-base font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                  Our Story Teaser
                </h3>
                <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                  From grandmother's kitchen to the UK, bringing authentic flavors with love.
                </p>
                <Link to="/story">
                  <Button variant="outline" className="w-full border-2 text-xs py-2" style={{ borderColor: '#800020', color: '#800020' }}>
                    Read More
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

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Utensils, CheckCircle, Leaf, Flame, ShoppingBag, Users, Clock } from 'lucide-react';
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

  return (
    <div className="min-h-screen">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Two Worlds Section */}
      <section id="two-worlds" className="py-24 px-4" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="container mx-auto max-w-7xl">
          <h2 
            className="text-4xl lg:text-5xl font-bold text-center mb-6"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Two Worlds, One Divine Experience
          </h2>
          <p className="text-center text-gray-700 mb-16 max-w-2xl mx-auto text-lg leading-relaxed">
            Experience authentic South Indian cuisine in two distinct culinary journeys
          </p>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Svadista - Non-Veg */}
            <Link to="/svadista" className="group block">
              <div 
                className="relative h-96 lg:h-[500px] rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                style={{ 
                  backgroundImage: 'url(https://images.unsplash.com/photo-1708782344490-9026aaa5eec7?crop=entropy&cs=srgb&fm=jpg&q=85)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Flame size={40} className="text-red-400" />
                    <Badge variant="outline" className="bg-white text-gray-900 border-0 text-sm px-3 py-1">Non-Veg</Badge>
                  </div>
                  <h3 
                    className="text-4xl lg:text-5xl font-bold mb-4"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Sree Svadista
                  </h3>
                  <p className="text-lg mb-6 text-gray-200 leading-relaxed">
                    The Traditional - Rustic, spicy, bold non-vegetarian dishes. Just like Sunday at your grandmother's home.
                  </p>
                  <div className="flex items-center gap-2 text-white group-hover:gap-4 transition-all duration-300">
                    <span className="font-semibold">Explore Svadista</span>
                    <span className="text-2xl">→</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Prasada - Pure Veg */}
            <Link to="/prasada" className="group block">
              <div 
                className="relative h-96 lg:h-[500px] rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                style={{ 
                  backgroundImage: 'url(https://images.unsplash.com/photo-1625398407796-82650a8c135f?crop=entropy&cs=srgb&fm=jpg&q=85)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Leaf size={40} className="text-green-300" />
                    <Badge variant="outline" className="bg-white text-gray-900 border-0 text-sm px-3 py-1">Pure Veg</Badge>
                  </div>
                  <h3 
                    className="text-4xl lg:text-5xl font-bold mb-4"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Sree Prasada
                  </h3>
                  <p className="text-lg mb-6 text-gray-200 leading-relaxed">
                    The Divine - 100% pure vegetarian temple-style cooking. Separate utensils, oils, and complete devotion.
                  </p>
                  <div className="flex items-center gap-2 text-white group-hover:gap-4 transition-all duration-300">
                    <span className="font-semibold">Explore Prasada</span>
                    <span className="text-2xl">→</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Different Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFF0' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl lg:text-5xl font-bold text-center mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Why We're Different
          </h2>
          <p className="text-center text-gray-700 mb-16 max-w-2xl mx-auto text-lg leading-relaxed">
            We bring the warmth of grandmother's kitchen to the UK
          </p>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#800020' }}>
                <Utensils className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                Grandma's Recipes
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Authentic recipes passed down through generations, cooked with the same love and care
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#800020' }}>
                <Leaf className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                Temple Purity
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Separate veg & non-veg kitchens with different oils, utensils, and cooking methods
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#800020' }}>
                <CheckCircle className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                Flexible Plans
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Weekly & monthly subscriptions with Dabba Wala service for busy professionals
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl lg:text-5xl font-bold text-center mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Our Services
          </h2>
          <p className="text-center text-gray-700 mb-16 max-w-2xl mx-auto text-lg leading-relaxed">
            From dine-in to doorstep delivery, homely food wherever you need
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-xl transition-all duration-300 bg-white border-0">
              <CardHeader>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#800020' }}>
                  <ShoppingBag className="text-white" size={28} />
                </div>
                <CardTitle className="text-2xl" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                  Dine-in Restaurant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  Experience homely ambiance with traditional seating. A family-friendly space to savor authentic South Indian meals.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 bg-white border-0">
              <CardHeader>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#800020' }}>
                  <Clock className="text-white" size={28} />
                </div>
                <CardTitle className="text-2xl" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                  Dabba Wala Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  Weekly and monthly meal subscriptions. Perfect for students and professionals missing home-cooked food.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 bg-white border-0">
              <CardHeader>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#800020' }}>
                  <Users className="text-white" size={28} />
                </div>
                <CardTitle className="text-2xl" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                  Catering & Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  Full catering for poojas, weddings, corporate events, and housewarming celebrations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Dishes Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFF0' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl lg:text-5xl font-bold text-center mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Trending & Loved
          </h2>
          <p className="text-center text-gray-700 mb-16 max-w-2xl mx-auto text-lg leading-relaxed">
            Dishes that remind you of home and bring comfort to your soul
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDishes.map((dish) => (
              <Card key={dish.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border-0 overflow-hidden">
                {dish.image && (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={dish.image} 
                      alt={dish.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge 
                      variant={dish.category === 'Non-Veg' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {dish.category}
                    </Badge>
                    {getSpiceIndicator(dish.spiceLevel)}
                  </div>
                  <CardTitle className="text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {dish.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {dish.description}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: '#800020' }}>{dish.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/menu">
              <Button 
                size="lg"
                className="text-white text-lg px-10 py-6 font-semibold hover:opacity-90 transition-all duration-200"
                style={{ backgroundColor: '#800020' }}
              >
                View Full Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl lg:text-5xl font-bold text-center mb-16"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            What Our Customers Say
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="hover:shadow-lg transition-all duration-300 bg-white border-0">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {Array(testimonial.rating).fill(0).map((_, i) => (
                      <span key={i} className="text-2xl" style={{ color: '#B8860B' }}>★</span>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <div>
                    <p className="font-semibold" style={{ color: '#800020' }}>{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4" style={{ backgroundColor: '#800020' }}>
        <div className="container mx-auto max-w-4xl text-center">
          <h2 
            className="text-4xl lg:text-5xl font-bold mb-6 text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Missing Home-Cooked Food?
          </h2>
          <p className="text-xl text-gray-200 mb-10 leading-relaxed">
            Subscribe to our Dabba Wala service and enjoy traditional South Indian meals delivered fresh to your doorstep every day.
          </p>
          <Link to="/subscriptions">
            <Button 
              size="lg"
              className="bg-white text-lg px-10 py-6 font-semibold hover:bg-gray-100 transition-all duration-200"
              style={{ color: '#800020' }}
            >
              View Subscription Plans
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
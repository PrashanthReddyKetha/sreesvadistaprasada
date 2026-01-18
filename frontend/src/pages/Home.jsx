import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Store, Users, Utensils, CheckCircle, Leaf, Flame } from 'lucide-react';
import { featuredDishes, testimonials } from '../mockData';

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
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4" style={{ background: 'linear-gradient(135deg, #ECEC75 0%, #e6e67c 100%)' }}>
        <div className="container mx-auto max-w-6xl text-center">
          <h1 
            className="text-5xl lg:text-7xl font-bold mb-6 text-gray-900"
            style={{ fontFamily: "'Crimson Text', serif", lineHeight: '1.2' }}
          >
            Sree Svadista Prasada
          </h1>
          <p className="text-xl lg:text-2xl mb-4 text-gray-800 font-medium">
            Traditional South Indian Homely Food in the UK
          </p>
          <p className="text-lg text-gray-700 mb-10 max-w-2xl mx-auto" style={{ lineHeight: '1.8' }}>
            From grandmother's kitchen to your plate – pure, divine, and truly home-style.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/menu">
              <Button 
                size="lg" 
                className="bg-gray-900 text-white hover:bg-gray-800 transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-lg text-base px-8 py-6"
              >
                View Menu
              </Button>
            </Link>
            <Link to="/subscriptions">
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-gray-900 text-gray-900 bg-transparent hover:bg-gray-900 hover:text-white transition-all duration-200 hover:-translate-y-1 text-base px-8 py-6"
              >
                Subscribe for Weekly Meals
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Two Worlds Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl lg:text-5xl font-bold text-center mb-4 text-gray-900"
            style={{ fontFamily: "'Crimson Text', serif" }}
          >
            Two Worlds, One Divine Experience
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto" style={{ lineHeight: '1.8' }}>
            Experience authentic South Indian cuisine in two distinct journeys
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Svadista */}
            <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-2" style={{ background: '#e6e67c' }}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Flame className="text-red-600" size={32} />
                  <Badge variant="outline" className="bg-white">Non-Veg</Badge>
                </div>
                <CardTitle className="text-3xl mb-2" style={{ fontFamily: "'Crimson Text', serif" }}>
                  Svadista
                </CardTitle>
                <CardDescription className="text-gray-700 text-base">
                  For Traditional Non-Veg Lovers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800 mb-6" style={{ lineHeight: '1.8' }}>
                  Traditional South Indian non-veg dishes, just like Sunday at home. Authentic recipes passed down through generations.
                </p>
                <Link to="/svadista">
                  <Button className="w-full bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-200">
                    Explore Svadista
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Prasada */}
            <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-2" style={{ background: '#e6e67c' }}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Leaf className="text-green-600" size={32} />
                  <Badge variant="outline" className="bg-white">Pure Veg</Badge>
                </div>
                <CardTitle className="text-3xl mb-2" style={{ fontFamily: "'Crimson Text', serif" }}>
                  Prasada
                </CardTitle>
                <CardDescription className="text-gray-700 text-base">
                  100% Pure Vegetarian
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800 mb-6" style={{ lineHeight: '1.8' }}>
                  Temple-style purity with separate oil, utensils, and cooking. Divine food prepared with complete devotion.
                </p>
                <Link to="/prasada">
                  <Button className="w-full bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-200">
                    Explore Prasada
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Different Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#f8fafc' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl lg:text-5xl font-bold text-center mb-16 text-gray-900"
            style={{ fontFamily: "'Crimson Text', serif" }}
          >
            Why We're Different
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Utensils className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Grandma's Recipes</h3>
              <p className="text-gray-600" style={{ lineHeight: '1.8' }}>
                Authentic recipes passed down through generations, cooked just like at home
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Leaf className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Temple-like Purity</h3>
              <p className="text-gray-600" style={{ lineHeight: '1.8' }}>
                Separate veg & non-veg handling with different oils and utensils
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Flexible Plans</h3>
              <p className="text-gray-600" style={{ lineHeight: '1.8' }}>
                Weekly & monthly meal subscriptions with corporate dabba wala service
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl lg:text-5xl font-bold text-center mb-4 text-gray-900"
            style={{ fontFamily: "'Crimson Text', serif" }}
          >
            Our Services
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto" style={{ lineHeight: '1.8' }}>
            From dine-in to doorstep, we bring homely food to you
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <Store className="mb-4 text-gray-900" size={36} />
                <CardTitle className="text-2xl" style={{ fontFamily: "'Crimson Text', serif" }}>
                  Dine-in Restaurant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600" style={{ lineHeight: '1.8' }}>
                  Homely ambiance with traditional seating. Family-friendly environment where you can enjoy authentic South Indian meals.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <Utensils className="mb-4 text-gray-900" size={36} />
                <CardTitle className="text-2xl" style={{ fontFamily: "'Crimson Text', serif" }}>
                  Subscription Meals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600" style={{ lineHeight: '1.8' }}>
                  Weekly and monthly flexible plans. Perfect for students and professionals who miss home-cooked food.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <Users className="mb-4 text-gray-900" size={36} />
                <CardTitle className="text-2xl" style={{ fontFamily: "'Crimson Text', serif" }}>
                  Catering & Corporate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600" style={{ lineHeight: '1.8' }}>
                  Events, poojas, and office lunches. Dabba-wala style delivery for corporate professionals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Items Section */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #ECEC75 0%, #e6e67c 100%)' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl lg:text-5xl font-bold text-center mb-4 text-gray-900"
            style={{ fontFamily: "'Crimson Text', serif" }}
          >
            Featured Dishes
          </h2>
          <p className="text-center text-gray-700 mb-16 max-w-2xl mx-auto" style={{ lineHeight: '1.8' }}>
            Taste the authentic flavors that remind you of home
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDishes.map((dish) => (
              <Card key={dish.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={dish.category === 'Non-Veg' ? 'destructive' : 'secondary'}>
                      {dish.category}
                    </Badge>
                    <span className="text-sm">{getSpiceIndicator(dish.spiceLevel)}</span>
                  </div>
                  <CardTitle className="text-xl">{dish.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4" style={{ lineHeight: '1.6' }}>
                    {dish.description}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{dish.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/menu">
              <Button 
                size="lg"
                className="bg-gray-900 text-white hover:bg-gray-800 transition-all duration-200 hover:-translate-y-1 shadow-md px-8 py-6"
              >
                View Full Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl lg:text-5xl font-bold text-center mb-16 text-gray-900"
            style={{ fontFamily: "'Crimson Text', serif" }}
          >
            What Our Customers Say
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {Array(testimonial.rating).fill(0).map((_, i) => (
                      <span key={i} className="text-yellow-500 text-xl">★</span>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic" style={{ lineHeight: '1.8' }}>
                    "{testimonial.text}"
                  </p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#1e293b' }}>
        <div className="container mx-auto max-w-4xl text-center">
          <h2 
            className="text-4xl lg:text-5xl font-bold mb-6 text-white"
            style={{ fontFamily: "'Crimson Text', serif" }}
          >
            Missing Home-Cooked Food?
          </h2>
          <p className="text-xl text-gray-300 mb-10" style={{ lineHeight: '1.8' }}>
            Subscribe to our weekly or monthly plans and enjoy traditional South Indian meals delivered to your doorstep.
          </p>
          <Link to="/subscriptions">
            <Button 
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 transition-all duration-200 hover:-translate-y-1 shadow-md px-8 py-6 text-base"
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
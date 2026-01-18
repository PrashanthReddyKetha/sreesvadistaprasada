import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Check, Calendar, Clock, Truck } from 'lucide-react';
import { subscriptionPlans } from '../mockData';

const Subscriptions = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="pt-32 pb-20 px-4 relative"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1616645258469-ec681c17f3ee?crop=entropy&cs=srgb&fm=jpg&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(128, 0, 32, 0.85)' }}></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h1 
            className="text-5xl lg:text-6xl font-bold mb-6 text-white"
            style={{ fontFamily: "'Playfair Display', serif", lineHeight: '1.2' }}
          >
            Dabba Wala Service
          </h1>
          <p className="text-2xl mb-4 text-gray-200">
            Weekly & Monthly Subscription Meals
          </p>
          <p className="text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Perfect for students, working professionals, and families who miss home-cooked food. 
            Get authentic South Indian meals delivered fresh to your doorstep every day.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFF0' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl font-bold text-center mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            How It Works
          </h2>
          <p className="text-center text-gray-700 mb-16 text-lg leading-relaxed">
            Getting homely food delivered is simple
          </p>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#800020' }}>
                <span className="text-white text-3xl font-bold">1</span>
              </div>
              <h3 
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
              >
                Choose Your Plan
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Select from weekly or monthly plans. Choose veg, non-veg, or mixed options based on your preference.
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#800020' }}>
                <span className="text-white text-3xl font-bold">2</span>
              </div>
              <h3 
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
              >
                Select Delivery Days
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Choose your preferred delivery days and time slots. Flexible scheduling to fit your routine.
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#800020' }}>
                <span className="text-white text-3xl font-bold">3</span>
              </div>
              <h3 
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
              >
                Enjoy Fresh Meals
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Receive freshly prepared homely food at your doorstep. Taste the difference every day!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl font-bold text-center mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Choose Your Plan
          </h2>
          <p className="text-center text-gray-700 mb-16 text-lg leading-relaxed">
            Flexible meal plans designed for your lifestyle
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {subscriptionPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`hover:shadow-2xl transition-all duration-300 border-2 ${
                  selectedPlan === plan.id ? 'border-burgundy' : 'border-transparent'
                }`}
                style={{ backgroundColor: 'white' }}
              >
                <CardHeader>
                  {plan.id === 2 && (
                    <Badge className="mb-3 w-fit" style={{ backgroundColor: '#800020' }}>Most Popular</Badge>
                  )}
                  <CardTitle 
                    className="text-3xl mb-2"
                    style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
                  >
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold" style={{ color: '#800020' }}>{plan.price}</span>
                    <span className="text-gray-500">{plan.duration}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{plan.meals}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-6 leading-relaxed">{plan.description}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="flex-shrink-0 mt-1" size={18} style={{ color: '#800020' }} />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full text-white font-semibold py-6 hover:opacity-90 transition-all duration-200"
                    style={{ backgroundColor: '#800020' }}
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      alert('Subscription functionality will be available soon!');
                    }}
                  >
                    Subscribe Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFF0' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl font-bold text-center mb-16"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Why Choose Our Dabba Wala Service?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#800020' }}>
                <Calendar className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#800020' }}>Flexible Scheduling</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Pause or resume anytime
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#800020' }}>
                <Clock className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#800020' }}>On-Time Delivery</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Fresh food at your preferred time
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#800020' }}>
                <Truck className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#800020' }}>Doorstep Delivery</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Convenient delivery to your home or office
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#800020' }}>
                <Check className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#800020' }}>Quality Guaranteed</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Homely food, every single day
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Menu */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="container mx-auto max-w-4xl">
          <h2 
            className="text-4xl font-bold text-center mb-6"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Sample Weekly Menu
          </h2>
          <p className="text-center text-gray-700 mb-12 leading-relaxed">
            Here's what a typical week looks like (menu rotates for variety)
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-semibold" style={{ color: '#800020' }}>Monday</span>
                <span className="text-gray-700">Sambar Rice, Potato Curry, Rasam, Papad</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-semibold" style={{ color: '#800020' }}>Tuesday</span>
                <span className="text-gray-700">Chicken Curry, White Rice, Dal, Pickle</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-semibold" style={{ color: '#800020' }}>Wednesday</span>
                <span className="text-gray-700">Pulihora, Gutti Vankaya, Curd, Papad</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-semibold" style={{ color: '#800020' }}>Thursday</span>
                <span className="text-gray-700">Biriyani, Raita, Gravy, Salad</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-semibold" style={{ color: '#800020' }}>Friday</span>
                <span className="text-gray-700">Veg Curry, Rice, Sambar, Papad</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-semibold" style={{ color: '#800020' }}>Saturday</span>
                <span className="text-gray-700">Fish Curry, Rice, Dal, Lemon Pickle</span>
              </div>
              <div className="flex justify-between items-center pb-3">
                <span className="font-semibold" style={{ color: '#800020' }}>Sunday</span>
                <span className="text-gray-700">Special Biriyani, Raita, Sweet</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#800020' }}>
        <div className="container mx-auto max-w-4xl text-center">
          <h2 
            className="text-4xl font-bold mb-6 text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Ready to Start?
          </h2>
          <p className="text-xl text-gray-200 mb-10 leading-relaxed">
            Subscribe today and never miss the taste of home again.
          </p>
          <Button 
            size="lg"
            className="bg-white text-lg px-12 py-6 font-semibold hover:bg-gray-100 transition-all duration-200"
            style={{ color: '#800020' }}
            onClick={() => alert('Contact us for subscription: +44 20 1234 5678')}
          >
            Contact Us to Subscribe
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Subscriptions;
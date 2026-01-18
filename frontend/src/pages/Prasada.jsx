import React from 'react';
import { Leaf, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { menuItems } from '../mockData';

const Prasada = () => {
  const getSpiceIndicator = (level) => {
    if (level === 0) return <span className="text-xs text-gray-500">Mild</span>;
    return (
      <div className="flex gap-0.5">
        {Array(level).fill(0).map((_, i) => (
          <span key={i} className="text-green-600">•</span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="pt-32 pb-20 px-4 relative"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1625398407796-82650a8c135f?crop=entropy&cs=srgb&fm=jpg&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(144, 238, 144, 0.85)' }}></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <Leaf size={60} className="mx-auto mb-6" style={{ color: '#800020' }} />
          <h1 
            className="text-5xl lg:text-7xl font-bold mb-6"
            style={{ fontFamily: "'Playfair Display', serif", lineHeight: '1.2', color: '#800020' }}
          >
            Sree Prasada
          </h1>
          <p className="text-2xl mb-4" style={{ color: '#800020', fontWeight: '600' }}>
            The Divine Pure Vegetarian Experience
          </p>
          <p className="text-lg text-gray-800 leading-relaxed max-w-2xl mx-auto">
            100% pure vegetarian temple-style cooking. Separate utensils, different oils, and complete devotion. 
            Perfect for poojas, vratam days, and those seeking sattvic food.
          </p>
        </div>
      </section>

      {/* Purity Promise Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFF0' }}>
        <div className="container mx-auto max-w-4xl">
          <h2 
            className="text-4xl font-bold text-center mb-6"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Our Purity Promise
          </h2>
          <p className="text-center text-gray-700 text-lg leading-relaxed mb-12">
            When we say pure, we mean truly pure. Prasada is not just vegetarian – it's prepared with the same 
            devotion and cleanliness as temple offerings.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#800020' }}>
                <Leaf className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#800020' }}>Separate Kitchen</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Completely separate cooking area for pure veg food
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#800020' }}>
                <Sparkles className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#800020' }}>Different Utensils</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Dedicated cookware and serving vessels for prasada
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#800020' }}>
                <Sparkles className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#800020' }}>Pure Oils</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Separate, high-quality oils for vegetarian cooking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Prasadam Specials */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl font-bold text-center mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Prasadam Specials
          </h2>
          <p className="text-center text-gray-700 mb-12 leading-relaxed">
            Traditional temple-style offerings
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.prasada.map((dish) => (
              <Card key={dish.id} className="hover:shadow-xl transition-all duration-300 bg-white border-0">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Prasada</Badge>
                    {getSpiceIndicator(dish.spiceLevel)}
                  </div>
                  <CardTitle className="text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {dish.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{dish.description}</p>
                  <p className="text-2xl font-bold" style={{ color: '#800020' }}>{dish.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Veg Curries */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFF0' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl font-bold text-center mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Vegetarian Curries
          </h2>
          <p className="text-center text-gray-700 mb-12 leading-relaxed">
            Wholesome curries that bring comfort and nourishment
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.veg.map((dish) => (
              <Card key={dish.id} className="hover:shadow-xl transition-all duration-300 bg-white border-0">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="text-xs">Veg</Badge>
                    {getSpiceIndicator(dish.spiceLevel)}
                  </div>
                  <CardTitle className="text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {dish.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{dish.description}</p>
                  <p className="text-2xl font-bold" style={{ color: '#800020' }}>{dish.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Special Note */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="container mx-auto max-w-4xl text-center">
          <Sparkles size={48} className="mx-auto mb-6" style={{ color: '#800020' }} />
          <h2 
            className="text-3xl font-bold mb-6"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Ideal for Sacred Occasions
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            Our prasada menu is perfect for poojas, vratam days, temple offerings, housewarming ceremonies, 
            and any occasion where you need food prepared with complete purity and devotion.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#800020' }}>
        <div className="container mx-auto max-w-4xl text-center">
          <h2 
            className="text-4xl font-bold mb-6 text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Experience Pure, Divine Food
          </h2>
          <p className="text-xl text-gray-200 mb-8 leading-relaxed">
            Order our prasada for your next pooja or enjoy it anytime you seek sattvic, pure food.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Prasada;
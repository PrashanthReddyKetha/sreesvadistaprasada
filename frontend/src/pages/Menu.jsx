import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Flame, Leaf } from 'lucide-react';
import { menuItems } from '../mockData';

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'nonVeg', name: 'Non-Veg (Svadista)' },
    { id: 'veg', name: 'Vegetarian' },
    { id: 'prasada', name: 'Prasada (Pure Veg)' },
    { id: 'breakfast', name: 'Breakfast' },
    { id: 'pickles', name: 'Pickles' },
    { id: 'podis', name: 'Podis' }
  ];

  const getSpiceIndicator = (level) => {
    if (level === 0) return <span className="text-xs text-gray-500">Mild</span>;
    return (
      <div className="flex gap-0.5">
        {Array(level).fill(0).map((_, i) => (
          <Flame key={i} size={14} className="text-red-500 fill-red-500" />
        ))}
      </div>
    );
  };

  const getAllDishes = () => {
    const all = [];
    Object.keys(menuItems).forEach(category => {
      menuItems[category].forEach(item => {
        all.push({ ...item, category });
      });
    });
    return all;
  };

  const getFilteredDishes = () => {
    if (activeCategory === 'all') {
      return getAllDishes();
    }
    return menuItems[activeCategory] || [];
  };

  const filteredDishes = getFilteredDishes();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4" style={{ backgroundColor: '#800020' }}>
        <div className="container mx-auto max-w-4xl text-center">
          <h1 
            className="text-5xl lg:text-6xl font-bold mb-6 text-white"
            style={{ fontFamily: "'Playfair Display', serif", lineHeight: '1.2' }}
          >
            Our Full Menu
          </h1>
          <p className="text-xl text-gray-200 leading-relaxed">
            Explore our complete collection of traditional South Indian dishes, from bold non-veg curries 
            to pure vegetarian prasada offerings.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 px-4 sticky top-20 z-40" style={{ backgroundColor: '#FFFFF0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                variant={activeCategory === category.id ? 'default' : 'outline'}
                className={`transition-all duration-200 ${
                  activeCategory === category.id
                    ? 'text-white'
                    : 'text-gray-700 border-2 hover:border-gray-400'
                }`}
                style={activeCategory === category.id ? { backgroundColor: '#800020' } : {}}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Items */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl font-bold text-center mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            {activeCategory === 'all' ? 'All Dishes' : categories.find(c => c.id === activeCategory)?.name}
          </h2>
          <p className="text-center text-gray-700 mb-12 leading-relaxed">
            {filteredDishes.length} delicious options to choose from
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDishes.map((dish) => (
              <Card key={dish.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border-0">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    {dish.category === 'nonVeg' ? (
                      <Badge variant="destructive" className="text-xs flex items-center gap-1">
                        <Flame size={12} /> Non-Veg
                      </Badge>
                    ) : dish.category === 'prasada' ? (
                      <Badge className="text-xs flex items-center gap-1 bg-green-100 text-green-800">
                        <Leaf size={12} /> Prasada
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {dish.category === 'veg' ? 'Veg' : dish.category.charAt(0).toUpperCase() + dish.category.slice(1)}
                      </Badge>
                    )}
                    {getSpiceIndicator(dish.spiceLevel)}
                  </div>
                  <CardTitle className="text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {dish.name}
                  </CardTitle>
                  {dish.subcategory && (
                    <p className="text-xs text-gray-500 mt-1">{dish.subcategory}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{dish.description}</p>
                  <p className="text-2xl font-bold" style={{ color: '#800020' }}>{dish.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDishes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No dishes found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Legend Section */}
      <section className="py-12 px-4" style={{ backgroundColor: '#FFFFF0' }}>
        <div className="container mx-auto max-w-4xl">
          <h3 
            className="text-2xl font-bold text-center mb-8"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Menu Legend
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <Flame size={32} className="mx-auto mb-3 text-red-500" />
              <p className="font-semibold mb-2" style={{ color: '#800020' }}>Spice Level</p>
              <p className="text-sm text-gray-600">Number of flames indicates heat level</p>
            </div>
            <div>
              <Leaf size={32} className="mx-auto mb-3 text-green-600" />
              <p className="font-semibold mb-2" style={{ color: '#800020' }}>Pure Veg (Prasada)</p>
              <p className="text-sm text-gray-600">Temple-style vegetarian with complete purity</p>
            </div>
            <div>
              <div className="w-8 h-8 rounded mx-auto mb-3 flex items-center justify-center bg-red-500">
                <Flame size={20} className="text-white" />
              </div>
              <p className="font-semibold mb-2" style={{ color: '#800020' }}>Non-Veg</p>
              <p className="text-sm text-gray-600">Traditional South Indian non-vegetarian dishes</p>
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
            Ready to Order?
          </h2>
          <p className="text-xl text-gray-200 mb-8 leading-relaxed">
            Visit our restaurant, call for delivery, or subscribe to our meal plans
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-white text-lg px-10 py-6 font-semibold hover:bg-gray-100 transition-all duration-200"
              style={{ color: '#800020' }}
              onClick={() => alert('Call us: +44 20 1234 5678')}
            >
              Order Now
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-white text-white bg-transparent hover:bg-white text-lg px-10 py-6 font-semibold"
              onClick={() => window.location.href = '/subscriptions'}
            >
              View Subscriptions
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Menu;

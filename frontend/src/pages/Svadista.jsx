import React from 'react';
import { Flame, ChefHat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { menuItems } from '../mockData';

const Svadista = () => {
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
      <section 
        className="pt-32 pb-20 px-4 relative"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1708782344490-9026aaa5eec7?crop=entropy&cs=srgb&fm=jpg&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255, 213, 128, 0.85)' }}></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <Flame size={60} className="mx-auto mb-6" style={{ color: '#800020' }} />
          <h1 
            className="text-5xl lg:text-7xl font-bold mb-6"
            style={{ fontFamily: "'Playfair Display', serif", lineHeight: '1.2', color: '#800020' }}
          >
            Sree Svadista
          </h1>
          <p className="text-2xl mb-4" style={{ color: '#800020', fontWeight: '600' }}>
            The Traditional Non-Veg Experience
          </p>
          <p className="text-lg text-gray-800 leading-relaxed max-w-2xl mx-auto">
            For those who grew up on Sunday chicken curry and festival mutton biriyani. 
            Rustic, spicy, bold – just like at your grandmother's home.
          </p>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFF0' }}>
        <div className="container mx-auto max-w-4xl">
          <h2 
            className="text-4xl font-bold text-center mb-6"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Bold, Rustic, Traditional
          </h2>
          <p className="text-center text-gray-700 text-lg leading-relaxed mb-12">
            Svadista brings you authentic South Indian non-vegetarian dishes prepared using grandmother's recipes. 
            No fusion, no shortcuts – just pure, traditional cooking that reminds you of home.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#800020' }}>
                <ChefHat className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#800020' }}>Traditional Recipes</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Authentic recipes passed down through generations
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#800020' }}>
                <Flame className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#800020' }}>Bold Spices</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Aromatic spice blends that create authentic flavors
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#800020' }}>
                <ChefHat className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#800020' }}>Fresh Ingredients</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Quality meats and fresh vegetables daily
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section - Starters */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl font-bold text-center mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Starters
          </h2>
          <p className="text-center text-gray-700 mb-12 leading-relaxed">
            Bold appetizers to awaken your taste buds
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.nonVeg.filter(item => item.subcategory === 'Starters').map((dish) => (
              <Card key={dish.id} className="hover:shadow-xl transition-all duration-300 bg-white border-0">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="destructive" className="text-xs">Non-Veg</Badge>
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

      {/* Menu Section - Curries */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFF0' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl font-bold text-center mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Curries
          </h2>
          <p className="text-center text-gray-700 mb-12 leading-relaxed">
            Rich, flavorful curries that taste like home
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.nonVeg.filter(item => item.subcategory === 'Curries').map((dish) => (
              <Card key={dish.id} className="hover:shadow-xl transition-all duration-300 bg-white border-0">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="destructive" className="text-xs">Non-Veg</Badge>
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

      {/* Menu Section - Biriyanis */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl font-bold text-center mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Biriyanis
          </h2>
          <p className="text-center text-gray-700 mb-12 leading-relaxed">
            Aromatic rice dishes layered with spices and meat
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.nonVeg.filter(item => item.subcategory === 'Biriyanis').map((dish) => (
              <Card key={dish.id} className="hover:shadow-xl transition-all duration-300 bg-white border-0">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="destructive" className="text-xs">Non-Veg</Badge>
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

      {/* CTA Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#800020' }}>
        <div className="container mx-auto max-w-4xl text-center">
          <h2 
            className="text-4xl font-bold mb-6 text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Craving Bold Flavors?
          </h2>
          <p className="text-xl text-gray-200 mb-8 leading-relaxed">
            Order now or visit our restaurant to experience authentic South Indian non-vegetarian cuisine.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Svadista;
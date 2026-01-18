import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Heart, Users, Leaf, Flame } from 'lucide-react';

const OurStory = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="pt-32 pb-20 px-4 relative"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1758874960394-afd9ead46eba?crop=entropy&cs=srgb&fm=jpg&q=85)',
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
            Our Story
          </h1>
          <p className="text-xl text-gray-200 leading-relaxed">
            From Amma's Kitchen to the UK – A Journey of Love, Tradition, and Homely Food
          </p>
        </div>
      </section>

      {/* Main Story Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFF0' }}>
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2 
              className="text-4xl font-bold mb-6"
              style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
            >
              The Beginning
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Every great journey starts with a longing. For us, it was the longing for the taste of home – 
              the kind of food that wraps you in warmth, transports you back to your grandmother's kitchen, 
              and makes you feel truly at peace.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              When we moved to the UK, we realized how many South Indians were missing authentic, 
              traditional homely food. Not restaurant food, not fusion experiments – but real, 
              soul-satisfying dishes cooked the way our grandmothers made them.
            </p>

            <div className="my-12">
              <img 
                src="https://images.unsplash.com/photo-1633536704679-de310869515b?crop=entropy&cs=srgb&fm=jpg&q=85"
                alt="Traditional South Indian Kitchen"
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>

            <h2 
              className="text-4xl font-bold mb-6 mt-12"
              style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
            >
              The Meaning of Sree Svadista Prasada
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Our name carries deep meaning. <strong>"Sree"</strong> represents divinity and prosperity. 
              <strong>"Svadista"</strong> means delicious and authentic – the traditional flavors that 
              make your taste buds dance. <strong>"Prasada"</strong> is sacred food offered with devotion, 
              pure and blessed.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Together, Sree Svadista Prasada embodies our commitment to bringing you food that is not just 
              delicious, but prepared with the same devotion and purity as temple offerings.
            </p>

            <h2 
              className="text-4xl font-bold mb-6 mt-12"
              style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
            >
              Two Culinary Worlds
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              We understood that our community has diverse needs. Some crave the bold, rustic flavors 
              of traditional non-vegetarian cooking – the Sunday chicken curry that filled the house 
              with irresistible aromas. Others seek the pure, sattvic experience of temple-style 
              vegetarian food.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              That's why we created two distinct culinary experiences under one roof:
            </p>

            <div className="grid md:grid-cols-2 gap-8 my-8">
              <div className="p-6 rounded-lg" style={{ backgroundColor: '#FFD580' }}>
                <Flame size={40} className="mb-4" style={{ color: '#800020' }} />
                <h3 
                  className="text-2xl font-bold mb-3"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
                >
                  Sree Svadista
                </h3>
                <p className="text-gray-800 leading-relaxed">
                  The Traditional – For those who love rustic, spicy, bold non-vegetarian dishes. 
                  Authentic recipes passed down through generations, cooked just like at your grandmother's home.
                </p>
              </div>

              <div className="p-6 rounded-lg" style={{ backgroundColor: '#90EE90' }}>
                <Leaf size={40} className="mb-4" style={{ color: '#800020' }} />
                <h3 
                  className="text-2xl font-bold mb-3"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
                >
                  Sree Prasada
                </h3>
                <p className="text-gray-800 leading-relaxed">
                  The Divine – 100% pure vegetarian temple-style cooking with separate utensils, 
                  different oils, and no cross-contamination. Food prepared with complete devotion.
                </p>
              </div>
            </div>

            <h2 
              className="text-4xl font-bold mb-6 mt-12"
              style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
            >
              Our Promise
            </h2>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Heart className="flex-shrink-0 mt-1" style={{ color: '#800020' }} />
                <span className="text-gray-700 leading-relaxed">
                  <strong>Fresh Ingredients:</strong> We source the finest ingredients, just like your grandmother 
                  would choose from the market.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Heart className="flex-shrink-0 mt-1" style={{ color: '#800020' }} />
                <span className="text-gray-700 leading-relaxed">
                  <strong>No Shortcuts:</strong> Every dish is cooked using traditional methods. No artificial 
                  flavors, no preservatives – just authentic taste.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Heart className="flex-shrink-0 mt-1" style={{ color: '#800020' }} />
                <span className="text-gray-700 leading-relaxed">
                  <strong>Temple-like Cleanliness:</strong> For our pure vegetarian prasada, we maintain 
                  separate kitchens, utensils, and cooking oils.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Heart className="flex-shrink-0 mt-1" style={{ color: '#800020' }} />
                <span className="text-gray-700 leading-relaxed">
                  <strong>Cooked with Devotion:</strong> Every meal is prepared with the same love and care 
                  that your mother puts into her cooking.
                </span>
              </li>
            </ul>

            <div className="my-12">
              <img 
                src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?crop=entropy&cs=srgb&fm=jpg&q=85"
                alt="Traditional Indian Curry Dishes"
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>

            <h2 
              className="text-4xl font-bold mb-6 mt-12"
              style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
            >
              More Than a Restaurant
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Sree Svadista Prasada is not just a restaurant – it's a gateway back home. Whether you're 
              a student missing Amma's cooking, a professional craving authentic flavors, or a family 
              looking for pure prasada for your pooja, we're here for you.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              We offer dine-in experiences, weekly and monthly meal subscriptions (Dabba Wala service), 
              and full catering for functions, poojas, and corporate events. Our goal is simple: to bring 
              the taste of home to every South Indian in the UK.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#800020' }}>
        <div className="container mx-auto max-w-4xl text-center">
          <h2 
            className="text-4xl lg:text-5xl font-bold mb-6 text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Experience the Taste of Home
          </h2>
          <p className="text-xl text-gray-200 mb-10 leading-relaxed">
            Visit us today or subscribe to our meal plans and rediscover the flavors you've been missing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/menu">
              <Button 
                size="lg"
                className="bg-white text-lg px-10 py-6 font-semibold hover:bg-gray-100 transition-all duration-200"
                style={{ color: '#800020' }}
              >
                View Menu
              </Button>
            </Link>
            <Link to="/subscriptions">
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white text-white bg-transparent hover:bg-white text-lg px-10 py-6 font-semibold"
                style={{ '&:hover': { color: '#800020' } }}
              >
                Subscribe Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OurStory;
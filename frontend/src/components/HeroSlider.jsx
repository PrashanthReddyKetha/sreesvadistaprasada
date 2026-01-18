import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1758874960394-afd9ead46eba?crop=entropy&cs=srgb&fm=jpg&q=85',
      title: "Welcome Home",
      subtitle: "The authentic taste you missed, carried forward with love.",
      description: "Now serving Edinburgh & Glasgow.",
      cta: "Explore Our Kitchen",
      link: "/menu"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full" style={{ height: '600px' }}>
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div 
            className="w-full h-full bg-cover bg-center relative"
            style={{ 
              backgroundImage: `url(${slide.image})`,
              backgroundColor: '#FFFFF0'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
            <div className="container mx-auto h-full flex items-center px-4 lg:px-8 relative z-10">
              <div className="max-w-2xl text-white">
                <h1 
                  className="text-5xl lg:text-7xl font-bold mb-4"
                  style={{ fontFamily: "'Playfair Display', serif", lineHeight: '1.2' }}
                >
                  {slide.title}
                </h1>
                <p className="text-xl lg:text-2xl mb-3 font-medium" style={{ color: '#B8860B' }}>
                  {slide.subtitle}
                </p>
                <p className="text-lg mb-8">
                  {slide.description}
                </p>
                <Link to={slide.link}>
                  <Button 
                    size="lg"
                    className="text-white text-base px-8 py-6 font-semibold hover:opacity-90 transition-all duration-200"
                    style={{ backgroundColor: '#800020' }}
                  >
                    {slide.cta}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 text-white p-3 rounded-full hover:bg-opacity-80 transition-all duration-200 z-20"
            style={{ backgroundColor: '#800020' }}
            aria-label="Previous slide"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 text-white p-3 rounded-full hover:bg-opacity-80 transition-all duration-200 z-20"
            style={{ backgroundColor: '#800020' }}
            aria-label="Next slide"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}
    </div>
  );
};

export default HeroSlider;

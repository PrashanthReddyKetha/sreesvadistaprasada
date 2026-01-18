import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "Welcome to Traditional Homely Food",
      subtitle: "From Grandmother's Kitchen to Your Plate",
      description: "Experience the authentic taste of South Indian home cooking, prepared with love and devotion",
      cta: "Explore Menu",
      link: "/menu",
      bgColor: "#FFFFF0"
    },
    {
      id: 2,
      title: "Two Divine Culinary Worlds",
      subtitle: "Prasada & Svadista",
      description: "Pure vegetarian temple-style prasada and traditional spicy non-vegetarian delicacies",
      cta: "Discover More",
      link: "#two-worlds",
      bgColor: "#FFFFF0"
    },
    {
      id: 3,
      title: "Dabba Wala Subscription Service",
      subtitle: "Homely Food Delivered Daily",
      description: "Weekly and monthly meal plans bringing the taste of home to your doorstep",
      cta: "View Plans",
      link: "/subscriptions",
      bgColor: "#FFFFF0"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundColor: slide.bgColor }}
        >
          <div className="container mx-auto px-4 h-full flex items-center justify-center">
            <div className="text-center max-w-4xl">
              <h1 
                className="text-5xl lg:text-7xl font-bold mb-6"
                style={{ 
                  fontFamily: "'Playfair Display', serif",
                  color: '#800020',
                  lineHeight: '1.2'
                }}
              >
                {slide.title}
              </h1>
              <h2 
                className="text-2xl lg:text-3xl font-semibold mb-6"
                style={{ color: '#B8860B' }}
              >
                {slide.subtitle}
              </h2>
              <p className="text-lg lg:text-xl text-gray-700 mb-10 max-w-2xl mx-auto leading-relaxed">
                {slide.description}
              </p>
              {slide.link.startsWith('#') ? (
                <a href={slide.link}>
                  <Button 
                    size="lg"
                    className="text-white text-lg px-10 py-6 font-semibold hover:opacity-90 transition-all duration-200"
                    style={{ backgroundColor: '#800020' }}
                  >
                    {slide.cta}
                  </Button>
                </a>
              ) : (
                <Link to={slide.link}>
                  <Button 
                    size="lg"
                    className="text-white text-lg px-10 py-6 font-semibold hover:opacity-90 transition-all duration-200"
                    style={{ backgroundColor: '#800020' }}
                  >
                    {slide.cta}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 text-white p-3 rounded-full hover:bg-opacity-80 transition-all duration-200"
        style={{ backgroundColor: '#800020' }}
        aria-label="Previous slide"
      >
        <ChevronLeft size={32} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 text-white p-3 rounded-full hover:bg-opacity-80 transition-all duration-200"
        style={{ backgroundColor: '#800020' }}
        aria-label="Next slide"
      >
        <ChevronRight size={32} />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'w-8'
                : 'opacity-50 hover:opacity-75'
            }`}
            style={{ backgroundColor: '#800020' }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;

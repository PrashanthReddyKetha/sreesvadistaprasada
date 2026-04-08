import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { heroSlides } from '../mockData';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback((index) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 800);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % heroSlides.length);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length);
  }, [currentSlide, goToSlide]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div data-testid="hero-slider" className="relative w-full overflow-hidden" style={{ height: 'min(80vh, 700px)' }}>
      {heroSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 ease-in-out ${
            index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          style={{ transition: 'all 800ms ease-in-out' }}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          />

          {/* Gradient Overlay - Strong for readability */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to right, rgba(45, 36, 34, 0.92) 0%, rgba(45, 36, 34, 0.8) 35%, rgba(45, 36, 34, 0.5) 65%, rgba(45, 36, 34, 0.3) 100%)'
          }} />

          {/* Bottom subtle grain */}
          <div className="absolute inset-0 grain-overlay" />

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
            <div
              className={`max-w-xl transition-all duration-700 ${
                index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: index === currentSlide ? '300ms' : '0ms' }}
            >
              {/* Decorative line */}
              <div className="w-12 h-0.5 mb-6" style={{ backgroundColor: '#F4C430' }} />

              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-white leading-tight tracking-tight whitespace-pre-line"
                style={{ fontFamily: "'Playfair Display', serif" }}
                data-testid={`hero-title-${slide.id}`}
              >
                {slide.title}
              </h1>

              <p className="text-lg md:text-xl mb-2 font-medium" style={{ color: '#F4C430' }}>
                {slide.subtitle}
              </p>

              <p className="text-base md:text-lg mb-8 text-gray-300 leading-relaxed">
                {slide.description}
              </p>

              <Link to={slide.link}>
                <button
                  className="group px-8 py-3.5 text-sm font-semibold tracking-wide uppercase text-white rounded-sm transition-all duration-300 hover:shadow-lg"
                  style={{ backgroundColor: '#800020' }}
                  data-testid={`hero-cta-${slide.id}`}
                >
                  {slide.cta}
                  <ChevronRight size={16} className="inline ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white z-20 transition-all duration-300 hover:scale-110"
        style={{ backgroundColor: 'rgba(128, 0, 32, 0.7)', backdropFilter: 'blur(4px)' }}
        aria-label="Previous slide"
        data-testid="hero-prev-btn"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white z-20 transition-all duration-300 hover:scale-110"
        style={{ backgroundColor: 'rgba(128, 0, 32, 0.7)', backdropFilter: 'blur(4px)' }}
        aria-label="Next slide"
        data-testid="hero-next-btn"
      >
        <ChevronRight size={20} />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1 rounded-full transition-all duration-500 ${
              index === currentSlide ? 'w-8' : 'w-3'
            }`}
            style={{ backgroundColor: index === currentSlide ? '#F4C430' : 'rgba(255,255,255,0.4)' }}
            aria-label={`Go to slide ${index + 1}`}
            data-testid={`hero-indicator-${index}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;

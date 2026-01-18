import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, Briefcase, Heart, Calendar } from 'lucide-react';

const Catering = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: '',
    eventDate: '',
    guests: '',
    foodType: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your enquiry! We will contact you soon.');
    console.log('Catering enquiry:', formData);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="pt-32 pb-20 px-4 relative"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1768725844862-a251caa28600?crop=entropy&cs=srgb&fm=jpg&q=85)',
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
            Catering & Corporate Services
          </h1>
          <p className="text-2xl mb-4 text-gray-200">
            Poojas, Weddings, Corporate Events & More
          </p>
          <p className="text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Make your special occasions memorable with authentic South Indian homely food. 
            From intimate gatherings to grand celebrations, we cater to all.
          </p>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFF0' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl font-bold text-center mb-16"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Our Catering Services
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Functions & Events */}
            <Card className="hover:shadow-xl transition-all duration-300 border-0">
              <CardHeader>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#800020' }}>
                  <Heart className="text-white" size={28} />
                </div>
                <CardTitle 
                  className="text-3xl mb-4"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
                >
                  Functions & Events Catering
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Perfect for all your special occasions:
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#800020' }}>•</span>
                    <span>Temple Poojas & Religious Ceremonies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#800020' }}>•</span>
                    <span>Weddings & Receptions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#800020' }}>•</span>
                    <span>Housewarming (Griha Pravesh)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#800020' }}>•</span>
                    <span>Birthday Parties & Anniversaries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#800020' }}>•</span>
                    <span>Vratam & Satyanarayan Puja</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#800020' }}>•</span>
                    <span>Thread Ceremony (Upanayanam)</span>
                  </li>
                </ul>
                <p className="text-gray-700 mt-6 leading-relaxed">
                  We offer both pure vegetarian prasada menus and mixed veg/non-veg options 
                  tailored to your requirements.
                </p>
              </CardContent>
            </Card>

            {/* Corporate Dabba Wala */}
            <Card className="hover:shadow-xl transition-all duration-300 border-0">
              <CardHeader>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#800020' }}>
                  <Briefcase className="text-white" size={28} />
                </div>
                <CardTitle 
                  className="text-3xl mb-4"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
                >
                  Corporate Dabba Wala
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Daily tiffin service for offices and working professionals:
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#800020' }}>•</span>
                    <span>Fixed Corporate Packages (Weekly/Monthly)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#800020' }}>•</span>
                    <span>Monday to Friday Lunch Delivery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#800020' }}>•</span>
                    <span>Bulk Orders for Office Teams</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#800020' }}>•</span>
                    <span>On-Time Delivery to Office Premises</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#800020' }}>•</span>
                    <span>Healthy, Homely, Consistent Quality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#800020' }}>•</span>
                    <span>Flexible Menu Options</span>
                  </li>
                </ul>
                <p className="text-gray-700 mt-6 leading-relaxed">
                  Keep your team energized with nutritious, home-style meals delivered 
                  fresh every day.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl font-bold text-center mb-16"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Why Choose Our Catering?
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#800020' }}>
                <Users className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#800020' }}>Any Size Event</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                From 10 to 500+ guests
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#800020' }}>
                <Heart className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#800020' }}>Pure Prasada</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Temple-style purity for sacred events
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#800020' }}>
                <Calendar className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#800020' }}>Flexible Menus</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Customized to your preferences
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#800020' }}>
                <Briefcase className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#800020' }}>Professional Service</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Experienced team, timely delivery
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enquiry Form */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFF0' }}>
        <div className="container mx-auto max-w-4xl">
          <h2 
            className="text-4xl font-bold text-center mb-6"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Request a Quote
          </h2>
          <p className="text-center text-gray-700 mb-12 text-lg leading-relaxed">
            Fill out the form below and we'll get back to you with a customized quote
          </p>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Your Name *</Label>
                    <Input 
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input 
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input 
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventType">Event Type *</Label>
                    <Select onValueChange={(value) => setFormData({...formData, eventType: value})}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pooja">Temple Pooja/Religious Ceremony</SelectItem>
                        <SelectItem value="wedding">Wedding/Reception</SelectItem>
                        <SelectItem value="housewarming">Housewarming</SelectItem>
                        <SelectItem value="birthday">Birthday/Anniversary</SelectItem>
                        <SelectItem value="corporate">Corporate Event</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="eventDate">Event Date *</Label>
                    <Input 
                      id="eventDate"
                      type="date"
                      required
                      value={formData.eventDate}
                      onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guests">Number of Guests *</Label>
                    <Input 
                      id="guests"
                      type="number"
                      required
                      value={formData.guests}
                      onChange={(e) => setFormData({...formData, guests: e.target.value})}
                      className="mt-2"
                      placeholder="e.g., 50"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="foodType">Food Preference *</Label>
                  <Select onValueChange={(value) => setFormData({...formData, foodType: value})}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select food preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pure-veg">Pure Vegetarian (Prasada)</SelectItem>
                      <SelectItem value="veg">Vegetarian</SelectItem>
                      <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                      <SelectItem value="mixed">Mixed (Veg & Non-Veg)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Additional Details</Label>
                  <Textarea 
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="mt-2"
                    placeholder="Please share any specific requirements, menu preferences, or questions..."
                  />
                </div>

                <Button 
                  type="submit"
                  size="lg"
                  className="w-full text-white text-lg py-6 font-semibold hover:opacity-90 transition-all duration-200"
                  style={{ backgroundColor: '#800020' }}
                >
                  Submit Enquiry
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4" style={{ backgroundColor: '#800020' }}>
        <div className="container mx-auto max-w-4xl text-center">
          <h2 
            className="text-4xl font-bold mb-6 text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Need Immediate Assistance?
          </h2>
          <p className="text-xl text-gray-200 mb-8 leading-relaxed">
            Call us directly to discuss your catering needs
          </p>
          <a href="tel:+442012345678">
            <Button 
              size="lg"
              className="bg-white text-lg px-12 py-6 font-semibold hover:bg-gray-100 transition-all duration-200"
              style={{ color: '#800020' }}
            >
              Call +44 20 1234 5678
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
};

export default Catering;
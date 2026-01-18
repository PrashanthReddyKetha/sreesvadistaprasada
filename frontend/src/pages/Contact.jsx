import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for contacting us! We will get back to you soon.');
    console.log('Contact form:', formData);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4" style={{ backgroundColor: '#800020' }}>
        <div className="container mx-auto max-w-4xl text-center">
          <h1 
            className="text-5xl lg:text-6xl font-bold mb-6 text-white"
            style={{ fontFamily: "'Playfair Display', serif", lineHeight: '1.2' }}
          >
            Get in Touch
          </h1>
          <p className="text-xl text-gray-200 leading-relaxed">
            We'd love to hear from you. Whether you have a question about our menu, subscriptions, 
            catering, or anything else, we're ready to answer.
          </p>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFFFF0' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 
                className="text-4xl font-bold mb-8"
                style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
              >
                Contact Information
              </h2>

              <div className="space-y-8">
                {/* Address */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#800020' }}>
                        <MapPin className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2" style={{ color: '#800020' }}>Visit Us</h3>
                        <p className="text-gray-700 leading-relaxed">
                          123 High Street<br />
                          London, UK<br />
                          SW1A 1AA
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Phone */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#800020' }}>
                        <Phone className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2" style={{ color: '#800020' }}>Call Us</h3>
                        <p className="text-gray-700 leading-relaxed">
                          Restaurant: <a href="tel:+442012345678" className="hover:underline">+44 20 1234 5678</a><br />
                          Catering: <a href="tel:+442012345679" className="hover:underline">+44 20 1234 5679</a><br />
                          WhatsApp: <a href="https://wa.me/442012345678" className="hover:underline">+44 20 1234 5678</a>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Email */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#800020' }}>
                        <Mail className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2" style={{ color: '#800020' }}>Email Us</h3>
                        <p className="text-gray-700 leading-relaxed">
                          General: <a href="mailto:info@sreesvadista.co.uk" className="hover:underline">info@sreesvadista.co.uk</a><br />
                          Catering: <a href="mailto:catering@sreesvadista.co.uk" className="hover:underline">catering@sreesvadista.co.uk</a><br />
                          Support: <a href="mailto:support@sreesvadista.co.uk" className="hover:underline">support@sreesvadista.co.uk</a>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Opening Hours */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#800020' }}>
                        <Clock className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2" style={{ color: '#800020' }}>Opening Hours</h3>
                        <p className="text-gray-700 leading-relaxed">
                          Monday - Friday: 11:00 AM - 10:00 PM<br />
                          Saturday - Sunday: 10:00 AM - 11:00 PM<br />
                          <span className="text-sm italic">Delivery available during all hours</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Social Media */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4" style={{ color: '#800020' }}>Follow Us</h3>
                <div className="flex gap-4">
                  <a 
                    href="#" 
                    className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity duration-200"
                    style={{ backgroundColor: '#800020' }}
                  >
                    <Facebook className="text-white" size={24} />
                  </a>
                  <a 
                    href="#" 
                    className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity duration-200"
                    style={{ backgroundColor: '#800020' }}
                  >
                    <Instagram className="text-white" size={24} />
                  </a>
                  <a 
                    href="#" 
                    className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity duration-200"
                    style={{ backgroundColor: '#800020' }}
                  >
                    <Twitter className="text-white" size={24} />
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 
                className="text-4xl font-bold mb-8"
                style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
              >
                Send Us a Message
              </h2>

              <Card className="border-0 shadow-xl">
                <CardContent className="pt-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="name">Your Name *</Label>
                      <Input 
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="mt-2"
                        placeholder="Enter your full name"
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
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="mt-2"
                        placeholder="+44 20 xxxx xxxx"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Your Message *</Label>
                      <Textarea 
                        id="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        className="mt-2"
                        placeholder="How can we help you?"
                      />
                    </div>

                    <Button 
                      type="submit"
                      size="lg"
                      className="w-full text-white text-lg py-6 font-semibold hover:opacity-90 transition-all duration-200"
                      style={{ backgroundColor: '#800020' }}
                    >
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 
            className="text-4xl font-bold text-center mb-12"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Find Us
          </h2>
          <div className="bg-gray-300 rounded-lg overflow-hidden" style={{ height: '400px' }}>
            {/* Google Maps embed would go here */}
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <p>Map will be integrated here</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
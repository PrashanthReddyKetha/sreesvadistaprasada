import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Calendar, Leaf, Flame, Sparkles, Package } from 'lucide-react';
import { subscriptionPlans } from '../mockData';

const steps = [
  { num: 1, label: 'Duration' },
  { num: 2, label: 'Box Type' },
  { num: 3, label: 'Preferences' },
  { num: 4, label: 'Summary' },
];

const durations = [
  { id: 'weekly', name: 'Weekly Trial', days: '5 Days', price: '£45', perMeal: '£9/meal', desc: 'Try before you commit. 5 meals, Mon-Fri.' },
  { id: 'monthly', name: 'Monthly Saver', days: '20 Days', price: '£160', perMeal: '£8/meal', desc: 'Best value. Full month of homely meals.', popular: true },
  { id: 'family', name: 'Family Plan', days: '20 Days x 2', price: '£280', perMeal: '£7/meal', desc: 'Feed the whole family. 40 meals total.' },
];

const boxTypes = [
  { id: 'prasada', name: 'Prasada Box', icon: Leaf, color: '#4A7C59', desc: '100% pure vegetarian meals. Temple-style cooking.', items: ['Rice / Roti', 'Dal', 'Veg Curry', 'Chutney / Pickle', 'Papad'] },
  { id: 'svadista', name: 'Svadista Box', icon: Flame, color: '#8B3A3A', desc: 'Traditional non-veg meals. Bold village flavors.', items: ['Rice', 'Non-Veg Curry', 'Side Dish', 'Rasam / Sambar', 'Pickle'] },
  { id: 'mixed', name: 'Mixed Box', icon: Sparkles, color: '#B8860B', desc: 'Best of both worlds. Alternating veg and non-veg.', items: ['Alternating daily', 'Full meal each day', 'Chef curated menu', 'Festival specials included'] },
];

const preferences = [
  { id: 'no-onion', label: 'No Onion / Garlic' },
  { id: 'less-spice', label: 'Less Spicy' },
  { id: 'extra-spice', label: 'Extra Spicy' },
  { id: 'no-egg', label: 'No Egg' },
  { id: 'jain', label: 'Jain Preference' },
  { id: 'no-mushroom', label: 'No Mushroom' },
  { id: 'no-brinjal', label: 'No Brinjal' },
  { id: 'gluten-free', label: 'Gluten-Free where possible' },
];

const Subscriptions = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null);
  const [selectedPrefs, setSelectedPrefs] = useState([]);
  const [startDate, setStartDate] = useState('');

  const togglePref = (id) => {
    setSelectedPrefs(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const canProceed = () => {
    if (currentStep === 1) return selectedDuration !== null;
    if (currentStep === 2) return selectedBox !== null;
    return true;
  };

  const goNext = () => { if (canProceed() && currentStep < 4) setCurrentStep(currentStep + 1); };
  const goBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const selectedDurationData = durations.find(d => d.id === selectedDuration);
  const selectedBoxData = boxTypes.find(b => b.id === selectedBox);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Hero */}
      <section className="pt-[calc(36px+4rem)] md:pt-[calc(36px+5rem)] relative overflow-hidden" style={{ height: 'min(45vh, 360px)' }}>
        <img
          src="https://images.unsplash.com/photo-1657205937707-940bf77b2602?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
          alt="Dabba Wala Subscription"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(128,0,32,0.92) 0%, rgba(128,0,32,0.7) 50%, rgba(128,0,32,0.5) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.25em] mb-2" style={{ color: '#F4C430' }}>The Dabba Wala Service</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your Daily Dose of Home
            </h1>
            <p className="text-lg text-gray-200 leading-relaxed max-w-md">
              Wholesome meal subscriptions delivered to your door. Build your perfect box in 4 simple steps.
            </p>
          </div>
        </div>
      </section>

      {/* Step Indicator */}
      <div className="py-6 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE', borderBottom: '1px solid rgba(128,0,32,0.1)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, i) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center gap-1.5" data-testid={`step-indicator-${step.num}`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      currentStep > step.num ? 'text-white' : currentStep === step.num ? 'text-white' : 'text-gray-400'
                    }`}
                    style={{
                      backgroundColor: currentStep > step.num ? '#4A7C59' : currentStep === step.num ? '#800020' : '#e5e7eb',
                    }}
                  >
                    {currentStep > step.num ? <Check size={18} /> : step.num}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${currentStep >= step.num ? 'text-gray-800' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2" style={{ backgroundColor: currentStep > step.num ? '#4A7C59' : '#e5e7eb' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Wizard Content */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">

          {/* Step 1: Duration */}
          {currentStep === 1 && (
            <div data-testid="wizard-step-1">
              <h2 className="text-3xl font-bold mb-2 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                Choose Your Plan
              </h2>
              <p className="text-sm text-gray-500 mb-8">How long do you want to enjoy homely meals?</p>
              <div className="grid md:grid-cols-3 gap-6">
                {durations.map(dur => (
                  <button
                    key={dur.id}
                    onClick={() => setSelectedDuration(dur.id)}
                    className={`relative p-6 rounded-lg text-left transition-all duration-300 ${
                      selectedDuration === dur.id ? 'ring-2 shadow-lg' : 'hover:shadow-md'
                    }`}
                    style={{
                      backgroundColor: 'white',
                      ringColor: '#800020',
                      boxShadow: selectedDuration === dur.id ? '0 8px 24px rgba(128,0,32,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                      border: selectedDuration === dur.id ? '2px solid #800020' : '2px solid transparent'
                    }}
                    data-testid={`duration-${dur.id}`}
                  >
                    {dur.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#F4C430', color: '#2D2422' }}>
                        Most Popular
                      </span>
                    )}
                    <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>{dur.name}</h3>
                    <p className="text-xs text-gray-500 mb-3">{dur.days}</p>
                    <p className="text-3xl font-bold mb-1" style={{ color: '#800020' }}>{dur.price}</p>
                    <p className="text-xs font-semibold mb-3" style={{ color: '#B8860B' }}>{dur.perMeal}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{dur.desc}</p>
                    {selectedDuration === dur.id && (
                      <div className="absolute top-4 right-4">
                        <Check size={20} style={{ color: '#800020' }} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Box Type */}
          {currentStep === 2 && (
            <div data-testid="wizard-step-2">
              <h2 className="text-3xl font-bold mb-2 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                Choose Your Box
              </h2>
              <p className="text-sm text-gray-500 mb-8">What kind of meals do you prefer?</p>
              <div className="grid md:grid-cols-3 gap-6">
                {boxTypes.map(box => (
                  <button
                    key={box.id}
                    onClick={() => setSelectedBox(box.id)}
                    className={`relative p-6 rounded-lg text-left transition-all duration-300 ${
                      selectedBox === box.id ? 'shadow-lg' : 'hover:shadow-md'
                    }`}
                    style={{
                      backgroundColor: 'white',
                      boxShadow: selectedBox === box.id ? `0 8px 24px ${box.color}20` : '0 2px 8px rgba(0,0,0,0.04)',
                      border: selectedBox === box.id ? `2px solid ${box.color}` : '2px solid transparent'
                    }}
                    data-testid={`box-${box.id}`}
                  >
                    <box.icon size={28} style={{ color: box.color }} className="mb-3" />
                    <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: box.color }}>{box.name}</h3>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">{box.desc}</p>
                    <ul className="space-y-1.5">
                      {box.items.map(item => (
                        <li key={item} className="text-xs text-gray-600 flex items-center gap-1.5">
                          <Check size={12} style={{ color: box.color }} /> {item}
                        </li>
                      ))}
                    </ul>
                    {selectedBox === box.id && (
                      <div className="absolute top-4 right-4">
                        <Check size={20} style={{ color: box.color }} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 3 && (
            <div data-testid="wizard-step-3">
              <h2 className="text-3xl font-bold mb-2 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                Fine-Tune Your Meals
              </h2>
              <p className="text-sm text-gray-500 mb-8">Any dietary preferences or exclusions? (Optional)</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {preferences.map(pref => (
                  <button
                    key={pref.id}
                    onClick={() => togglePref(pref.id)}
                    className={`flex items-center gap-3 p-4 rounded-lg text-left text-sm font-medium transition-all duration-200 ${
                      selectedPrefs.includes(pref.id) ? 'bg-[#800020]/5' : 'bg-white hover:bg-gray-50'
                    }`}
                    style={{
                      border: selectedPrefs.includes(pref.id) ? '2px solid #800020' : '2px solid #e5e7eb'
                    }}
                    data-testid={`pref-${pref.id}`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                      selectedPrefs.includes(pref.id) ? 'text-white' : 'border-2 border-gray-300'
                    }`} style={selectedPrefs.includes(pref.id) ? { backgroundColor: '#800020' } : {}}>
                      {selectedPrefs.includes(pref.id) && <Check size={14} />}
                    </div>
                    <span style={{ color: selectedPrefs.includes(pref.id) ? '#800020' : '#5C4B47' }}>{pref.label}</span>
                  </button>
                ))}
              </div>

              <div className="max-w-sm">
                <label className="text-sm font-semibold block mb-2" style={{ color: '#2D2422' }}>Preferred Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors"
                  data-testid="start-date-input"
                />
              </div>
            </div>
          )}

          {/* Step 4: Summary */}
          {currentStep === 4 && (
            <div data-testid="wizard-step-4">
              <h2 className="text-3xl font-bold mb-2 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                Your Subscription Summary
              </h2>
              <p className="text-sm text-gray-500 mb-8">Review your selections before confirming.</p>

              <div className="rounded-lg bg-white p-6 md:p-8 space-y-6" style={{ boxShadow: '0 4px 24px rgba(128,0,32,0.08)' }}>
                <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid #f0ebe6' }}>
                  <div>
                    <p className="text-xs text-gray-500">Plan</p>
                    <p className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>{selectedDurationData?.name}</p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#800020' }}>{selectedDurationData?.price}</p>
                </div>

                <div className="py-3" style={{ borderBottom: '1px solid #f0ebe6' }}>
                  <p className="text-xs text-gray-500 mb-1">Box Type</p>
                  <div className="flex items-center gap-2">
                    {selectedBoxData && <selectedBoxData.icon size={18} style={{ color: selectedBoxData.color }} />}
                    <p className="text-base font-bold" style={{ color: selectedBoxData?.color }}>{selectedBoxData?.name}</p>
                  </div>
                </div>

                {selectedPrefs.length > 0 && (
                  <div className="py-3" style={{ borderBottom: '1px solid #f0ebe6' }}>
                    <p className="text-xs text-gray-500 mb-2">Preferences</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPrefs.map(p => (
                        <span key={p} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: '#800020' }}>
                          {preferences.find(pr => pr.id === p)?.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {startDate && (
                  <div className="py-3" style={{ borderBottom: '1px solid #f0ebe6' }}>
                    <p className="text-xs text-gray-500 mb-1">Start Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} style={{ color: '#B8860B' }} />
                      <p className="text-sm font-medium">{new Date(startDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                )}

                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-3xl font-bold" style={{ color: '#800020' }}>{selectedDurationData?.price}</p>
                    <p className="text-xs" style={{ color: '#B8860B' }}>{selectedDurationData?.perMeal}</p>
                  </div>
                  <button
                    className="px-8 py-3.5 text-sm font-semibold tracking-wide uppercase text-white rounded-sm transition-all duration-300 hover:shadow-lg"
                    style={{ backgroundColor: '#800020' }}
                    onClick={() => alert('Thank you! Your subscription request has been received. We will contact you to confirm.')}
                    data-testid="confirm-subscription-btn"
                  >
                    Confirm Subscription
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-10">
            {currentStep > 1 ? (
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm border-2 transition-all duration-200"
                style={{ borderColor: '#800020', color: '#800020' }}
                data-testid="wizard-back-btn"
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : <div />}
            {currentStep < 4 && (
              <button
                onClick={goNext}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-sm transition-all duration-200 ${!canProceed() ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                style={{ backgroundColor: '#800020' }}
                disabled={!canProceed()}
                data-testid="wizard-next-btn"
              >
                Next <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Subscriptions;

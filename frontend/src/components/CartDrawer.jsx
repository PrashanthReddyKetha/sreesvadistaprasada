import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../api';

const CartDrawer = () => {
  const { cartItems, cartCount, cartTotal, cartOpen, setCartOpen, updateQuantity, removeFromCart, clearCart } = useCart();
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout' | 'success'
  const [form, setForm] = useState({ name: '', email: '', phone: '', line1: '', city: '', postcode: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleOrder = async () => {
    setError('');
    if (!form.name || !form.email || !form.phone || !form.line1 || !form.city || !form.postcode) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/orders', {
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        items: cartItems.map(i => ({
          item_id: i.id,
          name: i.name,
          price: parseFloat(String(i.price).replace('£', '')),
          quantity: i.quantity,
        })),
        delivery_address: { line1: form.line1, city: form.city, postcode: form.postcode },
      });
      setStep('success');
      clearCart();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCartOpen(false);
    setTimeout(() => { setStep('cart'); setError(''); }, 300);
  };

  if (!cartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[200] bg-black/50" onClick={handleClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-[201] w-full max-w-md flex flex-col bg-white shadow-2xl" style={{ fontFamily: 'inherit' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(128,0,32,0.12)' }}>
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} style={{ color: '#800020' }} />
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
              {step === 'success' ? 'Order Placed!' : step === 'checkout' ? 'Checkout' : `Your Cart (${cartCount})`}
            </h2>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors" style={{ color: '#5C4B47' }}>
            <X size={20} />
          </button>
        </div>

        {/* Success */}
        {step === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#F0FFF4' }}>
              <ShoppingBag size={36} style={{ color: '#4A7C59' }} />
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#4A7C59' }}>Thank You!</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">Your order has been received. We'll confirm it via email shortly.</p>
            <button onClick={handleClose} className="px-8 py-3 text-sm font-semibold text-white rounded-sm" style={{ backgroundColor: '#800020' }}>
              Continue Shopping
            </button>
          </div>
        )}

        {/* Cart Items */}
        {step === 'cart' && (
          <>
            {cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center text-gray-400">
                <ShoppingBag size={48} className="mb-3 opacity-30" />
                <p className="text-sm">Your cart is empty.</p>
                <button onClick={handleClose} className="mt-4 text-sm font-semibold" style={{ color: '#800020' }}>Browse Menu →</button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-0" style={{ borderColor: '#f0ebe6' }}>
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: '#2D2422' }}>{item.name}</p>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: '#800020' }}>{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors" style={{ borderColor: '#ddd' }}>
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors" style={{ borderColor: '#ddd' }}>
                          <Plus size={12} />
                        </button>
                        <button onClick={() => removeFromCart(item.id)} className="ml-1 text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 border-t" style={{ borderColor: 'rgba(128,0,32,0.12)', backgroundColor: '#FDFBF7' }}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500">Subtotal</span>
                    <span className="text-lg font-bold" style={{ color: '#800020' }}>£{cartTotal.toFixed(2)}</span>
                  </div>
                  <button onClick={() => setStep('checkout')} className="w-full py-3.5 text-sm font-semibold text-white rounded-sm flex items-center justify-center gap-2 hover:shadow-md transition-all" style={{ backgroundColor: '#800020' }}>
                    Proceed to Checkout <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Checkout Form */}
        {step === 'checkout' && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              <p className="text-xs text-gray-500 mb-2">Order total: <strong style={{ color: '#800020' }}>£{cartTotal.toFixed(2)}</strong> · {cartCount} item{cartCount !== 1 ? 's' : ''}</p>
              {[
                { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Your name' },
                { label: 'Email *', key: 'email', type: 'email', placeholder: 'you@example.com' },
                { label: 'Phone *', key: 'phone', type: 'tel', placeholder: '+44 xxx xxxx xxxx' },
                { label: 'Address Line 1 *', key: 'line1', type: 'text', placeholder: '123 High Street' },
                { label: 'City *', key: 'city', type: 'text', placeholder: 'Milton Keynes' },
                { label: 'Postcode *', key: 'postcode', type: 'text', placeholder: 'MK9 1AB' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#2D2422' }}>{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full p-2.5 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors"
                  />
                </div>
              ))}
              {error && <p className="text-xs font-medium p-3 rounded-lg" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>{error}</p>}
            </div>
            <div className="px-6 py-4 border-t space-y-2" style={{ borderColor: 'rgba(128,0,32,0.12)', backgroundColor: '#FDFBF7' }}>
              <button onClick={handleOrder} disabled={submitting} className="w-full py-3.5 text-sm font-semibold text-white rounded-sm flex items-center justify-center gap-2 hover:shadow-md transition-all disabled:opacity-60" style={{ backgroundColor: '#800020' }}>
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
              <button onClick={() => setStep('cart')} className="w-full py-2 text-sm font-medium" style={{ color: '#800020' }}>
                ← Back to Cart
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartDrawer;

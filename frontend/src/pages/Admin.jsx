import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
  ShoppingBag, Users, Package, Mail, MessageSquare, Bell,
  TrendingUp, Clock, CheckCircle, XCircle, RefreshCw, ChevronDown,
  Phone, MapPin, Calendar, Utensils, Eye, EyeOff
} from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_COLORS = {
  pending:   { bg: '#FFF8E1', text: '#B8860B', border: '#F4C430' },
  confirmed: { bg: '#E8F5E9', text: '#2E7D32', border: '#4CAF50' },
  preparing: { bg: '#E3F2FD', text: '#1565C0', border: '#2196F3' },
  delivered: { bg: '#F3E5F5', text: '#6A1B9A', border: '#9C27B0' },
  cancelled: { bg: '#FFEBEE', text: '#C62828', border: '#EF5350' },
  active:    { bg: '#E8F5E9', text: '#2E7D32', border: '#4CAF50' },
  paused:    { bg: '#FFF8E1', text: '#B8860B', border: '#F4C430' },
  completed: { bg: '#F3E5F5', text: '#6A1B9A', border: '#9C27B0' },
  new:       { bg: '#E3F2FD', text: '#1565C0', border: '#2196F3' },
  contacted: { bg: '#FFF8E1', text: '#B8860B', border: '#F4C430' },
  resolved:  { bg: '#E8F5E9', text: '#2E7D32', border: '#4CAF50' },
};

const Badge = ({ status }) => {
  const c = STATUS_COLORS[status] || { bg: '#F5F5F5', text: '#666', border: '#CCC' };
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {status}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-xl p-5 flex items-start gap-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
      <Icon size={22} style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>{value}</p>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const StatusSelect = ({ current, options, onUpdate, loading }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(!open)} disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
        style={{ backgroundColor: '#FDFBF7', borderColor: '#800020', color: '#800020' }}>
        {loading ? <RefreshCw size={12} className="animate-spin" /> : <>{current} <ChevronDown size={12} /></>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border z-10 py-1" style={{ borderColor: 'rgba(128,0,32,0.15)' }}>
          {options.map(o => (
            <button key={o} onClick={() => { onUpdate(o); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 capitalize">{o}</button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── tab components ───────────────────────────────────────────────────────────
const Overview = ({ orders, subscriptions, users, contacts, catering, newsletter }) => {
  const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  const newEnquiries = [...contacts, ...catering].filter(e => e.status === 'new').length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={TrendingUp}    label="Total Revenue"       value={`£${revenue.toFixed(2)}`}     color="#4A7C59" />
        <StatCard icon={ShoppingBag}   label="Total Orders"        value={orders.length}                 color="#800020" />
        <StatCard icon={Clock}         label="Pending Orders"      value={pendingOrders}                 color="#B8860B" />
        <StatCard icon={Package}       label="Active Subscriptions" value={activeSubscriptions}          color="#1565C0" />
        <StatCard icon={Users}         label="Registered Users"    value={users.length}                  color="#6A1B9A" />
        <StatCard icon={Bell}          label="New Enquiries"       value={newEnquiries}                  color="#C62828" />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#f0ebe6' }}>
          <h3 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Recent Orders</h3>
          <span className="text-xs text-gray-400">Last 10</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: '#FDFBF7' }}>
              <tr>{['Customer','Items','Total','Status','Date'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y" style={{ divideColor: '#f9f6ee' }}>
              {orders.slice(0, 10).map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><p className="font-medium text-gray-900">{o.customer_name}</p><p className="text-xs text-gray-400">{o.customer_email}</p></td>
                  <td className="px-4 py-3 text-gray-500">{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: '#800020' }}>£{o.total?.toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge status={o.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Newsletter quick stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 className="font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Newsletter</h3>
          <p className="text-3xl font-bold text-gray-800">{newsletter.length}</p>
          <p className="text-sm text-gray-500">Active subscribers</p>
        </div>
        <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 className="font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Enquiries</h3>
          <div className="flex gap-6">
            <div><p className="text-2xl font-bold text-gray-800">{contacts.length}</p><p className="text-xs text-gray-500">Contact</p></div>
            <div><p className="text-2xl font-bold text-gray-800">{catering.length}</p><p className="text-xs text-gray-500">Catering</p></div>
            <div><p className="text-2xl font-bold" style={{ color: '#C62828' }}>{newEnquiries}</p><p className="text-xs text-gray-500">Unread</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrdersTab = ({ orders, onStatusUpdate }) => {
  const [updatingId, setUpdatingId] = useState(null);
  const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'];

  const handleUpdate = async (id, status) => {
    setUpdatingId(id);
    await onStatusUpdate('orders', id, status);
    setUpdatingId(null);
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#f0ebe6' }}>
        <h3 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>All Orders ({orders.length})</h3>
      </div>
      {orders.length === 0 ? <p className="text-center text-gray-400 py-16">No orders yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: '#FDFBF7' }}>
              <tr>{['Customer','Contact','Items','Subtotal','Delivery','Total','Status','Date','Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-t hover:bg-gray-50" style={{ borderColor: '#f9f6ee' }}>
                  <td className="px-4 py-3"><p className="font-medium text-gray-900 whitespace-nowrap">{o.customer_name}</p></td>
                  <td className="px-4 py-3 text-xs text-gray-500"><p>{o.customer_email}</p><p>{o.customer_phone}</p></td>
                  <td className="px-4 py-3">
                    <div className="max-w-[180px]">
                      {o.items?.map((item, i) => (
                        <p key={i} className="text-xs text-gray-600 whitespace-nowrap">{item.name} ×{item.quantity}</p>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">£{o.subtotal?.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{o.delivery_fee === 0 ? <span className="text-green-600 text-xs font-semibold">Free</span> : `£${o.delivery_fee?.toFixed(2)}`}</td>
                  <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: '#800020' }}>£{o.total?.toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge status={o.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(o.created_at)}</td>
                  <td className="px-4 py-3">
                    <StatusSelect current={o.status} options={ORDER_STATUSES} loading={updatingId === o.id} onUpdate={(s) => handleUpdate(o.id, s)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const SubscriptionsTab = ({ subscriptions, onStatusUpdate }) => {
  const [updatingId, setUpdatingId] = useState(null);
  const SUB_STATUSES = ['active', 'paused', 'completed', 'cancelled'];

  const handleUpdate = async (id, status) => {
    setUpdatingId(id);
    await onStatusUpdate('subscriptions', id, status);
    setUpdatingId(null);
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: '#f0ebe6' }}>
        <h3 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Dabba Wala Subscriptions ({subscriptions.length})</h3>
      </div>
      {subscriptions.length === 0 ? <p className="text-center text-gray-400 py-16">No subscriptions yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: '#FDFBF7' }}>
              <tr>{['Customer','Plan','Box','Preferences','Delivery Address','Start Date','Price','Status','Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {subscriptions.map(s => (
                <tr key={s.id} className="border-t hover:bg-gray-50" style={{ borderColor: '#f9f6ee' }}>
                  <td className="px-4 py-3"><p className="font-medium whitespace-nowrap">{s.customer_name}</p><p className="text-xs text-gray-400">{s.customer_email}</p><p className="text-xs text-gray-400">{s.customer_phone}</p></td>
                  <td className="px-4 py-3 capitalize font-medium" style={{ color: '#800020' }}>{s.plan}</td>
                  <td className="px-4 py-3 capitalize">{s.box_type}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px]">{s.preferences?.length ? s.preferences.join(', ') : '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{s.delivery_address?.line1}, {s.delivery_address?.city}, {s.delivery_address?.postcode}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{fmtDate(s.start_date)}</td>
                  <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: '#800020' }}>£{s.price?.toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge status={s.status} /></td>
                  <td className="px-4 py-3">
                    <StatusSelect current={s.status} options={SUB_STATUSES} loading={updatingId === s.id} onUpdate={(st) => handleUpdate(s.id, st)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const UsersTab = ({ users }) => (
  <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
    <div className="px-6 py-4 border-b" style={{ borderColor: '#f0ebe6' }}>
      <h3 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Registered Users ({users.length})</h3>
    </div>
    {users.length === 0 ? <p className="text-center text-gray-400 py-16">No registered users yet.</p> : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: '#FDFBF7' }}>
            <tr>{['Name','Email','Phone','Role','Joined'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t hover:bg-gray-50" style={{ borderColor: '#f9f6ee' }}>
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-500">{u.phone || '—'}</td>
                <td className="px-4 py-3"><Badge status={u.role === 'admin' ? 'confirmed' : 'new'} /><span className="ml-1 text-xs capitalize">{u.role}</span></td>
                <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const EnquiriesTab = ({ contacts, catering, onStatusUpdate }) => {
  const [sub, setSub] = useState('contact');
  const [updatingId, setUpdatingId] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const ENQUIRY_STATUSES = ['new', 'contacted', 'resolved'];

  const handleUpdate = async (type, id, status) => {
    setUpdatingId(id);
    await onStatusUpdate(type, id, status);
    setUpdatingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[['contact', 'Contact Messages', contacts], ['catering', 'Catering Enquiries', catering]].map(([key, label, data]) => (
          <button key={key} onClick={() => setSub(key)}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{ backgroundColor: sub === key ? '#800020' : 'white', color: sub === key ? 'white' : '#800020', border: '1px solid #800020' }}>
            {label} ({data.length})
          </button>
        ))}
      </div>

      {sub === 'contact' && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {contacts.length === 0 ? <p className="text-center text-gray-400 py-16">No contact messages yet.</p> : (
            <div className="divide-y" style={{ divideColor: '#f0ebe6' }}>
              {contacts.map(c => (
                <div key={c.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        <Badge status={c.status} />
                        <span className="text-xs text-gray-400">{fmt(c.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{c.email} {c.phone && `· ${c.phone}`}</p>
                      <p className="text-sm font-medium text-gray-700 mb-1">Subject: {c.subject}</p>
                      <p className={`text-sm text-gray-600 ${expanded === c.id ? '' : 'line-clamp-2'}`}>{c.message}</p>
                      {c.message?.length > 100 && (
                        <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="text-xs mt-1 font-medium" style={{ color: '#800020' }}>
                          {expanded === c.id ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                    <StatusSelect current={c.status} options={ENQUIRY_STATUSES} loading={updatingId === c.id} onUpdate={(s) => handleUpdate('contact', c.id, s)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {sub === 'catering' && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {catering.length === 0 ? <p className="text-center text-gray-400 py-16">No catering enquiries yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#FDFBF7' }}>
                  <tr>{['Customer','Event','Date','Guests','Food Pref','Details','Status','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {catering.map(c => (
                    <tr key={c.id} className="border-t hover:bg-gray-50" style={{ borderColor: '#f9f6ee' }}>
                      <td className="px-4 py-3"><p className="font-medium whitespace-nowrap">{c.name}</p><p className="text-xs text-gray-400">{c.email}</p><p className="text-xs text-gray-400">{c.phone}</p></td>
                      <td className="px-4 py-3 capitalize">{c.event_type}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">{fmtDate(c.event_date)}</td>
                      <td className="px-4 py-3 text-center">{c.guest_count}</td>
                      <td className="px-4 py-3 capitalize text-xs">{c.food_preference}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate">{c.additional_details || '—'}</td>
                      <td className="px-4 py-3"><Badge status={c.status} /></td>
                      <td className="px-4 py-3">
                        <StatusSelect current={c.status} options={ENQUIRY_STATUSES} loading={updatingId === c.id} onUpdate={(s) => handleUpdate('catering', c.id, s)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const NewsletterTab = ({ newsletter }) => (
  <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
    <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#f0ebe6' }}>
      <h3 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Newsletter Subscribers ({newsletter.length})</h3>
      <button onClick={() => {
        const csv = 'Email,Subscribed\n' + newsletter.map(n => `${n.email},${fmtDate(n.created_at)}`).join('\n');
        const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv); a.download = 'newsletter.csv'; a.click();
      }} className="text-xs font-semibold px-3 py-1.5 rounded-lg border" style={{ color: '#800020', borderColor: '#800020' }}>
        Export CSV
      </button>
    </div>
    {newsletter.length === 0 ? <p className="text-center text-gray-400 py-16">No subscribers yet.</p> : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: '#FDFBF7' }}>
            <tr>{['Email','Subscribed','Status'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {newsletter.map(n => (
              <tr key={n.id} className="border-t hover:bg-gray-50" style={{ borderColor: '#f9f6ee' }}>
                <td className="px-4 py-3">{n.email}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(n.created_at)}</td>
                <td className="px-4 py-3"><Badge status={n.active ? 'active' : 'cancelled'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// ─── Main Admin Page ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',       label: 'Overview',       icon: TrendingUp },
  { id: 'orders',         label: 'Orders',         icon: ShoppingBag },
  { id: 'subscriptions',  label: 'Subscriptions',  icon: Package },
  { id: 'users',          label: 'Users',          icon: Users },
  { id: 'enquiries',      label: 'Enquiries',      icon: MessageSquare },
  { id: 'newsletter',     label: 'Newsletter',     icon: Mail },
];

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({ orders: [], subscriptions: [], users: [], contacts: [], catering: [], newsletter: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [orders, subscriptions, users, contacts, catering, newsletter] = await Promise.all([
        api.get('/orders'),
        api.get('/subscriptions'),
        api.get('/auth/users'),
        api.get('/enquiries/contact'),
        api.get('/enquiries/catering'),
        api.get('/enquiries/newsletter'),
      ]);
      setData({
        orders: orders.data,
        subscriptions: subscriptions.data,
        users: users.data,
        contacts: contacts.data,
        catering: catering.data,
        newsletter: newsletter.data,
      });
    } catch (err) {
      setError('Failed to load data. Make sure you are signed in as admin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleStatusUpdate = async (type, id, status) => {
    try {
      if (type === 'orders')        await api.put(`/orders/${id}/status`, { status });
      if (type === 'subscriptions') await api.put(`/subscriptions/${id}/status`, { status });
      if (type === 'contact')       await api.put(`/enquiries/contact/${id}/status?status=${status}`);
      if (type === 'catering')      await api.put(`/enquiries/catering/${id}/status?status=${status}`);
      await fetchAll();
    } catch { /* silent */ }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-600 mb-2">Please sign in to access the admin panel.</p>
      </div>
    </div>
  );

  if (user.role !== 'admin') return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="text-center">
        <XCircle size={48} className="mx-auto mb-3" style={{ color: '#800020' }} />
        <p className="text-lg font-semibold" style={{ color: '#800020' }}>Access Denied</p>
        <p className="text-sm text-gray-500 mt-1">This page is only accessible to administrators.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)]" style={{ backgroundColor: '#F4F1EC' }}>
      {/* Top Bar */}
      <div className="sticky top-[calc(32px+4rem)] md:top-[calc(32px+5rem)] z-20 px-4 md:px-8 py-3 flex items-center justify-between"
        style={{ backgroundColor: '#800020' }}>
        <div>
          <h1 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Admin Dashboard</h1>
          <p className="text-xs text-white/60">Sree Svadista Prasada</p>
        </div>
        <button onClick={fetchAll} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}>
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-52 min-h-[calc(100vh-8rem)] pt-6 px-3 bg-white border-r" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-left mb-1 transition-all"
              style={{ backgroundColor: activeTab === id ? 'rgba(128,0,32,0.08)' : 'transparent', color: activeTab === id ? '#800020' : '#5C4B47', fontWeight: activeTab === id ? 700 : 500 }}>
              <Icon size={17} /> {label}
            </button>
          ))}
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden w-full fixed bottom-0 left-0 z-30 flex bg-white border-t shadow-lg" style={{ borderColor: 'rgba(128,0,32,0.12)' }}>
          {TABS.slice(0, 6).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-medium transition-colors"
              style={{ color: activeTab === id ? '#800020' : '#9CA3AF' }}>
              <Icon size={18} />
              <span className="truncate w-full text-center px-1">{label}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden">
          {error && <div className="mb-4 p-4 rounded-lg text-sm font-medium" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>{error}</div>}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <RefreshCw size={32} className="animate-spin" style={{ color: '#800020' }} />
            </div>
          ) : (
            <>
              {activeTab === 'overview'      && <Overview {...data} />}
              {activeTab === 'orders'        && <OrdersTab orders={data.orders} onStatusUpdate={handleStatusUpdate} />}
              {activeTab === 'subscriptions' && <SubscriptionsTab subscriptions={data.subscriptions} onStatusUpdate={handleStatusUpdate} />}
              {activeTab === 'users'         && <UsersTab users={data.users} />}
              {activeTab === 'enquiries'     && <EnquiriesTab contacts={data.contacts} catering={data.catering} onStatusUpdate={handleStatusUpdate} />}
              {activeTab === 'newsletter'    && <NewsletterTab newsletter={data.newsletter} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Admin;

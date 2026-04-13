import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Calendar, User, LogOut, Package, Clock, CheckCircle, XCircle, ChefHat, RefreshCw, ChevronDown, ChevronUp, Edit2, Save, X, LayoutDashboard, MessageSquare, Bell, CheckCheck, Leaf, Flame, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import SubActiveCard, { BOX_META, DishCards, daysUntil } from '../components/dashboard/SubActiveCard';
import EnquiriesTab from '../components/dashboard/EnquiriesTab';

/* ── helpers ─────────────────────────────────────────── */
const STATUS_COLORS = {
  pending:    { bg: '#FEF9C3', text: '#854D0E', label: 'Pending' },
  confirmed:  { bg: '#DBEAFE', text: '#1E40AF', label: 'Confirmed' },
  preparing:  { bg: '#FEF3C7', text: '#92400E', label: 'Preparing' },
  delivered:  { bg: '#DCFCE7', text: '#166534', label: 'Delivered' },
  cancelled:  { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
  active:     { bg: '#DCFCE7', text: '#166534', label: 'Active' },
  paused:     { bg: '#FEF9C3', text: '#854D0E', label: 'Paused' },
  completed:  { bg: '#E0E7FF', text: '#3730A3', label: 'Completed' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_COLORS[status] || { bg: '#F3F4F6', text: '#374151', label: status };
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
};

const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ── Tab nav ─────────────────────────────────────────── */
const TABS = [
  { id: 'overview',       label: 'Overview',      icon: Package },
  { id: 'orders',         label: 'Orders',         icon: ShoppingBag },
  { id: 'subscriptions',  label: 'Dabba Wala',     icon: Calendar },
  { id: 'enquiries',      label: 'Enquiries',      icon: MessageSquare },
  { id: 'account',        label: 'My Account',     icon: User },
];

/* ══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [enquiries, setEnquiries] = useState({ contact: [], catering: [] });
  const [unreadCount, setUnreadCount] = useState(0);

  /* redirect if not logged in */
  useEffect(() => {
    if (!user) navigate('/', { replace: true });
  }, [user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [oRes, sRes, eRes, nRes] = await Promise.all([
        api.get('/orders'),
        api.get('/subscriptions'),
        api.get('/enquiries/my'),
        api.get('/enquiries/notifications/unread-count'),
      ]);
      setOrders(oRes.data);
      setSubs(sRes.data);
      setEnquiries(eRes.data);
      setUnreadCount(nRes.data.count || 0);
    } catch { /* token may have expired */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (!user) return null;

  const pending   = orders.filter(o => o.status === 'pending').length;
  const active    = orders.filter(o => ['confirmed','preparing'].includes(o.status)).length;
  const delivered = orders.filter(o => o.status === 'delivered').length;
  const totalSpent = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0);
  const activeSub = subs.find(s => s.status === 'active');

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16 px-4" style={{ backgroundColor: '#FAF8F4' }}>
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
              Welcome back, {user.name.split(' ')[0]}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#9C7B6B' }}>Here's everything about your account</p>
          </div>
          <div className="flex items-center gap-2">
            {user.role === 'admin' && (
              <Link to="/admin"
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: '#800020', color: '#FDFBF7' }}>
                <LayoutDashboard size={15} /> Admin Panel
              </Link>
            )}
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-colors hover:bg-[#800020]/10"
              style={{ color: '#800020' }}
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            const hasUnread = t.id === 'enquiries' && unreadCount > 0;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
                style={{
                  backgroundColor: active ? '#800020' : '#FDFBF7',
                  color: active ? '#FDFBF7' : '#5C4B47',
                  border: active ? 'none' : '1px solid rgba(128,0,32,0.15)',
                }}
              >
                <Icon size={15} />
                {t.label}
                {hasUnread && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                    style={{ backgroundColor: '#DC2626' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3" style={{ color: '#9C7B6B' }}>
            <RefreshCw size={20} className="animate-spin" /> Loading your data…
          </div>
        ) : (
          <>
            {activeTab === 'overview'      && <OverviewTab orders={orders} subs={subs} pending={pending} active={active} delivered={delivered} totalSpent={totalSpent} activeSub={activeSub} setActiveTab={setActiveTab} unreadEnquiries={unreadCount} />}
            {activeTab === 'orders'        && <OrdersTab orders={orders} reload={load} expandedOrder={expandedOrder} setExpandedOrder={setExpandedOrder} />}
            {activeTab === 'subscriptions' && <SubsTab subs={subs} reload={load} />}
            {activeTab === 'enquiries'     && <EnquiriesTab enquiries={enquiries} reload={load} />}
            {activeTab === 'account'       && <AccountTab user={user} login={login} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ══ Overview ════════════════════════════════════════════ */
function OverviewTab({ orders, subs, pending, active, delivered, totalSpent, activeSub, setActiveTab, unreadEnquiries }) {
  const recentOrders = orders.slice(0, 3);

  const stats = [
    { label: 'Total Orders',   value: orders.length, icon: ShoppingBag, color: '#800020' },
    { label: 'Active Orders',  value: active + pending, icon: Clock, color: '#B8860B' },
    { label: 'Delivered',      value: delivered, icon: CheckCircle, color: '#166534' },
    { label: 'Total Spent',    value: `£${totalSpent.toFixed(2)}`, icon: Package, color: '#1E40AF' },
  ];

  return (
    <div className="space-y-6">
      {/* Unread enquiry alert */}
      {unreadEnquiries > 0 && (
        <button onClick={() => setActiveTab('enquiries')}
          className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #800020 0%, #5C0015 100%)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(244,196,48,0.2)' }}>
            <Bell size={18} style={{ color: '#F4C430' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">
              {unreadEnquiries} new {unreadEnquiries === 1 ? 'reply' : 'replies'} to your {unreadEnquiries === 1 ? 'enquiry' : 'enquiries'}
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Tap to view the conversation →</p>
          </div>
        </button>
      )}
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: '#FDFBF7', border: '1px solid rgba(244,196,48,0.2)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: '#9C7B6B' }}>{s.label}</span>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Active Subscription Banner */}
      {activeSub && (
        <div className="rounded-2xl p-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #800020 0%, #5C0015 100%)' }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(244,196,48,0.8)' }}>Dabba Wala</p>
            <p className="text-lg font-bold text-white">{activeSub.plan.charAt(0).toUpperCase() + activeSub.plan.slice(1)} Plan — {activeSub.box_type}</p>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Active since {fmt(activeSub.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">£{activeSub.price}</p>
            <StatusBadge status="active" />
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold" style={{ color: '#800020', fontFamily: "'Playfair Display', serif" }}>Recent Orders</h3>
          {orders.length > 3 && (
            <button onClick={() => setActiveTab('orders')} className="text-xs font-semibold hover:underline" style={{ color: '#B8860B' }}>
              View all →
            </button>
          )}
        </div>
        {recentOrders.length === 0 ? (
          <EmptyState icon={ShoppingBag} message="No orders yet" sub="Your orders will appear here once you place one." link="/svadista" linkLabel="Browse Menu & Order" />
        ) : (
          <div className="space-y-3">
            {recentOrders.map(o => <OrderCard key={o.id} order={o} compact />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══ Orders ════════════════════════════════════════════ */
function OrdersTab({ orders, reload, expandedOrder, setExpandedOrder }) {
  const [cancelling, setCancelling] = useState(null);

  const cancel = async (id) => {
    setCancelling(id);
    try {
      await api.delete(`/orders/${id}`);
      await reload();
    } catch (e) {
      alert(e.response?.data?.detail || 'Could not cancel order');
    } finally { setCancelling(null); }
  };

  if (orders.length === 0) {
    return <EmptyState icon={ShoppingBag} message="No orders yet" sub="Browse our menus and place your first order." link="/svadista" linkLabel="Browse Menu & Order" />;
  }

  return (
    <div className="space-y-3">
      {orders.map(o => (
        <OrderCard
          key={o.id}
          order={o}
          expanded={expandedOrder === o.id}
          onToggle={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
          onCancel={() => cancel(o.id)}
          cancelling={cancelling === o.id}
        />
      ))}
    </div>
  );
}

function OrderCard({ order: o, compact, expanded, onToggle, onCancel, cancelling }) {
  const canCancel = ['pending', 'confirmed'].includes(o.status);
  const stepMap = { pending: 0, confirmed: 1, preparing: 2, delivered: 3, cancelled: -1 };
  const step = stepMap[o.status] ?? 0;
  const steps = ['Order Placed', 'Confirmed', 'Preparing', 'Delivered'];

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#FDFBF7', border: '1px solid rgba(244,196,48,0.2)' }}>
      {/* Header row */}
      <div
        className={`flex items-center justify-between p-4 ${!compact ? 'cursor-pointer hover:bg-[#800020]/5' : ''}`}
        onClick={!compact ? onToggle : undefined}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#800020', color: '#F4C430' }}>
            <ChefHat size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#3D2B1F' }}>
              Order #{o.id?.slice(-6).toUpperCase()}
            </p>
            <p className="text-xs" style={{ color: '#9C7B6B' }}>{fmt(o.created_at)} · {o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={o.status} />
          <p className="font-bold text-sm" style={{ color: '#800020' }}>£{o.total?.toFixed(2)}</p>
          {!compact && (
            expanded ? <ChevronUp size={16} style={{ color: '#9C7B6B' }} /> : <ChevronDown size={16} style={{ color: '#9C7B6B' }} />
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {!compact && expanded && (
        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: 'rgba(244,196,48,0.2)' }}>
          {/* Progress bar */}
          {o.status !== 'cancelled' && (
            <div className="pt-4">
              <div className="flex items-center justify-between mb-2">
                {steps.map((s, i) => (
                  <React.Fragment key={s}>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                        style={{
                          backgroundColor: i <= step ? '#800020' : '#E5E7EB',
                          color: i <= step ? '#FDFBF7' : '#9CA3AF',
                        }}>
                        {i < step ? '✓' : i + 1}
                      </div>
                      <span className="text-[10px] text-center hidden sm:block" style={{ color: i <= step ? '#800020' : '#9CA3AF' }}>{s}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="flex-1 h-0.5 mx-1" style={{ backgroundColor: i < step ? '#800020' : '#E5E7EB' }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
          {o.status === 'cancelled' && (
            <div className="pt-3 flex items-center gap-2 text-sm" style={{ color: '#991B1B' }}>
              <XCircle size={16} /> This order was cancelled.
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9C7B6B' }}>Items</p>
            <div className="space-y-1.5">
              {o.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span style={{ color: '#3D2B1F' }}>{item.name} × {item.quantity}</span>
                  <span style={{ color: '#5C4B47' }}>£{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-2 pt-2 space-y-1" style={{ borderColor: 'rgba(244,196,48,0.2)' }}>
              <div className="flex justify-between text-xs" style={{ color: '#9C7B6B' }}>
                <span>Subtotal</span><span>£{o.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs" style={{ color: '#9C7B6B' }}>
                <span>Delivery</span><span>{o.delivery_fee === 0 ? 'Free' : `£${o.delivery_fee?.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm font-bold" style={{ color: '#800020' }}>
                <span>Total</span><span>£{o.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#9C7B6B' }}>Delivery To</p>
            <p className="text-sm" style={{ color: '#3D2B1F' }}>
              {o.delivery_address?.line1}, {o.delivery_address?.city}, {o.delivery_address?.postcode}
            </p>
          </div>

          {/* Special instructions */}
          {o.special_instructions && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#9C7B6B' }}>Notes</p>
              <p className="text-sm italic" style={{ color: '#5C4B47' }}>{o.special_instructions}</p>
            </div>
          )}

          {/* Cancel */}
          {canCancel && (
            <button
              onClick={onCancel}
              disabled={cancelling}
              className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              style={{ border: '1px solid #991B1B', color: '#991B1B', backgroundColor: 'transparent' }}
            >
              {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ══ Subscriptions ════════════════════════════════════ */
function fmtDay(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function PrevSubDetails({ sub }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-6 max-w-sm mx-auto">
      <button onClick={() => setExpanded(e => !e)} className="text-sm font-semibold flex items-center gap-1 mx-auto" style={{ color: '#9C7B6B' }}>
        Your previous subscription {expanded ? <ChevronDown size={14} style={{ transform:'rotate(180deg)' }} /> : <ChevronDown size={14} />}
      </button>
      {expanded && (
        <div className="mt-3 rounded-xl p-4 text-left" style={{ backgroundColor: '#F9F6EE', border: '0.5px solid #e0d9d0' }}>
          {[
            ['Plan', sub.plan?.charAt(0).toUpperCase() + sub.plan?.slice(1)],
            ['Box', BOX_META[sub.box_type]?.label || sub.box_type],
            ['Started', sub.start_date ? new Date(sub.start_date + 'T12:00:00').toLocaleDateString('en-GB') : '—'],
            ['Ended', sub.end_date ? new Date(sub.end_date + 'T12:00:00').toLocaleDateString('en-GB') : '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm py-1.5" style={{ borderBottom: '0.5px solid #e0d9d0' }}>
              <span style={{ color: '#9C7B6B' }}>{k}</span><span style={{ color: '#2D2422' }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubsTab({ subs, reload }) {
  const today = new Date().toISOString().split('T')[0];
  const in7   = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  if (!subs || subs.length === 0) {
    return (
      <div className="text-center py-12">
        <Package size={48} className="mx-auto mb-4" style={{ color: '#800020' }} />
        <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>You have not tried Dabba Wala yet</h3>
        <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: '#9C7B6B' }}>
          Home-cooked South Indian meals every weekday — freshly made each morning, delivered to your door. From £9 per meal.
        </p>
        <Link to="/subscriptions" className="inline-block px-8 py-3 text-sm font-semibold text-white rounded-sm" style={{ backgroundColor: '#800020' }}>
          Start my subscription
        </Link>
        <div className="flex justify-center gap-6 mt-8">
          {[
            { icon: Leaf,    text: '100% fresh daily' },
            { icon: Clock,   text: 'Delivered 12–2pm' },
            { icon: Shield,  text: '48hr cancellation window' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex flex-col items-center gap-1.5 text-xs" style={{ color: '#9C7B6B' }}>
              <Icon size={18} style={{ color: '#800020' }} /> {text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Find the most relevant subscription
  const activeSub   = subs.find(s => s.status === 'active' && s.end_date && s.end_date >= today);
  const endingSoon  = activeSub && activeSub.end_date && activeSub.end_date <= in7;
  const expiredSub  = subs.find(s => s.status === 'expired' || (s.status === 'active' && s.end_date && s.end_date < today));
  const cancelledSub = subs.find(s => s.status === 'cancelled');

  // ── ENDING SOON ─────────────────────────────────────
  if (endingSoon) return (
    <div>
      {/* Amber ending-soon banner */}
      <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: '#FAEEDA', border: '0.5px solid #B8860B' }}>
        <p className="font-bold mb-1" style={{ color: '#854F0B' }}>Your Dabba Wala ends {fmtDay(activeSub.end_date)} 🍱</p>
        <p className="text-sm mb-4" style={{ color: '#854F0B' }}>Ready to continue? Renew now and keep your meals coming — same box, same schedule.</p>
        <div className="flex gap-3 flex-wrap">
          <Link to="/subscriptions" className="px-5 py-2.5 text-sm font-semibold text-white rounded-sm" style={{ backgroundColor: '#800020' }}>Renew — same plan</Link>
          <Link to="/subscriptions" className="px-5 py-2.5 text-sm font-semibold rounded-sm" style={{ color: '#800020', border: '1.5px solid #800020' }}>Change my plan</Link>
        </div>
      </div>
      <SubActiveCard sub={activeSub} />
    </div>
  );

  // ── ACTIVE ───────────────────────────────────────────
  if (activeSub) return <SubActiveCard sub={activeSub} />;

  // ── EXPIRED ──────────────────────────────────────────
  if (expiredSub) return (
    <div className="text-center py-12">
      <Package size={40} className="mx-auto mb-4" style={{ color: '#9CA3AF' }} />
      <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
        Your Dabba Wala ended on {fmtDay(expiredSub.end_date)}
      </h3>
      <p className="text-sm mb-6" style={{ color: '#9C7B6B' }}>We miss cooking for you. Whenever you are ready to come back, we will be here.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/subscriptions" className="px-8 py-3 text-sm font-semibold text-white rounded-sm" style={{ backgroundColor: '#800020' }}>Come back — same preferences</Link>
        <Link to="/subscriptions" className="px-8 py-3 text-sm font-semibold rounded-sm border-2" style={{ borderColor: '#800020', color: '#800020' }}>Start fresh</Link>
      </div>
      <PrevSubDetails sub={expiredSub} />
    </div>
  );

  // ── CANCELLED ────────────────────────────────────────
  if (cancelledSub) return (
    <div className="text-center py-12">
      <Package size={40} className="mx-auto mb-4" style={{ color: '#9CA3AF' }} />
      <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Your subscription was cancelled</h3>
      <p className="text-sm mb-6" style={{ color: '#9C7B6B' }}>We hope to see you again whenever you are ready.</p>
      <Link to="/subscriptions" className="inline-block px-8 py-3 text-sm font-semibold text-white rounded-sm" style={{ backgroundColor: '#800020' }}>Subscribe again</Link>
      <PrevSubDetails sub={cancelledSub} />
    </div>
  );

  // Fallback
  return <EmptyState icon={Calendar} message="No Dabba Wala subscription" sub="Sign up for our weekly meal plan." link="/subscriptions" linkLabel="Subscribe to Dabba Wala" />;
}


/* ══ Account ════════════════════════════════════════════ */
function AccountTab({ user, login }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user.name || '', phone: user.phone || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const save = async () => {
    setSaving(true); setError(''); setSuccess(false);
    try {
      const res = await api.put('/auth/me', form);
      login(res.data, localStorage.getItem('ssp_token'));
      setSuccess(true);
      setEditing(false);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to save changes');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#FDFBF7', border: '1px solid rgba(244,196,48,0.2)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Profile Details</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#B8860B' }}>
              <Edit2 size={14} /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setForm({ name: user.name, phone: user.phone || '' }); setError(''); }}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg" style={{ color: '#5C4B47', border: '1px solid #E5E7EB' }}>
                <X size={13} /> Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg font-semibold disabled:opacity-60"
                style={{ backgroundColor: '#800020', color: '#FDFBF7' }}>
                <Save size={13} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {[
            { label: 'Full Name', key: 'name', type: 'text' },
            { label: 'Phone Number', key: 'phone', type: 'tel' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#9C7B6B' }}>{f.label}</label>
              {editing ? (
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-[#800020]/30"
                  style={{ borderColor: 'rgba(128,0,32,0.3)', color: '#3D2B1F', backgroundColor: '#FDFBF7' }}
                />
              ) : (
                <p className="text-sm px-3 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(128,0,32,0.04)', color: '#3D2B1F' }}>
                  {user[f.key] || <span style={{ color: '#9C7B6B' }}>Not set</span>}
                </p>
              )}
            </div>
          ))}

          {/* Email — read only */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#9C7B6B' }}>Email Address</label>
            <p className="text-sm px-3 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(128,0,32,0.04)', color: '#9C7B6B' }}>
              {user.email} <span className="text-[10px] ml-1">(cannot be changed)</span>
            </p>
          </div>

          {/* Role badge */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#9C7B6B' }}>Account Type</label>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize"
              style={{ backgroundColor: user.role === 'admin' ? '#FEF3C7' : '#DBEAFE', color: user.role === 'admin' ? '#92400E' : '#1E40AF' }}>
              {user.role || 'customer'}
            </span>
          </div>

          {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{error}</p>}
          {success && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>Profile updated successfully.</p>}
        </div>
      </div>

      <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: '#FEF9C3', border: '1px solid #FDE68A', color: '#854D0E' }}>
        Need help with an order? Call us on <a href="tel:+447307119962" className="font-bold">+44 7307 119962</a> or WhatsApp us.
      </div>
    </div>
  );
}

/* ══ Empty State ════════════════════════════════════════ */
function EmptyState({ icon: Icon, message, sub, link, linkLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(128,0,32,0.08)' }}>
        <Icon size={26} style={{ color: '#800020' }} />
      </div>
      <p className="font-semibold" style={{ color: '#3D2B1F' }}>{message}</p>
      <p className="text-sm text-center max-w-xs" style={{ color: '#9C7B6B' }}>{sub}</p>
      {link && (
        <a href={link}
          className="mt-1 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:shadow-md"
          style={{ backgroundColor: '#800020' }}>
          {linkLabel}
        </a>
      )}
    </div>
  );
}



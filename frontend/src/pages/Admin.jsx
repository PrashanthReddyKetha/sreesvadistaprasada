import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
  ShoppingBag, Users, Package, Mail, MessageSquare, Bell,
  TrendingUp, Clock, CheckCircle, XCircle, RefreshCw,
  ChevronDown, ChevronRight, Edit2, Save, X, Plus,
  Utensils, LayoutDashboard, Eye, EyeOff, Flame, Leaf,
  ArrowLeft, Send, CheckCheck, AlertCircle
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt     = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';

const STATUS_COLORS = {
  pending:   { bg:'#FFF8E1', text:'#B8860B', border:'#F4C430' },
  confirmed: { bg:'#E8F5E9', text:'#2E7D32', border:'#4CAF50' },
  preparing: { bg:'#E3F2FD', text:'#1565C0', border:'#2196F3' },
  delivered: { bg:'#F3E5F5', text:'#6A1B9A', border:'#9C27B0' },
  cancelled: { bg:'#FFEBEE', text:'#C62828', border:'#EF5350' },
  active:    { bg:'#E8F5E9', text:'#2E7D32', border:'#4CAF50' },
  paused:    { bg:'#FFF8E1', text:'#B8860B', border:'#F4C430' },
  completed: { bg:'#F3E5F5', text:'#6A1B9A', border:'#9C27B0' },
  new:       { bg:'#E3F2FD', text:'#1565C0', border:'#2196F3' },
  contacted: { bg:'#FFF8E1', text:'#B8860B', border:'#F4C430' },
  resolved:  { bg:'#E8F5E9', text:'#2E7D32', border:'#4CAF50' },
};
const Badge = ({ status }) => {
  const c = STATUS_COLORS[status] || { bg:'#F5F5F5', text:'#666', border:'#CCC' };
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
      style={{ backgroundColor:c.bg, color:c.text, border:`1px solid ${c.border}` }}>{status}</span>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl p-5 flex items-start gap-4" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor:`${color}15` }}>
      <Icon size={22} style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-bold" style={{ color:'#1a1a1a' }}>{value}</p>
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
  </div>
);

// ─── Order status next-step buttons ───────────────────────────────────────────
const ORDER_FLOW = {
  pending:   { next:'confirmed', label:'Confirm Order',    color:'#2E7D32' },
  confirmed: { next:'preparing', label:'Start Preparing',  color:'#1565C0' },
  preparing: { next:'delivered', label:'Mark Delivered',   color:'#6A1B9A' },
};

const OrderActions = ({ order, onUpdate }) => {
  const [busy, setBusy] = useState(null);
  const flow = ORDER_FLOW[order.status];

  const handle = async (status) => {
    setBusy(status);
    await onUpdate('orders', order.id, status);
    setBusy(null);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {flow && (
        <button onClick={() => handle(flow.next)} disabled={!!busy}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 whitespace-nowrap"
          style={{ backgroundColor: flow.color }}>
          {busy === flow.next ? <RefreshCw size={11} className="animate-spin" /> : <ChevronRight size={11} />}
          {flow.label}
        </button>
      )}
      {['pending','confirmed','preparing'].includes(order.status) && (
        <button onClick={() => handle('cancelled')} disabled={!!busy}
          className="px-2 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          style={{ border:'1px solid #EF5350', color:'#C62828', backgroundColor:'transparent' }}>
          {busy === 'cancelled' ? <RefreshCw size={11} className="animate-spin inline" /> : 'Cancel'}
        </button>
      )}
    </div>
  );
};

// ─── Overview ─────────────────────────────────────────────────────────────────
const Overview = ({ orders, subscriptions, users, contacts, catering, newsletter }) => {
  const revenue         = orders.filter(o => o.status !== 'cancelled').reduce((s,o) => s+(o.total||0), 0);
  const pendingOrders   = orders.filter(o => o.status === 'pending').length;
  const activeSubs      = subscriptions.filter(s => s.status === 'active').length;
  const newEnquiries    = [...contacts,...catering].filter(e => e.status === 'new').length;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={TrendingUp}  label="Total Revenue"        value={`£${revenue.toFixed(2)}`} color="#4A7C59" />
        <StatCard icon={ShoppingBag} label="Total Orders"         value={orders.length}             color="#800020" />
        <StatCard icon={Clock}       label="Pending Orders"       value={pendingOrders}             color="#B8860B" />
        <StatCard icon={Package}     label="Active Subscriptions" value={activeSubs}                color="#1565C0" />
        <StatCard icon={Users}       label="Registered Users"     value={users.length}              color="#6A1B9A" />
        <StatCard icon={Bell}        label="New Enquiries"        value={newEnquiries}              color="#C62828" />
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor:'#f0ebe6' }}>
          <h3 className="font-bold" style={{ fontFamily:"'Playfair Display', serif", color:'#800020' }}>Recent Orders</h3>
          <span className="text-xs text-gray-400">Last 10</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor:'#FDFBF7' }}>
              <tr>{['Customer','Items','Total','Status','Date'].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y" style={{ divideColor:'#f9f6ee' }}>
              {orders.slice(0,10).map(o=>(
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><p className="font-medium">{o.customer_name}</p><p className="text-xs text-gray-400">{o.customer_email}</p></td>
                  <td className="px-4 py-3 text-gray-500">{o.items?.length} item{o.items?.length!==1?'s':''}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color:'#800020' }}>£{o.total?.toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge status={o.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 className="font-bold mb-3" style={{ fontFamily:"'Playfair Display', serif", color:'#800020' }}>Newsletter</h3>
          <p className="text-3xl font-bold text-gray-800">{newsletter.length}</p>
          <p className="text-sm text-gray-500">Active subscribers</p>
        </div>
        <div className="bg-white rounded-xl p-5" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 className="font-bold mb-3" style={{ fontFamily:"'Playfair Display', serif", color:'#800020' }}>Enquiries</h3>
          <div className="flex gap-6">
            <div><p className="text-2xl font-bold text-gray-800">{contacts.length}</p><p className="text-xs text-gray-500">Contact</p></div>
            <div><p className="text-2xl font-bold text-gray-800">{catering.length}</p><p className="text-xs text-gray-500">Catering</p></div>
            <div><p className="text-2xl font-bold" style={{ color:'#C62828' }}>{newEnquiries}</p><p className="text-xs text-gray-500">Unread</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Orders ───────────────────────────────────────────────────────────────────
const OrdersTab = ({ orders, onStatusUpdate }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const statuses = ['all','pending','confirmed','preparing','delivered','cancelled'];
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => {
          const count = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize"
              style={{
                backgroundColor: filter === s ? '#800020' : 'white',
                color: filter === s ? 'white' : '#5C4B47',
                border: '1px solid rgba(128,0,32,0.2)',
              }}>
              {s} ({count})
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No orders in this status.</p>
        ) : (
          <div className="divide-y" style={{ divideColor:'#f0ebe6' }}>
            {filtered.map(o => (
              <div key={o.id}>
                {/* Row */}
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">#{o.id?.slice(-6).toUpperCase()}</span>
                      <span className="text-sm text-gray-600">{o.customer_name}</span>
                      <span className="text-xs text-gray-400">{o.customer_email}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(o.created_at)} · {o.items?.length} item{o.items?.length!==1?'s':''}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-bold text-sm" style={{ color:'#800020' }}>£{o.total?.toFixed(2)}</span>
                    <Badge status={o.status} />
                    <ChevronDown size={14} className="text-gray-400 transition-transform" style={{ transform: expandedId===o.id?'rotate(180deg)':'none' }} />
                  </div>
                </div>

                {/* Expanded */}
                {expandedId === o.id && (
                  <div className="px-5 pb-5 bg-gray-50 border-t space-y-4" style={{ borderColor:'#f0ebe6' }}>
                    <div className="grid md:grid-cols-3 gap-4 pt-4">
                      {/* Items */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Order Items</p>
                        {o.items?.map((item,i)=>(
                          <div key={i} className="flex justify-between text-sm py-0.5">
                            <span className="text-gray-700">{item.name} ×{item.quantity}</span>
                            <span className="text-gray-500">£{(item.price*item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t mt-2 pt-2 space-y-1" style={{ borderColor:'#e5e7eb' }}>
                          <div className="flex justify-between text-xs text-gray-400"><span>Subtotal</span><span>£{o.subtotal?.toFixed(2)}</span></div>
                          <div className="flex justify-between text-xs text-gray-400"><span>Delivery</span><span>{o.delivery_fee===0?'Free':`£${o.delivery_fee?.toFixed(2)}`}</span></div>
                          <div className="flex justify-between text-sm font-bold" style={{ color:'#800020' }}><span>Total</span><span>£{o.total?.toFixed(2)}</span></div>
                        </div>
                      </div>
                      {/* Delivery */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Delivery Address</p>
                        <p className="text-sm text-gray-700">{o.delivery_address?.line1}</p>
                        {o.delivery_address?.line2 && <p className="text-sm text-gray-700">{o.delivery_address.line2}</p>}
                        <p className="text-sm text-gray-700">{o.delivery_address?.city}</p>
                        <p className="text-sm font-semibold text-gray-700">{o.delivery_address?.postcode}</p>
                        {o.customer_phone && <p className="text-xs text-gray-400 mt-2">📞 {o.customer_phone}</p>}
                        {o.special_instructions && <p className="text-xs italic text-gray-500 mt-1">"{o.special_instructions}"</p>}
                      </div>
                      {/* Actions */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Update Status</p>
                        <OrderActions order={o} onUpdate={onStatusUpdate} />
                        <p className="text-xs text-gray-400 mt-3">Current: <Badge status={o.status} /></p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Subscriptions ────────────────────────────────────────────────────────────
const SubscriptionsTab = ({ subscriptions, onStatusUpdate }) => {
  const [updatingId, setUpdatingId] = useState(null);
  const SUB_STATUSES = ['active','paused','completed','cancelled'];
  const handle = async (id, status) => {
    setUpdatingId(id);
    await onStatusUpdate('subscriptions', id, status);
    setUpdatingId(null);
  };
  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="px-6 py-4 border-b" style={{ borderColor:'#f0ebe6' }}>
        <h3 className="font-bold" style={{ fontFamily:"'Playfair Display', serif", color:'#800020' }}>Dabba Wala Subscriptions ({subscriptions.length})</h3>
      </div>
      {subscriptions.length === 0 ? <p className="text-center text-gray-400 py-16">No subscriptions yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor:'#FDFBF7' }}>
              <tr>{['Customer','Plan','Box','Preferences','Address','Date','Price','Status','Action'].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {subscriptions.map(s=>(
                <tr key={s.id} className="border-t hover:bg-gray-50" style={{ borderColor:'#f9f6ee' }}>
                  <td className="px-4 py-3"><p className="font-medium whitespace-nowrap">{s.customer_name}</p><p className="text-xs text-gray-400">{s.customer_email}</p></td>
                  <td className="px-4 py-3 capitalize font-medium" style={{ color:'#800020' }}>{s.plan}</td>
                  <td className="px-4 py-3 capitalize">{s.box_type}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px]">{s.preferences?.length?s.preferences.join(', '):'—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{s.delivery_address?.line1}, {s.delivery_address?.city}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{fmtDate(s.start_date)}</td>
                  <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color:'#800020' }}>£{s.price?.toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge status={s.status} /></td>
                  <td className="px-4 py-3">
                    <div className="relative inline-block">
                      <select value={s.status} onChange={e=>handle(s.id,e.target.value)}
                        disabled={updatingId===s.id}
                        className="text-xs border rounded-lg px-2 py-1.5 pr-6 font-semibold appearance-none cursor-pointer"
                        style={{ borderColor:'#800020', color:'#800020', backgroundColor:'#FDFBF7' }}>
                        {SUB_STATUSES.map(st=><option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
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

// ─── Users ────────────────────────────────────────────────────────────────────
const UsersTab = ({ users }) => (
  <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
    <div className="px-6 py-4 border-b" style={{ borderColor:'#f0ebe6' }}>
      <h3 className="font-bold" style={{ fontFamily:"'Playfair Display', serif", color:'#800020' }}>Registered Users ({users.length})</h3>
    </div>
    {users.length===0 ? <p className="text-center text-gray-400 py-16">No registered users yet.</p> : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor:'#FDFBF7' }}>
            <tr>{['Name','Email','Phone','Role','Joined'].map(h=>(
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {users.map(u=>(
              <tr key={u.id} className="border-t hover:bg-gray-50" style={{ borderColor:'#f9f6ee' }}>
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-500">{u.phone||'—'}</td>
                <td className="px-4 py-3"><Badge status={u.role==='admin'?'confirmed':'new'} /><span className="ml-1 text-xs capitalize">{u.role}</span></td>
                <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// ─── Enquiries ────────────────────────────────────────────────────────────────
const STATUS_ACTIONS = {
  new:       { next:'contacted', label:'Mark Contacted',  color:'#1D4ED8' },
  contacted: { next:'resolved',  label:'Mark Resolved',   color:'#166534' },
  resolved:  { next:'contacted', label:'Reopen',          color:'#92400E' },
};

const EnquiriesTab = ({ contacts, catering, onStatusUpdate, reload }) => {
  const [sub, setSub]               = useState('contact');
  const [selected, setSelected]     = useState(null); // { type, enq }
  const [messages, setMessages]     = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [replyText, setReplyText]   = useState('');
  const [sending, setSending]       = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const pollRef = useRef(null);

  const openConversation = useCallback(async (type, enq) => {
    setSelected({ type, enq });
    setMessages([]);
    setReplyText('');
    setMsgLoading(true);
    try {
      const res = await api.get(`/enquiries/${type}/${enq.id}/messages`);
      setMessages(res.data);
    } finally { setMsgLoading(false); }
  }, []);

  // Poll for new messages every 6s while open
  useEffect(() => {
    if (!selected) { clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/enquiries/${selected.type}/${selected.enq.id}/messages`);
        setMessages(res.data);
      } catch {}
    }, 6000);
    return () => clearInterval(pollRef.current);
  }, [selected]);

  const sendReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      const res = await api.post(`/enquiries/${selected.type}/${selected.enq.id}/messages`, { text: replyText.trim() });
      setMessages(m => [...m, res.data]);
      setReplyText('');
      // Refresh list to update unread counts
      reload();
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to send');
    } finally { setSending(false); }
  };

  const changeStatus = async (newStatus) => {
    if (!selected) return;
    setStatusBusy(true);
    try {
      await onStatusUpdate(selected.type, selected.enq.id, newStatus);
      setSelected(s => ({ ...s, enq: { ...s.enq, status: newStatus } }));
      reload();
    } finally { setStatusBusy(false); }
  };

  // ── List view ──────────────────────────────────────────────────────────────
  if (!selected) {
    const list = sub === 'contact' ? contacts : catering;
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {[['contact','Contact Messages',contacts],['catering','Catering Enquiries',catering]].map(([key,label,data])=>(
            <button key={key} onClick={()=>setSub(key)}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ backgroundColor:sub===key?'#800020':'white', color:sub===key?'white':'#800020', border:'1px solid #800020' }}>
              {label} ({data.length})
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          {list.length === 0 ? (
            <p className="text-center text-gray-400 py-16">No {sub === 'contact' ? 'contact messages' : 'catering enquiries'} yet.</p>
          ) : (
            <div className="divide-y">
              {list.map(enq => {
                const isContact = sub === 'contact';
                return (
                  <div key={enq.id}
                    className="p-5 cursor-pointer hover:bg-[#800020]/[0.03] transition-colors flex items-start gap-4"
                    onClick={() => openConversation(sub, enq)}>
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                      style={{ backgroundColor:'#800020' }}>
                      {enq.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-semibold text-gray-900">{enq.name}</p>
                        <Badge status={enq.status} />
                        {isContact && enq.subject && (
                          <span className="text-xs text-gray-500">· {enq.subject}</span>
                        )}
                        {!isContact && (
                          <span className="text-xs text-gray-500 capitalize">· {enq.event_type} · {enq.guest_count} guests</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{enq.email}{enq.phone ? ` · ${enq.phone}` : ''}</p>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {isContact ? enq.message : enq.additional_details || `Event on ${fmtDate(enq.event_date)}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{fmt(enq.created_at)}</span>
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Conversation view ──────────────────────────────────────────────────────
  const { type, enq } = selected;
  const action = STATUS_ACTIONS[enq.status];
  const isContact = type === 'contact';

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '70vh' }}>
      {/* Conversation header */}
      <div className="bg-white rounded-xl mb-3 p-4 flex items-start gap-4" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
        <button onClick={() => setSelected(null)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
          <ArrowLeft size={18} style={{ color:'#800020' }} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="font-bold text-gray-900">{enq.name}</h3>
            <Badge status={enq.status} />
            <span className="text-xs text-gray-400 capitalize">{type} enquiry</span>
          </div>
          <p className="text-sm text-gray-500">{enq.email}{enq.phone ? ` · ${enq.phone}` : ''}</p>
          {isContact && enq.subject && <p className="text-sm font-medium mt-0.5" style={{ color:'#800020' }}>Re: {enq.subject}</p>}
          {!isContact && <p className="text-sm text-gray-500 mt-0.5">{enq.event_type} · {enq.guest_count} guests · {fmtDate(enq.event_date)}</p>}
        </div>
        {action && (
          <button onClick={() => changeStatus(action.next)} disabled={statusBusy}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border flex-shrink-0 disabled:opacity-50 whitespace-nowrap"
            style={{ borderColor: action.color, color: action.color }}>
            {statusBusy ? '…' : action.label}
          </button>
        )}
      </div>

      {/* Original message card */}
      <div className="bg-white rounded-xl p-4 mb-3 border-l-4" style={{ boxShadow:'0 1px 6px rgba(0,0,0,0.05)', borderLeftColor:'#B8860B' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color:'#B8860B' }}>Original Message · {fmt(enq.created_at)}</p>
        {isContact ? (
          <p className="text-sm text-gray-700 leading-relaxed">{enq.message}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
            <div><span className="font-medium">Event:</span> {enq.event_type}</div>
            <div><span className="font-medium">Date:</span> {fmtDate(enq.event_date)}</div>
            <div><span className="font-medium">Guests:</span> {enq.guest_count}</div>
            <div><span className="font-medium">Preference:</span> {enq.food_preference}</div>
            {enq.additional_details && <div className="col-span-2"><span className="font-medium">Notes:</span> {enq.additional_details}</div>}
          </div>
        )}
      </div>

      {/* Message thread */}
      <div className="flex-1 bg-white rounded-xl p-4 mb-3 overflow-y-auto space-y-3" style={{ boxShadow:'0 1px 6px rgba(0,0,0,0.05)', maxHeight:'340px' }}>
        {msgLoading ? (
          <div className="flex justify-center py-6"><RefreshCw size={20} className="animate-spin text-gray-400" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-6">No replies yet. Start the conversation below.</p>
        ) : (
          messages.map(msg => {
            const isAdmin = msg.sender === 'admin';
            return (
              <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isAdmin ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                  style={{ backgroundColor: isAdmin ? '#800020' : '#F3F4F6', color: isAdmin ? 'white' : '#1F2937' }}>
                  <p className={`text-[10px] font-semibold mb-1 ${isAdmin ? 'text-[#F4C430]' : 'text-gray-500'}`}>
                    {msg.sender_name}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-[10px] mt-1.5 ${isAdmin ? 'text-white/60' : 'text-gray-400'}`}>
                    {fmt(msg.created_at)}
                    {isAdmin && msg.read_by_customer && <CheckCheck size={10} className="inline ml-1" />}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply box */}
      <div className="bg-white rounded-xl p-3 flex gap-2 items-end" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
        <textarea
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
          placeholder="Type your reply… (Enter to send, Shift+Enter for new line)"
          rows={2}
          className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#800020]/30"
          style={{ borderColor:'rgba(128,0,32,0.2)', color:'#3D2B1F' }}
        />
        <button onClick={sendReply} disabled={sending || !replyText.trim()}
          className="p-3 rounded-xl text-white flex-shrink-0 disabled:opacity-40 transition-opacity"
          style={{ backgroundColor:'#800020' }}>
          {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      {enq.status === 'resolved' && (
        <p className="text-xs text-center mt-2 flex items-center justify-center gap-1" style={{ color:'#166534' }}>
          <CheckCircle size={12} /> This enquiry is resolved. Replying will reopen it automatically.
        </p>
      )}
      {!enq.user_id && (
        <p className="text-xs text-center mt-1 flex items-center justify-center gap-1 text-amber-600">
          <AlertCircle size={12} /> Customer not registered — they won't receive in-app notifications, but can still view this thread if they log in with the same email.
        </p>
      )}
    </div>
  );
};

// ─── Newsletter ───────────────────────────────────────────────────────────────
const NewsletterTab = ({ newsletter }) => (
  <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
    <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor:'#f0ebe6' }}>
      <h3 className="font-bold" style={{ fontFamily:"'Playfair Display', serif", color:'#800020' }}>Newsletter Subscribers ({newsletter.length})</h3>
      <button onClick={()=>{
        const csv='Email,Subscribed\n'+newsletter.map(n=>`${n.email},${fmtDate(n.created_at)}`).join('\n');
        const a=document.createElement('a'); a.href='data:text/csv,'+encodeURIComponent(csv); a.download='newsletter.csv'; a.click();
      }} className="text-xs font-semibold px-3 py-1.5 rounded-lg border" style={{ color:'#800020', borderColor:'#800020' }}>
        Export CSV
      </button>
    </div>
    {newsletter.length===0 ? <p className="text-center text-gray-400 py-16">No subscribers yet.</p> : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor:'#FDFBF7' }}>
            <tr>{['Email','Subscribed','Status'].map(h=>(
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {newsletter.map(n=>(
              <tr key={n.id} className="border-t hover:bg-gray-50" style={{ borderColor:'#f9f6ee' }}>
                <td className="px-4 py-3">{n.email}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(n.created_at)}</td>
                <td className="px-4 py-3"><Badge status={n.active?'active':'cancelled'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// ─── Menu Management ──────────────────────────────────────────────────────────
const CATEGORIES = ['nonVeg','veg','prasada','breakfast','pickles','podis'];
const CAT_LABELS  = { nonVeg:'Non-Veg', veg:'Veg', prasada:'Prasada', breakfast:'Breakfast', pickles:'Pickles', podis:'Podis' };

const BLANK_ITEM = { name:'', description:'', price:'', category:'nonVeg', subcategory:'', spice_level:0, is_veg:false, available:true, featured:false, image:'', tag:'', allergens:[], faqs:[], pairs_with:[] };

const ALLERGEN_LIST = ['gluten','dairy','eggs','nuts','sesame','mustard','soy','celery'];

const AllergenPicker = ({ value=[], onChange }) => (
  <div className="flex flex-wrap gap-2">
    {ALLERGEN_LIST.map(a => (
      <label key={a} className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
        style={{ backgroundColor:value.includes(a)?'#FEF3C7':'#F3F4F6', color:value.includes(a)?'#92400E':'#374151' }}>
        <input type="checkbox" className="hidden" checked={value.includes(a)}
          onChange={e=>onChange(e.target.checked?[...value,a]:value.filter(x=>x!==a))} />
        {a}
      </label>
    ))}
  </div>
);

const FaqEditor = ({ value=[], onChange }) => (
  <div className="space-y-3">
    {value.map((faq, i) => (
      <div key={i} className="rounded-xl p-3 space-y-2" style={{ backgroundColor:'rgba(128,0,32,0.03)', border:'1px solid rgba(128,0,32,0.1)' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color:'#800020' }}>FAQ {i+1}</span>
          <button type="button" onClick={() => onChange(value.filter((_,j)=>j!==i))}
            className="text-gray-400 hover:text-red-500"><X size={14} /></button>
        </div>
        <input value={faq.q} onChange={e=>{ const v=[...value]; v[i]={...v[i],q:e.target.value}; onChange(v); }}
          placeholder="Question" className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor:'#d1d5db' }} />
        <textarea rows={2} value={faq.a} onChange={e=>{ const v=[...value]; v[i]={...v[i],a:e.target.value}; onChange(v); }}
          placeholder="Answer" className="w-full border rounded-lg px-3 py-2 text-sm resize-none" style={{ borderColor:'#d1d5db' }} />
      </div>
    ))}
    <button type="button" onClick={() => onChange([...value, {q:'',a:''}])}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all"
      style={{ borderColor:'rgba(128,0,32,0.3)', color:'#800020' }}>
      <Plus size={13} /> Add FAQ
    </button>
  </div>
);

const PairsWithPicker = ({ value=[], onChange, allItems, currentId }) => {
  const [search, setSearch] = useState('');
  const filtered = allItems.filter(i => i.id !== currentId && i.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8);
  return (
    <div className="space-y-2">
      <input value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="Search items to pair with…" className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor:'#d1d5db' }} />
      {search && filtered.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor:'#d1d5db' }}>
          {filtered.map(i => (
            <button key={i.id} type="button" onClick={() => { if(!value.includes(i.id)) onChange([...value,i.id]); setSearch(''); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between">
              <span>{i.name}</span>
              <span className="text-xs text-gray-400 capitalize">{i.category}</span>
            </button>
          ))}
        </div>
      )}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(id => {
            const item = allItems.find(i=>i.id===id);
            return item ? (
              <span key={id} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor:'rgba(128,0,32,0.08)', color:'#800020' }}>
                {item.name}
                <button type="button" onClick={()=>onChange(value.filter(x=>x!==id))}><X size={11}/></button>
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};

const MenuTab = () => {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [saving, setSaving]       = useState(false);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [msg, setMsg]             = useState('');
  const [adding, setAdding]       = useState(false);
  const [addForm, setAddForm]     = useState(BLANK_ITEM);
  const [addSaving, setAddSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get('/menu');
    setItems(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      subcategory: item.subcategory || '',
      spice_level: item.spice_level,
      is_veg: item.is_veg,
      available: item.available,
      featured: item.featured,
      image: item.image || '',
      tag: item.tag || '',
      allergens: item.allergens || [],
      faqs: item.faqs || [],
      pairs_with: item.pairs_with || [],
    });
  };

  const aiEnhance = async (form, setForm) => {
    setAiLoading(true); setMsg('');
    try {
      const res = await api.post('/menu/ai/enhance', {
        name: form.name, category: form.category,
        is_veg: form.is_veg, spice_level: form.spice_level,
      });
      setForm(p => ({
        ...p,
        description: res.data.description || p.description,
        allergens: res.data.allergens?.length ? res.data.allergens : p.allergens,
        tag: res.data.tag || p.tag,
        faqs: res.data.faqs?.length ? res.data.faqs : p.faqs,
      }));
      setMsg('AI filled in description, allergens, FAQs and tag!');
      setTimeout(() => setMsg(''), 3000);
    } catch(e) {
      setMsg(e.response?.data?.detail || 'AI unavailable. Set ANTHROPIC_API_KEY on Render.');
    } finally { setAiLoading(false); }
  };

  const save = async (id) => {
    setSaving(true);
    try {
      await api.put(`/menu/${id}`, {
        ...editForm,
        price: parseFloat(editForm.price),
        spice_level: parseInt(editForm.spice_level),
      });
      setMsg('Saved!');
      setEditingId(null);
      await load();
      setTimeout(() => setMsg(''), 2000);
    } catch { setMsg('Save failed.'); }
    finally { setSaving(false); }
  };

  const toggleAvail = async (item) => {
    await api.put(`/menu/${item.id}`, { available: !item.available });
    await load();
  };

  const addItem = async () => {
    if (!addForm.name || !addForm.description || !addForm.price) { setMsg('Name, description and price are required.'); return; }
    setAddSaving(true);
    try {
      await api.post('/menu', { ...addForm, price: parseFloat(addForm.price), spice_level: parseInt(addForm.spice_level) });
      setMsg('Item added!');
      setAdding(false);
      setAddForm(BLANK_ITEM);
      await load();
      setTimeout(() => setMsg(''), 2000);
    } catch (e) { setMsg(e.response?.data?.detail || 'Failed to add item.'); }
    finally { setAddSaving(false); }
  };

  const filtered = items
    .filter(i => filter === 'all' || i.category === filter)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-16"><RefreshCw size={28} className="animate-spin" style={{ color:'#800020' }} /></div>;

  return (
    <div className="space-y-4">
      {msg && <div className="p-3 rounded-lg text-sm font-semibold" style={{ backgroundColor: msg.includes('!')?'#DCFCE7':'#FEE2E2', color: msg.includes('!')?'#166534':'#991B1B' }}>{msg}</div>}

      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {['all',...CATEGORIES].map(c=>(
            <button key={c} onClick={()=>setFilter(c)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
              style={{ backgroundColor:filter===c?'#800020':'white', color:filter===c?'white':'#5C4B47', border:'1px solid rgba(128,0,32,0.2)' }}>
              {c==='all'?`All (${items.length})`:CAT_LABELS[c]+` (${items.filter(i=>i.category===c).length})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items…"
              className="pl-8 pr-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-[#800020]/30"
              style={{ borderColor:'rgba(128,0,32,0.25)', width:'180px', color:'#3D2B1F' }}
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
          <button onClick={()=>{ setAdding(true); setEditingId(null); setSearch(''); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white whitespace-nowrap"
            style={{ backgroundColor:'#800020' }}>
            <Plus size={15} /> Add New Item
          </button>
        </div>
      </div>
      {search && (
        <p className="text-xs" style={{ color:'#9C7B6B' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "<strong>{search}</strong>"
        </p>
      )}

      {/* Add New Item form */}
      {adding && (
        <div className="bg-white rounded-xl p-5 space-y-4" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.08)', border:'2px solid rgba(128,0,32,0.2)' }}>
          <div className="flex items-center justify-between">
            <p className="font-bold" style={{ color:'#800020', fontFamily:"'Playfair Display',serif" }}>Add New Menu Item</p>
            <button onClick={()=>{ setAdding(false); setMsg(''); }}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Name *</label>
              <input value={addForm.name} onChange={e=>setAddForm(p=>({...p,name:e.target.value}))}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor:'#d1d5db' }} placeholder="e.g. Hyderabadi Biryani" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Price (£) *</label>
              <input type="number" step="0.01" value={addForm.price} onChange={e=>setAddForm(p=>({...p,price:e.target.value}))}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor:'#d1d5db' }} placeholder="12.99" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Description *</label>
              <textarea rows={3} value={addForm.description} onChange={e=>setAddForm(p=>({...p,description:e.target.value}))}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none" style={{ borderColor:'#d1d5db' }} placeholder="Describe the dish..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Category</label>
              <select value={addForm.category} onChange={e=>setAddForm(p=>({...p,category:e.target.value}))}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor:'#d1d5db' }}>
                {CATEGORIES.map(c=><option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Spice Level (0–5)</label>
              <input type="number" min={0} max={5} value={addForm.spice_level} onChange={e=>setAddForm(p=>({...p,spice_level:e.target.value}))}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor:'#d1d5db' }} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Image URL</label>
              <input value={addForm.image} onChange={e=>setAddForm(p=>({...p,image:e.target.value}))}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor:'#d1d5db' }} placeholder="https://..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Tag</label>
              <input value={addForm.tag} onChange={e=>setAddForm(p=>({...p,tag:e.target.value}))}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor:'#d1d5db' }} placeholder="e.g. Best Seller, New" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Subcategory</label>
              <input value={addForm.subcategory||''} onChange={e=>setAddForm(p=>({...p,subcategory:e.target.value}))}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor:'#d1d5db' }} placeholder="e.g. Starters, Curries" />
            </div>
          </div>
          {/* Allergens */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Allergens <span className="normal-case font-normal">(click to select)</span></label>
            <div className="flex flex-wrap gap-2">
              {['gluten','dairy','eggs','nuts','sesame','mustard','soy','celery'].map(a=>(
                <label key={a} className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                  style={{ backgroundColor:(addForm.allergens||[]).includes(a)?'#FEF3C7':'#F3F4F6', color:(addForm.allergens||[]).includes(a)?'#92400E':'#374151' }}>
                  <input type="checkbox" className="hidden"
                    checked={(addForm.allergens||[]).includes(a)}
                    onChange={e=>setAddForm(p=>({...p, allergens: e.target.checked?[...(p.allergens||[]),a]:(p.allergens||[]).filter(x=>x!==a)}))} />
                  {a}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-6 flex-wrap">
            {[['is_veg','Vegetarian'],['available','Available on site'],['featured','Featured on homepage']].map(([key,label])=>(
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={addForm[key]} onChange={e=>setAddForm(p=>({...p,[key]:e.target.checked}))} className="w-4 h-4 accent-[#800020]" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
          {/* Pairs With */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Pairs Well With</label>
            <PairsWithPicker value={addForm.pairs_with||[]} onChange={v=>setAddForm(p=>({...p,pairs_with:v}))} allItems={items} currentId={null} />
          </div>

          {/* Custom FAQs */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Custom FAQs</label>
            <FaqEditor value={addForm.faqs||[]} onChange={v=>setAddForm(p=>({...p,faqs:v}))} />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button onClick={addItem} disabled={addSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor:'#800020' }}>
              <Plus size={14} /> {addSaving?'Adding…':'Add to Menu'}
            </button>
            <button type="button" onClick={()=>aiEnhance(addForm, setAddForm)} disabled={aiLoading || !addForm.name}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor:'#1565C0', color:'white' }}>
              {aiLoading ? <RefreshCw size={14} className="animate-spin"/> : '✨'} AI Auto-fill
            </button>
            <button onClick={()=>{ setAdding(false); setMsg(''); }} className="px-4 py-2 rounded-lg text-sm border font-semibold" style={{ borderColor:'#d1d5db', color:'#5C4B47' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {filtered.map(item=>(
          <div key={item.id} className="bg-white rounded-xl overflow-hidden" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.06)', opacity: item.available?1:0.6 }}>
            {editingId === item.id ? (
              /* ── Edit mode ── */
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm" style={{ color:'#800020' }}>Editing: {item.name}</p>
                  <button onClick={()=>setEditingId(null)}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Name</label>
                    <input value={editForm.name} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))}
                      className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor:'#d1d5db' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Price (£)</label>
                    <input type="number" step="0.01" value={editForm.price} onChange={e=>setEditForm(p=>({...p,price:e.target.value}))}
                      className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor:'#d1d5db' }} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Description</label>
                    <textarea rows={3} value={editForm.description} onChange={e=>setEditForm(p=>({...p,description:e.target.value}))}
                      className="w-full border rounded-lg px-3 py-2 text-sm resize-none" style={{ borderColor:'#d1d5db' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Category</label>
                    <select value={editForm.category} onChange={e=>setEditForm(p=>({...p,category:e.target.value}))}
                      className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor:'#d1d5db' }}>
                      {CATEGORIES.map(c=><option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Spice Level (0–5)</label>
                    <input type="number" min={0} max={5} value={editForm.spice_level} onChange={e=>setEditForm(p=>({...p,spice_level:e.target.value}))}
                      className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor:'#d1d5db' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Image URL</label>
                    <input value={editForm.image} onChange={e=>setEditForm(p=>({...p,image:e.target.value}))}
                      placeholder="https://..." className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor:'#d1d5db' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Tag (e.g. Best Seller)</label>
                    <input value={editForm.tag} onChange={e=>setEditForm(p=>({...p,tag:e.target.value}))}
                      className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor:'#d1d5db' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Subcategory</label>
                    <input value={editForm.subcategory||''} onChange={e=>setEditForm(p=>({...p,subcategory:e.target.value}))}
                      placeholder="e.g. Starters, Curries, Biriyanis"
                      className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor:'#d1d5db' }} />
                  </div>
                </div>
                {/* Allergens */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Allergens</label>
                  <div className="flex flex-wrap gap-2">
                    {['gluten','dairy','eggs','nuts','sesame','mustard','soy','celery'].map(a=>(
                      <label key={a} className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                        style={{ backgroundColor:(editForm.allergens||[]).includes(a)?'#FEF3C7':'#F3F4F6', color:(editForm.allergens||[]).includes(a)?'#92400E':'#374151', border:'1px solid transparent' }}>
                        <input type="checkbox" className="hidden"
                          checked={(editForm.allergens||[]).includes(a)}
                          onChange={e=>setEditForm(p=>({...p, allergens: e.target.checked ? [...(p.allergens||[]),a] : (p.allergens||[]).filter(x=>x!==a)}))} />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>
                {/* Toggles */}
                <div className="flex gap-6 flex-wrap">
                  {[['is_veg','Vegetarian'],['available','Available'],['featured','Featured']].map(([key,label])=>(
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editForm[key]} onChange={e=>setEditForm(p=>({...p,[key]:e.target.checked}))} className="w-4 h-4 accent-[#800020]" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>

                {/* Pairs With */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Pairs Well With <span className="normal-case font-normal">(shown on item page)</span></label>
                  <PairsWithPicker value={editForm.pairs_with||[]} onChange={v=>setEditForm(p=>({...p,pairs_with:v}))} allItems={items} currentId={item.id} />
                </div>

                {/* Custom FAQs */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Custom FAQs <span className="normal-case font-normal">(shown first on item page)</span></label>
                  <FaqEditor value={editForm.faqs||[]} onChange={v=>setEditForm(p=>({...p,faqs:v}))} />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button onClick={()=>save(item.id)} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor:'#800020' }}>
                    <Save size={14} /> {saving?'Saving…':'Save Changes'}
                  </button>
                  <button type="button" onClick={()=>aiEnhance(editForm, setEditForm)} disabled={aiLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                    style={{ backgroundColor:'#1565C0', color:'white' }}>
                    {aiLoading ? <RefreshCw size={14} className="animate-spin"/> : '✨'} AI Auto-fill
                  </button>
                  <button onClick={()=>setEditingId(null)} className="px-4 py-2 rounded-lg text-sm border font-semibold" style={{ borderColor:'#d1d5db', color:'#5C4B47' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── View mode ── */
              <div className="flex items-center gap-4 p-4">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor:'rgba(128,0,32,0.08)' }}>
                    <Utensils size={22} style={{ color:'#800020' }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    {item.tag && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor:'#FEF3C7', color:'#92400E' }}>{item.tag}</span>}
                    {item.is_veg ? <Leaf size={13} style={{ color:'#2E7D32' }} /> : <Flame size={13} style={{ color:'#C62828' }} />}
                    {item.featured && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor:'#E3F2FD', color:'#1565C0' }}>Featured</span>}
                  </div>
                  <p className="text-xs text-gray-500 truncate max-w-md">{item.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-bold text-sm" style={{ color:'#800020' }}>£{item.price?.toFixed(2)}</span>
                    <span className="text-xs text-gray-400 capitalize">{CAT_LABELS[item.category]}</span>
                    <span className="text-xs text-gray-400">Spice: {item.spice_level}/5</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={()=>toggleAvail(item)}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all"
                    style={{ backgroundColor: item.available?'#DCFCE7':'#FEE2E2', color: item.available?'#166534':'#991B1B' }}>
                    {item.available?'Live':'Hidden'}
                  </button>
                  <button onClick={()=>startEdit(item)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold border"
                    style={{ borderColor:'#800020', color:'#800020' }}>
                    <Edit2 size={12} /> Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Admin Page ──────────────────────────────────────────────────────────
const TABS = [
  { id:'overview',      label:'Overview',      icon:TrendingUp   },
  { id:'orders',        label:'Orders',        icon:ShoppingBag  },
  { id:'subscriptions', label:'Subscriptions', icon:Package      },
  { id:'menu',          label:'Menu',          icon:Utensils     },
  { id:'users',         label:'Users',         icon:Users        },
  { id:'enquiries',     label:'Enquiries',     icon:MessageSquare},
  { id:'newsletter',    label:'Newsletter',    icon:Mail         },
];

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({ orders:[], subscriptions:[], users:[], contacts:[], catering:[], newsletter:[] });
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
      setData({ orders:orders.data, subscriptions:subscriptions.data, users:users.data, contacts:contacts.data, catering:catering.data, newsletter:newsletter.data });
    } catch { setError('Failed to load data. Make sure you are signed in as admin.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleStatusUpdate = async (type, id, status) => {
    try {
      if (type==='orders')        await api.put(`/orders/${id}/status`, { status });
      if (type==='subscriptions') await api.put(`/subscriptions/${id}/status`, { status });
      if (type==='contact')       await api.put(`/enquiries/contact/${id}/status?status=${status}`);
      if (type==='catering')      await api.put(`/enquiries/catering/${id}/status?status=${status}`);
      await fetchAll();
    } catch { /* silent */ }
  };

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor:'#FDFBF7' }}>
      <p className="text-lg font-semibold text-gray-600">Please sign in to access the admin panel.</p>
      <p className="text-sm text-gray-400">Click the user icon at the top right to sign in.</p>
    </div>
  );

  if (user.role !== 'admin') return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ backgroundColor:'#FDFBF7' }}>
      <XCircle size={48} style={{ color:'#800020' }} />
      <p className="text-lg font-semibold" style={{ color:'#800020' }}>Access Denied</p>
      <p className="text-sm text-gray-500">This page is only accessible to administrators.</p>
      <Link to="/" className="text-sm font-semibold mt-2" style={{ color:'#B8860B' }}>← Back to site</Link>
    </div>
  );

  return (
    <div className="min-h-screen pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)]" style={{ backgroundColor:'#F4F1EC' }}>
      {/* Top Bar */}
      <div className="sticky top-[calc(32px+4rem)] md:top-[calc(32px+5rem)] z-20 px-4 md:px-8 py-3 flex items-center justify-between"
        style={{ backgroundColor:'#800020' }}>
        <div>
          <h1 className="text-lg font-bold text-white" style={{ fontFamily:"'Playfair Display', serif" }}>Admin Dashboard</h1>
          <p className="text-xs text-white/60">Sree Svadista Prasada</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ backgroundColor:'rgba(255,255,255,0.15)', color:'white' }}>
            <LayoutDashboard size={13} /> My Dashboard
          </Link>
          <button onClick={fetchAll} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ backgroundColor:'rgba(255,255,255,0.15)', color:'white' }}>
            <RefreshCw size={14} className={refreshing?'animate-spin':''} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-52 min-h-[calc(100vh-8rem)] pt-6 px-3 bg-white border-r" style={{ borderColor:'rgba(128,0,32,0.1)' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-left mb-1 transition-all"
              style={{ backgroundColor: activeTab===id?'rgba(128,0,32,0.08)':'transparent', color: activeTab===id?'#800020':'#5C4B47', fontWeight: activeTab===id?700:500 }}>
              <Icon size={17} /> {label}
            </button>
          ))}
          <div className="mt-auto pb-6 px-1">
            <Link to="/dashboard" className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all" style={{ color:'#9C7B6B' }}>
              <LayoutDashboard size={17} /> My Dashboard
            </Link>
            <Link to="/" className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all" style={{ color:'#9C7B6B' }}>
              ← Back to site
            </Link>
          </div>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden w-full fixed bottom-0 left-0 z-30 flex bg-white border-t shadow-lg overflow-x-auto" style={{ borderColor:'rgba(128,0,32,0.12)' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex-shrink-0 flex flex-col items-center py-2 px-3 gap-0.5 text-[10px] font-medium transition-colors"
              style={{ color: activeTab===id?'#800020':'#9CA3AF' }}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden">
          {error && <div className="mb-4 p-4 rounded-lg text-sm font-medium" style={{ backgroundColor:'#FFF0F0', color:'#800020' }}>{error}</div>}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <RefreshCw size={32} className="animate-spin" style={{ color:'#800020' }} />
            </div>
          ) : (
            <>
              {activeTab==='overview'      && <Overview {...data} />}
              {activeTab==='orders'        && <OrdersTab orders={data.orders} onStatusUpdate={handleStatusUpdate} />}
              {activeTab==='subscriptions' && <SubscriptionsTab subscriptions={data.subscriptions} onStatusUpdate={handleStatusUpdate} />}
              {activeTab==='menu'          && <MenuTab />}
              {activeTab==='users'         && <UsersTab users={data.users} />}
              {activeTab==='enquiries'     && <EnquiriesTab contacts={data.contacts} catering={data.catering} onStatusUpdate={handleStatusUpdate} reload={fetchAll} />}
              {activeTab==='newsletter'    && <NewsletterTab newsletter={data.newsletter} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Admin;

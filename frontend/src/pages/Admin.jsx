import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
  ShoppingBag, Users, Package, Mail, MessageSquare, Bell,
  TrendingUp, Clock, CheckCircle, XCircle, RefreshCw,
  ChevronDown, ChevronRight, Edit2, Save, X, Plus,
  Utensils, LayoutDashboard, Eye, EyeOff, Flame, Leaf
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
const EnquiriesTab = ({ contacts, catering, onStatusUpdate }) => {
  const [sub, setSub] = useState('contact');
  const [updatingId, setUpdatingId] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const ENQUIRY_STATUSES = ['new','contacted','resolved'];
  const handle = async (type, id, status) => {
    setUpdatingId(id);
    await onStatusUpdate(type, id, status);
    setUpdatingId(null);
  };
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
      {sub==='contact' && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          {contacts.length===0 ? <p className="text-center text-gray-400 py-16">No contact messages yet.</p> : (
            <div className="divide-y">
              {contacts.map(c=>(
                <div key={c.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        <Badge status={c.status} />
                        <span className="text-xs text-gray-400">{fmt(c.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{c.email} {c.phone&&`· ${c.phone}`}</p>
                      <p className="text-sm font-medium text-gray-700 mb-1">Subject: {c.subject}</p>
                      <p className={`text-sm text-gray-600 ${expanded===c.id?'':'line-clamp-2'}`}>{c.message}</p>
                      {c.message?.length>100 && (
                        <button onClick={()=>setExpanded(expanded===c.id?null:c.id)} className="text-xs mt-1 font-medium" style={{ color:'#800020' }}>
                          {expanded===c.id?'Show less':'Read more'}
                        </button>
                      )}
                    </div>
                    <select value={c.status} onChange={e=>handle('contact',c.id,e.target.value)} disabled={updatingId===c.id}
                      className="text-xs border rounded-lg px-2 py-1.5 font-semibold"
                      style={{ borderColor:'#800020', color:'#800020', backgroundColor:'#FDFBF7' }}>
                      {ENQUIRY_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {sub==='catering' && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          {catering.length===0 ? <p className="text-center text-gray-400 py-16">No catering enquiries yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor:'#FDFBF7' }}>
                  <tr>{['Customer','Event','Date','Guests','Preference','Details','Status','Action'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {catering.map(c=>(
                    <tr key={c.id} className="border-t hover:bg-gray-50" style={{ borderColor:'#f9f6ee' }}>
                      <td className="px-4 py-3"><p className="font-medium whitespace-nowrap">{c.name}</p><p className="text-xs text-gray-400">{c.email}</p></td>
                      <td className="px-4 py-3 capitalize">{c.event_type}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">{fmtDate(c.event_date)}</td>
                      <td className="px-4 py-3 text-center">{c.guest_count}</td>
                      <td className="px-4 py-3 capitalize text-xs">{c.food_preference}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate">{c.additional_details||'—'}</td>
                      <td className="px-4 py-3"><Badge status={c.status} /></td>
                      <td className="px-4 py-3">
                        <select value={c.status} onChange={e=>handle('catering',c.id,e.target.value)} disabled={updatingId===c.id}
                          className="text-xs border rounded-lg px-2 py-1.5 font-semibold"
                          style={{ borderColor:'#800020', color:'#800020', backgroundColor:'#FDFBF7' }}>
                          {ENQUIRY_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
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

const BLANK_ITEM = { name:'', description:'', price:'', category:'nonVeg', spice_level:0, is_veg:false, available:true, featured:false, image:'', tag:'' };

const MenuTab = () => {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [saving, setSaving]       = useState(false);
  const [filter, setFilter]       = useState('all');
  const [msg, setMsg]             = useState('');
  const [adding, setAdding]       = useState(false);
  const [addForm, setAddForm]     = useState(BLANK_ITEM);
  const [addSaving, setAddSaving] = useState(false);

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
      spice_level: item.spice_level,
      is_veg: item.is_veg,
      available: item.available,
      featured: item.featured,
      image: item.image || '',
      tag: item.tag || '',
    });
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

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);

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
        <button onClick={()=>{ setAdding(true); setEditingId(null); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor:'#800020' }}>
          <Plus size={15} /> Add New Item
        </button>
      </div>

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
          </div>
          <div className="flex gap-6 flex-wrap">
            {[['is_veg','Vegetarian'],['available','Available on site'],['featured','Featured on homepage']].map(([key,label])=>(
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={addForm[key]} onChange={e=>setAddForm(p=>({...p,[key]:e.target.checked}))} className="w-4 h-4 accent-[#800020]" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} disabled={addSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor:'#800020' }}>
              <Plus size={14} /> {addSaving?'Adding…':'Add to Menu'}
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
                <div className="flex gap-2">
                  <button onClick={()=>save(item.id)} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor:'#800020' }}>
                    <Save size={14} /> {saving?'Saving…':'Save Changes'}
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
              {activeTab==='enquiries'     && <EnquiriesTab contacts={data.contacts} catering={data.catering} onStatusUpdate={handleStatusUpdate} />}
              {activeTab==='newsletter'    && <NewsletterTab newsletter={data.newsletter} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Admin;

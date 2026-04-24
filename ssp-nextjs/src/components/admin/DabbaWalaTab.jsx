'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RefreshCw, CheckCircle, Printer, Copy, AlertTriangle, X } from 'lucide-react';
import api from '@/api';

// ── helpers ────────────────────────────────────────────────────────────────────
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

const BOX_BADGE = {
  prasada:  { bg:'#E1F5EE', color:'#0F6E56', label:'Prasada' },
  svadista: { bg:'rgba(128,0,32,0.1)', color:'#800020', label:'Svadista' },
};

const BOX_ROWS = ['prasada', 'svadista'];

// ─── Dabba Wala Admin Tab ────────────────────────────────────────────────────
const DABBA_VIEWS = [
  { id:'operations', label:'Operations' },
  { id:'subscribers', label:'Subscribers' },
  { id:'menu-planner', label:'Menu Planner' },
  { id:'delivery', label:'Delivery Sheet' },
  { id:'analytics', label:'Analytics' },
];

export default function DabbaWalaTab() {
  const [view, setView] = useState('operations');

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b pb-0" style={{ borderColor:'rgba(128,0,32,0.1)' }}>
        {DABBA_VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className="px-4 py-2.5 text-sm font-medium transition-colors"
            style={{ color: view===v.id?'#800020':'#9C7B6B', fontWeight: view===v.id?500:400, borderBottom: view===v.id?'2px solid #800020':'2px solid transparent' }}>
            {v.label}
          </button>
        ))}
      </div>
      {view==='operations'   && <DabbaOperations />}
      {view==='subscribers'  && <DabbaSubscribers />}
      {view==='menu-planner' && <DabbaMenuPlanner />}
      {view==='delivery'     && <DabbaDeliverySheet />}
      {view==='analytics'    && <DabbaAnalytics />}
    </div>
  );
}

/* ── Operations ────────────────────────────────────────── */
function DabbaOperations() {
  const [alerts, setAlerts]       = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading]     = useState(true);
  const today = new Date();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;

  useEffect(() => {
    Promise.all([
      api.get('/admin/dabba-wala/alerts'),
      api.get('/admin/dabba-wala/deliveries/today'),
    ]).then(([a, d]) => { setAlerts(a.data); setDeliveries(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateDeliveryStatus = async (deliveryId, status) => {
    await api.patch(`/admin/dabba-wala/deliveries/${deliveryId}/status`, { status });
    setDeliveries(prev => prev.map(d => d.delivery_id === deliveryId ? { ...d, status } : d));
  };

  const dayLabel = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const prasadaCount = deliveries.filter(d => d.box_type === 'prasada').length;
  const svadistCount = deliveries.filter(d => d.box_type === 'svadista').length;

  if (loading) return <div className="flex justify-center py-12"><RefreshCw size={24} className="animate-spin" style={{ color:'#800020' }} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ fontFamily:"'Playfair Display', serif", color:'#800020' }}>
          {dayLabel} — {isWeekend ? 'No deliveries today' : `${deliveries.length} deliveries today`}
        </h2>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl"
              style={{ backgroundColor: a.type==='red'?'#FEF2F2':a.type==='amber'?'#FFFBEB':'#EFF6FF', borderLeft: `4px solid ${a.type==='red'?'#DC2626':a.type==='amber'?'#F59E0B':'#3B82F6'}` }}>
              <AlertTriangle size={16} style={{ color: a.type==='red'?'#DC2626':a.type==='amber'?'#F59E0B':'#3B82F6', marginTop:2 }} />
              <div className="flex-1 text-sm" style={{ color:'#374151' }}>
                <span className="font-semibold">{a.subscriber_name}: </span>{a.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isWeekend && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <p className="text-3xl font-bold" style={{ color:'#800020' }}>{deliveries.length}</p>
              <p className="text-sm text-gray-500">Total deliveries today</p>
              <p className="text-xs mt-1" style={{ color:'#9C7B6B' }}>Prasada: {prasadaCount} · Svadista: {svadistCount}</p>
            </div>
            <div className="bg-white rounded-xl p-5" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <p className="text-3xl font-bold" style={{ color:'#4A7C59' }}>
                {deliveries.filter(d => d.status === 'delivered').length}
              </p>
              <p className="text-sm text-gray-500">Delivered so far</p>
            </div>
          </div>

          {deliveries.length > 0 && (
            <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <div className="p-4 border-b" style={{ borderColor:'rgba(128,0,32,0.08)' }}>
                <p className="font-semibold text-sm" style={{ color:'#800020' }}>Today's Delivery List</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor:'#F9F6EE' }}>
                      {['#','Name','Box','Dietary flags','Address','Status','Action'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color:'#9C7B6B' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((d, i) => {
                      const bm = BOX_BADGE[d.box_type] || BOX_BADGE.prasada;
                      return (
                        <tr key={d.delivery_id} className="border-b" style={{ borderColor:'rgba(128,0,32,0.06)', backgroundColor: d.status==='delivered'?'#F0FFF4':'white' }}>
                          <td className="px-4 py-3 text-xs" style={{ color:'#9C7B6B' }}>{i+1}</td>
                          <td className="px-4 py-3 font-medium" style={{ color:'#2D2422' }}>{d.name}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor:bm.bg, color:bm.color }}>{bm.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(d.preferences || []).slice(0,3).map(p => <span key={p} className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor:'rgba(128,0,32,0.07)', color:'#800020' }}>{p}</span>)}
                              {(d.preferences || []).length > 3 && <span className="text-[10px]" style={{ color:'#9C7B6B' }}>+{d.preferences.length-3}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color:'#5C4B47' }}>
                            {d.address?.line1}, {d.address?.postcode}
                          </td>
                          <td className="px-4 py-3">
                            <Badge status={d.status || 'confirmed'} />
                          </td>
                          <td className="px-4 py-3">
                            {d.status !== 'delivered' && d.status !== 'failed' ? (
                              <div className="flex gap-1.5 flex-wrap">
                                <button onClick={() => updateDeliveryStatus(d.delivery_id, 'delivered')}
                                  className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg"
                                  style={{ backgroundColor:'#4A7C59' }}>
                                  Delivered
                                </button>
                                <button onClick={() => updateDeliveryStatus(d.delivery_id, 'failed')}
                                  className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg"
                                  style={{ backgroundColor:'#C62828' }}>
                                  Failed
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold capitalize" style={{ color: d.status==='delivered'?'#4A7C59':'#C62828' }}>
                                {d.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-5" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold" style={{ color:'#800020' }}>Kitchen summary for today</p>
              <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg" style={{ backgroundColor:'#F9F6EE', color:'#9C7B6B' }}>
                <Printer size={13} /> Print
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color:'#0F6E56' }}>Prasada boxes ({prasadaCount})</p>
                <div className="space-y-1 text-xs" style={{ color:'#5C4B47' }}>
                  {['Standard', 'No onion/garlic', 'Jain', 'Gluten-free', 'Less spicy'].map(p => {
                    const count = deliveries.filter(d => d.box_type==='prasada' && (p==='Standard' ? !d.preferences?.length : d.preferences?.some(x => x.toLowerCase().includes(p.toLowerCase().split('/')[0])))).length;
                    return count > 0 ? <p key={p}>{p}: {count}</p> : null;
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color:'#800020' }}>Svadista boxes ({svadistCount})</p>
                <div className="space-y-1 text-xs" style={{ color:'#5C4B47' }}>
                  {['Standard', 'No egg', 'Extra spicy'].map(p => {
                    const count = deliveries.filter(d => d.box_type==='svadista' && (p==='Standard' ? !d.preferences?.length : d.preferences?.some(x => x.toLowerCase().includes(p.toLowerCase().split(' ')[0])))).length;
                    return count > 0 ? <p key={p}>{p}: {count}</p> : null;
                  })}
                </div>
              </div>
            </div>
            {deliveries.filter(d => d.custom_request).length > 0 && (
              <div className="mt-4 pt-4" style={{ borderTop:'1px solid rgba(128,0,32,0.08)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color:'#B8860B' }}>Custom requests:</p>
                {deliveries.filter(d => d.custom_request).map(d => (
                  <p key={d.delivery_id} className="text-xs" style={{ color:'#5C4B47' }}><strong>{d.name}:</strong> {d.custom_request}</p>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Subscribers ───────────────────────────────────────── */
function DabbaSubscribers() {
  const [subs, setSubs]         = useState([]);
  const [counts, setCounts]     = useState({});
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([api.get('/subscriptions'), api.get('/admin/dabba-wala/subscribers/counts')]);
      setSubs(s.data); setCounts(c.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = subs.filter(s => {
    const matchStatus = statusFilter === 'all' || s.status === statusFilter || (statusFilter === 'ending_soon' && s.end_date && new Date(s.end_date) <= new Date(Date.now() + 7*86400000) && s.status === 'active');
    const q = search.toLowerCase();
    const matchSearch = !q || [s.customer_name, s.customer_email, s.customer_phone, s.delivery_address?.postcode].some(v => v?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  if (selected) return <DabbaSubscriberProfile sub={selected} onBack={() => { setSelected(null); load(); }} />;

  const STATUS_TABS = [
    { id:'all', label:`All (${counts.all||0})` },
    { id:'active', label:`Active (${counts.active||0})` },
    { id:'ending_soon', label:`Ending Soon (${counts.ending_soon||0})` },
    { id:'expired', label:`Expired (${counts.expired||0})` },
    { id:'cancelled', label:`Cancelled (${counts.cancelled||0})` },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map(t => (
          <button key={t.id} onClick={() => setStatusFilter(t.id)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{ backgroundColor: statusFilter===t.id?'#800020':'#F9F6EE', color: statusFilter===t.id?'white':'#5C4B47' }}>
            {t.label}
          </button>
        ))}
        <input type="text" placeholder="Search name, email, postcode…" value={search} onChange={e => setSearch(e.target.value)}
          className="ml-auto px-4 py-1.5 rounded-full text-sm border" style={{ border:'1px solid rgba(128,0,32,0.2)', outline:'none', minWidth:200 }} />
      </div>

      {loading ? <div className="flex justify-center py-12"><RefreshCw size={20} className="animate-spin" style={{ color:'#800020' }} /></div> : (
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-sm text-center py-8" style={{ color:'#9C7B6B' }}>No subscribers found.</p>}
          {filtered.map(s => {
            const initials = s.customer_name?.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() || '?';
            const statusColor = s.status==='active'?'#4A7C59': s.status==='cancelled'?'#9CA3AF':'#B8860B';
            const bm = BOX_BADGE[s.box_type] || BOX_BADGE.prasada;
            return (
              <button key={s.id} onClick={() => setSelected(s)} className="w-full text-left">
                <div className="bg-white rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow" style={{ border:'0.5px solid #e0d9d0' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor:`${statusColor}20`, color:statusColor }}>{initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color:'#2D2422' }}>{s.customer_name}</p>
                    <p className="text-xs truncate" style={{ color:'#9C7B6B' }}>{s.customer_email} · {s.customer_phone}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize" style={{ backgroundColor:'rgba(128,0,32,0.08)', color:'#800020' }}>{s.plan}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor:bm.bg, color:bm.color }}>{bm.label}</span>
                      {(s.preferences||[]).slice(0,2).map(p => <span key={p} className="px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor:'#F9F6EE', color:'#9C7B6B' }}>{p}</span>)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge status={s.status} />
                    {s.end_date && <p className="text-[10px] mt-1" style={{ color:'#9C7B6B' }}>Ends {new Date(s.end_date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</p>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DabbaSubscriberProfile({ sub: initialSub, onBack }) {
  const [sub, setSub] = useState(initialSub);
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const saveNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      await api.post(`/admin/subscriptions/${sub.id}/notes`, { text: noteText });
      const res = await api.get(`/subscriptions/${sub.id}`);
      setSub(res.data);
      setNoteText(''); setAddingNote(false);
    } catch {} finally { setSaving(false); }
  };

  const bm = BOX_BADGE[sub.box_type] || BOX_BADGE.prasada;
  const addr = sub.delivery_address;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold" style={{ color:'#9C7B6B' }}>
          <ArrowLeft size={16} /> Back to list
        </button>
      </div>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily:"'Playfair Display', serif", color:'#800020' }}>{sub.customer_name}</h2>
          <p className="text-sm" style={{ color:'#9C7B6B' }}>{sub.customer_email} · {sub.customer_phone}</p>
        </div>
        <Badge status={sub.status} />
      </div>

      <div className="space-y-5">
        <div className="bg-white rounded-xl p-5" style={{ border:'0.5px solid #e0d9d0' }}>
          <p className="font-semibold text-sm mb-4" style={{ color:'#800020' }}>Subscription</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Plan', sub.plan?.charAt(0).toUpperCase()+sub.plan?.slice(1)],
              ['Box', bm.label],
              ['Price', `£${sub.price}`],
              ['Status', sub.status],
              ['Start date', sub.start_date || '—'],
              ['End date', sub.end_date || '—'],
              ['Address', addr ? `${addr.line1}, ${addr.city} ${addr.postcode}` : '—'],
              ['Delivery', sub.delivery_instruction || '—'],
            ].map(([k,v]) => (
              <div key={k}>
                <p className="text-[10px] uppercase font-semibold mb-0.5" style={{ color:'#B8860B' }}>{k}</p>
                <p style={{ color:'#2D2422' }}>{v}</p>
              </div>
            ))}
          </div>
          {sub.preferences?.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop:'1px solid rgba(128,0,32,0.08)' }}>
              <p className="text-[10px] uppercase font-semibold mb-2" style={{ color:'#B8860B' }}>Preferences</p>
              <div className="flex flex-wrap gap-1.5">
                {sub.preferences.map(p => <span key={p} className="px-2.5 py-1 rounded-full text-xs" style={{ backgroundColor:'rgba(128,0,32,0.08)', color:'#800020' }}>{p}</span>)}
              </div>
            </div>
          )}
          {sub.custom_request && (
            <div className="mt-3 pt-3" style={{ borderTop:'1px solid rgba(128,0,32,0.08)' }}>
              <p className="text-[10px] uppercase font-semibold mb-1" style={{ color:'#B8860B' }}>Special request</p>
              <p className="text-sm italic" style={{ color:'#5C4B47' }}>{sub.custom_request}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5" style={{ border:'0.5px solid #e0d9d0' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-sm" style={{ color:'#800020' }}>Internal Notes</p>
            <button onClick={() => setAddingNote(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor:'#F9F6EE', color:'#800020' }}>+ Add note</button>
          </div>
          {addingNote && (
            <div className="mb-4">
              <textarea rows={3} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Write a note…" className="w-full p-3 rounded-xl text-sm border" style={{ border:'1px solid rgba(128,0,32,0.2)', resize:'none' }} />
              <div className="flex gap-2 mt-2">
                <button onClick={saveNote} disabled={saving} className="px-4 py-2 text-xs font-semibold text-white rounded-lg" style={{ backgroundColor:'#800020' }}>{saving?'Saving…':'Save note'}</button>
                <button onClick={() => setAddingNote(false)} className="px-4 py-2 text-xs font-semibold rounded-lg" style={{ color:'#9C7B6B', border:'1px solid #e0d9d0' }}>Cancel</button>
              </div>
            </div>
          )}
          {(sub.internal_notes || []).length === 0 && !addingNote && <p className="text-sm" style={{ color:'#9C7B6B' }}>No notes yet.</p>}
          <div className="space-y-3">
            {(sub.internal_notes || []).slice().reverse().map(n => (
              <div key={n.id} className="p-3 rounded-xl" style={{ backgroundColor:'#F9F6EE' }}>
                <p className="text-sm" style={{ color:'#2D2422' }}>{n.text}</p>
                <p className="text-[10px] mt-1.5" style={{ color:'#9C7B6B' }}>{n.admin_name} · {new Date(n.created_at).toLocaleString('en-GB')}</p>
              </div>
            ))}
          </div>
        </div>

        {(sub.audit_trail || []).length > 0 && (
          <div className="bg-white rounded-xl p-5" style={{ border:'0.5px solid #e0d9d0' }}>
            <p className="font-semibold text-sm mb-4" style={{ color:'#800020' }}>Audit Trail</p>
            <div className="space-y-2">
              {(sub.audit_trail || []).slice().reverse().slice(0,10).map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-xs" style={{ color:'#5C4B47' }}>
                  <span style={{ color:'#9C7B6B', minWidth:120 }}>{new Date(a.timestamp).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'})}</span>
                  <span><strong>{a.admin_name}</strong> updated <em>{a.field}</em>{a.reason ? ` (${a.reason})` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Menu Planner ──────────────────────────────────────── */
function MenuItemAutocomplete({ value, suggestions, onChange, onRemove, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const filtered = value.trim().length > 0
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative mb-1">
      <div className="flex items-center gap-0.5">
        <input
          type="text" value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 text-[11px] px-2 py-1 rounded border-0 focus:outline-none focus:ring-1 focus:ring-[#800020]"
          style={{ backgroundColor: 'rgba(255,255,255,0.8)', fontSize: 11 }}
        />
        <button onClick={onRemove} className="text-gray-300 hover:text-red-400 px-0.5">
          <X size={11} />
        </button>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-0.5 rounded-lg overflow-hidden shadow-lg"
          style={{ backgroundColor: 'white', border: '1px solid #e0d9d0', maxHeight: 180, overflowY: 'auto' }}>
          {filtered.map(s => (
            <button key={s} onMouseDown={() => { onChange(s); setOpen(false); }}
              className="block w-full text-left px-3 py-1.5 text-xs hover:bg-[#800020]/8 transition-colors"
              style={{ color: '#2D2422' }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DabbaMenuPlanner() {
  const today = new Date();
  const getMonday = (d) => { const date = new Date(d); const diff = date.getDay()===0?-6:1-date.getDay(); date.setDate(date.getDate()+diff); return date; };
  const thisMonday = getMonday(today);
  const nextMonday = new Date(thisMonday); nextMonday.setDate(nextMonday.getDate()+7);
  const weekAfterMonday = new Date(nextMonday); weekAfterMonday.setDate(weekAfterMonday.getDate()+7);

  const [selectedWeek, setSelectedWeek] = useState(1);
  const [cells, setCells] = useState({});
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);

  const weekMondayDate = selectedWeek === 1 ? nextMonday : weekAfterMonday;
  const weekDates = Array.from({length:5}, (_,i) => { const d = new Date(weekMondayDate); d.setDate(d.getDate()+i); return d.toISOString().split('T')[0]; });
  const DAY_LABELS = ['MON','TUE','WED','THU','FRI'];

  useEffect(() => {
    api.get('/menu').then(res => {
      setMenuItems((res.data || []).map(m => m.name).filter(Boolean));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const monday = weekMondayDate.toISOString().split('T')[0];
    Promise.all(
      BOX_ROWS.map(b => api.get(`/menu/weekly-preview?week=${monday}&box_type=${b}`))
    ).then(([p, s]) => {
      const newCells = {};
      Object.entries(p.data.days || {}).forEach(([date, day]) => {
        newCells[`${date}_prasada`] = { items: day.items || [], status: day.status || 'empty' };
      });
      Object.entries(s.data.days || {}).forEach(([date, day]) => {
        newCells[`${date}_svadista`] = { items: day.items || [], status: day.status || 'empty' };
      });
      setCells(newCells);
    }).catch(() => {});
  }, [selectedWeek, weekMondayDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateItem = (date, box, itemIdx, value) => {
    setCells(prev => {
      const key = `${date}_${box}`;
      const cell = prev[key] || { items: [], status: 'empty' };
      const items = [...(cell.items || [])];
      items[itemIdx] = value;
      return { ...prev, [key]: { ...cell, items, status: cell.status === 'published' ? 'published' : 'draft' } };
    });
  };

  const addItem = (date, box) => {
    setCells(prev => {
      const key = `${date}_${box}`;
      const cell = prev[key] || { items: [], status: 'empty' };
      return { ...prev, [key]: { ...cell, items: [...(cell.items || []), ''], status: cell.status === 'published' ? 'published' : 'draft' } };
    });
  };

  const removeItem = (date, box, itemIdx) => {
    setCells(prev => {
      const key = `${date}_${box}`;
      const cell = prev[key] || { items: [], status: 'empty' };
      const items = (cell.items || []).filter((_, i) => i !== itemIdx);
      return { ...prev, [key]: { ...cell, items, status: cell.status === 'published' ? 'published' : 'draft' } };
    });
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      await Promise.all(
        weekDates.flatMap(date => BOX_ROWS.map(box => {
          const c = cells[`${date}_${box}`];
          const items = (c?.items || []).filter(i => i.trim());
          if (!items.length) return null;
          return api.post('/admin/menu', { date, box_type: box, items, status: c.status === 'published' ? 'published' : 'draft' });
        }).filter(Boolean))
      );
      setLastSaved(new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}));
    } catch {} finally { setSaving(false); }
  };

  const publishWeek = async () => {
    setPublishing(true);
    try {
      await saveDraft();
      const monday = weekMondayDate.toISOString().split('T')[0];
      await api.post('/admin/menu/publish', { week_start: monday });
      setCells(prev => {
        const next = { ...prev };
        weekDates.forEach(date => BOX_ROWS.forEach(box => { if (next[`${date}_${box}`]) next[`${date}_${box}`] = { ...next[`${date}_${box}`], status:'published' }; }));
        return next;
      });
      setShowPublishModal(false);
    } catch {} finally { setPublishing(false); }
  };

  const weekLabel = (m) => { const fri = new Date(m); fri.setDate(fri.getDate()+4); return `${m.toLocaleDateString('en-GB',{day:'numeric',month:'short'})} – ${fri.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}`; };

  return (
    <div>
      <div className="flex gap-3 mb-5">
        {[1,2].map(w => {
          const m = w===1?nextMonday:weekAfterMonday;
          return (
            <button key={w} onClick={() => setSelectedWeek(w)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ backgroundColor:selectedWeek===w?'#800020':'white', color:selectedWeek===w?'white':'#5C4B47', border:selectedWeek===w?'none':'0.5px solid #e0d9d0' }}>
              {w===1?'Next week':'The week after'} · {weekLabel(m)}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-3">
          {lastSaved && <p className="text-xs" style={{ color:'#9C7B6B' }}>Last saved {lastSaved}</p>}
          <button onClick={saveDraft} disabled={saving} className="px-4 py-2 text-xs font-semibold rounded-lg" style={{ backgroundColor:'#F9F6EE', color:'#800020' }}>{saving?'Saving…':'Save as draft'}</button>
          <button onClick={() => setShowPublishModal(true)} className="px-4 py-2 text-xs font-semibold text-white rounded-lg" style={{ backgroundColor:'#800020' }}>Publish this week</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth:700 }}>
          <thead>
            <tr>
              <th className="p-3 text-left text-xs font-semibold w-24" style={{ color:'#9C7B6B' }}>Box</th>
              {weekDates.map((d, i) => (
                <th key={d} className="p-3 text-center text-xs font-semibold" style={{ color:'#9C7B6B' }}>
                  {DAY_LABELS[i]}<br/><span className="font-normal">{new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BOX_ROWS.map(box => (
              <tr key={box}>
                <td className="p-3 align-top">
                  <span className="text-xs font-semibold capitalize px-2 py-1 rounded-full" style={{ backgroundColor:BOX_BADGE[box]?.bg, color:BOX_BADGE[box]?.color }}>{box}</span>
                </td>
                {weekDates.map(date => {
                  const c = cells[`${date}_${box}`] || { items: [], status: 'empty' };
                  const items = c.items || [];
                  const isEmpty = items.filter(i => i.trim()).length === 0;
                  const isPublished = c.status === 'published';
                  return (
                    <td key={date} className="p-2 align-top" style={{ backgroundColor:isEmpty?'#FEF2F2':isPublished?'white':'#FFFBEB', border:'1px solid #e0d9d0', minWidth:140 }}>
                      {isPublished && <div className="flex justify-end mb-1"><CheckCircle size={12} style={{ color:'#4A7C59' }} /></div>}
                      {isEmpty && <p className="text-[10px] text-center italic mb-1" style={{ color:'#DC2626' }}>Add menu</p>}
                      {items.map((item, fi) => (
                        <MenuItemAutocomplete
                          key={fi} value={item} suggestions={menuItems}
                          onChange={v => updateItem(date, box, fi, v)}
                          onRemove={() => removeItem(date, box, fi)}
                          placeholder={fi === 0 ? 'e.g. Sambar rice' : 'e.g. Beans poriyal'}
                        />
                      ))}
                      <button onClick={() => addItem(date, box)}
                        className="mt-1 w-full text-[10px] py-0.5 rounded border border-dashed transition-colors hover:bg-[#800020]/5"
                        style={{ borderColor: '#800020', color: '#800020' }}>
                        + add item
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5">
        <label className="text-sm font-semibold block mb-2" style={{ color:'#2D2422' }}>This week's kitchen notes (visible to subscribers)</label>
        <textarea rows={3} value={dietaryNotes} onChange={e => setDietaryNotes(e.target.value)}
          placeholder="e.g. This week's Prasada box contains mustard seeds."
          className="w-full p-3 rounded-xl text-sm border" style={{ border:'0.5px solid #e0d9d0', resize:'none' }} />
        <button onClick={async () => { await api.post('/admin/menu/notes', { week_start: weekMondayDate.toISOString().split('T')[0], notes: dietaryNotes }); }} className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg" style={{ backgroundColor:'#F9F6EE', color:'#800020' }}>Save notes</button>
      </div>

      <div className="mt-5 p-4 rounded-xl" style={{ backgroundColor:'#F9F6EE', border:'0.5px solid #e0d9d0' }}>
        <p className="text-xs" style={{ color:'#9C7B6B' }}>
          <strong>Mixed Box</strong> is automatically constructed: Mon, Wed, Fri use Prasada menu. Tue, Thu use Svadista menu.
        </p>
      </div>

      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-3" style={{ fontFamily:"'Playfair Display', serif", color:'#800020' }}>Publish this week?</h3>
            <p className="text-sm mb-4" style={{ color:'#5C4B47' }}>Subscribers will immediately see the menus for all filled cells.</p>
            <div className="flex gap-3">
              <button onClick={publishWeek} disabled={publishing} className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor:'#800020' }}>{publishing?'Publishing…':'Publish'}</button>
              <button onClick={() => setShowPublishModal(false)} className="flex-1 py-2.5 text-sm font-semibold rounded-lg border" style={{ color:'#9C7B6B', borderColor:'#e0d9d0' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Delivery Sheet ────────────────────────────────────── */
function DabbaDeliverySheet() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dabba-wala/deliveries/today');
      setDeliveries(res.data);
      setGenerated(true);
    } catch {} finally { setLoading(false); }
  };

  const toggleDelivered = async (deliveryId, current) => {
    const newStatus = current === 'delivered' ? 'confirmed' : 'delivered';
    try {
      await api.patch(`/admin/dabba-wala/deliveries/${deliveryId}/status`, { status: newStatus });
      setDeliveries(prev => prev.map(d => d.delivery_id === deliveryId ? { ...d, status: newStatus } : d));
    } catch {}
  };

  const copyForWhatsApp = () => {
    const lines = [`Dabba Wala Deliveries — ${new Date(date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}`, `Total: ${deliveries.length} deliveries`, ''];
    deliveries.forEach((d, i) => {
      const prefs = d.preferences?.length ? d.preferences.join(', ').toUpperCase() : 'Standard';
      const addr = d.address ? `${d.address.line1}, ${d.address.city} ${d.address.postcode}` : '—';
      lines.push(`${i+1}. ${d.full_name} — ${BOX_BADGE[d.box_type]?.label||d.box_type} — ${prefs} — ${addr}`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-4 py-2 rounded-xl text-sm border" style={{ border:'0.5px solid #e0d9d0' }} />
        <button onClick={generate} disabled={loading} className="px-5 py-2 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor:'#800020' }}>
          {loading ? 'Loading…' : 'Generate sheet'}
        </button>
        {generated && (
          <>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg" style={{ backgroundColor:'#F9F6EE', color:'#800020' }}><Printer size={14} /> Print PDF</button>
            <button onClick={copyForWhatsApp} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg" style={{ backgroundColor:'#F9F6EE', color:'#800020' }}><Copy size={14} /> Copy for WhatsApp</button>
          </>
        )}
      </div>

      {generated && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border:'0.5px solid #e0d9d0' }}>
          <div className="p-4 border-b" style={{ borderColor:'rgba(128,0,32,0.08)', backgroundColor:'#F9F6EE' }}>
            <p className="font-bold" style={{ color:'#800020' }}>Dabba Wala Deliveries — {new Date(date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</p>
            <p className="text-sm" style={{ color:'#9C7B6B' }}>Total: {deliveries.length} · Prasada: {deliveries.filter(d=>d.box_type==='prasada').length} · Svadista: {deliveries.filter(d=>d.box_type==='svadista').length}</p>
          </div>
          {deliveries.length === 0 && <p className="text-sm text-center py-8" style={{ color:'#9C7B6B' }}>No deliveries for this date.</p>}
          <div className="divide-y" style={{ borderColor:'rgba(128,0,32,0.06)' }}>
            {deliveries.map((d, i) => {
              const bm = BOX_BADGE[d.box_type] || BOX_BADGE.prasada;
              const prefs = d.preferences?.length ? d.preferences.join(', ').toUpperCase() : 'Standard';
              const addr = d.address ? `${d.address.line1}${d.address.line2?', '+d.address.line2:''}, ${d.address.city} ${d.address.postcode}` : '—';
              return (
                <div key={d.delivery_id} className="p-4 flex items-start gap-4">
                  <span className="w-6 shrink-0 text-xs font-bold pt-0.5" style={{ color:'#9C7B6B' }}>{i+1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold" style={{ color:'#2D2422' }}>{d.full_name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor:bm.bg, color:bm.color }}>{bm.label}</span>
                    </div>
                    <p className="text-xs mb-0.5" style={{ color:'#800020', fontWeight:500 }}>{prefs}</p>
                    <p className="text-xs" style={{ color:'#5C4B47' }}>{addr}</p>
                    {d.delivery_instruction && d.delivery_instruction !== 'door' && <p className="text-xs mt-0.5" style={{ color:'#B8860B' }}>Note: {d.delivery_instruction}{d.neighbour_name ? ` — ${d.neighbour_name}, ${d.neighbour_door}` : ''}{d.safe_place_description ? ` — ${d.safe_place_description}` : ''}</p>}
                    {d.custom_request && <p className="text-xs mt-0.5 italic" style={{ color:'#9C7B6B' }}>"{d.custom_request}"</p>}
                  </div>
                  <input type="checkbox" checked={d.status==='delivered'} onChange={() => toggleDelivered(d.delivery_id, d.status)} className="mt-1 w-4 h-4 accent-[#4A7C59] cursor-pointer" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Analytics ─────────────────────────────────────────── */
function DabbaAnalytics() {
  const [summary, setSummary] = useState(null);
  const [churn, setChurn]     = useState([]);
  const [ending, setEnding]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dabba-wala/analytics/summary'),
      api.get('/admin/dabba-wala/analytics/churn'),
      api.get('/admin/dabba-wala/analytics/ending-soon'),
    ]).then(([s, c, e]) => { setSummary(s.data); setChurn(c.data); setEnding(e.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><RefreshCw size={20} className="animate-spin" style={{ color:'#800020' }} /></div>;

  const cards = summary ? [
    { label:'Active subscribers', value:summary.active_subscribers, color:'#4A7C59' },
    { label:'Monthly revenue', value:`£${summary.monthly_revenue}`, color:'#800020' },
    { label:'Meals this month', value:summary.meals_this_month, color:'#B8860B' },
    { label:'Churn rate', value:`${summary.churn_rate}%`, color:'#DC2626' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl p-5" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <p className="text-2xl font-bold" style={{ color:c.color }}>{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {ending.length > 0 && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border:'0.5px solid #e0d9d0' }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor:'rgba(128,0,32,0.08)' }}>
            <p className="font-semibold text-sm" style={{ color:'#800020' }}>Ending within 30 days ({ending.length})</p>
          </div>
          <table className="w-full text-sm">
            <thead><tr style={{ backgroundColor:'#F9F6EE' }}>
              {['Name','Plan','End date','Days remaining','Action'].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color:'#9C7B6B' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {ending.map(s => {
                const days = Math.ceil((new Date(s.end_date+'T23:59:59')-new Date())/(1000*60*60*24));
                return (
                  <tr key={s.id} className="border-b" style={{ borderColor:'rgba(128,0,32,0.06)' }}>
                    <td className="px-4 py-3">{s.customer_name}</td>
                    <td className="px-4 py-3 capitalize">{s.plan}</td>
                    <td className="px-4 py-3">{new Date(s.end_date+'T12:00:00').toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3"><span style={{ color:days<=3?'#DC2626':'#B8860B', fontWeight:500 }}>{days}d</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => api.post(`/admin/subscriptions/${s.id}/send-renewal-reminder`)} className="px-3 py-1 text-xs font-semibold rounded-lg" style={{ backgroundColor:'#F9F6EE', color:'#800020' }}>Send reminder</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {churn.length > 0 && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border:'0.5px solid #e0d9d0' }}>
          <div className="p-4 border-b" style={{ borderColor:'rgba(128,0,32,0.08)' }}>
            <p className="font-semibold text-sm" style={{ color:'#800020' }}>Cancelled in last 30 days ({churn.length})</p>
          </div>
          <table className="w-full text-sm">
            <thead><tr style={{ backgroundColor:'#F9F6EE' }}>
              {['Name','Plan','Box','Subscribed','Cancelled'].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color:'#9C7B6B' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {churn.map(s => (
                <tr key={s.id} className="border-b" style={{ borderColor:'rgba(128,0,32,0.06)' }}>
                  <td className="px-4 py-3">{s.customer_name}</td>
                  <td className="px-4 py-3 capitalize">{s.plan}</td>
                  <td className="px-4 py-3 capitalize">{s.box_type}</td>
                  <td className="px-4 py-3">{fmtDate(s.created_at)}</td>
                  <td className="px-4 py-3">{fmtDate(s.updated_at||s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {churn.length === 0 && ending.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color:'#9C7B6B' }}>No churn data yet.</p>
      )}
    </div>
  );
}

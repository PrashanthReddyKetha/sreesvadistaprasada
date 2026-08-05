'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '@/api';
import { Plus, Edit2, Trash2, Eye, EyeOff, RefreshCw, X, Search } from 'lucide-react';
import { buildItemUrl } from '@/lib/itemUrl';

const BLANK = {
  title: '',
  subtitle: '',
  price: '',
  image: '',
  link: '',
  active: true,
  display_order: 0,
};

const DailySpecialsTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  // Menu search
  const [menuQuery, setMenuQuery] = useState('');
  const [menuResults, setMenuResults] = useState([]);
  const [menuSearching, setMenuSearching] = useState(false);
  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/daily-specials/all');
      setItems(r.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...BLANK, display_order: items.length + 1 });
    setShowForm(true);
  };

  const openEdit = (it) => {
    setEditing(it);
    setForm({
      title: it.title || '',
      subtitle: it.subtitle || '',
      price: it.price ?? '',
      image: it.image || '',
      link: it.link || '',
      active: it.active !== false,
      display_order: it.display_order ?? 0,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(BLANK);
    setMenuQuery('');
    setMenuResults([]);
  };

  // Debounced menu search
  useEffect(() => {
    if (!menuQuery.trim()) { setMenuResults([]); return; }
    clearTimeout(searchTimer.current);
    setMenuSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await api.get(`/menu?available=true&search=${encodeURIComponent(menuQuery)}`);
        setMenuResults((r.data || []).slice(0, 8));
      } catch {
        setMenuResults([]);
      } finally {
        setMenuSearching(false);
      }
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [menuQuery]);

  const pickMenuItem = (item) => {
    setForm(f => ({
      ...f,
      title: item.name,
      subtitle: item.description ? item.description.slice(0, 100) : '',
      price: item.price != null ? String(item.price) : f.price,
      image: item.image || f.image,
      link: buildItemUrl(item),
    }));
    setMenuQuery('');
    setMenuResults([]);
  };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        price: form.price === '' ? null : parseFloat(form.price),
        image: form.image.trim() || null,
        link: form.link.trim() || null,
        active: !!form.active,
        display_order: parseInt(form.display_order, 10) || 0,
      };
      if (editing) {
        await api.put(`/daily-specials/${editing.id}`, payload);
      } else {
        await api.post('/daily-specials', payload);
      }
      await load();
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (it) => {
    await api.put(`/daily-specials/${it.id}`, { active: !it.active });
    await load();
  };

  const remove = async (it) => {
    if (!window.confirm(`Delete "${it.title}"?`)) return;
    await api.delete(`/daily-specials/${it.id}`);
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Today's Specials</h2>
          <p className="text-sm text-gray-500 mt-1">Manage the rotating daily highlights shown on the home page.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg" style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: '#800020' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg text-white" style={{ backgroundColor: '#800020' }}>
            <Plus size={14} /> Add Special
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin" style={{ color: '#800020' }} />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-dashed" style={{ borderColor: 'rgba(128,0,32,0.2)' }}>
          <p className="text-sm text-gray-500 mb-4">No daily specials yet.</p>
          <button onClick={openNew} className="px-4 py-2 text-xs font-semibold rounded-lg text-white" style={{ backgroundColor: '#800020' }}>
            Add Your First Special
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <div key={it.id} className="bg-white rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
              <div className="relative h-32 bg-gray-100">
                {it.image && <img src={it.image} alt={it.title} className="w-full h-full object-cover" />}
                <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase" style={{ backgroundColor: it.active ? '#4A7C59' : '#9CA3AF', color: 'white' }}>
                  {it.active ? 'Live' : 'Hidden'}
                </span>
                <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-sm" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}>
                  #{it.display_order}
                </span>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold mb-0.5 line-clamp-1" style={{ color: '#2D2422' }}>{it.title}</h3>
                {it.subtitle && <p className="text-xs text-gray-500 line-clamp-1">{it.subtitle}</p>}
                {typeof it.price === 'number' && <p className="text-sm font-bold mt-1" style={{ color: '#800020' }}>£{it.price.toFixed(2)}</p>}
                <div className="flex items-center gap-1 mt-3">
                  <button onClick={() => openEdit(it)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg" style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: '#800020' }}>
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => toggleActive(it)} className="flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg" style={{ backgroundColor: '#F4F1EC', color: '#5C4B47' }}>
                    {it.active ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                  <button onClick={() => remove(it)} className="flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg" style={{ backgroundColor: '#FFF0F0', color: '#B91C1C' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
              <h3 className="text-lg font-bold" style={{ color: '#800020', fontFamily: "'Playfair Display', serif" }}>
                {editing ? 'Edit Special' : 'Add Special'}
              </h3>
              <button onClick={closeForm} aria-label="Close form" className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* ── Menu item search picker ── */}
              <div>
                <span className="block text-xs font-semibold mb-1" style={{ color: '#5C4B47' }}>
                  Search Menu to Auto-fill
                </span>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Type a dish name…"
                    value={menuQuery}
                    onChange={e => setMenuQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
                    style={{ borderColor: 'rgba(128,0,32,0.2)' }}
                  />
                  {menuSearching && (
                    <RefreshCw size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                  )}
                </div>
                {menuResults.length > 0 && (
                  <div className="mt-1 border rounded-lg overflow-hidden shadow-sm" style={{ borderColor: 'rgba(128,0,32,0.15)' }}>
                    {menuResults.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => pickMenuItem(item)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-amber-50 border-b last:border-0 transition-colors"
                        style={{ borderColor: 'rgba(128,0,32,0.08)' }}
                      >
                        {item.image && (
                          <img src={item.image} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate" style={{ color: '#2D2422' }}>{item.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{item.category}</p>
                        </div>
                        {item.price != null && (
                          <span className="text-xs font-bold flex-shrink-0" style={{ color: '#800020' }}>£{Number(item.price).toFixed(2)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
                <p className="text-[11px] font-medium mb-3 uppercase tracking-wider" style={{ color: '#8B6914' }}>
                  Details {form.title ? `— ${form.title}` : '(manual entry or auto-filled above)'}
                </p>
              </div>

              <Field label="Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <Field label="Subtitle / Note" value={form.subtitle} onChange={(v) => setForm({ ...form, subtitle: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (£)" type="number" step="0.01" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
                <Field label="Display Order" type="number" value={form.display_order} onChange={(v) => setForm({ ...form, display_order: v })} />
              </div>
              <Field label="Image URL" value={form.image} onChange={(v) => setForm({ ...form, image: v })} />
              {form.image && (
                <img src={form.image} alt="preview" className="w-full h-28 object-cover rounded-lg" />
              )}
              <Field label="Link (auto-set from menu, or e.g. /breakfast)" value={form.link} onChange={(v) => setForm({ ...form, link: v })} />
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer" style={{ color: '#5C4B47' }}>
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Show on home page (Live)
              </label>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
              <button onClick={closeForm} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ backgroundColor: '#F4F1EC', color: '#5C4B47' }}>Cancel</button>
              <button onClick={save} disabled={saving || !form.title.trim()} className="px-5 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50" style={{ backgroundColor: '#800020' }}>
                {saving ? 'Saving…' : (editing ? 'Save Changes' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'text', step }) => (
  <label className="block">
    <span className="block text-xs font-semibold mb-1" style={{ color: '#5C4B47' }}>{label}</span>
    <input
      type={type}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
      style={{ borderColor: 'rgba(128,0,32,0.2)' }}
    />
  </label>
);

export default DailySpecialsTab;

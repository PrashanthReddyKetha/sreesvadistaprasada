import React, { useState, useCallback, useEffect } from 'react';
import { Plus, X, Save, RefreshCw, Utensils, Leaf, Flame, Edit2, Trash2 } from 'lucide-react';
import api from '../../api';

const CATEGORIES = ['nonVeg','veg','prasada','breakfast','pickles','podis'];
const CAT_LABELS  = { nonVeg:'Non-Veg', veg:'Veg', prasada:'Prasada', breakfast:'Breakfast', pickles:'Pickles', podis:'Podis' };
const BLANK_ITEM  = { name:'', description:'', price:'', category:'nonVeg', subcategory:'', spice_level:0, is_veg:false, available:true, featured:false, image:'', tag:'', allergens:[], faqs:[], pairs_with:[] };
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

export default function MenuTab() {
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
  const [selected, setSelected]   = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

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
      name: item.name, description: item.description, price: item.price,
      category: item.category, subcategory: item.subcategory || '',
      spice_level: item.spice_level, is_veg: item.is_veg, available: item.available,
      featured: item.featured, image: item.image || '', tag: item.tag || '',
      allergens: item.allergens || [], faqs: item.faqs || [], pairs_with: item.pairs_with || [],
    });
  };

  const aiEnhance = async (form, setForm) => {
    setAiLoading(true); setMsg('');
    try {
      const res = await api.post('/menu/ai/enhance', {
        name: form.name, category: form.category, is_veg: form.is_veg, spice_level: form.spice_level,
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
      await api.put(`/menu/${id}`, { ...editForm, price: parseFloat(editForm.price), spice_level: parseInt(editForm.spice_level) });
      setMsg('Saved!'); setEditingId(null); await load();
      setTimeout(() => setMsg(''), 2000);
    } catch { setMsg('Save failed.'); }
    finally { setSaving(false); }
  };

  const toggleAvail = async (item) => {
    await api.put(`/menu/${item.id}`, { available: !item.available });
    await load();
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Permanently delete "${item.name}"? This cannot be undone.`)) return;
    await api.delete(`/menu/${item.id}`);
    setSelected(s => { const n = new Set(s); n.delete(item.id); return n; });
    await load();
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    const names = [...selected].map(id => items.find(i => i.id === id)?.name).filter(Boolean);
    if (!window.confirm(`Permanently delete ${selected.size} item${selected.size > 1 ? 's' : ''}?\n\n${names.join('\n')}\n\nThis cannot be undone.`)) return;
    setBulkDeleting(true);
    await Promise.all([...selected].map(id => api.delete(`/menu/${id}`).catch(() => {})));
    setSelected(new Set());
    await load();
    setBulkDeleting(false);
  };

  const toggleSelect = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allFilteredSelected = filtered => filtered.length > 0 && filtered.every(i => selected.has(i.id));
  const toggleSelectAll = (filtered) => {
    if (allFilteredSelected(filtered)) {
      setSelected(s => { const n = new Set(s); filtered.forEach(i => n.delete(i.id)); return n; });
    } else {
      setSelected(s => { const n = new Set(s); filtered.forEach(i => n.add(i.id)); return n; });
    }
  };

  const addItem = async () => {
    if (!addForm.name || !addForm.description || !addForm.price) { setMsg('Name, description and price are required.'); return; }
    setAddSaving(true);
    try {
      await api.post('/menu', { ...addForm, price: parseFloat(addForm.price), spice_level: parseInt(addForm.spice_level) });
      setMsg('Item added!'); setAdding(false); setAddForm(BLANK_ITEM); await load();
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…"
              className="pl-8 pr-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-[#800020]/30"
              style={{ borderColor:'rgba(128,0,32,0.25)', width:'180px', color:'#3D2B1F' }} />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>}
          </div>
          <button onClick={()=>{ setAdding(true); setEditingId(null); setSearch(''); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white whitespace-nowrap"
            style={{ backgroundColor:'#800020' }}>
            <Plus size={15} /> Add New Item
          </button>
        </div>
      </div>
      {search && <p className="text-xs" style={{ color:'#9C7B6B' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''} for "<strong>{search}</strong>"</p>}

      {/* Bulk action bar */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox"
              checked={allFilteredSelected(filtered)}
              onChange={() => toggleSelectAll(filtered)}
              className="w-4 h-4 accent-[#800020]" />
            <span className="text-xs text-gray-500">
              {allFilteredSelected(filtered) ? 'Deselect all' : `Select all (${filtered.length})`}
            </span>
          </label>
          {selected.size > 0 && (
            <button onClick={deleteSelected} disabled={bulkDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60 transition-all"
              style={{ backgroundColor: '#991B1B' }}>
              <Trash2 size={12} /> {bulkDeleting ? 'Deleting…' : `Delete selected (${selected.size})`}
            </button>
          )}
        </div>
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
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Allergens <span className="normal-case font-normal">(click to select)</span></label>
            <AllergenPicker value={addForm.allergens||[]} onChange={v=>setAddForm(p=>({...p,allergens:v}))} />
          </div>
          <div className="flex gap-6 flex-wrap">
            {[['is_veg','Vegetarian'],['available','Available on site'],['featured','Featured on homepage']].map(([key,label])=>(
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={addForm[key]} onChange={e=>setAddForm(p=>({...p,[key]:e.target.checked}))} className="w-4 h-4 accent-[#800020]" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Pairs Well With</label>
            <PairsWithPicker value={addForm.pairs_with||[]} onChange={v=>setAddForm(p=>({...p,pairs_with:v}))} allItems={items} currentId={null} />
          </div>
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
            <button onClick={()=>{ setAdding(false); setMsg(''); }} className="px-4 py-2 rounded-lg text-sm border font-semibold" style={{ borderColor:'#d1d5db', color:'#5C4B47' }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {filtered.map(item=>(
          <div key={item.id} className="bg-white rounded-xl overflow-hidden" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.06)', opacity: item.available?1:0.6 }}>
            {editingId === item.id ? (
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
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Allergens</label>
                  <AllergenPicker value={editForm.allergens||[]} onChange={v=>setEditForm(p=>({...p,allergens:v}))} />
                </div>
                <div className="flex gap-6 flex-wrap">
                  {[['is_veg','Vegetarian'],['available','Available'],['featured','Featured']].map(([key,label])=>(
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editForm[key]} onChange={e=>setEditForm(p=>({...p,[key]:e.target.checked}))} className="w-4 h-4 accent-[#800020]" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Pairs Well With <span className="normal-case font-normal">(shown on item page)</span></label>
                  <PairsWithPicker value={editForm.pairs_with||[]} onChange={v=>setEditForm(p=>({...p,pairs_with:v}))} allItems={items} currentId={item.id} />
                </div>
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
                  <button onClick={()=>setEditingId(null)} className="px-4 py-2 rounded-lg text-sm border font-semibold" style={{ borderColor:'#d1d5db', color:'#5C4B47' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4">
                <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)}
                  className="w-4 h-4 accent-[#800020] flex-shrink-0 cursor-pointer" />
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
                  <button onClick={()=>deleteItem(item)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

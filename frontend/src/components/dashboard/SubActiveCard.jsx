import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, ChevronDown, Leaf, Flame } from 'lucide-react';
import api from '../../api';

export const BOX_META = {
  prasada:  { icon: Leaf,  color: '#4A7C59', label: 'Prasada Box' },
  svadista: { icon: Flame, color: '#8B3A3A', label: 'Svadista Box' },
};

export function daysUntil(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(iso + 'T23:59:59') - new Date()) / (1000 * 60 * 60 * 24));
}

export function DishCards({ items }) {
  return (
    <div className="flex items-start overflow-x-auto gap-0 pb-1" style={{ scrollbarWidth: 'none' }}>
      {(items || []).map((item, i) => {
        const name = typeof item === 'string' ? item : item.name;
        const img  = typeof item === 'object' ? item.image : null;
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <div className="flex items-center self-stretch px-1 shrink-0"
                style={{ color: '#d1c4b8', fontSize: 14, paddingTop: 24 }}>+</div>
            )}
            <div className="flex flex-col items-center shrink-0" style={{ width: 72 }}>
              <div className="overflow-hidden mb-1"
                style={{ width: 64, height: 64, borderRadius: 10, border: '1px solid #e0d9d0' }}>
                {img ? (
                  <img src={img} alt={name} className="w-full h-full object-cover" loading="lazy"
                    onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                ) : null}
                <div className="w-full h-full items-center justify-center text-lg"
                  style={{ display: img ? 'none' : 'flex', backgroundColor: '#F9F6EE' }}>🍛</div>
              </div>
              <p className="text-center leading-tight" style={{ fontSize: 9, color: '#5C4B47', width: 64, wordBreak: 'break-word' }}>{name}</p>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function SubActiveCard({ sub }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [weekMenu, setWeekMenu]       = useState(null);
  const [menuLoading, setMenuLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const boxMeta = BOX_META[sub.box_type] || BOX_META.prasada;
  const addr = sub.delivery_address;
  const daysLeft = daysUntil(sub.end_date);

  const thisWeekMonday = useMemo(() => {
    const d = new Date();
    const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
    d.setDate(d.getDate() + diff);
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }, []);

  useEffect(() => {
    if (!sub.box_type) return;
    setMenuLoading(true);
    api.get(`/menu/weekly-preview?week=${thisWeekMonday}&box_type=${sub.box_type}`)
      .then(r => setWeekMenu(r.data))
      .catch(() => {})
      .finally(() => setMenuLoading(false));
  }, [sub.box_type, thisWeekMonday]);

  const savingsInfo = useMemo(() => {
    if (!weekMenu) return null;
    const days = Object.values(weekMenu.days || {}).filter(d => !d.is_placeholder && d.items?.length);
    const totalRetail = days.reduce((s, d) =>
      s + (d.items||[]).reduce((a, it) => a + (typeof it==='object' && it.price ? it.price : 0), 0), 0);
    const mealsWithPrices = days.filter(d => (d.items||[]).some(it => typeof it==='object' && it.price));
    if (!mealsWithPrices.length) return null;
    const perMealPlan = sub.plan === 'monthly' ? 8 : 9;
    const avgRetail = totalRetail / mealsWithPrices.length;
    const weekSaving = (avgRetail - perMealPlan) * mealsWithPrices.length;
    if (weekSaving < 1) return null;
    return { perMeal: (avgRetail - perMealPlan).toFixed(0), week: weekSaving.toFixed(0) };
  }, [weekMenu, sub.plan]);

  let heroBg = '#800020', heroText = 'Next delivery coming up', heroSub = '';
  if (daysLeft !== null && daysLeft <= 0) {
    heroBg = '#B8860B'; heroText = 'This week is confirmed ✅'; heroSub = 'Your meals are being prepared.';
  } else if (daysLeft === 1) {
    heroBg = '#4A7C59'; heroText = 'Your delivery is tomorrow 🍱'; heroSub = 'Lunch · arriving 12–2pm';
  } else if (sub.start_date === today) {
    heroBg = '#F4C430'; heroText = 'Your delivery is on its way today'; heroSub = 'Arriving between 12pm and 2pm';
  } else {
    heroText = `Next delivery: ${sub.start_date ? new Date(sub.start_date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'}) : '—'}`;
    heroSub = daysLeft !== null ? `${daysLeft} days away` : '';
  }

  const WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ backgroundColor: heroBg }}>
        <p className="text-lg font-bold mb-1"
          style={{ color: heroBg === '#F4C430' ? '#2D2422' : 'white', fontFamily: "'Playfair Display', serif" }}>{heroText}</p>
        {heroSub && <p className="text-sm" style={{ color: heroBg === '#F4C430' ? 'rgba(45,36,34,0.7)' : 'rgba(255,255,255,0.8)' }}>{heroSub}</p>}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(244,196,48,0.2)', backgroundColor: '#FDFBF7' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '0.5px solid rgba(244,196,48,0.15)' }}>
          <p className="font-semibold text-sm" style={{ color: '#800020' }}>This week's meals</p>
          {savingsInfo && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ backgroundColor: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}>
              💰 Save ~£{savingsInfo.perMeal}/meal · £{savingsInfo.week} this week
            </span>
          )}
        </div>
        {menuLoading ? (
          <div className="px-5 py-6 flex justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#800020', borderTopColor: 'transparent' }} />
          </div>
        ) : weekMenu ? (
          <div className="divide-y" style={{ borderColor: 'rgba(244,196,48,0.1)' }}>
            {Object.entries(weekMenu.days || {}).map(([date, day], idx) => {
              const isPast = new Date(date + 'T23:59:59') < new Date();
              const items = day.items || [];
              const isToday = date === today;
              return (
                <div key={date} className="px-4 py-3" style={{ opacity: isPast && !isToday ? 0.5 : 1 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-bold" style={{ color: isToday ? '#166534' : '#800020' }}>{WEEKDAYS[idx]}</p>
                    <p className="text-[10px]" style={{ color: '#9C7B6B' }}>
                      {new Date(date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
                    </p>
                    {isToday && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor:'#DCFCE7',color:'#166534'}}>Today</span>}
                    {isPast && !isToday && <span className="text-[9px]" style={{ color:'#9C7B6B'}}>Passed</span>}
                  </div>
                  {day.is_placeholder || items.length === 0 ? (
                    <p className="text-xs italic" style={{ color: '#9C7B6B' }}>Menu is on the way 🍱</p>
                  ) : (
                    <DishCards items={items} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="px-5 py-4 text-sm italic" style={{ color: '#9C7B6B' }}>Could not load this week's menu.</p>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(244,196,48,0.2)', backgroundColor: '#FDFBF7' }}>
        <button onClick={() => setDetailsOpen(e => !e)} className="w-full flex items-center justify-between p-5 text-left">
          <p className="font-semibold text-sm" style={{ color: '#800020' }}>Subscription details</p>
          {detailsOpen ? <ChevronUp size={16} style={{ color: '#9C7B6B' }} /> : <ChevronDown size={16} style={{ color: '#9C7B6B' }} />}
        </button>
        {detailsOpen && (
          <div className="px-5 pb-5 space-y-3" style={{ borderTop: '1px solid rgba(244,196,48,0.15)' }}>
            {[
              ['Plan', sub.plan?.charAt(0).toUpperCase() + sub.plan?.slice(1) + ' Plan'],
              ['Box', boxMeta.label],
              ['Price', `£${sub.price}`],
              ['Start date', sub.start_date ? new Date(sub.start_date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : '—'],
              ['End date', sub.end_date ? new Date(sub.end_date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : '—'],
              ['Delivering to', addr ? (typeof addr==='string' ? addr : `${addr.line1}, ${addr.city}, ${addr.postcode}`) : '—'],
              ['If not home', sub.delivery_instruction || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-start gap-4">
                <p className="text-xs font-semibold shrink-0" style={{ color: '#B8860B', minWidth: 90 }}>{k}</p>
                <p className="text-sm text-right" style={{ color: '#3D2B1F' }}>{v}</p>
              </div>
            ))}
            {sub.preferences?.length > 0 && (
              <div className="flex justify-between items-start gap-4">
                <p className="text-xs font-semibold shrink-0" style={{ color: '#B8860B', minWidth: 90 }}>Preferences</p>
                <div className="flex flex-wrap gap-1 justify-end">
                  {sub.preferences.map(p => <span key={p} className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor:'rgba(128,0,32,0.08)',color:'#800020'}}>{p}</span>)}
                </div>
              </div>
            )}
            {sub.custom_request && (
              <div className="flex justify-between items-start gap-4">
                <p className="text-xs font-semibold shrink-0" style={{ color: '#B8860B', minWidth: 90 }}>Special request</p>
                <p className="text-sm text-right italic" style={{ color: '#5C4B47' }}>{sub.custom_request}</p>
              </div>
            )}
            <div className="pt-3 mt-3" style={{ borderTop: '1px solid rgba(128,0,32,0.08)' }}>
              <p className="text-xs text-center" style={{ color: '#9C7B6B' }}>
                Need to make a change?{' '}
                <Link to="/dashboard" className="underline font-semibold" style={{ color: '#800020' }}>Contact us</Link>
                {' '}— we aim to respond within 2 hours.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

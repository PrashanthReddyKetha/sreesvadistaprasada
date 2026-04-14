import React, { useState } from 'react';
import { Star, Check, X as XIcon } from 'lucide-react';
import api from '../../api';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';

const TYPE_COPY = {
  order:        { title: 'How was your order?', sub: 'Rate your takeaway experience.' },
  meal_day:     { title: "How did today's meal feel?", sub: 'Quick 1–5 star rating — your feedback shapes next week.' },
  week_summary: { title: 'Weekly Dabba Wala review', sub: 'Tell us how the full week went — this is your full review.' },
};

function Stars({ value, onChange, size = 22 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="transition-transform active:scale-90"
          aria-label={`${n} stars`}
        >
          <Star
            size={size}
            className={n <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, onSubmit, onDismiss }) {
  const [rating, setRating] = useState(review.rating || 0);
  const [text, setText] = useState(review.text || '');
  const [favs, setFavs] = useState(review.favourite_item_ids || []);
  const [busy, setBusy] = useState(false);
  const copy = TYPE_COPY[review.type] || TYPE_COPY.meal_day;
  const isSubmitted = review.status === 'submitted';
  const wantsDetail = review.type === 'week_summary' || review.type === 'order';

  const toggleFav = (id) => {
    setFavs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const submit = async () => {
    if (!rating) { alert('Pick a star rating first'); return; }
    setBusy(true);
    try {
      await api.post(`/reviews/${review.id}/submit`, {
        rating,
        text: text || null,
        favourite_item_ids: favs,
      });
      onSubmit();
    } catch (e) {
      alert(e.response?.data?.detail || 'Could not submit review');
    } finally { setBusy(false); }
  };

  const dismiss = async () => {
    if (!window.confirm('Dismiss this review prompt?')) return;
    setBusy(true);
    try { await api.post(`/reviews/${review.id}/dismiss`); onDismiss(); }
    finally { setBusy(false); }
  };

  return (
    <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#FDFBF7', border: '1px solid rgba(244,196,48,0.2)' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold" style={{ color: '#800020', fontFamily: "'Playfair Display', serif" }}>{copy.title}</p>
          <p className="text-xs mt-0.5" style={{ color: '#9C7B6B' }}>
            {copy.sub}
            {review.meal_date && <> · {fmtDate(review.meal_date)}</>}
            {review.week_start && <> · week of {fmtDate(review.week_start)}</>}
          </p>
        </div>
        {isSubmitted && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
            Submitted
          </span>
        )}
      </div>

      {!!review.menu_item_names?.length && (
        <p className="text-xs mb-3" style={{ color: '#5C4B47' }}>
          <span className="font-semibold">Meals: </span>{review.menu_item_names.join(' · ')}
        </p>
      )}

      <div className="mb-3">
        <Stars value={rating} onChange={isSubmitted ? () => {} : setRating} />
      </div>

      {wantsDetail && (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={isSubmitted}
          placeholder="What did you love? Anything we could do better?"
          rows={3}
          className="w-full text-sm rounded-lg p-3 mb-3 focus:outline-none disabled:opacity-70"
          style={{ backgroundColor: '#FAF8F4', border: '1px solid rgba(128,0,32,0.15)' }}
        />
      )}

      {!wantsDetail && !isSubmitted && (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Optional — any notes? (skip for a 1-tap rating)"
          rows={2}
          className="w-full text-sm rounded-lg p-3 mb-3 focus:outline-none"
          style={{ backgroundColor: '#FAF8F4', border: '1px solid rgba(128,0,32,0.15)' }}
        />
      )}

      {!!review.menu_item_ids?.length && !isSubmitted && rating >= 4 && (
        <div className="mb-3">
          <p className="text-xs mb-2" style={{ color: '#5C4B47' }}>Any favourites? (we'll share on the item page)</p>
          <div className="flex flex-wrap gap-2">
            {review.menu_item_ids.map((id, i) => (
              <button key={id} type="button" onClick={() => toggleFav(id)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: favs.includes(id) ? '#800020' : 'transparent',
                  color: favs.includes(id) ? '#fff' : '#5C4B47',
                  border: '1px solid rgba(128,0,32,0.25)',
                }}>
                {review.menu_item_names?.[i] || 'Item'}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isSubmitted && (
        <div className="flex gap-2 justify-end">
          <button onClick={dismiss} disabled={busy}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: '#5C4B47' }}>
            <XIcon size={13} /> Skip
          </button>
          <button onClick={submit} disabled={busy || !rating}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: '#800020' }}>
            <Check size={13} /> {busy ? 'Saving…' : 'Submit'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReviewsTab({ reviews, reload }) {
  const pending = reviews.filter(r => r.status === 'pending');
  const done = reviews.filter(r => r.status === 'submitted');

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: '#FDFBF7', border: '1px solid rgba(244,196,48,0.2)' }}>
        <Star size={32} className="mx-auto mb-3" style={{ color: '#B8860B' }} />
        <p className="font-semibold mb-1" style={{ color: '#800020' }}>No reviews yet</p>
        <p className="text-sm" style={{ color: '#9C7B6B' }}>We'll ask for your feedback once your first meal or order is delivered.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#800020' }}>
            Waiting for your rating · {pending.length}
          </h3>
          <div className="space-y-3">
            {pending.map(r => <ReviewCard key={r.id} review={r} onSubmit={reload} onDismiss={reload} />)}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#5C4B47' }}>
            Your reviews
          </h3>
          <div className="space-y-3">
            {done.map(r => <ReviewCard key={r.id} review={r} onSubmit={reload} onDismiss={reload} />)}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
import { Instagram, Play, Volume2, VolumeX, ExternalLink, Images } from 'lucide-react';
import api from '@/api';
import { record } from '@/lib/track';

/**
 * The business's own Instagram posts and reels, from our cached /api/instagram/feed (never straight from Meta, so
 * no Meta cookies land on visitors). Reels play inline: tap to play (muted), tap the speaker for sound. Renders
 * nothing until the feed has posts, so the page looks the same when the token is missing.
 */
const fmt = (n) => (n == null ? null : n >= 10000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : n.toLocaleString('en-GB'));

export default function InstagramFeed({ limit = 6, eyebrow = 'Fresh from the kitchen', title = 'Follow the cooking on Instagram' }) {
  const [feed, setFeed] = useState(null);
  useEffect(() => {
    let alive = true;
    api.get('/instagram/feed').then(r => { if (alive) setFeed(r.data); }).catch(() => { if (alive) setFeed({ posts: [] }); });
    return () => { alive = false; };
  }, []);

  const posts = (feed?.posts || []).slice(0, limit);
  if (!posts.length) return null;
  const p = feed.profile || {};
  const handle = p.username ? `@${p.username}` : 'Instagram';
  const profileUrl = p.url || 'https://www.instagram.com/sreesvadistaprasada/';

  return (
    <section className="py-16 md:py-24 px-4 md:px-8" data-testid="instagram-feed" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] mb-3" style={{ color: '#8B6914' }}>{eyebrow}</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
              {title}
            </h2>
          </div>
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" data-testid="instagram-profile"
            onClick={() => record('instagram_open', { label: 'profile', method: 'catering' })}
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 transition-shadow hover:shadow-md"
            style={{ border: '1px solid rgba(128,0,32,0.12)' }}>
            {p.avatar ? (
              <img src={p.avatar} alt="" width={48} height={48} className="w-12 h-12 rounded-full object-cover" style={{ border: '2px solid #F4C430' }} />
            ) : (
              <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(128,0,32,0.08)' }}><Instagram size={22} style={{ color: '#800020' }} /></span>
            )}
            <span className="text-left">
              <span className="block text-sm font-black" style={{ color: '#2D2422' }}>{handle}</span>
              <span className="block text-xs" style={{ color: '#5C4B47' }}>
                {[fmt(p.posts) && `${fmt(p.posts)} posts`, fmt(p.followers) && `${fmt(p.followers)} followers`].filter(Boolean).join(' · ') || 'Sree Svadista Prasada'}
              </span>
            </span>
            <span className="ml-2 px-3 py-1.5 rounded-full text-xs font-black text-white" style={{ backgroundColor: '#800020' }}>Follow</span>
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {posts.map(post => <Tile key={post.id} post={post} />)}
        </div>
        <p className="text-xs mt-5 text-center" style={{ color: '#8B8178' }}>
          Reels play here on the page · tap the corner icon to open the post on Instagram
        </p>
      </div>
    </section>
  );
}

function Tile({ post }) {
  const isVideo = post.type === 'reel' || post.type === 'video';
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  // Pause when scrolled out of view, so two reels never play at once by accident
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isVideo || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting && !v.paused) { v.pause(); setPlaying(false); } }, { threshold: 0.3 });
    io.observe(v);
    return () => io.disconnect();
  }, [isVideo]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      document.querySelectorAll('video[data-ig-reel]').forEach(o => { if (o !== v) o.pause(); });
      v.play().then(() => { setPlaying(true); record('instagram_reel_play', { method: 'catering' }); }).catch(() => setFailed(true));
    } else { v.pause(); setPlaying(false); }
  };

  const caption = post.caption || (isVideo ? 'Reel from our kitchen' : 'From our kitchen');
  return (
    <div className="relative rounded-2xl overflow-hidden bg-black group" style={{ aspectRatio: '4 / 5' }} data-testid={`instagram-post-${post.type}`}>
      {isVideo && !failed ? (
        <>
          <video ref={videoRef} data-ig-reel src={post.url} poster={post.poster} muted={muted} playsInline loop preload="none"
            className="absolute inset-0 w-full h-full object-cover" onError={() => setFailed(true)} onEnded={() => setPlaying(false)} />
          <button type="button" onClick={toggle} aria-label={playing ? 'Pause reel' : 'Play reel'} data-testid="instagram-play"
            className="absolute inset-0 flex items-center justify-center">
            {!playing && (
              <span className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: 'rgba(253,251,247,0.92)' }}>
                <Play size={26} style={{ color: '#800020', marginLeft: 3 }} fill="#800020" />
              </span>
            )}
          </button>
          {playing && (
            <button type="button" onClick={() => setMuted(m => !m)} aria-label={muted ? 'Sound on' : 'Sound off'}
              className="absolute bottom-3 left-3 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
              {muted ? <VolumeX size={16} color="#fff" /> : <Volume2 size={16} color="#fff" />}
            </button>
          )}
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white" style={{ backgroundColor: 'rgba(128,0,32,0.9)' }}>Reel</span>
        </>
      ) : (
        <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="absolute inset-0">
          <img src={isVideo ? post.poster : post.url} alt={caption} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          {post.type === 'carousel' && <Images size={16} color="#fff" className="absolute top-3 left-3 drop-shadow" />}
        </a>
      )}
      <a href={post.permalink} target="_blank" rel="noopener noreferrer" aria-label="Open on Instagram" title="Open on Instagram"
        onClick={() => record('instagram_open', { label: post.type, method: 'catering' })}
        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <ExternalLink size={14} color="#fff" />
      </a>
      {post.caption && !playing && (
        <p className="absolute bottom-0 inset-x-0 px-3 pb-3 pt-10 text-[11px] leading-snug text-white line-clamp-2"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}>{post.caption}</p>
      )}
    </div>
  );
}

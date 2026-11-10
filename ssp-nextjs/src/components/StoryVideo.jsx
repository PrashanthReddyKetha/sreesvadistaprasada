'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { record } from '@/lib/track';

/* "Why We Lit This Stove": the kitchen's own portrait film (owner, 10 Nov 2026), 540×960, 5.6 MB, fast start.
   Nothing is fetched until it is about a screen away; it plays muted once half of it is on screen and pauses when
   it leaves. People who asked for less motion or to save data see the still with a play button. Either side of
   the portrait frame, the first frame blurred keeps the section's shape on wide screens. */
const SRC = '/video/our-kitchen.mp4';
const POSTER = '/video/our-kitchen-poster.webp';

export default function StoryVideo() {
  const box = useRef(null);
  const vid = useRef(null);
  const chosePause = useRef(false);   // someone paused it: scrolling back does not start it again
  const told = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = vid.current, el = box.current;
    if (!v || !el) return;
    v.muted = true;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData;
    let fetched = false;
    const fetchNow = () => { if (!fetched) { fetched = true; v.preload = 'auto'; v.load(); } };
    const near = new IntersectionObserver(([e]) => { if (e.isIntersecting && !still) { fetchNow(); near.disconnect(); } },
      { rootMargin: '700px 0px' });
    const seen = new IntersectionObserver(([e]) => {
      if (e.intersectionRatio >= 0.5) { if (!still && !chosePause.current) v.play().catch(() => {}); }
      else if (!v.paused) v.pause();
    }, { threshold: [0, 0.5] });
    near.observe(el);
    seen.observe(el);
    return () => { near.disconnect(); seen.disconnect(); };
  }, []);

  const toggle = () => {
    const v = vid.current;
    if (v.paused) { chosePause.current = false; v.play().catch(() => {}); }
    else { chosePause.current = true; v.pause(); }
  };
  const sound = () => {
    const v = vid.current;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) { record('story_video_sound'); if (v.paused) v.play().catch(() => {}); }
  };
  const onPlay = () => {
    setPlaying(true);
    if (!told.current) { told.current = true; record('story_video_play'); }
  };

  const button = 'w-9 h-9 rounded-full flex items-center justify-center text-white transition-colors hover:bg-black/70';
  return (
    <div ref={box} className="relative h-[460px] md:h-[540px] rounded-lg overflow-hidden" style={{ backgroundColor: '#2D2422' }} data-testid="story-video">
      <div aria-hidden="true" className="absolute inset-0 scale-125"
        style={{ backgroundImage: `url(${POSTER})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(26px) brightness(0.62)' }} />
      <div className="relative h-full mx-auto aspect-[9/16] shadow-2xl">
        <video ref={vid} src={SRC} poster={POSTER} muted playsInline loop preload="none" disablePictureInPicture
          className="h-full w-full object-cover"
          aria-label="A minute in our kitchen: idli with podi and ghee, a veg thali served on a banana leaf, punugulu hot from the pan"
          onPlay={onPlay} onPause={() => setPlaying(false)} />
        <div className="absolute top-3 right-3 flex gap-2">   {/* top: phones keep WhatsApp and the order bar at the bottom */}
          <button type="button" onClick={toggle} className={button} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            aria-label={playing ? 'Pause the video' : 'Play the video'} data-testid="story-video-play">
            {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          <button type="button" onClick={sound} className={button} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            aria-label={muted ? 'Turn the sound on' : 'Turn the sound off'} data-testid="story-video-sound">
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>
      <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ border: '1px solid rgba(244, 196, 48, 0.2)' }} />
    </div>
  );
}

# Instagram on the Catering page

The Catering page shows the business's latest Instagram posts and reels (owner, 14–15 Nov 2026).

- **Source**: Meta app "SSP website" (Unified login), Instagram account `sreesvadistaprasada` (id 17841474998556404).
- **Render env**: `INSTAGRAM_ACCESS_TOKEN` (required), `INSTAGRAM_USER_ID`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`.
- **Backend**: `backend/instagram.py` fetches profile + last 12 posts, caches one hour in memory, keeps the last good copy in `settings/_id=instagram_feed`, refreshes the token every 14 days (`settings/_id=instagram_token`). Public endpoint `GET /api/instagram/feed`.
- **Frontend**: `ssp-nextjs/src/components/InstagramFeed.jsx` on `/catering`. Hidden until the feed has posts. Reels play inline (muted first, speaker toggles sound); every tile links to the post on Instagram. Visitors' browsers never call Meta.
- **Health**: Admin › Overview › "Is everything working?" has an "Instagram feed" row and a launch-list item.
- **If it stops**: generate a new token in the Meta app (Use cases › Instagram API › API setup with Unified login › Generate token) and update `INSTAGRAM_ACCESS_TOKEN` on Render.

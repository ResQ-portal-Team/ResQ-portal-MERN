/** YouTube / youtu.be → embed URL, or null for direct video links. */
export function youtubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = u.pathname.match(/\/embed\/([^/?]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}`;
      const s = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (s) return `https://www.youtube.com/embed/${s[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Autoplay with sound (mute=0). Some browsers still block until the user interacts
 * with the page; YouTube’s player may fall back to muted in that case.
 */
export function youtubeEmbedSrcWithAutoplay(embedBase) {
  if (!embedBase) return '';
  const sep = embedBase.includes('?') ? '&' : '?';
  return `${embedBase}${sep}autoplay=1&mute=0&rel=0`;
}

/** Embed without autoplay (e.g. until feedback modal is dismissed). */
export function youtubeEmbedSrcNoAutoplay(embedBase) {
  if (!embedBase) return '';
  const sep = embedBase.includes('?') ? '&' : '?';
  return `${embedBase}${sep}autoplay=0&mute=0&rel=0`;
}

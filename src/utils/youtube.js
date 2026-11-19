const REGEXES = [
  /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/|v\/|attribution_link\?u=.*%2Fwatch\?v%3D))([A-Za-z0-9_-]{11})/,
  /youtu\.be\/([A-Za-z0-9_-]{11})/,
];

export function extractYoutubeId(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  const url = String(value);
  for (const regex of REGEXES) {
    const match = url.match(regex);
    if (match) return match[1];
  }
  return null;
}

export function isYoutubeUrl(value) {
  return !!extractYoutubeId(value);
}

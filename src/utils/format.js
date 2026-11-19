// Petits utilitaires d'affichage (dates relatives, prix…).

export function timeAgo(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Math.max(0, (Date.now() - date.getTime()) / 1000);
  const units = [
    [31536000, 'an', 'ans'],
    [2592000, 'mois', 'mois'],
    [604800, 'semaine', 'semaines'],
    [86400, 'jour', 'jours'],
    [3600, 'heure', 'heures'],
    [60, 'minute', 'minutes'],
  ];
  for (const [sec, one, many] of units) {
    const n = Math.floor(diff / sec);
    if (n >= 1) return `il y a ${n} ${n > 1 ? many : one}`;
  }
  return "à l'instant";
}

export function formatNumber(value) {
  const n = Math.round(Number(value) || 0);
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Les miniatures renvoyées par l'API contiennent parfois des entités HTML
// (ex. "&amp;rs=…") qui cassent l'URL de l'image.
export function decodeEntities(value) {
  if (!value || typeof value !== 'string') return value;
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

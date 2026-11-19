const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const https = require('https');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname),
};

// ─── Proxy API pour le développement web ─────────────────────────────
// L'API de production n'envoie pas d'en-tête CORS pour les origines locales :
// sur web, le navigateur bloque donc les requêtes depuis http://localhost:8081.
// En dev, Metro relaie /__api/* vers l'API réelle (côté serveur, sans CORS).
// Ce proxy n'existe qu'en développement : les builds Android/iOS appellent
// l'API directement.
const API_TARGET = new URL(process.env.EXPO_PUBLIC_API_URL || 'https://nufotec.com/api/v1');
const PROXY_PREFIX = '/__api';

config.server = config.server || {};
const previousEnhance = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const base = previousEnhance ? previousEnhance(middleware, server) : middleware;
  return (req, res, next) => {
    if (!req.url || !req.url.startsWith(PROXY_PREFIX + '/')) return base(req, res, next);

    const targetPath = API_TARGET.pathname.replace(/\/+$/, '') + req.url.slice(PROXY_PREFIX.length);
    const headers = { ...req.headers, host: API_TARGET.host };
    delete headers.origin;
    delete headers.referer;

    const upstream = https.request(
      { protocol: 'https:', hostname: API_TARGET.hostname, port: API_TARGET.port || 443, path: targetPath, method: req.method, headers },
      (upRes) => {
        res.writeHead(upRes.statusCode || 502, upRes.headers);
        upRes.pipe(res);
      }
    );
    upstream.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: `Proxy API: ${err.message}` }));
    });
    req.pipe(upstream);
  };
};

module.exports = config;

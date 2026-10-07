/**
 * bookImages.js — resolves textbook figure references to bundled asset URLs
 *
 * The book markdown references figures as `images/<name>.png` relative to
 * the source folder. Vite's import.meta.glob maps every bundled PNG to a
 * hashed URL at build time; the BookReader resolves chapter bodies through
 * resolveBookBodyImages() before rendering.
 *
 * Images are excluded from the PWA precache (see vite.config.js) and cached
 * at runtime on first view, keeping the initial install light.
 */

export const bookImageModules = import.meta.glob(
  '../../data/courses-data/textbooks-and-references/md/images/*.{png,jpg,jpeg,gif}',
  { eager: false, query: '?url', import: 'default' },
);

const IMAGE_KEY_SUFFIX = '/images/';

/** Resolve a single `images/<name>` source to a bundled URL (or null).
 *  Matches by filename suffix — Vite may normalize the glob keys' path
 *  segments, so building a key by hand is fragile. */
export async function resolveBookImage(src) {
  const name = (src ?? '').split('/').pop();
  if (!name) return null;
  const suffix = `${IMAGE_KEY_SUFFIX}${name}`;
  for (const [key, loader] of Object.entries(bookImageModules)) {
    if (key.endsWith(suffix)) return loader();
  }
  return null;
}

/** Replace every `images/<name>` reference in a chapter body with a real URL. */
export async function resolveBookBodyImages(body) {
  const matches = [...(body ?? '').matchAll(/images\/[A-Za-z0-9._-]+\.(?:png|jpe?g|gif)/g)];
  const sources = [...new Set(matches.map(m => m[0]))];
  const resolved = new Map();
  await Promise.all(sources.map(async src => {
    const url = await resolveBookImage(src);
    if (url) resolved.set(src, url);
  }));
  if (resolved.size === 0) return body ?? '';
  let out = body;
  for (const [src, url] of resolved) out = out.split(src).join(url);
  return out;
}

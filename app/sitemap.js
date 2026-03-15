// app/sitemap.js — Auto-generates sitemap.xml
export default function sitemap() {
  const base = 'https://tampa.citytourguide.app';
  const now  = new Date().toISOString();

  return [
    { url: base,              lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/partner`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/terms`,   lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/disclaimer`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}

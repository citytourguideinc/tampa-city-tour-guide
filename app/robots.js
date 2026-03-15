// app/robots.js — Auto-generates robots.txt
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/resources/'],
      },
    ],
    sitemap: 'https://tampa.citytourguide.app/sitemap.xml',
  };
}

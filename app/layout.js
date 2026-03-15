import './globals.css';
import { Outfit } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';

const outfit = Outfit({ subsets: ['latin'], weight: ['600','700','800'] });

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata = {
  title: 'City Tour Guide | Tampa Bay Events, Tours and Things To Do',
  description: 'Discover the best tours, events, and things to do in Tampa Bay. Updated daily.',
  openGraph: {
    title: 'City Tour Guide',
    description: 'Local discovery for Tampa Bay. Tours, events, restaurants, deals and more.',
    url: 'https://tampa.citytourguide.app',
    siteName: 'City Tour Guide',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={outfit.className} style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        {children}
        <Analytics />
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}</Script>
          </>
        )}
      </body>
    </html>
  );
}

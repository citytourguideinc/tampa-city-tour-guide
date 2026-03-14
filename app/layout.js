import './globals.css';
import { Outfit } from 'next/font/google';
import Script from 'next/script';

const outfit = Outfit({ subsets: ['latin'], weight: ['600','700','800'] });

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata = {
  title: 'Tampa City Tour Guide — AI-Powered City Discovery',
  description: 'Discover the best tours, events, deals, and things to do in Tampa Bay. Powered by AI.',
  openGraph: {
    title: 'Tampa City Tour Guide',
    description: 'AI-powered local discovery for Tampa Bay — tours, events, restaurants, deals and more.',
    url: 'https://tampa.citytourguide.app',
    siteName: 'City Tour Guide',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={outfit.className} style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        {children}
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

import './globals.css';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], weight: ['600','700','800'] });

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
      </body>
    </html>
  );
}

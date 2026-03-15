'use client';
import Script from 'next/script';

// Viator affiliate widget — shows bookable tours for the selected city
// Partner ID: P00292624 | Widget: W-15c072ce-f938-48e3-9b24-544cd68c5dd2
export default function ViatorWidget() {
  return (
    <div style={{ width: '100%', minHeight: 200 }}>
      <div
        data-vi-partner-id="P00292624"
        data-vi-widget-ref="W-15c072ce-f938-48e3-9b24-544cd68c5dd2"
      />
      <Script
        src="https://www.viator.com/orion/partner/widget.js"
        strategy="lazyOnload"
      />
    </div>
  );
}

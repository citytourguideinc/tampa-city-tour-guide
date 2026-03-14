'use client';

export default function DownloadButton() {
  return (
    <button
      className="btn-primary"
      style={{ fontSize: '0.82rem', padding: '8px 18px' }}
      onClick={() => window.print()}
      title="Save this page as a PDF"
    >
      ⬇️ Download PDF
    </button>
  );
}

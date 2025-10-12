"use client";

import TutoringHistory from '../../components/TutoringHistory/TutoringHistory';

export default function HistoryPage() {
  return (
    <div className="history-page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <TutoringHistory />
    </div>
  );
}
'use client';

import React, { Suspense } from 'react';
import FindTutorView from '../../components/FindTutorView/FindTutorView';

function LoadingFallback() {
    return (
        <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#FFF8F0] border-t-[#FDAE1E] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#101F24] font-medium">Loading tutors...</p>
            </div>
        </div>
    );
}

export default function FindTutorPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <FindTutorView />
        </Suspense>
    );
}
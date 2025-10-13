"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import JointAvailability from "../components/joint_availability/joint_availability";

function JointAvailabilityContent() {
  const searchParams = useSearchParams();
  const subject = searchParams.get('subject') || 'Matemáticas';

  return <JointAvailability subject={subject} />;
}

export default function JointAvailabilityPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JointAvailabilityContent />
    </Suspense>
  );
}
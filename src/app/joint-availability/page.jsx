"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import JointAvailability from "../components/joint_availability/joint_availability";

function JointAvailabilityContent() {
  const searchParams = useSearchParams();
  const course = searchParams.get('course') || 'Matemáticas';

  return <JointAvailability course={course} />;
}

export default function JointAvailabilityPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JointAvailabilityContent />
    </Suspense>
  );
}
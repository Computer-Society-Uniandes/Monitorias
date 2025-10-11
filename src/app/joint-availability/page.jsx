"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import JointAvailability from "../components/joint_availability/joint_availability";

export default function JointAvailabilityPage() {
  const searchParams = useSearchParams();
  const subject = searchParams.get('subject') || 'Matemáticas';

  return <JointAvailability subject={subject} />;
}
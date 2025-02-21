'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import CameraComponent with no SSR
const CameraComponent = dynamic(
  () => import('../../components/CameraComponent'),
  { ssr: false }
);

export default function CameraPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <h2 className="text-xl font-semibold">Loading camera...</h2>
        </div>
      </div>
    }>
      <CameraComponent />
    </Suspense>
  );
}
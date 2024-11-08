'use client';

import LandingPageDesign from './components/LandingPageDesign';
import OverlayEditor from './components/overlay-editor';

export default function DesignPage() {
  return (
    <div className="space-y-8 p-4">
      <h1 className="text-2xl font-bold mb-6">Design Management</h1>
      
      {/* Landing Page Design Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Landing Page Design</h2>
        <LandingPageDesign />
      </div>

      {/* Overlay Editor Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Overlay Editor</h2>
        <OverlayEditor />
      </div>
    </div>
  );
}


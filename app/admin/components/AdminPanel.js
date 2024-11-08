'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function AdminPanel() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <nav className="space-y-4">
        <Link 
          href="/admin/events" 
          className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          Events Management
        </Link>
        {/* Add more navigation items as needed */}
      </nav>
    </div>
  );
}

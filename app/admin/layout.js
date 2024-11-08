'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Design', path: '/admin/design' },
    { name: 'Events', path: '/admin/events' },
    { name: 'Settings', path: '/admin/settings' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: '280px',
        backgroundColor: '#1F2937', // Lighter gray
        borderRight: '1px solid #374151'
      }}>
        <div style={{
          padding: '28px 24px',
          borderBottom: '1px solid #374151'
        }}>
          <h1 style={{
            color: 'white',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            Admin Panel
          </h1>
        </div>
        <nav style={{ padding: '24px 16px' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              style={{
                display: 'block',
                padding: '14px 16px',
                marginBottom: '12px',
                borderRadius: '8px',
                color: pathname === item.path ? 'white' : '#9CA3AF',
                backgroundColor: pathname === item.path ? '#3B82F6' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s',
                fontSize: '15px',
                fontWeight: pathname === item.path ? '500' : '400'
              }}
              onMouseEnter={(e) => {
                if (pathname !== item.path) {
                  e.target.style.backgroundColor = '#374151';
                  e.target.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== item.path) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#9CA3AF';
                }
              }}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        backgroundColor: '#F3F4F6',
        padding: '32px'
      }}>
        {children}
      </div>
    </div>
  );
}

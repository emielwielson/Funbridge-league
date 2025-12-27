'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/users', label: 'Players' },
    { href: '/admin/divisions', label: 'Divisions' },
    { href: '/admin/league', label: 'League' },
    { href: '/admin/old-leagues', label: 'Old Leagues' },
  ];

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="mb-6">
            <div className="flex space-x-1 overflow-x-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
          
          <main>{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}


'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  showViewToggle?: boolean;
  viewMode?: '2d' | '3d';
  onViewModeChange?: (mode: '2d' | '3d') => void;
}

export function Navbar({ showViewToggle = false, viewMode = '2d', onViewModeChange }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 shrink-0">
      <nav className='flex justify-between items-center py-6 max-w-[95%] mx-auto'>
        <div className="flex items-center gap-8">
          <span className="text-2xl font-bold text-white">WindBorne Balloon Tracker</span>

          <div className="flex gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'text-sky-500 underline decoration-2 underline-offset-8'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link
              href="/case-study"
              className={`text-sm font-medium transition-colors ${
                pathname === '/case-study'
                  ? 'text-sky-500 underline decoration-2 underline-offset-8'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Case Study
            </Link>
          </div>
        </div>

        {showViewToggle && onViewModeChange && (
          <div className="flex gap-2 bg-zinc-900 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('2d')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === '2d'
                  ? 'bg-sky-500 text-white'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              2D Map
            </button>
            <button
              onClick={() => onViewModeChange('3d')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === '3d'
                  ? 'bg-sky-500 text-white'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              3D Globe
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}

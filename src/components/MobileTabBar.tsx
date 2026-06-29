'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, CalendarCheck, Award } from 'lucide-react';

export default function MobileTabBar() {
  const pathname = usePathname();
  return (
    <div className="lg:hidden grid grid-cols-4 border-b border-[#f1f5f9] dark:border-[#161b22] bg-white dark:bg-[#0d1117]">
      {/* Home */}
      <Link href="/" className="relative flex flex-col items-center justify-center py-3 gap-1">
        <Home className="w-[22px] h-[22px] tab-icon-home" style={{ color: '#024c57' }} aria-hidden="true" />
        <span className="text-[10px] font-semibold tab-label-home" style={{ color: '#024c57' }}>Home</span>
        {(pathname === '/' || pathname === '') && (
          <span className="absolute bottom-0 left-[15%] right-[15%] h-[3px] rounded-t-sm tab-underline-home" style={{ background: '#024c57' }} />
        )}
      </Link>
      {/* Courses */}
      <Link href="/courses/" className="relative flex flex-col items-center justify-center py-3 gap-1">
        <LayoutGrid className="w-[22px] h-[22px] tab-icon-courses" style={{ color: '#1d4ed8' }} aria-hidden="true" />
        <span className="text-[10px] font-semibold tab-label-courses" style={{ color: '#1d4ed8' }}>Courses</span>
        {pathname.startsWith('/courses') && (
          <span className="absolute bottom-0 left-[15%] right-[15%] h-[3px] rounded-t-sm tab-underline-courses" style={{ background: '#1d4ed8' }} />
        )}
      </Link>
      {/* Batches */}
      <Link href="/batches" className="relative flex flex-col items-center justify-center py-3 gap-1">
        <CalendarCheck className="w-[22px] h-[22px] tab-icon-batches" style={{ color: '#d97706' }} aria-hidden="true" />
        <span className="text-[10px] font-semibold tab-label-batches" style={{ color: '#d97706' }}>Batches</span>
        {pathname.startsWith('/batches') && (
          <span className="absolute bottom-0 left-[15%] right-[15%] h-[3px] rounded-t-sm tab-underline-batches" style={{ background: '#d97706' }} />
        )}
      </Link>
      {/* Reviews */}
      <Link href="/student-reviews/" className="relative flex flex-col items-center justify-center py-3 gap-1">
        <Award className="w-[22px] h-[22px] tab-icon-reviews" style={{ color: '#7c3aed' }} aria-hidden="true" />
        <span className="text-[10px] font-semibold tab-label-reviews" style={{ color: '#7c3aed' }}>Reviews</span>
        {pathname.startsWith('/student-reviews') && (
          <span className="absolute bottom-0 left-[15%] right-[15%] h-[3px] rounded-t-sm tab-underline-reviews" style={{ background: '#7c3aed' }} />
        )}
      </Link>
    </div>
  );
}

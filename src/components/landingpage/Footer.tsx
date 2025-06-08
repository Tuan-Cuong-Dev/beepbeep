'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#00d289] text-white text-sm py-4 text-center w-full">
      <div>© 2025 Workman. All rights reserved.</div>
      <div className="mt-1 space-x-3">
        <Link href="/about" className="underline">About Us</Link>
        <Link href="/contact" className="underline">Contact</Link>
        <Link href="/policy" className="underline">Policy</Link>
      </div>
    </footer>
  );
}

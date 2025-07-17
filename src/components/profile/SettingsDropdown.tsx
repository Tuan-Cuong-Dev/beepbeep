'use client';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/src/components/ui/dropdown-menu';
import { FiSettings } from 'react-icons/fi';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button'; // nếu bạn dùng button tuỳ biến

export default function SettingsDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span title="Settings">
          <FiSettings className="w-5 h-5 cursor-pointer text-gray-500 hover:text-gray-700" />
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/profile/edit" className="w-full">Edit your profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/edit-photo" className="w-full">Edit profile photo</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/edit-cover" className="w-full">Edit cover photo</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account" className="w-full">Account info</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/settings" className="w-full">Account settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/subscriptions" className="w-full">Subscriptions</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/payments" className="w-full">Payment Options</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/connectgoogledriver" className="w-full">Connect Google Driver</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

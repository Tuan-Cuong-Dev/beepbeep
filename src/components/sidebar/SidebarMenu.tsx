'use client';

import Link from 'next/link';
import {
  FaTimes,
  FaGlobe,
  FaHome,
  FaInfoCircle,
  FaPhone,
  FaShieldAlt,
} from 'react-icons/fa';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
  if (!isOpen) return null;

  return (
    <div
      className="
        font-sans fixed top-0 left-0 h-full w-80 bg-white shadow-lg z-[100] p-5
        transform transition-transform duration-300 ease-in-out translate-x-0
      "
    >
      {/* Close Sidebar Button */}
      <button onClick={onClose} className="absolute top-4 right-4 text-lg">
        <FaTimes />
      </button>

      {/* Header */}
      <div className="flex items-center text-gray-800 space-x-2 font-semibold text-lg mb-8">
        <FaGlobe />
        <span>United States, EN | USD</span>
      </div>

      {/* Menu Items */}
      <ul className="space-y-4 text-gray-800">
        <li className="flex items-center space-x-3 hover:text-blue-500">
          <FaHome />
          <Link href="/" onClick={onClose}>
            Home
          </Link>
        </li>
        <hr />
        <li className="flex items-center space-x-3 hover:text-blue-500">
          <FaInfoCircle />
          <Link href="/about" onClick={onClose}>
            About Us
          </Link>
        </li>
        <hr />
        <li className="flex items-center space-x-3 hover:text-blue-500">
          <FaPhone />
          <Link href="/contact" onClick={onClose}>
            Contact
          </Link>
        </li>
        <hr />
        <li className="flex items-center space-x-3 hover:text-blue-500">
          <FaShieldAlt />
          <Link href="/policy" onClick={onClose}>
            Policies
          </Link>
        </li>
      </ul>
    </div>
  );
}

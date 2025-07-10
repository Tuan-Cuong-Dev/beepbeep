'use client';

import { FaImage, FaPen, FaGlobeAsia, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import { Button } from '@/src/components/ui/button';

interface ProfileSidebarProps {
  location?: string;
  joinedDate?: string;
  helpfulVotes?: number;
}

export default function ProfileSidebar({
  location = 'Da Nang, Vietnam',
  joinedDate = 'Mar 2025',
  helpfulVotes = 0,
}: ProfileSidebarProps) {
  return (
    <div className="w-full space-y-6">
      {/* Achievements */}
      <div className="bg-white p-4 rounded-lg shadow-sm hidden md:block">
        <h2 className="text-base font-semibold mb-3">Your Achievements</h2>
        <p className="text-sm text-gray-500 mb-4">Start sharing to unlock</p>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-center justify-between border rounded px-3 py-2">
            <div>
              <p className="font-medium">Write your first review</p>
              <p className="text-xs text-gray-500">Unlock review milestones</p>
            </div>
            <span className="text-xl">🔒</span>
          </div>
          <div className="flex items-center justify-between border rounded px-3 py-2">
            <div>
              <p className="font-medium">Upload your first photo</p>
              <p className="text-xs text-gray-500">Unlock photo milestones</p>
            </div>
            <span className="text-xl">🔒</span>
          </div>
        </div>
        <Button className="mt-4 w-full bg-green-900 text-white hover:bg-green-800" size="sm">
          View all
        </Button>
      </div>

      {/* Intro - hidden on mobile */}
      <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-gray-700 hidden md:block">
        <h2 className="text-base font-semibold mb-3">Intro</h2>
        <ul className="space-y-3">
          <li className="flex items-center gap-2">
            <FaMapMarkerAlt className="text-gray-500 w-4 h-4" />
            {location}
          </li>
          <li className="flex items-center gap-2">
            <FaCalendarAlt className="text-gray-500 w-4 h-4" />
            Joined in {joinedDate}
          </li>
          <li className="flex items-center gap-2">
            <FaGlobeAsia className="text-gray-500 w-4 h-4" />
            {helpfulVotes} helpful votes
          </li>
          <li className="text-[#00d289] hover:underline cursor-pointer font-medium">
            Help improve Bíp Bíp with your feedback
          </li>
        </ul>
      </div>

      {/* Share actions - hidden on mobile */}
      <div className="bg-white p-4 rounded-lg shadow-sm hidden md:block">
        <h2 className="text-base font-semibold mb-3">Help improve Bíp Bíp with your feedback</h2>
        <div className="text-sm text-gray-700 space-y-3">
          <p className="flex items-center gap-2 font-semibold hover:underline underline-offset-2 cursor-pointer">
            <FaImage className="w-4 h-4" />
            Post photos
          </p>
          <p className="flex items-center gap-2 font-semibold hover:underline underline-offset-2 cursor-pointer">
            <FaPen className="w-4 h-4" />
            Write review
          </p>
        </div>
      </div>
    </div>
  );
}

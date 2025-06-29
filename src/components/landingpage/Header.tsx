'use client';

import React, { useState } from "react";
import { FaBars, FaRegUserCircle, FaGlobe } from "react-icons/fa";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Preferences from "./Preferences";
import SidebarMenu from "../sidebar/SidebarMenu";
import UserSidebar from "../sidebar/UserSidebar";
import LoginPopup from "@/src/components/auth/LoginPopup";
import { useUser } from "@/src/context/AuthContext";
import Link from "next/link";

const Header = () => {
  const [language, setLanguage] = useState("EN");
  const [currency, setCurrency] = useState("USD");
  const [isReferencePopupOpen, setIsReferencePopupOpen] = useState(false);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserSidebarOpen, setIsUserSidebarOpen] = useState(false);

  const { user } = useUser();
  const router = useRouter();

  const togglePopup = () => setIsReferencePopupOpen(!isReferencePopupOpen);
  const toggleLoginPopup = () => setIsLoginPopupOpen(!isLoginPopupOpen);
  const toggleSidebar = () => {
    if (!isSidebarOpen) setIsUserSidebarOpen(false);
    setIsSidebarOpen(!isSidebarOpen);
  };
  const toggleUserSidebar = () => {
    if (!isUserSidebarOpen) setIsSidebarOpen(false);
    setIsUserSidebarOpen(!isUserSidebarOpen);
  };

  return (
    <header className="sticky flex items-center justify-between absolute top-0 left-0 w-full bg-white z-50 h-16">
      {/* Nút Menu Icon (hamburger) - chỉ hiện trên mobile */}
      <button className="text-2xl text-gray-800 md:hidden lg:hidden px-6 py-2" onClick={toggleSidebar}>
        <FaBars />
      </button>

      {/* Logo */}
      <div className="flex items-center px-8">
        <Link href="/">
          <Image
            src="/assets/images/BipBip_logo1.png"
            alt="eBikeRental Logo"
            width={160}
            height={60}
            priority
            className="h-auto w-auto max-h-12"
          />
        </Link>
      </div>

      {/* User Icon (mobile) */}
      <button
        className="text-2xl md:hidden text-gray-800 lg:hidden px-6 py-2"
        onClick={user ? toggleUserSidebar : toggleLoginPopup}
      >
        {user ? (
          <img
            src={user.photoURL || "/assets/images/technician.png"}
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <FaRegUserCircle />
        )}
      </button>

      {/* Popup đăng nhập */}
      {isLoginPopupOpen && <LoginPopup onClose={toggleLoginPopup} />}

      {/* Sidebar Menu */}
      <SidebarMenu isOpen={isSidebarOpen} onClose={toggleSidebar} />

      {/* Desktop Only */}
      <div className="hidden sm:block px-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={togglePopup}
            className="flex items-center space-x-2 text-sm font-semibold"
          >
            <FaGlobe className="text-lg" />
            <span className="border-l border-gray-400 h-4 mx-2"></span>
            <span>{currency}</span>
            <span className="border-l border-gray-400 h-4 mx-2"></span>
          </button>

          {user ? (
            <img
              src={user.photoURL || "/assets/images/usericon.png"}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover cursor-pointer"
              onClick={toggleUserSidebar}
            />
          ) : (
            <button
              onClick={toggleLoginPopup}
              className="px-4 py-1 bg-transparent border border-[#00d289] text-[#00d289] text-md font-semibold rounded-sm"
            >
              Sign in
            </button>
          )}
        </div>

        {isReferencePopupOpen && (
          <Preferences onClose={() => setIsReferencePopupOpen(false)} />
        )}
      </div>

      {/* Sidebar người dùng */}
      {user && (
        <UserSidebar
          user={user}
          isOpen={isUserSidebarOpen}
          onClose={() => setIsUserSidebarOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;

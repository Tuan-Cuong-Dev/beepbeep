"use client";

import React, { useState } from "react";
import { FaBars, FaRegUserCircle, FaGlobe } from "react-icons/fa";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Preferences from "./Preferences";
import SidebarMenu from "../sidebar/SidebarMenu";
import UserSidebar from "../sidebar/UserSidebar";
import LoginPopup from "@/src/components/auth/LoginPopup";
import { useUser } from "@/src/context/AuthContext";

// Import UserSidebar từ file riêng
import Link from "next/link";
// Quản lý đóng mở sidebar cho đồng bộ


const Header = () => {
  const [language, setLanguage] = useState("EN");
  const [currency, setCurrency] = useState("USD");

  // Quản lý mở/đóng popup Preferences
  const [isReferencePopupOpen, setIsReferencePopupOpen] = useState(false);
  // Quản lý mở/đóng popup Login
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  // Quản lý mở/đóng SidebarMenu (hamburger)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Quản lý mở/đóng Sidebar đổ xuống cho user (khi đã đăng nhập)
  const [isUserSidebarOpen, setIsUserSidebarOpen] = useState(false);

  const { user } = useUser();  // ✅
  const router = useRouter();

  // Đổi tiền tệ / ngôn ngữ
  const togglePopup = () => setIsReferencePopupOpen(!isReferencePopupOpen);
  // Đóng / mở Login popup
  const toggleLoginPopup = () => setIsLoginPopupOpen(!isLoginPopupOpen);
  // Đóng / mở SidebarMenu (hamburger) và đóng UserSidebar nếu cần
  const toggleSidebar = () => {
    if (!isSidebarOpen) {
      setIsUserSidebarOpen(false); // Đóng UserSidebar nếu SidebarMenu đang mở
    }
    setIsSidebarOpen(!isSidebarOpen);
  };
  // Đóng / mở UserSidebar và đóng SidebarMenu nếu cần
const toggleUserSidebar = () => {
  if (!isUserSidebarOpen) {
    setIsSidebarOpen(false); // Đóng SidebarMenu nếu UserSidebar đang mở
  }
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
              width={160} // ✅ để đúng kích thước thực tế
              height={60} // ✅ tùy theo tỷ lệ logo
              priority // ✅ logo thì nên preload
              className="h-auto w-auto max-h-12" // ✅ tối ưu responsive
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
            src={user.photoURL || "/default-avatar.png"}
            alt="avatar"
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <FaRegUserCircle />
        )}
      </button>

      {/* Popup đăng nhập (nếu cần) */}
      {isLoginPopupOpen && <LoginPopup onClose={toggleLoginPopup} />}

      {/* Sidebar Menu (hamburger) */}
      <SidebarMenu isOpen={isSidebarOpen} onClose={toggleSidebar} />

      {/* Desktop Only */}
      <div className="hidden sm:block px-8">
        <div className="flex items-center space-x-4">
          {/* Nút đổi tiền tệ / ngôn ngữ */}
          <button
            onClick={togglePopup}
            className="flex items-center space-x-2 text-sm font-semibold"
          >
            <FaGlobe className="text-lg" />
            <span className="border-l border-gray-400 h-4 mx-2"></span>
            <span>{currency}</span>
            <span className="border-l border-gray-400 h-4 mx-2"></span>
          </button>

          {/* Nếu đã đăng nhập => hiển thị avatar, nếu chưa => nút "Đăng nhập" */}
          {user ? (
            <img
              src={user.photoURL || "/default-avatar.png"}
              alt="avatar"
              className="w-8 h-8 rounded-full cursor-pointer"
              onClick={toggleUserSidebar}
            />
          ) : (
            <button
              onClick={user ? toggleUserSidebar : toggleLoginPopup}
              className="px-4 py-1 bg-transparent border border-[#00d289] text-[#00d289] text-md font-semibold rounded-sm"
            >
              Sign in
            </button>
          )}
        </div>

        {/* Popup đổi tiền tệ / ngôn ngữ */}
        {isReferencePopupOpen && (
          <Preferences onClose={() => setIsReferencePopupOpen(false)} />
        )}
      </div>

      {/* Sidebar đổ xuống cho user (chỉ hiện khi đã đăng nhập) */}
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

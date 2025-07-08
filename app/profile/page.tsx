"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/src/components/users/useAuth"; 
import { db } from "@/src/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Header from "@/src/components/landingpage/Header";
import Footer from "@/src/components/landingpage/Footer";
import { Button } from "@/src/components/ui/button";
import { FaImage, FaPen, FaCog } from "react-icons/fa";
import ActivityFeed from "@/src/components/profiles/ActivityFeed";
import Photos from "@/src/components/profiles/Photos";
import Reviews from "@/src/components/profiles/Reviews";
import Forums from "@/src/components/profiles/Forums";
import SettingsMenu from "@/src/components/accounts/SettingsMenu";


type UserData = {
  displayName?: string;
  photoURL?: string;
  location?: string;
  joinedDate?: string; // Bạn có thể lưu kiểu Date hoặc string
  helpfulVotes?: number;
  // ...các trường khác bạn muốn
};



export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData>({});
  const [loading, setLoading] = useState(true);
  // tạo state để theo dõi tab đang được chọn
  const [activeTab, setActiveTab] = useState<"activity" | "photos" | "reviews" | "forums">("activity");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      const ref = doc(db, "users", currentUser.uid);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        setUserData(snapshot.data() as UserData);
      }
      setLoading(false);
    };

    fetchUserData();
  }, [currentUser]);

  if (loading) return <div className="p-6">Loading...</div>;

  // Nếu user chưa có tên hiển thị, ta dùng fallback
  const displayName = userData.displayName || currentUser?.displayName || "Your Name";
  // Location, joinedDate, helpfulVotes demo
  const location = userData.location || "Da Nang, Vietnam";
  const joinedDate = userData.joinedDate || "Mar 2025";
  const helpfulVotes = userData.helpfulVotes || 2;

  return (
    <>
    <Header />
      {/* Cover section (nền xám) */}
      <div className="w-full h-40 md:h-60 relative overflow-hidden rounded">
        <img 
          src="/assets/images/Cover.jpg" // 👈 Thay ảnh mặc định ở đây
          alt="Cover"
          className="object-cover w-full h-full"
        />
      {/* Xữ lý thay đổi hình ở đây  */}
          {/*  <button
              className="absolute top-1/2 left-1/2 
                        -translate-x-1/2 -translate-y-1/2 
                        flex items-center gap-2 
                        bg-white bg-opacity-60 px-4 py-2 rounded 
                        text-gray-700 hover:text-black transition"
              onClick={() => {
                // Logic upload ảnh cover
              }}
            >
              <FaImage className="w-5 h-5" />
              <span className="text-sm md:text-base font-medium">Change cover photo</span>
            </button>
          */}
      </div>


      <div className="bg-gray-100 min-h-screen">
        {/* Profile Header */}
        <div className="bg-white border-b border-gray-300 md:p-6">
          <div className="w-full px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-full flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4 sm:py-6">
                {/* Ảnh đại diện, họ tên, 3 nút phía dưới đặt bên trái*/}
                <div className="flex flex-row items-end -mt-12">
                  {/* Avatar */}
                  <div className="relative w-20 h-20 rounded-full bg-gray-200 overflow-hidden shrink-0">
                    {userData.photoURL ? (
                      <Image
                        src={userData.photoURL}
                        alt={displayName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      // Nếu không có photoURL, hiển thị nút “Add your own photo”
                      <button className="w-full h-full text-sm text-gray-500">
                        Add your own photo
                      </button>
                    )}
                  </div>

                  {/* Thông tin Tên người dùng 3 nút dưới avatar */}
                  <div className="flex-1 px-2 md:px-4 ">
                    <h1 className="text-2xl font-semibold">{displayName}</h1>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <p className="mr-4">Contributions <span className="font-semibold">0</span></p>
                      <p className="mr-4">Followers <span className="font-semibold">0</span></p>
                      <p className="mr-4">Following <span className="font-semibold">0</span></p>
                    </div>
                  </div>

                </div>

                {/* Nút bên phải */}
                <div className="w-full sm:w-auto flex border rounded mt-3 sm:mt-0 sm:-mt-12">
                  {/* Edit Profile button */}
                  <button className="w-full px-4 py-1.5 text-sm font-semibold text-gray-800 ">
                    Edit profile
                  </button>

                  {/* Divider line */}
                  <div className="w-px bg-gray-300" />
                    <div></div>
                    
                  {/* Settings button */}
                    <SettingsMenu />
                </div>

                </div>
              </div>

              {/* Thanh menu hoạt động */}
              <div className="w-full px-4 md:px-8 mx-auto border-t border-gray-300">
                <div className="flex flex-wrap gap-4 py-3 text-sm">
                  <button onClick={() => setActiveTab("activity")}  className="text-gray-700 hover:underline hover:decoration-[#00d289] hover:decoration-2 hover:underline-offset-4 ">Activity feed</button>
                  <button onClick={() => setActiveTab("photos")} className="text-gray-700 hover:underline hover:decoration-[#00d289] hover:decoration-2 hover:underline-offset-4 ">Photos</button>
                  <button onClick={() => setActiveTab("reviews")} className="text-gray-700 hover:underline hover:decoration-[#00d289] hover:decoration-2 hover:underline-offset-4 ">Reviews</button>
                  <button onClick={() => setActiveTab("forums")}className="text-gray-700 hover:underline hover:decoration-[#00d289] hover:decoration-2 hover:underline-offset-4 ">Forums</button>
                </div> 
              </div>
        </div>


        {/* Main content */}
        <div className="w-full px-4 md:px-8 mx-auto py-6 md:flex md:gap-6">
          {/* Cột trái: Achievements + Intro */}
          <div className="w-full md:w-1/4 space-y-6">
            {/* Your Achievements */}
            <div className="bg-white p-4 rounded shadow-sm">
              <h2 className="font-semibold mb-3 ">Your Achievements</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <p>• Your first review</p>
                <p>• Upload your first photo</p>
              </div>
              <Button variant="ghost" className="mt-3">View all</Button>
            </div>

            {/* Intro / Thông tin cá nhân */}
            <div className="bg-white p-4 rounded shadow-sm">
              <h2 className="font-semibold mb-3">Intro</h2>
              <ul className="text-sm  text-gray-700 space-y-3">
                <li>{location}</li>
                <li>Joined {joinedDate}</li>
                <li>{helpfulVotes} helpful votes</li>
                <li className="text-[#00d289] hover:underline cursor-pointer">
                  Share your travel advice
                </li>
              </ul>
            </div>

            {/* Share your travel advice / Chia sẽ lời gợi ý về chuyến du lịch */}
            <div className="bg-white p-4 rounded shadow-sm">
              <h2 className="font-semibold mb-3">Share your travel advice</h2>
              <div className=" text-sm text-gray-700 space-y-3 ">
                <p className="flex items-center gap-2 font-semibold hover:underline underline-offset-2">
                  <FaImage className="w-4 h-4" />
                  Post photos
                </p>
                <p className="flex items-center gap-2 font-semibold hover:underline underline-offset-2">
                  <FaPen className="w-4 h-4" />
                  Write review
                </p>
              </div>
            </div>

          </div>
        
        {/* Ứng với mỗi task; nó sẽ gọi một thành phần hiển thị ở đây*/}

          {/* Cột phải: Forum block (hoặc nội dung tuỳ ý) */}
          <div className="w-full md:w-2/3 mt-6 md:mt-0 space-y-6">
            {activeTab === "activity" && <ActivityFeed />}
            {activeTab === "photos" && <Photos />}
            {activeTab === "reviews" && <Reviews />}
            {activeTab === "forums" && <Forums />}
          </div>
        </div>
      </div>
    <Footer />
    </>
  );
}

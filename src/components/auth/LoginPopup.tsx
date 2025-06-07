import { useState } from "react";
import { FaGoogle, FaEnvelope } from "react-icons/fa";
import { X } from "lucide-react";
import SigninPopup from "@/src/components/auth/SigninPopup";
import { signInWithGoogle } from "@/src/components/auth/authService";

// Tạo interface này để đóng popup khi cần
interface LoginPopupProps {
  onClose: () => void;
}

export default function LoginPopup({ onClose }: LoginPopupProps) {

  // Khai báo trạng thái của đăng nhập Signin là hiden
  const [showSignin, setShowSignin] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      console.log("User signed in:", user);

      // ✅ Đóng popup sau khi đăng nhập thành công
      onClose();
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  return (
    <div className="p-3 fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-96 relative">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img
            src="/assets/images/BipBip_logo1.png"
            alt="BipBip Logo"
            className="w-32 h-10"
          />
        </div>

        <div className="text-center">
          <h2 className="text-xl text-gray-600 font-semibold mb-4">
            Sign in to unlock the best of <br />Bíp Bíp.
          </h2>

          {/* Continue with Google */}
          <button 
            className="flex text-gray-600 items-center justify-center w-full border py-2 rounded-lg mb-3 hover:bg-[#00d289] transition"
            onClick={handleGoogleSignIn}
          >
            <FaGoogle className="mr-2" /> Continue with Google
          </button>

          {/* Continue with Email thì (Mở SigninPopup) */}
          <button
            className="flex text-gray-600 items-center justify-center w-full border py-2 rounded-lg hover:bg-[#00d289] transition"
            onClick={() => setShowSignin(true)}
          >
            <FaEnvelope className="mr-2" /> Continue with Email
          </button>

          <p className="text-xs text-gray-500 mt-4">
            By proceeding, you agree to our{" "}
            <a href="#" className="underline">
              Terms of Use
            </a>{" "}
            and confirm you have read our{" "}
            <a href="#" className="underline">
              Privacy and Cookie Statement
            </a>.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This site is protected by reCAPTCHA and the Google{" "}
            <a href="#" className="underline">
              Privacy Policy
            </a>{" "}
            and
            <a href="#" className="underline"> Terms of Service</a> apply.
          </p>
        </div>
      </div>

      {/* Popup Signin xuất hiện khi bấm "Continue with Email" */}
      {showSignin && <SigninPopup onClose={() => setShowSignin(false)} />}
    </div>
  );
}

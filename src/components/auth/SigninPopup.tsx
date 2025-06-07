import { useState } from "react";
import { X } from "lucide-react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { handleEmailLoginAndStoreUser } from "@/src/components/auth/handleEmailLoginAndStoreUser";
import SignupPopup from "@/src/components/auth/SignupPopup";

export default function SigninPopup({ onClose }: { onClose: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showSignup, setShowSignup] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    try {
      setErrorMessage("");
      await handleEmailLoginAndStoreUser(email, password);
      onClose(); // đóng popup sau khi đăng nhập thành công
    } catch (error: any) {
      setErrorMessage(error.message || "Đăng nhập thất bại.");
    }
  };

  return (
    <div className="font-sans p-3 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-96 relative">
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        <div className="flex justify-center mb-4">
          <img
            src="/assets/images/BipBip_logo1.png"
            alt="BipBip Logo"
            className="w-32 h-10"
          />
        </div>

        <h2 className="text-2xl text-gray-600 font-bold text-center mb-6">Welcome back.</h2>

        <label className="block text-gray-600 font-semibold text-sm mb-1">Email address</label>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg p-2 mb-4 focus:ring focus:ring-blue-300 outline-none"
        />

        <label className="block text-gray-600 font-semibold text-sm mb-1">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg p-2 pr-10 focus:ring focus:ring-blue-300 outline-none"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-3 flex items-center text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {errorMessage && (
          <p className="text-red-500 text-sm text-center mt-2">{errorMessage}</p>
        )}

        <a href="#" className="text-[#00d289] text-sm mt-2 inline-block">
          Forgot password?
        </a>

        <button
          onClick={handleLogin}
          className="flex text-gray-600 items-center justify-center w-full border py-2 rounded-lg mt-2 mb-3 hover:bg-[#00d289] transition"
        >
          Sign in
        </button>

        <div className="flex items-center my-4">
          <hr className="flex-1" />
          <span className="mx-2 text-gray-500 text-sm">Not a member?</span>
          <hr className="flex-1" />
        </div>

        <p className="text-center text-gray-600 text-sm">
          <a
            href="#"
            className="font-bold underline text-[#00d289]"
            onClick={(e) => {
              e.preventDefault();
              setShowSignup(true);
            }}
          >
            Join
          </a>{" "}
          to unlock the best of <br />Bíp Bíp.
        </p>

        <p className="text-xs text-gray-500 mt-4 text-center">
          By proceeding, you agree to our{" "}
          <a href="#" className="underline">Terms of Use</a> and confirm you have read our{" "}
          <a href="#" className="underline">Privacy and Cookie Statement</a>.
        </p>
        <p className="text-xs text-gray-500 text-center mt-1">
          This site is protected by reCAPTCHA and the Google{" "}
          <a href="#" className="underline">Privacy Policy</a> and{" "}
          <a href="#" className="underline">Terms of Service</a> apply.
        </p>
      </div>

     {/* ✅ Hiển thị SignupPopup nếu được bật */}
      {showSignup && (
          <SignupPopup
            onClose={() => setShowSignup(false)}
            onSwitchToSignin={() => setShowSignup(false)} // ✅ Bổ sung prop bắt buộc
          />
        )}
    </div>
  );
}

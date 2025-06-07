"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/src/firebaseConfig"; // Nhớ export db từ firebaseConfig.ts

interface SignupPopupProps {
  onClose: () => void;
  onSwitchToSignin: () => void;
}

export default function SignupPopup({ onClose, onSwitchToSignin }: SignupPopupProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim()
      );
      const user = userCredential.user;

      // Lưu thông tin vào Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: `${firstName} ${lastName}`.trim(),
        email: user.email,
        photoURL: user.photoURL || "",
        role: "Customer",
        createdAt: serverTimestamp(),
      });

      console.log("User created and saved to Firestore!");
      onClose(); // Đóng popup sau khi tạo thành công
    } catch (err: any) {
      setError(err.message);
      console.error("Signup error:", err);
    }
  };

  return (
    <div className="font-sans p-3 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-96 relative">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src="/assets/images/BipBip_logo1.jpg" alt="Logo" className="w-24 h-10" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-6">
          Join to unlock the best of <br />Bíp Bíp
        </h2>

        {/* Name fields */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-1/2 border rounded-lg p-2 focus:ring focus:ring-blue-300 outline-none"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-1/2 border rounded-lg p-2 focus:ring focus:ring-blue-300 outline-none"
          />
        </div>

        {/* Email */}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg p-2 mb-4 focus:ring focus:ring-blue-300 outline-none"
        />

        {/* Password */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
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

        {/* Error message */}
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        {/* Join Button */}
        <button
          onClick={handleSignup}
          className="flex items-center justify-center w-full border py-2 rounded-lg mt-2 mb-3 hover:bg-[#00d289] transition"
        >
          Join
        </button>

        {/* Already a member */}
        <div className="flex items-center my-4">
          <hr className="flex-1" />
          <span className="mx-2 text-gray-500 text-sm">Already a member?</span>
          <hr className="flex-1" />
        </div>

        <p className="text-center text-sm ">
          <a
            href="#"
            className="font-bold underline text-[#00d289]"
            onClick={(e) => {
              e.preventDefault();
              onSwitchToSignin();
            }}
          >
            Sign in
          </a>{" "}
          using your Bíp Bíp account.
        </p>

        {/* Terms */}
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
    </div>
  );
}

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { handleEmailLoginAndStoreUser } from '@/src/components/auth/handleEmailLoginAndStoreUser';
import SignupPopup from '@/src/components/auth/SignupPopup';
import { useTranslation } from 'react-i18next';

export default function SigninPopup({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('common');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSignup, setShowSignup] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage(t('signin_popup.fill_all_fields'));
      return;
    }

    try {
      setErrorMessage('');
      await handleEmailLoginAndStoreUser(email, password);
      onClose(); // Close popup on success
    } catch (error: any) {
      setErrorMessage(error.message || t('signin_popup.login_failed'));
    }
  };

  return (
    <div className="font-sans p-3 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-96 relative">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
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

        <h2 className="text-2xl text-gray-600 font-bold text-center mb-6">
          {t('signin_popup.welcome')}
        </h2>

        {/* Email */}
        <label className="block text-gray-600 font-semibold text-sm mb-1">
          {t('signin_popup.email_label')}
        </label>
        <input
          type="email"
          placeholder={t('signin_popup.email_placeholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg p-2 mb-4 focus:ring focus:ring-blue-300 outline-none"
        />

        {/* Password */}
        <label className="block text-gray-600 font-semibold text-sm mb-1">
          {t('signin_popup.password_label')}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('signin_popup.password_placeholder')}
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

        {/* Error Message */}
        {errorMessage && (
          <p className="text-red-500 text-sm text-center mt-2">{errorMessage}</p>
        )}

        <a href="#" className="text-[#00d289] text-sm mt-2 inline-block">
          {t('signin_popup.forgot_password')}
        </a>

        {/* Sign In Button */}
        <button
          onClick={handleLogin}
          className="flex text-gray-600 items-center justify-center w-full border py-2 rounded-lg mt-2 mb-3 hover:bg-[#00d289] transition"
        >
          {t('signin_popup.signin')}
        </button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <hr className="flex-1" />
          <span className="mx-2 text-gray-500 text-sm">
            {t('signin_popup.not_a_member')}
          </span>
          <hr className="flex-1" />
        </div>

        {/* Join CTA */}
        <p className="text-center text-gray-600 text-sm">
          <a
            href="#"
            className="font-bold underline text-[#00d289]"
            onClick={(e) => {
              e.preventDefault();
              setShowSignup(true);
            }}
          >
            {t('signin_popup.join')}
          </a>{' '}
          {t('signin_popup.unlock_bipbip')}
        </p>

        {/* Legal Note */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          {t('signin_popup.agree_prefix')}{' '}
          <a href="#" className="underline">
            {t('signin_popup.terms_of_use')}
          </a>{' '}
          {t('signin_popup.and_read')}{' '}
          <a href="#" className="underline">
            {t('signin_popup.privacy_statement')}
          </a>.
        </p>
        <p className="text-xs text-gray-500 text-center mt-1">
          {t('signin_popup.recaptcha_note')}{' '}
          <a href="#" className="underline">
            {t('signin_popup.google_privacy')}
          </a>{' '}
          {t('signin_popup.and')}{' '}
          <a href="#" className="underline">
            {t('signin_popup.google_terms')}
          </a>{' '}
          {t('signin_popup.apply')}.
        </p>
      </div>

      {/* Show Signup Popup */}
      {showSignup && (
        <SignupPopup
          onClose={() => setShowSignup(false)}
          onSwitchToSignin={() => setShowSignup(false)}
        />
      )}
    </div>
  );
}

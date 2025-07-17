'use client';

import { useState } from 'react';
import { FaGoogle, FaEnvelope } from 'react-icons/fa';
import { X } from 'lucide-react';
import SigninPopup from '@/src/components/auth/SigninPopup';
import { useAuthService } from '@/src/components/auth/authService';
import { useTranslation } from 'react-i18next';

interface LoginPopupProps {
  onClose: () => void;
}

export default function LoginPopup({ onClose }: LoginPopupProps) {
  const { t } = useTranslation('common');
  const { signInWithGoogle } = useAuthService();
  const [showSignin, setShowSignin] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      console.log('User signed in:', user);
      onClose(); // ✅ Close popup on success
    } catch (error) {
      console.error('Google Sign-In Error:', error);
    }
  };

  return (
    <div className="p-3 fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
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
            {t('login_popup.title')}
          </h2>

          {/* Sign in with Google */}
          <button
            className="flex text-gray-600 items-center justify-center w-full border py-2 rounded-lg mb-3 hover:bg-[#00d289] transition"
            onClick={handleGoogleSignIn}
          >
            <FaGoogle className="mr-2" />
            {t('login_popup.continue_with_google')}
          </button>

          {/* Sign in with Email */}
          <button
            className="flex text-gray-600 items-center justify-center w-full border py-2 rounded-lg hover:bg-[#00d289] transition"
            onClick={() => setShowSignin(true)}
          >
            <FaEnvelope className="mr-2" />
            {t('login_popup.continue_with_email')}
          </button>

          <p className="text-xs text-gray-500 mt-4">
            {t('login_popup.agree_prefix')}{' '}
            <a href="#" className="underline">
              {t('login_popup.terms_of_use')}
            </a>{' '}
            {t('login_popup.and_read')}{' '}
            <a href="#" className="underline">
              {t('login_popup.privacy_statement')}
            </a>.
          </p>

          <p className="text-xs text-gray-500 mt-2">
            {t('login_popup.recaptcha_note')}{' '}
            <a href="#" className="underline">
              {t('login_popup.google_privacy')}
            </a>{' '}
            {t('login_popup.and')}{' '}
            <a href="#" className="underline">
              {t('login_popup.google_terms')}
            </a>{' '}
            {t('login_popup.apply')}.
          </p>
        </div>
      </div>

      {/* Signin popup on email login */}
      {showSignin && (
        <SigninPopup
          onClose={() => {
            setShowSignin(false); // hide child
            onClose(); // hide parent
          }}
        />
      )}
    </div>
  );
}

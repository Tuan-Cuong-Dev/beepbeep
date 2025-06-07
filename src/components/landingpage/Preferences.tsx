import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PreferencesProps {
  onClose: () => void;
}

export default function Preferences({ onClose }: PreferencesProps) {
  const [activeTab, setActiveTab] = useState('region');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-lg relative">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold mb-4">Preferences</h2>

        {/* Tabs */}
        <div className="flex space-x-4 border-b mb-4">
          <button
            className={`pb-2 ${activeTab === 'region' ? 'border-b-2 border-black font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab('region')}
          >
            Region & Language
          </button>
          <button
            className={`pb-2 ${activeTab === 'currency' ? 'border-b-2 border-black font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab('currency')}
          >
            Currency
          </button>
        </div>

        {/* Content */}
        {activeTab === 'region' ? (
          <div>
            <h3 className="text-lg font-medium mb-2">Select Region | Language</h3>
            <div className="text-sm grid grid-cols-4 gap-3">
              {[
                'Vietnam 🇻🇳',
                'English (UK) 🇬🇧',
                'Japan 🇯🇵',
                'China 🇨🇳',
                'South Korea 🇰🇷',
                'Russia 🇷🇺',
                'France 🇫🇷',
                'Germany 🇩🇪',
                'Italy 🇮🇹',
                'Spain 🇪🇸',
                'Portugal 🇵🇹',
                'Saudi Arabia 🇸🇦',
              ].map((region) => (
                <button
                  key={region}
                  className="p-2 rounded-lg border hover:bg-[#00d289] transition "
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium mb-2">Select Currency</h3>
            <div className="text-sm grid grid-cols-4 gap-4">
              {[
                'VND (Vietnamese Dong)',
                'GBP (British Pound Sterling)',
                'JPY (Japanese Yen)',
                'CNY (Chinese Yuan)',
                'KRW (South Korean Won)',
                'RUB (Russian Ruble)',
                'EUR (Euro)',
                'SAR (Saudi Riyal)',
              ].map((currency) => (
                <button
                  key={currency}
                  className="p-2 rounded-lg border hover:bg-[#00d289] transition "
                >
                  {currency}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-sm text-gray-500 mt-4">
          All preference changes are optional and will be saved for your session.
        </p>
      </div>
    </div>
  );
}

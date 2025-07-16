'use client';

import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQ() {
  const { t } = useTranslation('common');
  const faqs = t('faqSection.faqs', { returnObjects: true }) as {
    question: string;
    answer: string;
  }[];

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!Array.isArray(faqs)) return null;

  return (
    <section className="font-sans px-4 py-10 bg-gray-50 text-center">
      <div className="container mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          {t('faqSection.title')}
        </h2>

        {/* Mobile: scrollable cards */}
        <div className="block sm:hidden overflow-x-auto pb-4">
          <div className="flex gap-4 w-max">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="min-w-[280px] max-w-[280px] p-4 bg-white rounded-lg shadow-md border hover:shadow-lg transition-transform hover:-translate-y-1 text-left"
              >
                <button
                  className="w-full flex justify-between items-center text-left text-base font-semibold text-[#00d289] focus:outline-none"
                  onClick={() => toggleFAQ(index)}
                >
                  <span>{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {openIndex === index && (
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: grid layout */}
        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6 text-left">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="p-6 bg-white rounded-lg shadow-md border hover:shadow-xl transition-transform hover:-translate-y-1"
            >
              <button
                className="w-full flex justify-between items-center text-left text-lg font-semibold text-[#00d289] focus:outline-none"
                onClick={() => toggleFAQ(index)}
              >
                <span>{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {openIndex === index && (
                <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: 'How do I swap batteries at a station?',
    answer:
      'When you rent an electric vehicle from Bíp Bíp, we provide clear instructions on how to use our smart battery swapping stations. You can swap batteries yourself using your Bíp Bíp account at any supported location.',
  },
  {
    question: 'What accessories come with the rental vehicle?',
    answer:
      'Each vehicle comes with two helmets, two raincoats, and a charger (if needed). Some vehicles may also include a phone holder, rear carrier, or extra storage depending on the model.',
  },
  {
    question: 'Which vehicle types are available on Bíp Bíp?',
    answer:
      'We offer a wide range of vehicles including electric motorbikes, bicycles, electric cars, vans, and more – all suited for both tourism and delivery needs.',
  },
  {
    question: 'What should I do if I encounter a problem on the road?',
    answer:
      'In case of accidents, breakdowns, or any issues, please contact our hotline or request roadside assistance directly through the app. Our technicians will assist you promptly.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="px-4 py-12 bg-gray-50 w-full">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          What Would You Like to Ask?
        </h2>
        <div className="bg-white shadow-xl rounded-xl divide-y">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <button
                className="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-800 focus:outline-none"
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

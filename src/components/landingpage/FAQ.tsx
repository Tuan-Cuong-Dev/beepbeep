"use client";
import { useState } from "react";

const faqs = [
  {
    question: "How to Swap Battery at ATM Battery Station?",
    answer:
      "With an extremely smart and convenient solution, when you rent a bike, we will guide you on how to swap the battery at the station. When you travel to tourist cities, you can swap the battery yourself using your existing account.",
  },
  {
    question: "What equipment comes with the electric motorbike?",
    answer:
      "Each bike is equipped with two helmets, two raincoats, and a charger. Additionally, all electric bikes have a phone holder, making it easy for you to explore the city and surrounding areas.",
  },
  {
    question: "Which electric motorbike models are available?",
    answer:
      "We currently provide the most popular and reliable electric motorbike models in Vietnam - Selex Camel, Evgo C, Evgo D, Vinfast Evo Lite.",
  },
  {
    question: "What should I do in case of a traffic incident?",
    answer:
      "If you encounter a traffic incident, please contact us immediately via our hotline for the fastest support. Also, comply with traffic regulations to ensure safety.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="p-4 w-full mx-auto bg-gray-100">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">What Would You Like to Ask?</h2>
      <div className="bg-white shadow-lg p-4 rounded-lg">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b border-gray-300 py-3">
            <div
              role="button"
              tabIndex={0}
              className="flex justify-between items-center w-full text-left text-md text-gray-800 font-semibold cursor-pointer"
              onClick={() => toggleFAQ(index)}
              onKeyDown={(e) => e.key === "Enter" && toggleFAQ(index)}
            >
              <span>{faq.question}</span>
              <span>{openIndex === index ? "▲" : "▼"}</span>
            </div>
            {openIndex === index && <p className="text-sm mt-2 text-gray-700">{faq.answer}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
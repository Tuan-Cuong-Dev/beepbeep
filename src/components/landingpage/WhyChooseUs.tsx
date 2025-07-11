'use client';

import { useEffect, useState } from 'react';

const roles = [
  {
    id: 1,
    title: "Customers",
    description:
      "Easily book vehicle rentals, request roadside assistance, and access trustworthy repair and maintenance services anywhere.",
  },
  {
    id: 2,
    title: "Staff",
    description:
      "Manage rentals, assist customers, update vehicle statuses, and coordinate service requests – all from one platform.",
  },
  {
    id: 3,
    title: "Station Managers",
    description:
      "Oversee station operations, manage inventory and staff, and ensure smooth vehicle dispatch and returns every day.",
  },
  {
    id: 4,
    title: "Company Owners",
    description:
      "Monitor fleet usage, customer trends, and financial performance in real-time. Expand your vehicle business with confidence.",
  },
  {
    id: 5,
    title: "Technicians",
    description:
      "Get assigned repair tasks, track issue histories, and manage vehicle service records with efficient digital tools.",
  },
  {
    id: 6,
    title: "Private Owners",
    description:
      "List your personal vehicles for rent or service on our platform and earn income while retaining full ownership control.",
  },
  {
    id: 7,
    title: "Investors",
    description:
      "Track your investment performance, view reports by region or company, and support a growing, eco-driven vehicle service network.",
  },
  {
    id: 8,
    title: "Agents (Collaborators)",
    description:
      "Connect customers with the right vehicle services, earn commission transparently, and grow your own partner network.",
  },
];


export default function WhyChooseUs() {
  return (
    <section className="font-sans px-4 py-10 bg-gray-50 text-center">
      <div className="container mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Why Everyone Benefits from Our Platform
        </h2>

        {/* Mobile: horizontal scroll */}
        <div className="block sm:hidden overflow-x-auto pb-4">
          <div className="flex gap-4 w-max">
            {roles.map((role) => (
              <div
                key={role.id}
                className="min-w-[260px] max-w-[260px] p-4 bg-white rounded-lg shadow-md border hover:shadow-lg transition-transform hover:-translate-y-1"
              >
                <h3 className="text-lg font-semibold text-[#00d289]">
                  {role.title}
                </h3>
                <p className="text-sm text-gray-700 mt-2">{role.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: grid layout */}
        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {roles.map((role) => (
            <div
              key={role.id}
              className="p-6 bg-white rounded-lg shadow-md border hover:shadow-xl transition-transform hover:-translate-y-1"
            >
              <h3 className="text-xl font-semibold text-[#00d289]">{role.title}</h3>
              <p className="text-sm text-gray-700 mt-3">{role.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

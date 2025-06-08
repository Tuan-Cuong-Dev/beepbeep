'use client';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <Header />

      <main className="flex-grow max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6 text-center">About Us</h1>

        <div className="space-y-5 leading-relaxed text-justify text-base">
          <p>
            At <strong>Bíp Bíp</strong>, we are building an advanced platform that transforms how electric vehicle rentals are managed and scaled.
            Our system empowers multiple stakeholders to participate in a transparent and efficient rental ecosystem — from customers and staff to investors, technicians, and business owners.
          </p>

          <p>
            Our goal is to streamline all rental operations — from booking, maintenance, staff coordination, to performance tracking —
            making it easy for anyone to join the growing e-mobility movement.
          </p>

          <p>
            Whether you're a customer looking for a reliable ride, a technician handling maintenance requests,
            a company owner managing fleets, or even an investor tracking ROI — <strong>Bíp Bíp</strong> provides the right tools for you.
          </p>

          <p>Our platform supports:</p>

          <ul className="list-disc list-inside mt-3 space-y-1">
            <li><strong>Customers</strong> – Convenient rentals, flexible delivery options, and access to quality electric bikes anytime.</li>
            <li><strong>Staff</strong> – Tools to manage orders, assist users, and handle bikes in real-time.</li>
            <li><strong>Station Managers</strong> – Operational oversight, performance tracking, and staff management.</li>
            <li><strong>Company Owners</strong> – Centralized control, business analytics, and confident scaling.</li>
            <li><strong>Technicians</strong> – Maintenance tracking, service history, and task assignments.</li>
            <li><strong>Private Owners</strong> – Earn from listed vehicles with full transparency.</li>
            <li><strong>Investors</strong> – Insight into ROI and sustainable business performance.</li>
            <li><strong>Agents</strong> – Commission-based referrals through user-friendly tools.</li>
          </ul>

          <p>
            We are committed to shaping a smarter, greener future for transportation in Vietnam and beyond.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

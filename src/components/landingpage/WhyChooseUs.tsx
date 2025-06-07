// components/WhyChooseUs.tsx

'use client';

const roles = [
  {
    id: 1,
    title: "Customers",
    description:
      "Enjoy convenient rentals, flexible delivery options, and access to high-quality electric bikes anytime, anywhere.",
  },
  {
    id: 2,
    title: "Staff",
    description:
      "Use a streamlined platform to manage rentals, assist customers, and track bikes efficiently in real-time.",
  },
  {
    id: 3,
    title: "Station Managers",
    description:
      "Oversee daily operations at your rental station, manage staff, optimize resources, and monitor performance with ease.",
  },
  {
    id: 4,
    title: "Company Owners",
    description:
      "Track all operations from a centralized dashboard, analyze performance data, and scale your business confidently.",
  },
  {
    id: 5,
    title: "Technicians",
    description:
      "Receive maintenance requests instantly, track service history, and manage on-site support tasks with modern tools.",
  },
  {
    id: 6,
    title: "Private Owners",
    description:
      "List your bikes on our platform, earn passive income, and monitor usage and earnings with full transparency.",
  },
  {
    id: 7,
    title: "Investors",
    description:
      "Gain insights into business performance, track ROI, and invest in a scalable, eco-friendly mobility ecosystem.",
  },
  {
    id: 8,
    title: "Agents (Collaborators)",
    description:
      "Easily refer customers and earn commissions with a transparent tracking system and user-friendly booking tools.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="font-sans px-4 py-10 bg-gray-50 text-center">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Everyone Benefits from Our Platform</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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

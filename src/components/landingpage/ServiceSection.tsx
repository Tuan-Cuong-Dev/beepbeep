// components/ServiceSection.js
import { FaIdCard, FaMotorcycle, FaChargingStation, FaShieldAlt } from 'react-icons/fa';

const services = [
  {
    id: 1,
    icon: (
      <div className="flex flex-col items-center justify-center h-[12rem] ">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-full mb-3"
          style={{ backgroundColor: '#00d289' }}
        >
          <FaIdCard size={40} style={{ color: '#FFFFFF' }} />
        </div>
        <h3 className="text-lg font-bold text-gray-800">No Driver's License Required</h3>
        <p className="text-sm mt-2 text-center text-gray-700">
          They are classified as license-free vehicles internationally.
        </p>
      </div>
    ),
  },

  {
    id: 2,
    icon: (
      <div className="flex flex-col items-center justify-center h-[12rem]">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-full mb-3"
          style={{ backgroundColor: '#00d289' }}
        >
          <FaChargingStation size={40} style={{ color: '#FFFFFF' }} />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Fast Charging Stations</h3>
        <p className="text-sm mt-2 text-center text-gray-700">
          Convenient <span className="font-semibold" style={{ color: '#00d289' }}>2-minute battery swap</span> system ensures uninterrupted travel.
        </p>
      </div>
    ),
  },

  {
    id: 3,
    icon: (
      <div className="flex flex-col items-center justify-center h-[12rem]">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-full mb-3"
          style={{ backgroundColor: '#00d289' }}
        >
          <FaMotorcycle size={40} style={{ color: '#FFFFFF' }} />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Variety of Vehicles</h3>
        <p className="text-sm mt-2 text-center text-gray-700">
          Offering a wide range of electric motorbikes to suit all travel needs.
        </p>
      </div>
    ),
  },

  {
    id: 4,
    icon: (
      <div className="flex flex-col items-center justify-center h-[12rem]">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-full mb-3"
          style={{ backgroundColor: '#00d289' }}
        >
          <FaShieldAlt size={40} style={{ color: '#FFFFFF' }} />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Safety & Insurance</h3>
        <p className="text-sm mt-2 text-center text-gray-700">
          Comprehensive vehicle insurance for absolute user safety.
        </p>
      </div>
    ),
  },
];

export default function ServiceSection() {
  return (
    <section className="font-sans py-12 px-3 bg-gray-100 text-center">
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Electric Vehicle Rental Services
        </h2>

        <p className="p-6 text-md text-gray-700 max-w-2xl mx-auto leading-relaxed mb-6 ">
          Experience an <span className="font-semibold text-[#00d289]">affordable</span>,
          <span className="font-semibold text-[#00d289]"> eco-friendly</span> ride.
          Ideal for adventures in <span className="font-semibold text-[#00d289]">Vietnam</span>.
          Fast electric vehicle delivery service across the city.
        </p>

        <div className="grid grid-cols-2 gap-1 md:grid-cols-4 gap-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="transition-transform transform hover:-translate-y-1"
            >
              <div className="bg-white p-6 bg-gray-100 rounded-lg shadow-md">{service.icon}</div>
              <h3 className="text-lg font-semibold">{service.title}</h3>
              <p className="text-sm text-gray-700 mt-2">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

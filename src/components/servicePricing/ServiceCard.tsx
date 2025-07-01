import Image from 'next/image';
import { ServicePricing } from '@/src/lib/servicePricing/servicePricingTypes';

interface Props {
  service: ServicePricing;
  onContact?: () => void;
}

export default function ServiceCard({ service, onContact }: Props) {
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-md transition-all duration-300 p-4 h-full flex flex-col justify-between">
      {service.imageUrl && (
        <Image
          src={service.imageUrl}
          alt={service.title}
          width={300}
          height={180}
          className="rounded-md mb-3 object-cover w-full h-[180px]"
        />
      )}
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{service.title}</h3>
      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{service.description}</p>
      <ul className="text-sm text-gray-500 mb-3 list-disc pl-5 space-y-1">
        {service.features.slice(0, 2).map((feature, i) => (
          <li key={i}>{feature}</li>
        ))}
      </ul>
      <div className="mt-auto text-right font-semibold text-[#00d289]">
        {service.price.toLocaleString()} ₫
      </div>
    </div>
  );
}

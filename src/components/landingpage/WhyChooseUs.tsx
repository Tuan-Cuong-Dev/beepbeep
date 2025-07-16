'use client';

import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export default function WhyChooseUs() {
  const { t } = useTranslation('common');
  const [mounted, setMounted] = useState(false);
  const [roles, setRoles] = useState<{ title: string; description: string }[]>([]);

  useEffect(() => {
    setMounted(true);
    const fetchedRoles = t('whyChooseUs.roles', { returnObjects: true });
    setRoles(Array.isArray(fetchedRoles) ? fetchedRoles : []);
  }, [t]);

  if (!mounted) return null; // hoặc loading...

  return (
    <section className="font-sans px-4 py-10 bg-gray-50 text-center">
      <div className="container mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          {t('whyChooseUs.title')}
        </h2>

        {/* Mobile: horizontal scroll */}
        <div className="block sm:hidden overflow-x-auto pb-4">
          <div className="flex gap-4 w-max">
            {roles.map((role, index) => (
              <div
                key={index}
                className="min-w-[260px] max-w-[260px] p-4 bg-white rounded-lg shadow-md border hover:shadow-lg transition-transform hover:-translate-y-1"
              >
                <h3 className="text-lg font-semibold text-[#00d289]">{role.title}</h3>
                <p className="text-sm text-gray-700 mt-2">{role.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: grid layout */}
        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {roles.map((role, index) => (
            <div
              key={index}
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

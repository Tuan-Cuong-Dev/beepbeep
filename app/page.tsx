'use client';

import Head from 'next/head';
import { usePreferences } from '@/src/hooks/usePreferences';
import { useUser } from '@/src/context/AuthContext';
import { useAutoDetectLanguage } from '@/src/hooks/useAutoDetectLanguage';

import Header from '@/src/components/landingpage/Header';
import Hero from '@/src/components/landingpage/Hero';
import StationSection from '@/src/components/landingpage/StationSection';
import TechnicianPartnerSection from '@/src/components/landingpage/TechnicianPartnerSection';
import ServicePricingSection from '@/src/components/landingpage/ServicePricingSection';
import Bipbip365Section from '@/src/components/landingpage/Bipbip365Section';
import VehicleModelsSection from '@/src/components/landingpage/VehicleModelsSection';
import BatteryStationCounter from '@/src/components/landingpage/BatteryStationCounter';
import BatteryChargingStationCounter from '@/src/components/landingpage/BatteryChargingStationCounter';
import WhyChooseUs from '@/src/components/landingpage/WhyChooseUs';
import FAQ from '@/src/components/landingpage/FAQ';
import Footer from '@/src/components/landingpage/Footer';

const Home: React.FC = () => {
  const { user } = useUser();
  const { preferences, updatePreferences } = usePreferences(user?.uid);
  // ✅ Gọi hook với đầy đủ đối số
  useAutoDetectLanguage({ preferences, updatePreferences, user });

  return (
    <>
      <Head>
        <title>Bíp Bíp - Thuê xe dễ như bấm còi!</title>
        <meta name="description" content="Dịch vụ thuê xe tiện lợi chỉ với một tiếng bíp." />
      </Head>

      <Header />
      <Hero />
      <StationSection />
      <TechnicianPartnerSection />
      {/*<VehicleModelsSection /> - Xây dựng xong hãy đưa lên cho bài bản*/}
      <BatteryStationCounter />
      <BatteryChargingStationCounter />
      <ServicePricingSection />
      <Bipbip365Section />
      <WhyChooseUs />
      <FAQ />
      <Footer />
    </>
  );
};

export default Home;

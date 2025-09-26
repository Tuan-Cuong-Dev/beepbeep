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
import WhyChooseUs from '@/src/components/landingpage/WhyChooseUs';
import BatteryStationCounter from '@/src/components/landingpage/BatteryStationCounter';
import BatteryChargingStationCounter from '@/src/components/landingpage/BatteryChargingStationCounter';
import PartnerSignupSection from '@/src/components/landingpage/PartnerSignupSection';
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
        <meta name="zalo-platform-site-verification" content="VzgkD9da8pTQqlSodE5CE5xgdmQod4XUDZ4r" />
      </Head>

      <Header />
      <Hero />
      <StationSection />
      <TechnicianPartnerSection />
      <BatteryStationCounter />
      <BatteryChargingStationCounter />
      <ServicePricingSection />
      <Bipbip365Section />
      <PartnerSignupSection/>
      <Footer />
    </>
  );
};

export default Home;

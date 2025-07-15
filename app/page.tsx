// Homepage
import Head from "next/head"; 
import Header from '../src/components/landingpage/Header';
import Hero from '../src/components/landingpage/Hero';
import ServiceSection from '../src/components/landingpage/ServiceSection';
import VehicleModelsSection from   '../src/components/landingpage/VehicleModelsSection';
import WhyChooseUs from '../src/components/landingpage/WhyChooseUs';
import Footer from '../src/components/landingpage/Footer';
import FAQ  from "@/src/components/landingpage/FAQ";
import TechnicianPartnerSection from '../src/components/landingpage/TechnicianPartnerSection';
import ServicePricingSection from "@/src/components/landingpage/ServicePricingSection";
import StationSection from "@/src/components/landingpage/StationSection";
import BatteryStationCounter from '@/src/components/landingpage/BatteryStationCounter';
import Bipbip365Section from "@/src/components/landingpage/Bipbip365Section";

const Home: React.FC = () => {
  return (
    <>
      <Head>
        <title>Bíp Bíp - Rent your ride in a beep beep!</title>
        <meta name="description" content="Thuê xe dễ như bấm còi." />
      </Head>
      <Header />
      <Hero />
      <StationSection/>
      <TechnicianPartnerSection />
      <ServicePricingSection/>
      <Bipbip365Section/>
      <VehicleModelsSection />
      <BatteryStationCounter />
      <WhyChooseUs />
      <FAQ />
        <Footer />
    </>
  );
};

export default Home;

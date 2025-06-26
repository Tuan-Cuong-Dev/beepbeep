// Homepage
import Head from "next/head"; 
import Header from '../src/components/landingpage/Header';
import Hero from '../src/components/landingpage/Hero';
import ServiceSection from '../src/components/landingpage/ServiceSection';
import EbikeModels from   '../src/components/landingpage/EbikeModels';
import WhyChooseUs from '../src/components/landingpage/WhyChooseUs';
import Footer from '../src/components/landingpage/Footer';
import FAQ  from "@/src/components/landingpage/FAQ";
import TechnicianPartnerSection from '../src/components/landingpage/TechnicianPartnerSection';

const Home: React.FC = () => {
  return (
    <>
      <Head>
        <title>EbikeRental - Rent an electric scooter to explore Vietnam!</title>
        <meta name="description" content="Dịch vụ cho thuê xe máy điện tiện lợi, an toàn và tiết kiệm." />
      </Head>
      <Header />
      <Hero />
      <ServiceSection />
      <EbikeModels />
      <TechnicianPartnerSection /> 
      <WhyChooseUs />
      <FAQ />
        <Footer />
    </>
  );
};

export default Home;

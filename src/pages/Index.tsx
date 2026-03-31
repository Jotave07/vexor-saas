import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import Niches from "@/components/landing/Niches";
import Comparison from "@/components/landing/Comparison";
import Integrations from "@/components/landing/Integrations";
import Pricing from "@/components/landing/Pricing";
import Testimonials from "@/components/landing/Testimonials";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <Features />
      <Niches />
      <Comparison />
      <Integrations />
      <Pricing />
      <Testimonials />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Index;

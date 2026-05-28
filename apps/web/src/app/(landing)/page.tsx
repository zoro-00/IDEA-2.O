import Navbar from "@/components/Navbar";
import HeroSection from "@/sections/HeroSection";
import IntelligenceSection from "@/sections/IntelligenceSection";
import GraphSection from "@/sections/GraphSection";
import IsolationForestSection from "@/sections/IsolationForestSection";
import AISection from "@/sections/AISection";
import ArchitectureSection from "@/sections/ArchitectureSection";
import FeaturesSection from "@/sections/FeaturesSection";
import CommandCenterSection from "@/sections/CommandCenterSection";
import PerformanceSection from "@/sections/PerformanceSection";
import CTASection from "@/sections/CTASection";
import Footer from "@/sections/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <HeroSection />
      <IntelligenceSection />
      <GraphSection />
      <IsolationForestSection />
      <AISection />
      <ArchitectureSection />
      <FeaturesSection />
      <CommandCenterSection />
      <PerformanceSection />
      <CTASection />
      <Footer />
    </main>
  );
}

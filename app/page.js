import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ProductExplanation from "@/components/landing/ProductExplanation";
import AccessibilityFeatures from "@/components/landing/AccessibilityFeatures";
import HowItWorks from "@/components/landing/HowItWorks";
import WorkflowVisual from "@/components/landing/WorkflowVisual";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import AccessibilityToolbar from "@/components/ui/AccessibilityToolbar";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main id="main-content" className="flex-grow">
        <Hero />
        <ProductExplanation />
        <AccessibilityFeatures />
        <HowItWorks />
        <WorkflowVisual />
        <CTA />
      </main>
      <Footer />
      <AccessibilityToolbar />
    </div>
  );
}

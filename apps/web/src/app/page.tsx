import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedVendors } from '@/components/home/FeaturedVendors';
import { TrustSection } from '@/components/home/TrustSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CTASection } from '@/components/home/CTASection';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <CategoryGrid />
      <HowItWorks />
      <FeaturedVendors />
      <TrustSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}

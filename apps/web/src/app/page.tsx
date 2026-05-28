import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedVendors } from '@/components/home/FeaturedVendors';
import { TrustSection } from '@/components/home/TrustSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CTASection } from '@/components/home/CTASection';
import { Footer } from '@/components/layout/Footer';
import { RecentlyViewed } from '@/components/vendors/RecentlyViewed';
import { WelcomeWizard } from '@/components/onboarding/WelcomeWizard';
import { LiveActivityFeed } from '@/components/engagement/SocialProof';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      {/* Live activity feed showing real-time bookings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-100">
        <LiveActivityFeed />
      </div>
      <RecentlyViewed />
      <CategoryGrid />
      <HowItWorks />
      <FeaturedVendors />
      <TrustSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
      {/* Onboarding wizard for first-time users */}
      <WelcomeWizard />
    </main>
  );
}

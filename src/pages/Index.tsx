import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { FantasyLeaguePreview } from "@/components/FantasyLeaguePreview";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { session } = useAuth();

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <FantasyLeaguePreview />
      <HowItWorks />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Index;

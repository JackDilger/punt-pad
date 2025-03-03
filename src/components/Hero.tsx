import { ChevronRight, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-50 pt-16">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(110deg,#f5f7fa,#e4e9f2)] opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(2,166,79,0.05)_1px,transparent_1px)] bg-[length:20px_20px]" />
      </div>
      
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-primary">
            Track Your Bets & Dominate Fantasy Leagues
          </h1>
          <p className="text-2xl text-primary mb-4">
            Keep Punt'n
          </p>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Take control of your bets with effortless tracking and compete in exciting fantasy leagues with friends.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/auth" className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-primary rounded-lg shadow-lg hover:bg-primary-hover transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              Start Tracking Now
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
            
            <Link to="/auth" className="inline-flex items-center px-6 py-3 text-lg font-medium text-primary bg-white border-2 border-primary rounded-lg shadow-lg hover:bg-gray-50 transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              Join Fantasy League
              <Trophy className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

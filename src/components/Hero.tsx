import { ChevronRight, Trophy, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        {/* Main gradient background - simplified */}
        <div className="absolute inset-0 bg-gradient-to-b from-white to-white" />
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(2,166,79,0.03)_1px,transparent_1px)] bg-[length:20px_20px]" />
        
        {/* Floating elements - repositioned */}
        <div className="hidden lg:block absolute top-1/3 right-[15%] w-20 h-20 rounded-xl bg-white shadow-xl border border-gray-100 rotate-12 animate-float">
          <div className="flex items-center justify-center h-full">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="hidden lg:block absolute bottom-1/4 right-[25%] w-20 h-20 rounded-xl bg-white shadow-xl border border-gray-100 -rotate-12 animate-float" style={{ animationDelay: '1s' }}>
          <div className="flex items-center justify-center h-full">
            <Trophy className="h-8 w-8 text-[#fdee21]" />
          </div>
        </div>
      </div>
      
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side: Text content */}
          <div className="text-left max-w-xl mx-auto lg:mx-0 lg:max-w-none pt-4">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-8 animate-fadeIn mt-2">
              <Star className="h-4 w-4 mr-2" />
              <span>Your betting companion</span>
            </div>
            
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 text-gray-900 leading-tight animate-slideUp">
              Track Your Bets <span className="text-primary">&</span> Dominate <span className="relative">
                Fantasy Leagues
                <span className="absolute bottom-2 left-0 w-full h-3 bg-accent/30 -z-10 skew-x-3"></span>
              </span>
            </h1>
            
            <p className="text-3xl text-primary font-heading font-bold mb-6 animate-slideUp" style={{ animationDelay: '200ms' }}>
              Keep Punt'n
            </p>
            
            <p className="text-lg text-gray-600 mb-8 animate-slideUp" style={{ animationDelay: '300ms' }}>
              Take control of your bets with effortless tracking and compete in exciting 
              fantasy leagues with friends. Join thousands of punters who've improved their 
              betting strategy with our powerful tools.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-slideUp" style={{ animationDelay: '400ms' }}>
              <Link to="/auth" className="inline-flex items-center px-6 py-4 text-lg font-medium text-white bg-primary rounded-lg shadow-lg hover:bg-primary-hover transform transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                Start Tracking Now
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
              
              <Link to="/auth" className="inline-flex items-center px-6 py-4 text-lg font-medium text-primary bg-white border-2 border-primary rounded-lg shadow-lg hover:bg-gray-50 transform transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                Join Fantasy League
                <Trophy className="ml-2 h-5 w-5 text-[#fdee21]" />
              </Link>
            </div>
            
            <div className="mt-10 flex items-center gap-4 animate-slideUp" style={{ animationDelay: '500ms' }}>
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-primary/10 border border-white flex items-center justify-center text-xs font-medium text-primary">
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">1,000+</span> punters joined this month
              </p>
            </div>
          </div>
          
          {/* Right side: Visual elements */}
          <div className="hidden lg:block relative">
            {/* Main card */}
            <div className="absolute top-0 right-0 w-[90%] h-auto aspect-[4/3] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 rotate-3 z-10 animate-float">
              <div className="bg-primary px-6 py-4 text-white">
                <h3 className="font-heading font-bold text-xl">My Betting Dashboard</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="h-8 bg-gray-100 rounded-md w-3/4"></div>
                  <div className="h-32 bg-gray-100 rounded-md"></div>
                  <div className="h-8 bg-gray-100 rounded-md w-1/2"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-red-100 rounded-md"></div>
                    <div className="h-24 bg-red-100 rounded-md"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Secondary card */}
            <div className="absolute bottom-0 left-0 w-[80%] h-auto aspect-[3/2] bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 -rotate-6 animate-float" style={{ animationDelay: '1s' }}>
              <div className="bg-accent/90 px-6 py-4 text-gray-900">
                <h3 className="font-heading font-bold text-xl">Fantasy League</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="h-8 bg-gray-100 rounded-md w-2/3"></div>
                  <div className="space-y-2">
                    <div className="h-10 bg-gray-100 rounded-md"></div>
                    <div className="h-10 bg-gray-100 rounded-md"></div>
                    <div className="h-10 bg-red-100 rounded-md"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Straight divider */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-white"></div>
    </section>
  );
};

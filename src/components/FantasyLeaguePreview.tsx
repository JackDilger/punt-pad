import { Award, ChevronRight, Shield, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";

export const FantasyLeaguePreview = () => {
  return (
    <section className="py-20 my-16 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md mx-4 sm:mx-8 lg:mx-12 border border-green-200/50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-200/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
      
      <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Trophy className="h-12 w-12 text-accent mr-3 animate-pulse" />
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary">
              Fantasy Leagues
            </h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Compete with friends and test your horse racing knowledge
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left side: Feature descriptions */}
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-semibold mb-2 text-gray-900">Create Your League</h3>
                <p className="text-gray-600">Invite friends, family, or colleagues to join your private league and compete for bragging rights.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-semibold mb-2 text-gray-900">Strategic Power-ups</h3>
                <p className="text-gray-600">Deploy special chips like Super Boost, Double Chance, and Triple Threat to gain an edge over your competitors.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-semibold mb-2 text-gray-900">Live Leaderboards</h3>
                <p className="text-gray-600">Track your position in real-time as race results come in and see how you stack up against the competition.</p>
              </div>
            </div>

            <div className="mt-8">
              <Link to="/auth" className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-primary rounded-lg shadow-lg hover:bg-primary-hover transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                Join Fantasy League
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Right side: UI preview */}
          <div className="relative">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <div className="bg-primary px-6 py-4 text-white">
                <h3 className="font-heading font-bold text-xl">Cheltenham Festival League</h3>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Leaderboard</h4>
                  <div className="space-y-3">
                    {[
                      { position: 1, name: "Emma T.", points: 86, avatar: "E" },
                      { position: 2, name: "David K.", points: 72, avatar: "D" },
                      { position: 3, name: "Alex M.", points: 65, avatar: "A" },
                      { position: 4, name: "Sarah L.", points: 58, avatar: "S" },
                    ].map((player) => (
                      <div key={player.position} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                            player.position === 1 
                              ? "bg-yellow-500" 
                              : player.position === 2 
                              ? "bg-gray-400" 
                              : player.position === 3 
                              ? "bg-amber-700" 
                              : "bg-gray-300"
                          }`}>
                            {player.position}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {player.avatar}
                          </div>
                          <span className="font-medium">{player.name}</span>
                        </div>
                        <span className="font-bold">{player.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Your Power-ups</h4>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {[
                      { name: "Super Boost", icon: "🚀", used: false },
                      { name: "Double Chance", icon: "🎯", used: false },
                      { name: "Triple Threat", icon: "⚖️", used: true },
                    ].map((chip) => (
                      <div 
                        key={chip.name} 
                        className={`border rounded-lg p-3 text-center transition-all flex-1 min-w-[100px] ${
                          chip.used 
                            ? "border-gray-200 bg-gray-100 opacity-50" 
                            : "border-primary bg-primary/5 hover:bg-primary/10 cursor-pointer"
                        }`}
                      >
                        <div className="text-2xl mb-1">{chip.icon}</div>
                        <div className="text-sm font-medium">{chip.name}</div>
                        <div className="text-xs text-gray-500">
                          {chip.used ? "Used" : "Available"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

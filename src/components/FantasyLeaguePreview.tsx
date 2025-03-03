import { Award, ChevronRight, Shield, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";

export const FantasyLeaguePreview = () => {
  return (
    <section className="py-24 bg-primary/5">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Trophy className="h-12 w-12 text-accent mr-3" />
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary">
              Fantasy Leagues
            </h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Compete with friends and test your horse racing knowledge
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side: Feature description */}
          <div>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-semibold mb-2 text-gray-900">Create or Join Leagues</h3>
                  <p className="text-gray-600">Start your own fantasy league or join existing ones with friends, colleagues, or other racing enthusiasts.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-semibold mb-2 text-gray-900">Make Daily Selections</h3>
                  <p className="text-gray-600">Pick your horses for each race day and compete against other players in your league.</p>
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
          </div>

          {/* Right side: UI preview */}
          <div className="relative">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
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
                      <div key={player.position} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                            {player.avatar}
                          </div>
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-gray-500">{player.points} pts</div>
                          </div>
                        </div>
                        <div className="font-bold text-lg">#{player.position}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Available Power-ups</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: "Super Boost", icon: "🚀", used: false },
                      { name: "Double Chance", icon: "🎯", used: false },
                      { name: "Triple Threat", icon: "⚖️", used: true },
                    ].map((chip) => (
                      <div 
                        key={chip.name} 
                        className={`border rounded-lg p-3 text-center ${
                          chip.used 
                            ? "border-gray-200 bg-gray-100 opacity-50" 
                            : "border-primary bg-primary/5"
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
            
            {/* Decorative elements - removed yellow blur */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

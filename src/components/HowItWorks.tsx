import { ClipboardCheck, LineChart, Target, Trophy, Users, Award } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const bettingSteps = [
  {
    icon: ClipboardCheck,
    title: "Log Your Bets",
    description: "Record horse, odds, stake, and result",
  },
  {
    icon: LineChart,
    title: "Track Performance",
    description: "View detailed stats and graphs",
  },
  {
    icon: Target,
    title: "Adjust Strategies",
    description: "Identify patterns and refine your approach",
  },
];

const fantasySteps = [
  {
    icon: Users,
    title: "Join a League",
    description: "Create or join leagues with friends",
  },
  {
    icon: Trophy,
    title: "Make Selections",
    description: "Pick horses for each race day",
  },
  {
    icon: Award,
    title: "Use Power-ups",
    description: "Deploy special chips for strategic advantage",
  },
];

export const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState("betting");
  
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Simple steps to improve your betting game and dominate fantasy leagues
          </p>
        </div>

        <Tabs defaultValue="betting" className="w-full max-w-4xl mx-auto" onValueChange={setActiveTab}>
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-gray-100 rounded-lg">
              <TabsTrigger 
                value="betting" 
                className={`rounded-md py-3 px-4 font-medium transition-all ${
                  activeTab === "betting" 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Bet Tracking
              </TabsTrigger>
              <TabsTrigger 
                value="fantasy" 
                className={`rounded-md py-3 px-4 font-medium transition-all ${
                  activeTab === "fantasy" 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Fantasy Leagues
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="betting">
            <div className="relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 hidden md:block" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {bettingSteps.map((step, index) => (
                  <div
                    key={index}
                    className="relative group"
                  >
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                      <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white transform group-hover:scale-110 transition-transform duration-300">
                        <step.icon size={32} />
                      </div>
                      <h3 className="font-heading text-xl font-semibold mb-3 text-gray-900">
                        {step.title}
                      </h3>
                      <p className="text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="fantasy">
            <div className="relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 hidden md:block" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {fantasySteps.map((step, index) => (
                  <div
                    key={index}
                    className="relative group"
                  >
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                      <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white transform group-hover:scale-110 transition-transform duration-300">
                        <step.icon size={32} />
                      </div>
                      <h3 className="font-heading text-xl font-semibold mb-3 text-gray-900">
                        {step.title}
                      </h3>
                      <p className="text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

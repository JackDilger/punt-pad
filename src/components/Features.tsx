import { BookOpen, ChartBar, Smartphone, Trophy, Users, Award } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Easy Bet Logging",
    description: "Simple form to record bets effortlessly",
  },
  {
    icon: ChartBar,
    title: "Performance Insights",
    description: "Interactive charts for tracking success",
  },
  {
    icon: Trophy,
    title: "Fantasy Leagues",
    description: "Compete with friends in exciting competitions",
  },
  {
    icon: Award,
    title: "Special Power-ups",
    description: "Use strategic chips to boost your fantasy score",
  },
  {
    icon: Users,
    title: "Social Experience",
    description: "Connect and compete with other punters",
  },
  {
    icon: Smartphone,
    title: "Mobile-Friendly",
    description: "Designed for on-the-go use",
  },
];

export const Features = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary mb-4">
            Key Features
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to track bets and dominate fantasy leagues
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-gradient-to-b from-white to-gray-50 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="mb-6 inline-block p-4 rounded-xl bg-primary/5 text-primary group-hover:scale-110 transition-transform duration-300">
                <feature.icon size={32} />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3 text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

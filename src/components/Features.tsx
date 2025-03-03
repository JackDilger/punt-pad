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
    <section className="py-16 bg-white">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
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
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-2 text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

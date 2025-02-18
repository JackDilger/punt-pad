
import { ClipboardCheck, LineChart, Target } from "lucide-react";

const steps = [
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

export const HowItWorks = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Three simple steps to improve your betting game
          </p>
        </div>

        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 hidden md:block" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative group"
              >
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
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
      </div>
    </section>
  );
};


import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    quote: "This app revolutionized my betting analysis!",
    author: "Michael S.",
    role: "Professional Bettor",
  },
  {
    quote: "Finally, a simple way to track my bets and see my progress.",
    author: "Sarah L.",
    role: "Racing Enthusiast",
  },
  {
    quote: "The performance insights helped me improve my win rate significantly.",
    author: "James R.",
    role: "Amateur Bettor",
  },
];

export const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((current) =>
      current === testimonials.length - 1 ? 0 : current + 1
    );
  };

  const prev = () => {
    setCurrentIndex((current) =>
      current === 0 ? testimonials.length - 1 : current - 1
    );
  };

  return (
    <section className="py-24 bg-white">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary mb-4">
              What Our Users Say
            </h2>
          </div>

          <div className="relative bg-gradient-to-b from-white to-gray-50 rounded-2xl p-8 md:p-12 shadow-sm">
            <div className="flex items-center justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-6 h-6 text-accent fill-accent"
                />
              ))}
            </div>
            
            <blockquote className="text-center mb-8">
              <p className="text-xl md:text-2xl text-gray-700 font-medium mb-6">
                "{testimonials[currentIndex].quote}"
              </p>
              <footer>
                <div className="font-heading font-semibold text-gray-900">
                  {testimonials[currentIndex].author}
                </div>
                <div className="text-gray-600">
                  {testimonials[currentIndex].role}
                </div>
              </footer>
            </blockquote>

            <div className="flex justify-center gap-4">
              <button
                onClick={prev}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <button
                onClick={next}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

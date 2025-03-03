import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    quote: "This app revolutionized my betting analysis!",
    author: "Michael S.",
    role: "Professional Bettor",
    category: "betting"
  },
  {
    quote: "Finally, a simple way to track my bets and see my progress.",
    author: "Sarah L.",
    role: "Racing Enthusiast",
    category: "betting"
  },
  {
    quote: "The performance insights helped me improve my win rate significantly.",
    author: "James R.",
    role: "Amateur Bettor",
    category: "betting"
  },
  {
    quote: "The fantasy leagues feature is addictive! I love competing with my friends each race day.",
    author: "Emma T.",
    role: "Fantasy League Champion",
    category: "fantasy"
  },
  {
    quote: "Using the power-up chips in fantasy leagues adds a whole new strategic dimension.",
    author: "David K.",
    role: "Strategy Expert",
    category: "fantasy"
  },
  {
    quote: "I've tried other fantasy racing platforms, but Puntpad's interface and features are unmatched.",
    author: "Alex M.",
    role: "Fantasy League Manager",
    category: "fantasy"
  }
];

export const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");
  
  const filteredTestimonials = activeCategory === "all" 
    ? testimonials 
    : testimonials.filter(t => t.category === activeCategory);

  const next = () => {
    setCurrentIndex((current) =>
      current === filteredTestimonials.length - 1 ? 0 : current + 1
    );
  };

  const prev = () => {
    setCurrentIndex((current) =>
      current === 0 ? filteredTestimonials.length - 1 : current - 1
    );
  };

  return (
    <section className="py-24 bg-white">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary mb-4">
              What Our Users Say
            </h2>
            <div className="flex justify-center gap-4 mb-8">
              <button 
                onClick={() => { setActiveCategory("all"); setCurrentIndex(0); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === "all" 
                    ? "bg-primary text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Testimonials
              </button>
              <button 
                onClick={() => { setActiveCategory("betting"); setCurrentIndex(0); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === "betting" 
                    ? "bg-primary text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Bet Tracking
              </button>
              <button 
                onClick={() => { setActiveCategory("fantasy"); setCurrentIndex(0); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === "fantasy" 
                    ? "bg-primary text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Fantasy Leagues
              </button>
            </div>
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
                "{filteredTestimonials[currentIndex].quote}"
              </p>
              <footer>
                <div className="font-heading font-semibold text-gray-900">
                  {filteredTestimonials[currentIndex].author}
                </div>
                <div className="text-gray-600">
                  {filteredTestimonials[currentIndex].role}
                </div>
              </footer>
            </blockquote>

            <div className="flex justify-center gap-4">
              <button
                onClick={prev}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <button
                onClick={next}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label="Next testimonial"
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

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Trophy, PartyPopper, Medal, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WinnerBannerProps {
  winnerName: string;
  points: number;
}

export function WinnerBanner({ winnerName, points }: WinnerBannerProps) {
  const [showBanner, setShowBanner] = useState(true);
  const [confettiTriggered, setConfettiTriggered] = useState(false);

  // Trigger confetti when component mounts
  useEffect(() => {
    if (!confettiTriggered) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // since particles fall down, start a bit higher than random
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      setConfettiTriggered(true);
    }
  }, [confettiTriggered]);

  const triggerMoreConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full overflow-hidden"
        >
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 p-4 rounded-lg mb-4 shadow-lg border-2 border-yellow-300">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-3 mb-3 md:mb-0">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <Trophy className="h-10 w-10 text-yellow-900" />
                </motion.div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-yellow-900">
                    Congratulations to our Champion!
                  </h3>
                  <div className="flex items-center">
                    <Crown className="h-5 w-5 text-yellow-900 mr-1" />
                    <p className="text-md md:text-lg font-semibold text-yellow-900">
                      {winnerName} - {points} points
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={triggerMoreConfetti} 
                  className="bg-yellow-900 hover:bg-yellow-800 text-yellow-100 border-none"
                  size="sm"
                >
                  <PartyPopper className="h-4 w-4 mr-1" />
                  Celebrate!
                </Button>
                <Button 
                  onClick={() => setShowBanner(false)} 
                  variant="outline" 
                  className="bg-yellow-50 border-yellow-900 text-yellow-900 hover:bg-yellow-100"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

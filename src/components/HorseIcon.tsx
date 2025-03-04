import React, { memo } from 'react';
import { FaHorseHead } from 'react-icons/fa';

interface HorseIconProps {
  className?: string;
}

const HorseIcon: React.FC<HorseIconProps> = memo(({ className = "text-3xl text-gray-800" }) => {
  return <FaHorseHead className={className} />;
});

HorseIcon.displayName = 'HorseIcon';

export default HorseIcon;

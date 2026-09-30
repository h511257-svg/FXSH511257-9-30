import React from 'react';
import {
  Sandwich,
  Drumstick,
  Pizza,
  Egg,
  Soup,
  Croissant,
  Cookie,
  Coffee,
  Milk,
  Sparkles,
  PenTool,
  Scissors,
  Edit3,
  Box,
  BookOpen,
  Flame,
  Award,
  Zap,
  ShoppingBag
} from 'lucide-react';

interface ProductIconProps {
  name: string;
  className?: string;
}

export const ProductIcon: React.FC<ProductIconProps> = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'sandwich':
      return <Sandwich className={className} />;
    case 'drumstick':
      return <Drumstick className={className} />;
    case 'pizza':
      return <Pizza className={className} />;
    case 'egg':
      return <Egg className={className} />;
    case 'soup':
      return <Soup className={className} />;
    case 'croissant':
      return <Croissant className={className} />;
    case 'cookie':
      return <Cookie className={className} />;
    case 'coffee':
      return <Coffee className={className} />;
    case 'milk':
      return <Milk className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'pen-tool':
      return <PenTool className={className} />;
    case 'scissors':
      return <Scissors className={className} />;
    case 'edit-3':
      return <Edit3 className={className} />;
    case 'box':
      return <Box className={className} />;
    case 'book-open':
      return <BookOpen className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'award':
      return <Award className={className} />;
    case 'zap':
      return <Zap className={className} />;
    default:
      return <ShoppingBag className={className} />;
  }
};

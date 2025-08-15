import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette } from 'lucide-react';

export interface HighlightColor {
  name: string;
  value: string;
  bg: string;
  text: string;
  border: string;
}

export const HIGHLIGHT_COLORS: HighlightColor[] = [
  {
    name: 'Yellow',
    value: 'primary',
    bg: 'bg-yellow-200',
    text: 'text-yellow-900',
    border: 'border-yellow-400'
  },
  {
    name: 'Green',
    value: 'secondary', 
    bg: 'bg-green-200',
    text: 'text-green-900',
    border: 'border-green-400'
  },
  {
    name: 'Blue',
    value: 'tertiary',
    bg: 'bg-blue-200',
    text: 'text-blue-900',
    border: 'border-blue-400'
  },
  {
    name: 'Pink',
    value: 'quaternary',
    bg: 'bg-pink-200',
    text: 'text-pink-900',
    border: 'border-pink-400'
  },
  {
    name: 'Purple',
    value: 'quinary',
    bg: 'bg-purple-200',
    text: 'text-purple-900',
    border: 'border-purple-400'
  },
  {
    name: 'Orange',
    value: 'senary',
    bg: 'bg-orange-200',
    text: 'text-orange-900',
    border: 'border-orange-400'
  }
];

interface ColorPickerProps {
  onColorSelect: (color: HighlightColor) => void;
  selectedColor?: HighlightColor;
  trigger?: React.ReactNode;
}

export function ColorPicker({ onColorSelect, selectedColor, trigger }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorSelect = (color: HighlightColor) => {
    onColorSelect(color);
    setIsOpen(false);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <div className={`w-4 h-4 rounded ${selectedColor?.bg || 'bg-yellow-200'} border ${selectedColor?.border || 'border-yellow-400'}`} />
      <Palette className="h-4 w-4" />
      {selectedColor?.name || 'Yellow'}
    </Button>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text-primary">Choose highlight color</h4>
          <div className="grid grid-cols-3 gap-2">
            {HIGHLIGHT_COLORS.map((color) => (
              <Button
                key={color.value}
                variant="ghost"
                size="sm"
                onClick={() => handleColorSelect(color)}
                className={`h-12 flex flex-col items-center gap-1 hover:bg-surface-hover ${
                  selectedColor?.value === color.value ? 'ring-2 ring-brand-primary' : ''
                }`}
              >
                <div className={`w-6 h-6 rounded ${color.bg} border ${color.border}`} />
                <span className="text-xs">{color.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
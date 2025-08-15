import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Highlighter, 
  BookOpen, 
  Brain, 
  Languages,
  Copy,
  Volume2,
  Download,
  Palette
} from 'lucide-react';

interface TextSelectionMenuProps {
  selectedText: string;
  position: { x: number; y: number } | null;
  onHighlight: (color: 'yellow' | 'green' | 'blue' | 'pink') => void;
  onSimplify: () => void;
  onTranslate: () => void;
  onCopy: () => void;
  onSpeak: () => void;
  onClose: () => void;
}

export function TextSelectionMenu({
  selectedText,
  position,
  onHighlight,
  onSimplify,
  onTranslate,
  onCopy,
  onSpeak,
  onClose
}: TextSelectionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (position && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      let { x, y } = position;
      
      // Adjust horizontal position
      if (x + rect.width / 2 > viewport.width - 20) {
        x = viewport.width - rect.width / 2 - 20;
      } else if (x - rect.width / 2 < 20) {
        x = rect.width / 2 + 20;
      }
      
      // Adjust vertical position
      if (y - rect.height - 20 < 20) {
        y = y + 40; // Show below selection instead
      }
      
      setAdjustedPosition({ x, y });
    }
  }, [position, showColorPicker]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!adjustedPosition || !selectedText) return null;

  const highlightColors = [
    { name: 'Yellow', value: 'yellow', color: 'bg-yellow-300' },
    { name: 'Green', value: 'green', color: 'bg-green-300' },
    { name: 'Blue', value: 'blue', color: 'bg-blue-300' },
    { name: 'Pink', value: 'pink', color: 'bg-pink-300' }
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-10px'
      }}
    >
      <Card className="p-2 shadow-2xl border-2 border-gray-200 bg-white backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex flex-col gap-1 min-w-max">
          {/* Main Actions Row */}
          <div className="flex items-center gap-1 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="gap-2 hover:bg-yellow-50 text-yellow-700 border-yellow-200 hover:border-yellow-300"
              title="Highlight text"
            >
              <Highlighter className="h-4 w-4" />
              <span className="text-xs font-medium">Highlight</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onSimplify}
              className="gap-2 hover:bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300"
              title="Simplify text"
            >
              <BookOpen className="h-4 w-4" />
              <span className="text-xs font-medium">Simplify</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onTranslate}
              className="gap-2 hover:bg-green-50 text-green-700 border-green-200 hover:border-green-300"
              title="Translate text"
            >
              <Languages className="h-4 w-4" />
              <span className="text-xs font-medium">Translate</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onSpeak}
              className="gap-2 hover:bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-300"
              title="Read aloud"
            >
              <Volume2 className="h-4 w-4" />
              <span className="text-xs font-medium">Speak</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onCopy}
              className="gap-2 hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
              <span className="text-xs font-medium">Copy</span>
            </Button>
          </div>

          {/* Color Picker Row */}
          {showColorPicker && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 animate-in slide-in-from-top-1 duration-200">
              <span className="text-xs text-gray-600 font-medium">Choose color:</span>
              <div className="flex gap-1">
                {highlightColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      onHighlight(color.value as any);
                      setShowColorPicker(false);
                    }}
                    className={`w-7 h-7 rounded-full ${color.color} hover:scale-110 transition-all duration-200 border-2 border-white shadow-md hover:shadow-lg ring-2 ring-gray-200 hover:ring-gray-300`}
                    title={`Highlight with ${color.name}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Selected Text Preview */}
          <div className="pt-2 border-t border-gray-200 max-w-xs">
            <div className="text-xs text-gray-600 mb-1 font-medium">Selected text:</div>
            <p className="text-xs text-gray-800 line-clamp-2 bg-gray-50 p-2 rounded border italic leading-relaxed">
              "{selectedText.substring(0, 120)}{selectedText.length > 120 ? '...' : ''}"
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
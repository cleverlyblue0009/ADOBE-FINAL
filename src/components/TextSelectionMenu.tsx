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

  if (!position || !selectedText) return null;

  const highlightColors = [
    { name: 'Yellow', value: 'yellow', color: 'bg-yellow-300' },
    { name: 'Green', value: 'green', color: 'bg-green-300' },
    { name: 'Blue', value: 'blue', color: 'bg-blue-300' },
    { name: 'Pink', value: 'pink', color: 'bg-pink-300' }
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-10px'
      }}
    >
      <Card className="p-2 shadow-2xl border-0 bg-white/95 backdrop-blur-md min-w-[320px]">
        <div className="flex flex-col gap-2">
          {/* Main Actions Row */}
          <div className="flex items-center gap-1 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="gap-1.5 hover:bg-yellow-50 px-2 py-1"
              title="Highlight"
            >
              <Highlighter className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium">Highlight</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onSimplify}
              className="gap-1.5 hover:bg-blue-50 px-2 py-1"
              title="Simplify"
            >
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium">Simplify</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onTranslate}
              className="gap-1.5 hover:bg-green-50 px-2 py-1"
              title="Translate"
            >
              <Languages className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium">Translate</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onSpeak}
              className="gap-1.5 hover:bg-purple-50 px-2 py-1"
              title="Read Aloud"
            >
              <Volume2 className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium">Speak</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onCopy}
              className="gap-1.5 hover:bg-gray-50 px-2 py-1"
              title="Copy"
            >
              <Copy className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-medium">Copy</span>
            </Button>
          </div>

          {/* Color Picker Row */}
          {showColorPicker && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Color:</span>
              {highlightColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    onHighlight(color.value as any);
                    setShowColorPicker(false);
                  }}
                  className={`w-7 h-7 rounded-full ${color.color} hover:scale-110 transition-transform border-2 border-white shadow-md hover:shadow-lg`}
                  title={color.name}
                />
              ))}
            </div>
          )}

          {/* Selected Text Preview */}
          <div className="pt-2 border-t border-gray-200 max-w-sm">
            <p className="text-xs text-gray-600 line-clamp-2 italic">
              "{selectedText.substring(0, 100)}{selectedText.length > 100 ? '...' : ''}"
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
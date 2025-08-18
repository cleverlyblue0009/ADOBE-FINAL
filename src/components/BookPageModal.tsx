import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, BookOpen } from 'lucide-react';

interface BookPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  pageNumber?: number;
  bookTitle?: string;
}

export function BookPageModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  pageNumber = 1,
  bookTitle = "Document Analysis"
}: BookPageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-2 border-amber-200 dark:border-amber-800 shadow-2xl">
        {/* Book binding effect */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 border-r-2 border-amber-900">
          <div className="h-full w-full bg-gradient-to-r from-amber-800 to-transparent opacity-60"></div>
          {/* Binding holes */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-amber-900 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-amber-900 rounded-full"></div>
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-amber-900 rounded-full"></div>
        </div>

        {/* Page content */}
        <div className="pl-8 pr-6 py-6">
          {/* Book header */}
          <DialogHeader className="mb-6 border-b border-amber-200 dark:border-amber-700 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-amber-700 dark:text-amber-300" />
                <div>
                  <DialogTitle className="text-xl font-serif text-amber-900 dark:text-amber-100">
                    {title}
                  </DialogTitle>
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-serif italic">
                    {bookTitle}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:text-amber-100 dark:hover:bg-amber-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Page content with book-like styling */}
          <ScrollArea className="h-[calc(90vh-200px)] pr-4">
            <div className="space-y-6 font-serif text-amber-900 dark:text-amber-100 leading-relaxed">
              {/* Decorative initial letter styling */}
              <div className="first-letter:text-6xl first-letter:font-bold first-letter:text-amber-800 first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:leading-none">
                {children}
              </div>
            </div>
          </ScrollArea>

          {/* Page footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-amber-200 dark:border-amber-700">
            <div className="text-sm text-amber-600 dark:text-amber-400 font-serif italic">
              Chapter Analysis • {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-300 font-serif">
              Page {pageNumber}
            </div>
          </div>
        </div>

        {/* Paper texture overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3Ccircle cx='19' cy='19' r='1'/%3E%3Ccircle cx='25' cy='25' r='1'/%3E%3Ccircle cx='31' cy='31' r='1'/%3E%3Ccircle cx='37' cy='37' r='1'/%3E%3Ccircle cx='43' cy='43' r='1'/%3E%3Ccircle cx='49' cy='49' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Subtle shadow for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/5 to-transparent pointer-events-none rounded-lg"></div>
      </DialogContent>
    </Dialog>
  );
}

// Enhanced version with more book-like features
export function EnhancedBookPageModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  pageNumber = 1,
  bookTitle = "Document Analysis",
  chapter = "Analysis Results"
}: BookPageModalProps & { chapter?: string }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950 border-4 border-amber-300 dark:border-amber-700 shadow-2xl rounded-lg overflow-hidden">
        {/* Book spine */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-b from-amber-800 via-amber-900 to-amber-800 border-r-4 border-amber-900">
          <div className="h-full w-full bg-gradient-to-r from-amber-900 to-transparent opacity-70"></div>
          {/* Decorative spine elements */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gold-400 rounded-full opacity-80"></div>
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-amber-600 rounded-full opacity-60"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gold-400 rounded-full opacity-80"></div>
          <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-amber-600 rounded-full opacity-60"></div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gold-400 rounded-full opacity-80"></div>
        </div>

        {/* Page margins */}
        <div className="pl-12 pr-8 py-8">
          {/* Decorative header */}
          <div className="border-b-2 border-amber-300 dark:border-amber-600 pb-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-2xl font-serif font-bold text-amber-900 dark:text-amber-100 tracking-wide">
                  {title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-amber-700 dark:text-amber-300">
                  <span className="font-serif italic">{bookTitle}</span>
                  <span className="w-px h-4 bg-amber-400"></span>
                  <span className="font-serif">{chapter}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:text-amber-100 dark:hover:bg-amber-800 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Main content */}
          <ScrollArea className="h-[calc(95vh-300px)]">
            <div className="space-y-6 font-serif text-amber-900 dark:text-amber-100 leading-relaxed text-justify">
              {/* Ornamental initial capital */}
              <div className="first-letter:text-7xl first-letter:font-bold first-letter:text-amber-800 dark:first-letter:text-amber-200 first-letter:float-left first-letter:mr-3 first-letter:mt-2 first-letter:leading-none first-letter:font-serif">
                {children}
              </div>
            </div>
            
            {/* Decorative flourish */}
            <div className="flex justify-center mt-8 mb-4">
              <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
            </div>
          </ScrollArea>

          {/* Page footer with ornamental elements */}
          <div className="border-t-2 border-amber-300 dark:border-amber-600 pt-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-serif">
                <BookOpen className="h-4 w-4" />
                <span className="italic">
                  {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              
              {/* Ornamental page number */}
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-serif">
                <div className="w-8 h-px bg-amber-400"></div>
                <span className="text-lg font-bold">{pageNumber}</span>
                <div className="w-8 h-px bg-amber-400"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Aged paper texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4a574' fill-opacity='0.1'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Subtle shadow for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-amber-900/10 pointer-events-none rounded-lg"></div>
      </DialogContent>
    </Dialog>
  );
}
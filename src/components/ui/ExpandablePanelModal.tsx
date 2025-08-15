import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Maximize2, X } from 'lucide-react';

interface ExpandablePanelModalProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  triggerButton?: React.ReactNode;
  className?: string;
}

export function ExpandablePanelModal({ 
  title, 
  icon, 
  children, 
  triggerButton,
  className = ""
}: ExpandablePanelModalProps) {
  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title="Expand to full view"
    >
      <Maximize2 className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className={`max-w-6xl w-[90vw] h-[90vh] p-0 gap-0 ${className}`}>
        <DialogHeader className="px-6 py-4 border-b bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            {icon}
            {title}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 h-full">
          <div className="p-6">
            {children}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Wrapper component for existing panels to add expand functionality
interface ExpandablePanelWrapperProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  showExpandButton?: boolean;
}

export function ExpandablePanelWrapper({ 
  title, 
  icon, 
  children, 
  className = "",
  showExpandButton = true
}: ExpandablePanelWrapperProps) {
  return (
    <div className={`relative ${className}`}>
      {showExpandButton && (
        <div className="absolute top-4 right-4 z-10">
          <ExpandablePanelModal title={title} icon={icon}>
            {children}
          </ExpandablePanelModal>
        </div>
      )}
      {children}
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { TextSelectionMenu } from './TextSelectionMenu';

interface PDFTextSelectionHandlerProps {
  onHighlight: (text: string, color: 'yellow' | 'green' | 'blue' | 'pink', page: number) => void;
  onSimplify: (text: string) => void;
  onTranslate: (text: string) => void;
  onCopy: (text: string) => void;
  onSpeak: (text: string) => void;
  currentPage: number;
  pdfContainerRef?: React.RefObject<HTMLElement>;
}

export function PDFTextSelectionHandler({
  onHighlight,
  onSimplify,
  onTranslate,
  onCopy,
  onSpeak,
  currentPage,
  pdfContainerRef
}: PDFTextSelectionHandlerProps) {
  const [selectedText, setSelectedText] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectionPage, setSelectionPage] = useState(1);

  useEffect(() => {
    const handleSelection = (event: MouseEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setMenuPosition(null);
        setSelectedText('');
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setMenuPosition(null);
        setSelectedText('');
        return;
      }

      // Check if the selection is within the PDF viewer area
      const target = event.target as HTMLElement;
      
      // Check if the target is within the PDF container or Adobe viewer
      const isInPDFViewer = 
        target.closest('#adobe-pdf-viewer') ||
        target.closest('[id^="adobe-pdf-viewer-"]') ||
        target.closest('.pdf-viewer-container') ||
        target.closest('iframe') ||
        (pdfContainerRef?.current && pdfContainerRef.current.contains(target));

      // Also check if it's NOT in UI elements
      const isInUIElement = 
        target.closest('button') ||
        target.closest('[role="button"]') ||
        target.closest('aside') ||
        target.closest('header') ||
        target.closest('.ui-panel') ||
        target.closest('[class*="panel"]') ||
        target.closest('[class*="sidebar"]') ||
        target.closest('[class*="toolbar"]') ||
        target.closest('[class*="menu"]') ||
        target.closest('[class*="dropdown"]') ||
        target.closest('[class*="modal"]') ||
        target.closest('[class*="dialog"]') ||
        target.closest('[class*="card"]') ||
        target.closest('nav');

      // Only show menu if selection is in PDF viewer and NOT in UI elements
      if (isInPDFViewer && !isInUIElement) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setSelectedText(text);
        setSelectionPage(currentPage);
        setMenuPosition({
          x: rect.left + rect.width / 2,
          y: rect.top
        });
      } else {
        // Clear menu if selection is in UI elements
        setMenuPosition(null);
        setSelectedText('');
      }
    };

    // Use mouseup event to detect end of selection
    document.addEventListener('mouseup', handleSelection);

    // Also listen for selection change to clear menu when selection is cleared
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setMenuPosition(null);
        setSelectedText('');
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [currentPage, pdfContainerRef]);

  const handleHighlight = (color: 'yellow' | 'green' | 'blue' | 'pink') => {
    if (selectedText) {
      onHighlight(selectedText, color, selectionPage);
    }
    setMenuPosition(null);
    setSelectedText('');
  };

  const handleSimplify = () => {
    if (selectedText) {
      onSimplify(selectedText);
    }
    setMenuPosition(null);
  };

  const handleTranslate = () => {
    if (selectedText) {
      onTranslate(selectedText);
    }
    setMenuPosition(null);
  };

  const handleCopy = () => {
    if (selectedText) {
      onCopy(selectedText);
    }
    setMenuPosition(null);
  };

  const handleSpeak = () => {
    if (selectedText) {
      onSpeak(selectedText);
    }
    setMenuPosition(null);
  };

  const handleClose = () => {
    setMenuPosition(null);
    setSelectedText('');
  };

  return (
    <TextSelectionMenu
      selectedText={selectedText}
      position={menuPosition}
      onHighlight={handleHighlight}
      onSimplify={handleSimplify}
      onTranslate={handleTranslate}
      onCopy={handleCopy}
      onSpeak={handleSpeak}
      onClose={handleClose}
    />
  );
}
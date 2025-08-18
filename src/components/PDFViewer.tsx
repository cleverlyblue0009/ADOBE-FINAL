import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Upload, ZoomIn, ZoomOut } from 'lucide-react';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Highlight {
  id: string;
  page: number;
  text: string;
  rect: DOMRect;
  color: string;
  timestamp: number;
}

interface PDFViewerProps {
  onTextSelected?: (text: string, rect: DOMRect) => void;
  onHighlightCreated?: (highlight: Highlight) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ onTextSelected, onHighlightCreated }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);
  
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');

  // Load PDF from file
  const loadPDF = useCallback(async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header with controls */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && file.type === 'application/pdf') {
                loadPDF(file);
              }
            }}
            className="hidden"
            id="pdf-upload"
          />
          <label htmlFor="pdf-upload">
            <Button variant="outline" className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Upload PDF
            </Button>
          </label>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        {pdfDoc ? (
          <Card className="mx-auto w-fit p-4 bg-white shadow-lg">
            <div
              ref={containerRef}
              className="relative"
              style={{
                width: 'fit-content',
                height: 'fit-content',
              }}
            >
              {/* Canvas layer for PDF rendering */}
              <canvas
                ref={canvasRef}
                className="block"
                style={{ display: 'block' }}
              />
              
              {/* Text layer for selection */}
              <div
                ref={textLayerRef}
                className="absolute top-0 left-0 overflow-hidden leading-none"
                style={{
                  pointerEvents: 'auto',
                  userSelect: 'text',
                }}
              />
              
              {/* Highlight overlay layer */}
              <div
                ref={highlightLayerRef}
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
            </div>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No PDF loaded
              </h3>
              <p className="text-gray-500 mb-4">
                Upload a PDF file to get started
              </p>
              <label htmlFor="pdf-upload">
                <Button className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose PDF File
                </Button>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
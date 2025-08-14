import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, ChevronDown, FileText, Eye, File, BookOpen } from 'lucide-react';
import { OutlineItem } from './PDFReader';

interface PDFDocument {
  id: string;
  name: string;
  title: string;
  url: string;
  outline: OutlineItem[];
}

interface DocumentOutlineProps {
  documents?: PDFDocument[];
  outline?: OutlineItem[];
  currentDocument?: PDFDocument;
  currentPage: number;
  onItemClick: (item: OutlineItem) => void;
  onDocumentSwitch?: (document: PDFDocument) => void;
}

export function DocumentOutline({ 
  documents, 
  outline, 
  currentDocument,
  currentPage, 
  onItemClick,
  onDocumentSwitch 
}: DocumentOutlineProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['root']));
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set(documents?.map(d => d.id) || []));
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Use either multiple documents or single document outline
  const isMultiDocument = documents && documents.length > 0;
  const singleOutline = outline || currentDocument?.outline || [];

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const toggleDocumentExpanded = (docId: string) => {
    const newExpanded = new Set(expandedDocuments);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedDocuments(newExpanded);
  };

  const renderOutlineItem = (item: OutlineItem, depth = 0, documentId?: string) => {
    const isActive = Math.abs(currentPage - item.page) <= 1 && 
                    (!documentId || documentId === currentDocument?.id);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isHovered = hoveredItem === item.id;

    return (
      <div key={item.id} className="select-none">
        <div
          className={`
            outline-item flex items-center gap-2 cursor-pointer group
            ${isActive ? 'active bg-blue-50 border-l-2 border-l-blue-500' : ''}
            hover:bg-gray-50 transition-colors duration-150 rounded-md p-1
          `}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          onClick={() => {
            onItemClick(item);
            // Switch to the correct document if needed
            if (documentId && onDocumentSwitch) {
              const doc = documents?.find(d => d.id === documentId);
              if (doc && doc.id !== currentDocument?.id) {
                onDocumentSwitch(doc);
              }
            }
          }}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-surface-hover"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(item.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center">
              <FileText className="h-3 w-3 text-text-tertiary" />
            </div>
          )}

          <span className={`
            flex-1 text-sm truncate
            ${item.level === 1 ? 'font-medium' : ''}
            ${item.level === 2 ? 'font-normal' : ''}
            ${item.level >= 3 ? 'text-text-secondary' : ''}
          `}>
            {item.title}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isHovered && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-surface-hover"
                onClick={(e) => {
                  e.stopPropagation();
                  // Would show page preview
                }}
                aria-label="Preview page"
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
            
            <span className="text-xs text-text-tertiary font-mono">
              {item.page}
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="animate-fade-in">
            {item.children!.map(child => renderOutlineItem(child, depth + 1, documentId))}
          </div>
        )}
      </div>
    );
  };

  const renderDocumentSection = (document: PDFDocument) => {
    const isExpanded = expandedDocuments.has(document.id);
    const isCurrentDoc = currentDocument?.id === document.id;

    return (
      <div key={document.id} className="mb-4">
        <Collapsible 
          open={isExpanded} 
          onOpenChange={() => toggleDocumentExpanded(document.id)}
        >
          <CollapsibleTrigger asChild>
            <div className={`
              flex items-center gap-3 p-3 rounded-lg cursor-pointer group
              ${isCurrentDoc ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}
              transition-all duration-200
            `}>
              <div className="flex items-center gap-2 flex-1">
                <div className={`p-2 rounded-lg ${isCurrentDoc ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <File className={`h-4 w-4 ${isCurrentDoc ? 'text-blue-600' : 'text-gray-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold text-sm truncate ${isCurrentDoc ? 'text-blue-900' : 'text-gray-900'}`}>
                    {document.title}
                  </h4>
                  <p className="text-xs text-gray-600 truncate">{document.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isCurrentDoc && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                    Current
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {document.outline.length} sections
                </Badge>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-2">
            <div className="space-y-1 border-l-2 border-gray-200 ml-6 pl-2">
              {document.outline.map(item => renderOutlineItem(item, 0, document.id))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b border-border-subtle">
        <h3 className="font-semibold text-lg text-text-primary mb-2 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {isMultiDocument ? 'Document Library' : 'Document Outline'}
        </h3>
        <p className="text-sm text-text-secondary">
          {isMultiDocument ? (
            <>
              {documents.length} documents • {documents.reduce((total, doc) => total + doc.outline.length, 0)} total sections
              {currentDocument && ` • Currently viewing: ${currentDocument.title}`}
            </>
          ) : (
            <>
              {singleOutline.length} sections • Currently on page {currentPage}
            </>
          )}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isMultiDocument ? (
            // Multi-document view
            documents.map(doc => renderDocumentSection(doc))
          ) : (
            // Single document view
            singleOutline.map(item => renderOutlineItem(item))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
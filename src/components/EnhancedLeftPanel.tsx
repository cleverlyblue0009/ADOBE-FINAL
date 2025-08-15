import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Search, 
  ChevronDown,
  ChevronRight,
  BookOpen,
  List,
  Clock,
  Star,
  Bookmark,
  Eye,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Target,
  Zap,
  Users,
  Filter
} from 'lucide-react';

interface OutlineItem {
  id: string;
  title: string;
  level: number;
  page: number;
  children?: OutlineItem[];
}

interface PDFDocument {
  id: string;
  name: string;
  url: string;
  outline: OutlineItem[];
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: any;
  action: () => void;
  shortcut?: string;
}

interface ReadingSession {
  startTime: number;
  currentPage: number;
  totalPages: number;
  bookmarks: number[];
  progress: number;
}

interface EnhancedLeftPanelProps {
  documents?: PDFDocument[];
  currentDocument?: PDFDocument | null;
  currentPage?: number;
  totalPages?: number;
  persona?: string;
  jobToBeDone?: string;
  onDocumentChange?: (document: PDFDocument) => void;
  onPageNavigate?: (page: number) => void;
  onSectionNavigate?: (page: number, section: string) => void;
  onQuickAction?: (actionId: string) => void;
}

export function EnhancedLeftPanel({
  documents = [],
  currentDocument,
  currentPage = 1,
  totalPages = 1,
  persona,
  jobToBeDone,
  onDocumentChange,
  onPageNavigate,
  onSectionNavigate,
  onQuickAction
}: EnhancedLeftPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['outline', 'session', 'documents'])
  );
  const [expandedOutlineItems, setExpandedOutlineItems] = useState<Set<string>>(new Set());
  const [readingSession, setReadingSession] = useState<ReadingSession>({
    startTime: Date.now(),
    currentPage: currentPage,
    totalPages: totalPages,
    bookmarks: [],
    progress: 0
  });
  const { toast } = useToast();

  // Update reading session when page changes
  useEffect(() => {
    setReadingSession(prev => ({
      ...prev,
      currentPage,
      totalPages,
      progress: Math.round((currentPage / totalPages) * 100)
    }));
  }, [currentPage, totalPages]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const toggleOutlineItem = (itemId: string) => {
    setExpandedOutlineItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleOutlineClick = (item: OutlineItem) => {
    if (onPageNavigate) {
      onPageNavigate(item.page);
    }
    if (onSectionNavigate) {
      onSectionNavigate(item.page, item.title);
    }
    toast({
      title: "Navigating to Section",
      description: `${item.title} - Page ${item.page}`,
    });
  };

  const handleDocumentChange = (document: PDFDocument) => {
    if (onDocumentChange) {
      onDocumentChange(document);
      toast({
        title: "Document Changed",
        description: `Now viewing: ${document.name}`,
      });
    }
  };

  const addBookmark = () => {
    setReadingSession(prev => ({
      ...prev,
      bookmarks: [...prev.bookmarks, currentPage]
    }));
    toast({
      title: "Bookmark Added",
      description: `Page ${currentPage} bookmarked`,
    });
  };

  const removeBookmark = (page: number) => {
    setReadingSession(prev => ({
      ...prev,
      bookmarks: prev.bookmarks.filter(p => p !== page)
    }));
    toast({
      title: "Bookmark Removed",
      description: `Page ${page} bookmark removed`,
    });
  };

  const quickActions: QuickAction[] = [
    {
      id: 'bookmark',
      label: 'Bookmark Page',
      description: 'Save current page for quick access',
      icon: Bookmark,
      action: addBookmark,
      shortcut: 'Ctrl+B'
    },
    {
      id: 'strategic',
      label: 'Get Recommendations',
      description: 'AI-powered reading suggestions',
      icon: Target,
      action: () => onQuickAction?.('strategic'),
      shortcut: 'Ctrl+R'
    },
    {
      id: 'highlights',
      label: 'View Highlights',
      description: 'See all highlighted content',
      icon: Zap,
      action: () => onQuickAction?.('highlights'),
      shortcut: 'Ctrl+H'
    },
    {
      id: 'insights',
      label: 'Generate Insights',
      description: 'Extract key insights from content',
      icon: Eye,
      action: () => onQuickAction?.('insights'),
      shortcut: 'Ctrl+I'
    }
  ];

  const filteredOutline = currentDocument?.outline?.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const renderOutlineItem = (item: OutlineItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedOutlineItems.has(item.id);
    const paddingLeft = depth * 16 + 8;

    return (
      <div key={item.id} className="w-full">
        <div 
          className="flex items-center gap-2 py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors"
          style={{ paddingLeft }}
          onClick={() => handleOutlineClick(item)}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleOutlineItem(item.id);
              }}
            >
              {isExpanded ? 
                <ChevronDown className="h-3 w-3" /> : 
                <ChevronRight className="h-3 w-3" />
              }
            </Button>
          )}
          {!hasChildren && <div className="w-4" />}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`text-sm truncate ${
                depth === 0 ? 'font-medium' : 
                depth === 1 ? 'font-normal' : 'text-gray-600'
              }`}>
                {item.title}
              </span>
              <Badge variant="outline" className="text-xs ml-2">
                {item.page}
              </Badge>
            </div>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {item.children!.map(child => renderOutlineItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getPersonaIcon = (persona?: string) => {
    switch (persona?.toLowerCase()) {
      case 'student': return '🎓';
      case 'researcher': return '🔬';
      case 'professional': return '💼';
      case 'expert': return '👨‍🏫';
      default: return '👤';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-border-subtle">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-text-primary">Navigation</h3>
        </div>

        {/* Current Session Info */}
        {persona && (
          <Card className="mb-4">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getPersonaIcon(persona)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize">{persona} Mode</p>
                  <p className="text-xs text-gray-600 truncate">{jobToBeDone}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Page {readingSession.currentPage} of {readingSession.totalPages}</span>
                <span>{readingSession.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all" 
                  style={{ width: `${readingSession.progress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search sections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Quick Actions */}
          <Collapsible 
            open={expandedSections.has('actions')}
            onOpenChange={() => toggleSection('actions')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium text-sm">Quick Actions</span>
                </div>
                {expandedSections.has('actions') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      onClick={action.action}
                      className="flex flex-col gap-1 h-auto p-3"
                      title={action.description}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Document Outline */}
          <Collapsible 
            open={expandedSections.has('outline')}
            onOpenChange={() => toggleSection('outline')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  <span className="font-medium text-sm">Document Outline</span>
                </div>
                {expandedSections.has('outline') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              {currentDocument && filteredOutline.length > 0 ? (
                <div className="space-y-1">
                  {filteredOutline.map(item => renderOutlineItem(item))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <List className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {currentDocument ? 'No outline available' : 'No document selected'}
                  </p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Reading Session */}
          <Collapsible 
            open={expandedSections.has('session')}
            onOpenChange={() => toggleSection('session')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium text-sm">Reading Session</span>
                </div>
                {expandedSections.has('session') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <Card>
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Reading Time</span>
                    <span className="font-mono">
                      {Math.floor((Date.now() - readingSession.startTime) / 60000)}m
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{readingSession.progress}%</span>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Bookmarks</span>
                      <Badge variant="secondary" className="text-xs">
                        {readingSession.bookmarks.length}
                      </Badge>
                    </div>
                    {readingSession.bookmarks.length > 0 ? (
                      <div className="space-y-1">
                        {readingSession.bookmarks.map((page) => (
                          <div key={page} className="flex items-center justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onPageNavigate?.(page)}
                              className="flex-1 justify-start h-6 px-2"
                            >
                              <Bookmark className="h-3 w-3 mr-2" />
                              <span className="text-xs">Page {page}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBookmark(page)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-2">
                        No bookmarks yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Documents */}
          {documents.length > 1 && (
            <Collapsible 
              open={expandedSections.has('documents')}
              onOpenChange={() => toggleSection('documents')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-medium text-sm">Documents ({documents.length})</span>
                  </div>
                  {expandedSections.has('documents') ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <Button
                      key={doc.id}
                      variant={currentDocument?.id === doc.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleDocumentChange(doc)}
                      className="w-full justify-start h-auto p-2"
                    >
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium truncate">
                          {doc.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {doc.outline?.length || 0} sections
                        </div>
                      </div>
                      {currentDocument?.id === doc.id && (
                        <ArrowRight className="h-3 w-3 ml-2" />
                      )}
                    </Button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
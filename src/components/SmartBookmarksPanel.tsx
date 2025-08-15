import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bookmark, 
  Plus, 
  Search, 
  Tag, 
  Clock,
  Brain,
  Star,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface SmartBookmark {
  id: string;
  title: string;
  page: number;
  content: string;
  aiSummary: string;
  tags: string[];
  timestamp: number;
  importance: 'low' | 'medium' | 'high';
  category: string;
  relatedBookmarks: string[];
}

interface SmartBookmarksPanelProps {
  currentPage: number;
  selectedText?: string;
  currentSection?: string;
  documentId?: string;
  persona?: string;
  jobToBeDone?: string;
}

export function SmartBookmarksPanel({
  currentPage,
  selectedText,
  currentSection,
  documentId,
  persona,
  jobToBeDone
}: SmartBookmarksPanelProps) {
  const [bookmarks, setBookmarks] = useState<SmartBookmark[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string>('all');
  const { toast } = useToast();

  // Mock bookmarks data
  useEffect(() => {
    const mockBookmarks: SmartBookmark[] = [
      {
        id: '1',
        title: 'Key Market Analysis',
        page: 15,
        content: 'The regional market shows significant growth potential with a 23% increase in consumer demand over the past quarter.',
        aiSummary: 'Market analysis indicates strong growth trajectory with specific metrics for strategic planning.',
        tags: ['market', 'growth', 'analysis'],
        timestamp: Date.now() - 3600000,
        importance: 'high',
        category: 'Strategy',
        relatedBookmarks: ['2']
      },
      {
        id: '2',
        title: 'Competitive Landscape',
        page: 28,
        content: 'Three major competitors dominate the space, but there are clear opportunities in the mid-market segment.',
        aiSummary: 'Competitive analysis reveals market gaps and positioning opportunities for strategic advantage.',
        tags: ['competition', 'strategy', 'opportunity'],
        timestamp: Date.now() - 7200000,
        importance: 'high',
        category: 'Competition',
        relatedBookmarks: ['1', '3']
      },
      {
        id: '3',
        title: 'Technical Implementation',
        page: 45,
        content: 'The proposed architecture leverages microservices with containerized deployment for scalability.',
        aiSummary: 'Technical approach focuses on scalable architecture using modern deployment methodologies.',
        tags: ['technical', 'architecture', 'scalability'],
        timestamp: Date.now() - 10800000,
        importance: 'medium',
        category: 'Technical',
        relatedBookmarks: ['2']
      },
      {
        id: '4',
        title: 'Budget Considerations',
        page: 62,
        content: 'Initial investment of $2.5M with expected ROI of 180% over 18 months based on conservative projections.',
        aiSummary: 'Financial projections show strong ROI potential with manageable initial investment requirements.',
        tags: ['budget', 'roi', 'finance'],
        timestamp: Date.now() - 14400000,
        importance: 'high',
        category: 'Finance',
        relatedBookmarks: []
      }
    ];
    setBookmarks(mockBookmarks);
  }, []);

  const addSmartBookmark = async () => {
    if (!selectedText && !currentSection) {
      toast({
        title: "No content selected",
        description: "Please select text or navigate to a section to bookmark.",
        variant: "destructive"
      });
      return;
    }

    const content = selectedText || currentSection || '';
    
    // Generate AI summary (mock implementation)
    const generateAISummary = (text: string): string => {
      if (text.length < 50) return text;
      
      // Simple extractive summary - in real app, this would call an AI service
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const summary = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '...' : '');
      return summary;
    };

    // Auto-generate tags based on content (mock implementation)
    const generateTags = (text: string): string[] => {
      const commonWords = ['market', 'strategy', 'technical', 'analysis', 'growth', 'opportunity', 'implementation', 'budget', 'roi', 'competitive'];
      const textLower = text.toLowerCase();
      return commonWords.filter(word => textLower.includes(word)).slice(0, 3);
    };

    // Determine importance based on content and context
    const determineImportance = (text: string): 'low' | 'medium' | 'high' => {
      const importantKeywords = ['critical', 'important', 'key', 'significant', 'major', 'essential'];
      const textLower = text.toLowerCase();
      const matches = importantKeywords.filter(word => textLower.includes(word));
      
      if (matches.length >= 2) return 'high';
      if (matches.length >= 1) return 'medium';
      return 'low';
    };

    const newBookmark: SmartBookmark = {
      id: Date.now().toString(),
      title: currentSection || `Page ${currentPage} Bookmark`,
      page: currentPage,
      content: content.substring(0, 500), // Limit content length
      aiSummary: generateAISummary(content),
      tags: generateTags(content),
      timestamp: Date.now(),
      importance: determineImportance(content),
      category: persona || 'General',
      relatedBookmarks: []
    };

    setBookmarks(prev => [newBookmark, ...prev]);
    setIsAddingBookmark(false);

    toast({
      title: "Smart Bookmark Added",
      description: `Bookmark saved for page ${currentPage} with AI-generated insights.`
    });
  };

  const deleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
    toast({
      title: "Bookmark Deleted",
      description: "Bookmark has been removed from your collection."
    });
  };

  const getImportanceColor = (importance: 'low' | 'medium' | 'high') => {
    switch (importance) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  const getImportanceIcon = (importance: 'low' | 'medium' | 'high') => {
    switch (importance) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const filteredBookmarks = bookmarks
    .filter(bookmark => {
      const matchesSearch = bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bookmark.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bookmark.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTag = filterTag === 'all' || bookmark.tags.includes(filterTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  const allTags = Array.from(new Set(bookmarks.flatMap(b => b.tags)));

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2 mb-3">
          <Bookmark className="h-5 w-5 text-brand-primary" />
          <h3 className="font-semibold text-text-primary">Smart Bookmarks</h3>
          <Badge variant="secondary" className="text-xs">
            {bookmarks.length}
          </Badge>
        </div>
        <p className="text-xs text-text-secondary mb-3">
          AI-powered bookmarks with intelligent summaries and insights
        </p>

        {/* Add Bookmark Button */}
        <Button
          onClick={addSmartBookmark}
          disabled={!selectedText && !currentSection}
          className="w-full gap-2 mb-3"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Add Smart Bookmark
        </Button>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <Input
            placeholder="Search bookmarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tag Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterTag === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterTag('all')}
            className="text-xs"
          >
            All
          </Button>
          {allTags.slice(0, 4).map(tag => (
            <Button
              key={tag}
              variant={filterTag === tag ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTag(tag)}
              className="text-xs"
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {filteredBookmarks.length > 0 ? (
            filteredBookmarks.map((bookmark) => (
              <Card key={bookmark.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {getImportanceIcon(bookmark.importance)}
                        {bookmark.title}
                        <Badge variant="outline" className="text-xs">
                          Page {bookmark.page}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getImportanceColor(bookmark.importance)}>
                          {bookmark.importance}
                        </Badge>
                        <Badge variant="secondary">{bookmark.category}</Badge>
                        <span className="text-xs text-text-tertiary flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(bookmark.timestamp)}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Go to Page
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteBookmark(bookmark.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Original Content */}
                    <div>
                      <p className="text-sm text-text-primary line-clamp-2">
                        "{bookmark.content}"
                      </p>
                    </div>

                    {/* AI Summary */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Brain className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-800">AI Summary</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        {bookmark.aiSummary}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {bookmark.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Related Bookmarks */}
                    {bookmark.relatedBookmarks.length > 0 && (
                      <div className="text-xs text-text-secondary">
                        <span className="font-medium">Related:</span> {bookmark.relatedBookmarks.length} bookmark(s)
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <Bookmark className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary mb-1">
                {bookmarks.length === 0 ? 'No bookmarks yet' : 'No bookmarks match your search'}
              </p>
              <p className="text-xs text-text-tertiary">
                {bookmarks.length === 0 
                  ? 'Select text or navigate to a section to create your first smart bookmark'
                  : 'Try adjusting your search terms or filters'
                }
              </p>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterTag('all');
                  }}
                  className="mt-2"
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {bookmarks.length > 0 && (
        <div className="p-4 border-t border-border-subtle">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-text-primary">{bookmarks.length}</div>
              <div className="text-xs text-text-secondary">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {bookmarks.filter(b => b.importance === 'high').length}
              </div>
              <div className="text-xs text-text-secondary">High Priority</div>
            </div>
            <div>
              <div className="text-lg font-bold text-text-primary">
                {new Set(bookmarks.map(b => b.page)).size}
              </div>
              <div className="text-xs text-text-secondary">Pages</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
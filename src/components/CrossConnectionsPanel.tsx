import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { apiService, CrossConnectionsResponse, RelatedDocument, Contradiction, CrossDocumentInsight } from '@/lib/api';
import { 
  Link2, 
  AlertTriangle, 
  Lightbulb, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight,
  Loader2,
  TrendingUp,
  Target,
  Zap,
  BookOpen,
  AlertCircle
} from 'lucide-react';

interface CrossConnectionsPanelProps {
  documentId: string;
  onNavigateToDocument?: (documentId: string) => void;
  className?: string;
}

export function CrossConnectionsPanel({ documentId, onNavigateToDocument, className = '' }: CrossConnectionsPanelProps) {
  const [connections, setConnections] = useState<CrossConnectionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['related']));
  const { toast } = useToast();

  useEffect(() => {
    loadConnections();
  }, [documentId]);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getCrossConnections(documentId);
      setConnections(data);
    } catch (error) {
      console.error('Failed to load cross connections:', error);
      toast({
        title: "Error",
        description: "Failed to analyze cross-connections. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getConnectionTypeIcon = (type: string) => {
    switch (type) {
      case 'complementary': return <Link2 className="h-4 w-4 text-green-600" />;
      case 'contradictory': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'similar': return <BookOpen className="h-4 w-4 text-blue-600" />;
      default: return <Link2 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'complementary': return 'bg-green-100 text-green-800 border-green-200';
      case 'contradictory': return 'bg-red-100 text-red-800 border-red-200';
      case 'similar': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <TrendingUp className="h-4 w-4 text-purple-600" />;
      case 'opportunity': return <Target className="h-4 w-4 text-orange-600" />;
      case 'recommendation': return <Zap className="h-4 w-4 text-blue-600" />;
      default: return <Lightbulb className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (isLoading) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Cross-Document Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Analyzing connections...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!connections || (connections.related_documents.length === 0 && connections.contradictions.length === 0 && connections.insights.length === 0)) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Cross-Document Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No connections found with other documents.</p>
            <p className="text-xs text-gray-500 mt-1">Upload more documents to discover relationships.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} shadow-lg border-0`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          Cross-Document Connections
        </CardTitle>
        <CardDescription className="text-sm mt-1">
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {connections.total_connections} connection{connections.total_connections !== 1 ? 's' : ''}
          </span>
          {' '}found with your document library
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {/* Related Documents */}
        {connections.related_documents.length > 0 && (
          <Collapsible 
            open={expandedSections.has('related')} 
            onOpenChange={() => toggleSection('related')}
            className="border rounded-lg overflow-hidden"
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 h-auto hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-none">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded">
                    <Link2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    Related Documents
                  </span>
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {connections.related_documents.length}
                  </Badge>
                </div>
                {expandedSections.has('related') ? 
                  <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-gray-50 dark:bg-gray-900/30 p-4 space-y-3">
              {connections.related_documents.map((doc, index) => (
                <Card key={index} className="p-4 hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 border-l-4" 
                  style={{borderLeftColor: doc.connection_type === 'complementary' ? '#10b981' : doc.connection_type === 'contradictory' ? '#ef4444' : '#3b82f6'}}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                          {doc.document_title}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className={`text-xs px-2 py-0.5 ${getConnectionTypeColor(doc.connection_type)}`}>
                            {getConnectionTypeIcon(doc.connection_type)}
                            <span className="ml-1.5 capitalize">{doc.connection_type}</span>
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full" 
                                style={{width: `${doc.relevance_score * 100}%`}}
                              />
                            </div>
                            <span>{Math.round(doc.relevance_score * 100)}%</span>
                          </div>
                        </div>
                      </div>
                      {onNavigateToDocument && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onNavigateToDocument(doc.document_id)}
                          className="ml-2 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {doc.explanation}
                    </p>
                    {doc.key_sections.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doc.key_sections.slice(0, 3).map((section, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800">
                            {section}
                          </Badge>
                        ))}
                        {doc.key_sections.length > 3 && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700">
                            +{doc.key_sections.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Contradictions */}
        {connections.contradictions.length > 0 && (
          <Collapsible 
            open={expandedSections.has('contradictions')} 
            onOpenChange={() => toggleSection('contradictions')}
            className="border rounded-lg overflow-hidden"
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 h-auto hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    Contradictions
                  </span>
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                    {connections.contradictions.length}
                  </Badge>
                </div>
                {expandedSections.has('contradictions') ? 
                  <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-red-50 dark:bg-red-900/10 p-4 space-y-3">
              {connections.contradictions.map((contradiction, index) => (
                <Card key={index} className="p-4 border-l-4 border-red-400 bg-white dark:bg-gray-800">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {contradiction.document_title}
                      </h4>
                      <Badge variant="secondary" className={`text-xs px-2 py-0.5 ${getSeverityColor(contradiction.severity)}`}>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {contradiction.severity} severity
                      </Badge>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
                        ⚠️ {contradiction.contradiction}
                      </p>
                    </div>
                    {onNavigateToDocument && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigateToDocument(contradiction.document_id)}
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                      >
                        <ExternalLink className="h-3 w-3 mr-1.5" />
                        Review Document
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Cross-Document Insights */}
        {connections.insights.length > 0 && (
          <Collapsible 
            open={expandedSections.has('insights')} 
            onOpenChange={() => toggleSection('insights')}
            className="border rounded-lg overflow-hidden"
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 h-auto hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-none">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/50 rounded">
                    <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    AI Insights
                  </span>
                  <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
                    {connections.insights.length}
                  </Badge>
                </div>
                {expandedSections.has('insights') ? 
                  <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 p-4 space-y-3">
              {connections.insights.map((insight, index) => (
                <Card key={index} className="p-4 bg-white dark:bg-gray-800 border-l-4 border-purple-400">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs capitalize bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                          {insight.type}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>Confidence:</span>
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                              className="bg-purple-600 h-1.5 rounded-full" 
                              style={{width: `${insight.confidence * 100}%`}}
                            />
                          </div>
                          <span className="font-medium">{Math.round(insight.confidence * 100)}%</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        💡 {insight.content}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
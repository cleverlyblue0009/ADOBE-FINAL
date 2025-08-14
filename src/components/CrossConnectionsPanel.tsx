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
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Link2 className="h-5 w-5 text-blue-600" />
          Cross-Document Connections
        </CardTitle>
        <CardDescription className="text-sm">
          {connections.total_connections} connection{connections.total_connections !== 1 ? 's' : ''} found with your document library
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Related Documents */}
        {connections.related_documents.length > 0 && (
          <Collapsible 
            open={expandedSections.has('related')} 
            onOpenChange={() => toggleSection('related')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 h-auto hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Link2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-gray-900">Related Documents</span>
                    <div className="text-sm text-gray-500">{connections.related_documents.length} documents found</div>
                  </div>
                </div>
                {expandedSections.has('related') ? 
                  <ChevronDown className="h-5 w-5 text-gray-400" /> : 
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-4 pl-2">
              {connections.related_documents.map((doc, index) => (
                <Card key={index} className="p-4 hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">{doc.document_title}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className={`text-xs font-medium ${getConnectionTypeColor(doc.connection_type)} border`}>
                            {getConnectionTypeIcon(doc.connection_type)}
                            <span className="ml-1 capitalize">{doc.connection_type}</span>
                          </Badge>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-gray-600 font-medium">
                              {Math.round(doc.relevance_score * 100)}% match
                            </span>
                          </div>
                        </div>
                      </div>
                      {onNavigateToDocument && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onNavigateToDocument(doc.document_id)}
                          className="ml-3 border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed bg-white/50 p-2 rounded border-l-2 border-l-blue-200">{doc.explanation}</p>
                    {doc.key_sections.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {doc.key_sections.slice(0, 3).map((section, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs px-2 py-1 bg-blue-50 border-blue-200 text-blue-800">
                            {section}
                          </Badge>
                        ))}
                        {doc.key_sections.length > 3 && (
                          <Badge variant="outline" className="text-xs px-2 py-1 bg-gray-50 border-gray-200 text-gray-600">
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
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 h-auto hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-gray-900">Contradictions</span>
                    <div className="text-sm text-gray-500">{connections.contradictions.length} conflicts identified</div>
                  </div>
                </div>
                {expandedSections.has('contradictions') ? 
                  <ChevronDown className="h-5 w-5 text-gray-400" /> : 
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-4 pl-2">
              {connections.contradictions.map((contradiction, index) => (
                <Card key={index} className="p-4 border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm mb-2">{contradiction.document_title}</h4>
                        <Badge variant="secondary" className={`text-xs font-medium ${getSeverityColor(contradiction.severity)} border mb-2`}>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {contradiction.severity.toUpperCase()} SEVERITY
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed bg-white/50 p-3 rounded border-l-2 border-l-red-300">{contradiction.contradiction}</p>
                    {onNavigateToDocument && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigateToDocument(contradiction.document_id)}
                        className="mt-2 border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
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
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 h-auto hover:bg-yellow-50 rounded-lg border border-transparent hover:border-yellow-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-gray-900">AI Insights</span>
                    <div className="text-sm text-gray-500">{connections.insights.length} strategic insights</div>
                  </div>
                </div>
                {expandedSections.has('insights') ? 
                  <ChevronDown className="h-5 w-5 text-gray-400" /> : 
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-4 pl-2">
              {connections.insights.map((insight, index) => (
                <Card key={index} className="p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border border-purple-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs capitalize font-medium bg-purple-100 text-purple-800 border-purple-200">
                          {insight.type}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-gray-600 font-medium">
                            {Math.round(insight.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed bg-white/60 p-3 rounded border-l-2 border-l-purple-300">{insight.content}</p>
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
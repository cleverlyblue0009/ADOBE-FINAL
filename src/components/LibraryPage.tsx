import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiService, DocumentInfo } from '@/lib/api';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { 
  Search, 
  Filter, 
  FileText, 
  Calendar, 
  User, 
  Target, 
  BookOpen, 
  Trash2, 
  Eye,
  ArrowLeft,
  Loader2,
  Grid3x3,
  List,
  Clock,
  TrendingUp,
  Star,
  MoreVertical
} from 'lucide-react';

interface LibraryPageProps {
  onDocumentSelect: (documents: DocumentInfo[], persona: string, jobToBeDone: string) => void;
  onBack: () => void;
}

export function LibraryPage({ onDocumentSelect, onBack }: LibraryPageProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [personas, setPersonas] = useState<string[]>([]);
  const [jobs, setJobs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();

  useEffect(() => {
    loadLibraryData();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, selectedPersona, selectedJob]);

  const loadLibraryData = async () => {
    try {
      setIsLoading(true);
      const [docsData, personasData, jobsData] = await Promise.all([
        apiService.getLibraryDocuments(),
        apiService.getPersonas(),
        apiService.getJobs()
      ]);
      
      setDocuments(docsData);
      setPersonas(personasData);
      setJobs(jobsData);
    } catch (error) {
      console.error('Failed to load library data:', error);
      toast({
        title: "Error",
        description: "Failed to load your document library. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by persona
    if (selectedPersona) {
      filtered = filtered.filter(doc => doc.persona === selectedPersona);
    }

    // Filter by job
    if (selectedJob) {
      filtered = filtered.filter(doc => doc.job_to_be_done === selectedJob);
    }

    setFilteredDocuments(filtered);
  };

  const handleDocumentToggle = (docId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleAnalyzeSelected = () => {
    if (selectedDocuments.size === 0) {
      toast({
        title: "No documents selected",
        description: "Please select at least one document to analyze.",
        variant: "destructive"
      });
      return;
    }

    const selectedDocs = documents.filter(doc => selectedDocuments.has(doc.id));
    
    // Use the most common persona and job from selected documents
    const personaCount = new Map<string, number>();
    const jobCount = new Map<string, number>();
    
    selectedDocs.forEach(doc => {
      if (doc.persona) {
        personaCount.set(doc.persona, (personaCount.get(doc.persona) || 0) + 1);
      }
      if (doc.job_to_be_done) {
        jobCount.set(doc.job_to_be_done, (jobCount.get(doc.job_to_be_done) || 0) + 1);
      }
    });

    const mostCommonPersona = Array.from(personaCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const mostCommonJob = Array.from(jobCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    onDocumentSelect(selectedDocs, mostCommonPersona, mostCommonJob);
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await apiService.deleteDocument(docId);
      setDocuments(docs => docs.filter(doc => doc.id !== docId));
      setSelectedDocuments(selected => {
        const newSelected = new Set(selected);
        newSelected.delete(docId);
        return newSelected;
      });
      toast({
        title: "Success",
        description: "Document deleted successfully."
      });
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNeonColor = (index: number) => {
    const neonColors = [
      'neon-cyan',
      'neon-pink', 
      'neon-green',
      'neon-purple',
      'neon-orange',
      'neon-blue'
    ];
    return neonColors[index % neonColors.length];
  };

  const getNeonBorderClass = (index: number) => {
    const neonBorders = [
      'border-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.3)]',
      'border-neon-pink shadow-[0_0_20px_rgba(255,20,147,0.3)]',
      'border-neon-green shadow-[0_0_20px_rgba(0,255,0,0.3)]',
      'border-neon-purple shadow-[0_0_20px_rgba(138,43,226,0.3)]',
      'border-neon-orange shadow-[0_0_20px_rgba(255,165,0,0.3)]',
      'border-neon-blue shadow-[0_0_20px_rgba(30,144,255,0.3)]'
    ];
    return neonBorders[index % neonBorders.length];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--brand-primary)) 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, hsl(var(--brand-secondary)) 0%, transparent 50%),
                             radial-gradient(circle at 50% 50%, hsl(var(--brand-accent)) 0%, transparent 50%)`,
            backgroundSize: '400px 400px, 300px 300px, 500px 500px',
            backgroundPosition: '0 0, 100px 100px, 200px 50px'
          }} />
        </div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-32 left-1/3 w-80 h-80 bg-neon-green/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-neon-orange/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="text-center relative z-10">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-brand-primary" />
          <p className="text-lg font-medium text-text-primary">Loading your document library...</p>
          <p className="text-sm text-text-secondary mt-2">Organizing your knowledge base</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--brand-primary)) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, hsl(var(--brand-secondary)) 0%, transparent 50%),
                           radial-gradient(circle at 50% 50%, hsl(var(--brand-accent)) 0%, transparent 50%)`,
          backgroundSize: '400px 400px, 300px 300px, 500px 500px',
          backgroundPosition: '0 0, 100px 100px, 200px 50px'
        }} />
      </div>
      
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-32 left-1/3 w-80 h-80 bg-neon-green/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-neon-orange/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Modern Header */}
      <header className="relative z-10 p-6 border-b border-border-subtle bg-surface-elevated/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 hover:bg-brand-primary/10 hover:text-brand-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-text-primary">
                {documents.length} Documents
              </p>
              <p className="text-xs text-text-secondary">
                {selectedDocuments.size} selected
              </p>
            </div>
            <div className="flex items-center gap-2 bg-surface-elevated rounded-lg p-1 border border-border-subtle">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-6xl font-black text-text-primary mb-3 headline-gradient text-transparent bg-clip-text">
              Document Library
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Manage, organize, and analyze your intelligent document collection with neon-powered insights
            </p>
          </div>

          {/* Enhanced Filters Section */}
          <Card className="mb-8 border-0 shadow-xl bg-surface-elevated/80 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary h-5 w-5" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 bg-surface-hover border-border-subtle focus:bg-surface-elevated transition-colors"
                  />
                </div>
                
                <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                  <SelectTrigger className="h-12 bg-surface-hover border-border-subtle focus:bg-surface-elevated">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-text-tertiary" />
                      <SelectValue placeholder="All personas" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All personas</SelectItem>
                    {personas.map(persona => (
                      <SelectItem key={persona} value={persona}>
                        {persona}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedJob} onValueChange={setSelectedJob}>
                  <SelectTrigger className="h-12 bg-surface-hover border-border-subtle focus:bg-surface-elevated">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-text-tertiary" />
                      <SelectValue placeholder="All jobs" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All jobs</SelectItem>
                    {jobs.map(job => (
                      <SelectItem key={job} value={job}>
                        {job}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleAnalyzeSelected}
                  disabled={selectedDocuments.size === 0}
                  className="h-12 bg-gradient-primary hover:opacity-90 text-white font-semibold shadow-xl transition-all hover:shadow-2xl"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  Analyze ({selectedDocuments.size})
                </Button>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-border-subtle">
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary">{documents.length}</div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wider">Total Docs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-primary">{personas.length}</div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wider">Personas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-secondary">{jobs.length}</div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wider">Jobs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-green">
                    {documents.reduce((acc, doc) => acc + (doc.outline?.length || 0), 0)}
                  </div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wider">Sections</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Grid/List */}
          {filteredDocuments.length === 0 ? (
            <Card className="border-0 shadow-xl bg-surface-elevated/80 backdrop-blur-md">
              <CardContent className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-surface-hover rounded-full mb-6">
                  <FileText className="h-10 w-10 text-text-tertiary" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  {documents.length === 0 ? 'No documents yet' : 'No documents match your filters'}
                </h3>
                <p className="text-text-secondary max-w-md mx-auto">
                  {documents.length === 0 
                    ? 'Upload your first PDF to get started with intelligent document analysis.'
                    : 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                  }
                </p>
                {documents.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedPersona('');
                      setSelectedJob('');
                    }}
                    className="mt-6"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {filteredDocuments.map((doc, index) => (
                <Card 
                  key={doc.id}
                  className={`
                    group cursor-pointer transition-all duration-500 border-2
                    ${selectedDocuments.has(doc.id) 
                      ? `${getNeonBorderClass(index)} scale-105 bg-surface-elevated shadow-2xl animate-pulse` 
                      : 'border-border-subtle hover:border-neon-cyan/50 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:scale-[1.02] bg-surface-elevated/80'
                    }
                    backdrop-blur-md hover:bg-surface-elevated
                    ${viewMode === 'list' ? 'flex flex-row' : ''}
                  `}
                  onClick={() => handleDocumentToggle(doc.id)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      {/* Grid View Card */}
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-bold line-clamp-2 text-text-primary group-hover:text-neon-cyan transition-colors">
                              {doc.title}
                            </CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDocument(doc.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-error hover:text-error/80 hover:bg-error/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardDescription className="text-sm text-text-secondary line-clamp-1">
                          {doc.name}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {doc.persona && (
                            <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30 hover:bg-neon-blue/30 transition-colors">
                              <User className="h-3 w-3 mr-1" />
                              {doc.persona}
                            </Badge>
                          )}
                          {doc.job_to_be_done && (
                            <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/30 hover:bg-neon-purple/30 transition-colors">
                              <Target className="h-3 w-3 mr-1" />
                              {doc.job_to_be_done}
                            </Badge>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1 text-text-secondary">
                            <Clock className="h-3 w-3" />
                            {formatDate(doc.upload_timestamp)}
                          </div>
                          <div className="flex items-center gap-1 text-text-secondary">
                            <FileText className="h-3 w-3" />
                            {doc.outline.length} sections
                          </div>
                        </div>

                        {/* Selection indicator */}
                        {selectedDocuments.has(doc.id) && (
                          <div className="flex items-center justify-center py-2 bg-neon-cyan/10 rounded-lg border border-neon-cyan/30">
                            <span className="text-neon-cyan text-sm font-semibold">✓ Selected</span>
                          </div>
                        )}
                      </CardContent>
                    </>
                  ) : (
                    <>
                      {/* List View Card */}
                      <div className="flex-1 p-6 flex items-center gap-6">
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${selectedDocuments.has(doc.id) ? `bg-${getNeonColor(index)}/20 border border-${getNeonColor(index)}/50` : 'bg-gradient-primary'}`}>
                            <FileText className={`h-6 w-6 ${selectedDocuments.has(doc.id) ? `text-${getNeonColor(index)}` : 'text-white'}`} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-text-primary group-hover:text-neon-cyan transition-colors truncate">
                            {doc.title}
                          </h3>
                          <p className="text-sm text-text-secondary truncate">{doc.name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          {doc.persona && (
                            <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30">
                              {doc.persona}
                            </Badge>
                          )}
                          {doc.job_to_be_done && (
                            <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/30">
                              {doc.job_to_be_done}
                            </Badge>
                          )}
                          <div className="text-sm text-text-secondary">
                            {doc.outline.length} sections
                          </div>
                          <div className="text-sm text-text-secondary">
                            {formatDate(doc.upload_timestamp)}
                          </div>
                          {selectedDocuments.has(doc.id) && (
                            <Badge className={`bg-${getNeonColor(index)}/20 text-${getNeonColor(index)} border-${getNeonColor(index)}/50`}>Selected</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDocument(doc.id);
                            }}
                            className="text-error hover:text-error/80 hover:bg-error/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
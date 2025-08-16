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

  const getPersonaColor = (persona: string) => {
    const colors = [
      'bg-blue-900/30 text-blue-300 border-blue-700',
      'bg-green-900/30 text-green-300 border-green-700',
      'bg-purple-900/30 text-purple-300 border-purple-700',
      'bg-orange-900/30 text-orange-300 border-orange-700',
      'bg-pink-900/30 text-pink-300 border-pink-700',
      'bg-indigo-900/30 text-indigo-300 border-indigo-700'
    ];
    const index = persona.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const getJobColor = (job: string) => {
    const colors = [
      'bg-emerald-900/30 text-emerald-300 border-emerald-700',
      'bg-cyan-900/30 text-cyan-300 border-cyan-700',
      'bg-rose-900/30 text-rose-300 border-rose-700',
      'bg-amber-900/30 text-amber-300 border-amber-700',
      'bg-violet-900/30 text-violet-300 border-violet-700',
      'bg-teal-900/30 text-teal-300 border-teal-700'
    ];
    const index = job.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-indigo-400" />
          <p className="text-lg font-medium text-gray-200">Loading your document library...</p>
          <p className="text-sm text-gray-400 mt-2">Organizing your knowledge base</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Modern Header */}
      <header className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700 sticky top-0 z-20 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={onBack}
                className="flex items-center gap-2 hover:bg-gray-700 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Logo size="sm" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-200">
                  {documents.length} Documents
                </p>
                <p className="text-xs text-gray-400">
                  {selectedDocuments.size} selected
                </p>
              </div>
              <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
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
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-100 mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Document Library
          </h1>
          <p className="text-lg text-gray-300">
            Manage, organize, and analyze your intelligent document collection
          </p>
        </div>

        {/* Enhanced Filters Section */}
        <Card className="mb-8 border border-gray-700 shadow-xl bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:bg-gray-600 focus:border-indigo-500 transition-colors"
                />
              </div>
              
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger className="h-12 bg-gray-700 border-gray-600 text-gray-100 focus:bg-gray-600 focus:border-indigo-500">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="All personas" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-gray-100 hover:bg-gray-700">All personas</SelectItem>
                  {personas.map(persona => (
                    <SelectItem key={persona} value={persona} className="text-gray-100 hover:bg-gray-700">
                      {persona}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger className="h-12 bg-gray-700 border-gray-600 text-gray-100 focus:bg-gray-600 focus:border-indigo-500">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="All jobs" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-gray-100 hover:bg-gray-700">All jobs</SelectItem>
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
                className="h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transition-all hover:shadow-xl"
              >
                <Eye className="h-5 w-5 mr-2" />
                Analyze ({selectedDocuments.size})
              </Button>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Total Docs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{personas.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Personas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{jobs.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {documents.reduce((acc, doc) => acc + (doc.outline?.length || 0), 0)}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Sections</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Grid/List */}
        {filteredDocuments.length === 0 ? (
          <Card className="border border-gray-700 shadow-xl bg-gray-800/90 backdrop-blur-sm">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-700 rounded-full mb-6">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">
                {documents.length === 0 ? 'No documents yet' : 'No documents match your filters'}
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
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
                  className="mt-6 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
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
            {filteredDocuments.map((doc) => (
              <Card 
                key={doc.id}
                className={`
                  group cursor-pointer transition-all duration-300 border border-gray-700 shadow-lg
                  ${selectedDocuments.has(doc.id) 
                    ? 'ring-2 ring-indigo-500 shadow-xl scale-[1.02] bg-indigo-900/20' 
                    : 'hover:shadow-xl hover:scale-[1.02] bg-gray-800/90'
                  }
                  backdrop-blur-sm hover:bg-gray-800
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
                          <CardTitle className="text-lg font-bold line-clamp-2 text-gray-100 group-hover:text-indigo-400 transition-colors">
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
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardDescription className="text-sm text-gray-400 line-clamp-1">
                        {doc.name}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {doc.persona && (
                          <Badge className={getPersonaColor(doc.persona)}>
                            <User className="h-3 w-3 mr-1" />
                            {doc.persona}
                          </Badge>
                        )}
                        {doc.job_to_be_done && (
                          <Badge className={getJobColor(doc.job_to_be_done)}>
                            <Target className="h-3 w-3 mr-1" />
                            {doc.job_to_be_done}
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatDate(doc.upload_timestamp)}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <FileText className="h-3 w-3" />
                          {doc.outline.length} sections
                        </div>
                      </div>

                      {/* Selection indicator */}
                      {selectedDocuments.has(doc.id) && (
                        <div className="flex items-center justify-center py-2 bg-blue-100 rounded-lg">
                          <span className="text-blue-700 text-sm font-semibold">✓ Selected</span>
                        </div>
                      )}
                    </CardContent>
                  </>
                ) : (
                  <>
                    {/* List View Card */}
                    <div className="flex-1 p-6 flex items-center gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{doc.name}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {doc.persona && (
                          <Badge className="bg-blue-100 text-blue-700">
                            {doc.persona}
                          </Badge>
                        )}
                        {doc.job_to_be_done && (
                          <Badge className="bg-purple-100 text-purple-700">
                            {doc.job_to_be_done}
                          </Badge>
                        )}
                        <div className="text-sm text-gray-500">
                          {doc.outline.length} sections
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(doc.upload_timestamp)}
                        </div>
                        {selectedDocuments.has(doc.id) && (
                          <Badge className="bg-blue-600 text-white">Selected</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.id);
                          }}
                          className="text-red-500 hover:text-red-700"
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
  );
}
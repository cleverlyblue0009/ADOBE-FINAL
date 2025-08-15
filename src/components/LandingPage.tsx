import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiService, DocumentInfo } from '@/lib/api';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';
import { 
  Upload, 
  Brain, 
  Mic, 
  Eye, 
  Clock, 
  BookOpen,
  Accessibility,
  Palette,
  Volume2,
  Loader2,
  Library,
  ArrowRight
} from 'lucide-react';
import { useEffect } from 'react';

interface LandingPageProps {
  onStart: (documents: DocumentInfo[], persona: string, jobToBeDone: string) => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [persona, setPersona] = useState('');
  const [jobToBeDone, setJobToBeDone] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showFeatureDemo, setShowFeatureDemo] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Typing animation state
  const [typedText, setTypedText] = useState('');
  const [showRemainingText, setShowRemainingText] = useState(false);
  const [remainingTextOpacity, setRemainingTextOpacity] = useState(0);
  const fullText = 'Transform PDFs into';
  const remainingText = ' intelligent reading experiences';
  
  // Typing animation effect with improved font and gradual appearance
  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        // Start showing remaining text gradually after typing completes
        setShowRemainingText(true);
        
        // Gradually increase opacity
        let opacity = 0;
        const fadeInterval = setInterval(() => {
          opacity += 0.02;
          if (opacity >= 1) {
            opacity = 1;
            clearInterval(fadeInterval);
          }
          setRemainingTextOpacity(opacity);
        }, 30);
      }
    }, 80); // Slightly faster typing speed

    return () => clearInterval(typingInterval);
  }, []);

  const handleFileUpload = (files: FileList) => {
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    setSelectedFiles(prev => [...prev, ...pdfFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleStart = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one PDF file to continue.",
        variant: "destructive"
      });
      return;
    }

    if (!persona.trim() || !jobToBeDone.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both your role and what you want to accomplish.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadedDocuments = await apiService.uploadPDFs(selectedFiles, persona, jobToBeDone);
      
      toast({
        title: "Upload successful",
        description: `Successfully uploaded ${uploadedDocuments.length} document(s).`
      });
      
      onStart(uploadedDocuments, persona, jobToBeDone);
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload and process PDFs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFeatureClick = (feature: string) => {
    setShowFeatureDemo(feature);
    toast({
      title: `${feature.charAt(0).toUpperCase() + feature.slice(1)} Feature`,
      description: `Learn how to use ${feature} after uploading a PDF and starting your reading session.`
    });
  };

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
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-32 left-1/3 w-80 h-80 bg-green-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      {/* Header */}
      <header className="relative z-10 p-6 border-b border-border-subtle bg-surface-elevated/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              onClick={() => navigate('/library')}
              variant="outline"
              className="flex items-center gap-2 hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/30"
            >
              <Library className="h-4 w-4" />
              My Library
            </Button>
          </div>
        </div>
      </header>

          {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-5xl mx-auto text-center space-y-12 animate-fade-in">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-medium border border-brand-primary/20">
              <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
              AI-Powered Reading Assistant
            </div>
            <h2 className="text-6xl md:text-8xl font-bold text-text-primary leading-[1.1] tracking-tight headline-main">
              <span className="typing-text inline-block" style={{ 
                fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: 700,
                letterSpacing: '-0.02em'
              }}>
                {typedText}
                {typedText.length < fullText.length && (
                  <span className="typing-cursor inline-block w-1 h-14 md:h-20 bg-brand-primary ml-1 animate-pulse" />
                )}
              </span>
              {showRemainingText && (
                <span 
                  className="headline-gradient text-transparent bg-clip-text inline-block ml-3 transition-opacity duration-1000"
                  style={{ 
                    opacity: remainingTextOpacity,
                    fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                    fontWeight: 800,
                    letterSpacing: '-0.03em'
                  }}
                >
                  {remainingText}
                </span>
              )}
            </h2>
            <p className="text-xl md:text-2xl text-text-secondary max-w-4xl mx-auto leading-relaxed font-light">
              Upload your documents and unlock AI-powered insights, personalized highlights, 
              and universal accessibility features designed for every reader.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-text-tertiary">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                Instant Processing
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                Privacy First
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                Fully Accessible
              </div>
            </div>
          </div>

          {/* Upload Zone */}
          <Card id="upload-section" className="max-w-4xl mx-auto shadow-xl border-0 bg-surface-elevated/80 backdrop-blur-md">
            <CardHeader className="pb-8 text-center">
              <CardTitle className="text-3xl font-bold">Get Started</CardTitle>
              <CardDescription className="text-lg text-text-secondary">
                Upload your PDFs and personalize your reading experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 relative
                  ${dragActive 
                    ? 'border-brand-primary bg-surface-hover' 
                    : 'border-border-subtle hover:border-brand-primary/50'
                  }
                `}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="relative z-20 pointer-events-none">
                  <Upload className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-text-primary font-medium">
                      Drop your PDFs here or click to browse
                    </p>
                    <p className="text-sm text-text-secondary">
                      Supports multiple files • Max 10MB per file
                    </p>
                  </div>
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2 relative z-20 pointer-events-none">
                    <p className="text-sm font-medium text-text-primary">
                      {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected:
                    </p>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="text-sm text-text-secondary bg-surface-elevated rounded px-3 py-1">
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Persona & Job Input */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="persona">Your Role/Persona</Label>
                  <Input
                    id="persona"
                    placeholder="e.g., Researcher, Student, Analyst"
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job">Your Goal</Label>
                  <Input
                    id="job"
                    placeholder="e.g., Exam prep, Market research"
                    value={jobToBeDone}
                    onChange={(e) => setJobToBeDone(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={handleStart}
                disabled={selectedFiles.length === 0 || isUploading}
                size="lg"
                className="w-full gap-3 h-16 text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-primary hover:opacity-90 text-white disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-7 w-7 animate-spin" />
                    Processing PDFs...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-7 w-7" />
                    Start Intelligent Reading
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-text-primary mb-4">Powerful Features</h3>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Experience the future of document reading with our AI-powered tools
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                {/* AI Insights */}
                <Card 
                  className="group text-center transition-all duration-500 border-0 shadow-xl hover:shadow-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-md cursor-pointer hover:from-blue-50 hover:to-indigo-50 hover:-translate-y-2 relative overflow-hidden"
                  onClick={() => handleFeatureClick('ai-insights')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardContent className="p-10 space-y-6 relative z-10">
                    <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl">
                      <Brain className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="font-bold text-2xl text-gray-800 group-hover:text-blue-700 transition-colors">AI Insights</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">Get comprehensive insights with web research, persona analysis, and keyword extraction</p>
                    <div className="text-sm text-blue-600 font-semibold group-hover:text-blue-700 flex items-center justify-center gap-2">
                      Click to learn more 
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="group text-center transition-all duration-500 border-0 shadow-xl hover:shadow-2xl bg-gradient-to-br from-purple-50/80 to-pink-50/80 backdrop-blur-md cursor-pointer hover:from-purple-50 hover:to-pink-50 hover:-translate-y-2 relative overflow-hidden"
                  onClick={() => handleFeatureClick('podcast')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardContent className="p-10 space-y-6 relative z-10">
                    <div className="h-24 w-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl">
                      <Volume2 className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="font-bold text-2xl text-gray-800 group-hover:text-purple-700 transition-colors">Podcast Mode</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">Listen to AI-narrated summaries of any section</p>
                    <div className="text-sm text-purple-600 font-semibold group-hover:text-purple-700 flex items-center justify-center gap-2">
                      Click to learn more 
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="group text-center transition-all duration-500 border-0 shadow-xl hover:shadow-2xl bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-md cursor-pointer hover:from-green-50 hover:to-emerald-50 hover:-translate-y-2 relative overflow-hidden"
                  onClick={() => handleFeatureClick('accessibility')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardContent className="p-10 space-y-6 relative z-10">
                    <div className="h-24 w-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl">
                      <Accessibility className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="font-bold text-2xl text-gray-800 group-hover:text-green-700 transition-colors">Universal Access</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">Dyslexia-friendly fonts, voice reading, and accessibility support</p>
                    <div className="text-sm text-green-600 font-semibold group-hover:text-green-700 flex items-center justify-center gap-2">
                      Click to learn more 
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="group text-center transition-all duration-500 border-0 shadow-xl hover:shadow-2xl bg-gradient-to-br from-yellow-50/80 to-orange-50/80 backdrop-blur-md cursor-pointer hover:from-yellow-50 hover:to-orange-50 hover:-translate-y-2 relative overflow-hidden"
                  onClick={() => handleFeatureClick('highlights')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardContent className="p-10 space-y-6 relative z-10">
                    <div className="h-24 w-24 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl">
                      <Eye className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="font-bold text-2xl text-gray-800 group-hover:text-yellow-700 transition-colors">Smart Highlights</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">Automatically highlight content relevant to your role</p>
                    <div className="text-sm text-yellow-600 font-semibold group-hover:text-yellow-700 flex items-center justify-center gap-2">
                      Click to learn more 
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="group text-center transition-all duration-500 border-0 shadow-xl hover:shadow-2xl bg-gradient-to-br from-cyan-50/80 to-teal-50/80 backdrop-blur-md cursor-pointer hover:from-cyan-50 hover:to-teal-50 hover:-translate-y-2 relative overflow-hidden"
                  onClick={() => handleFeatureClick('progress')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardContent className="p-10 space-y-6 relative z-10">
                    <div className="h-24 w-24 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl">
                      <Clock className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="font-bold text-2xl text-gray-800 group-hover:text-cyan-700 transition-colors">Reading Progress</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">Track your progress with intelligent time estimates</p>
                    <div className="text-sm text-cyan-600 font-semibold group-hover:text-cyan-700 flex items-center justify-center gap-2">
                      Click to learn more 
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="group text-center transition-all duration-500 border-0 shadow-xl hover:shadow-2xl bg-gradient-to-br from-rose-50/80 to-pink-50/80 backdrop-blur-md cursor-pointer hover:from-rose-50 hover:to-pink-50 hover:-translate-y-2 relative overflow-hidden"
                  onClick={() => handleFeatureClick('themes')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardContent className="p-10 space-y-6 relative z-10">
                    <div className="h-24 w-24 bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl">
                      <Palette className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="font-bold text-2xl text-gray-800 group-hover:text-rose-700 transition-colors">Adaptive Themes</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">Light, dark, and accessible themes for comfortable reading</p>
                    <div className="text-sm text-rose-600 font-semibold group-hover:text-rose-700 flex items-center justify-center gap-2">
                      Click to learn more 
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </div>
          </div>
        </div>
      </main>

      {/* Feature Demo Modal */}
      {showFeatureDemo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-surface-elevated/95 backdrop-blur-lg border border-border-subtle rounded-3xl p-8 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto shadow-2xl modern-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-text-primary">
                {showFeatureDemo === 'ai-insights' && 'AI Insights'}
                {showFeatureDemo === 'podcast' && 'Podcast Mode'}
                {showFeatureDemo === 'accessibility' && 'Universal Access'}
                {showFeatureDemo === 'highlights' && 'Smart Highlights'}
                {showFeatureDemo === 'progress' && 'Reading Progress'}
                {showFeatureDemo === 'themes' && 'Adaptive Themes'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFeatureDemo(null)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4 text-text-secondary">
              {showFeatureDemo === 'ai-insights' && (
                <>
                  <p>AI Insights provides comprehensive analysis of your documents using advanced language models and web research.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Get key takeaways and important facts</li>
                    <li>Discover interesting connections and contradictions</li>
                    <li>Understand complex concepts through AI explanations</li>
                    <li><strong>NEW:</strong> Extract keywords and concepts automatically</li>
                    <li><strong>NEW:</strong> Get persona-specific analysis for your role</li>
                    <li><strong>NEW:</strong> Receive web search suggestions for current facts</li>
                    <li><strong>NEW:</strong> Access topic analysis and research opportunities</li>
                  </ul>
                  <p className="text-sm text-text-tertiary mt-4">
                    <strong>How to use:</strong> Upload a PDF, set your role and goals, then click the Insights panel in the right sidebar. Use "Generate Comprehensive Insights" for advanced analysis.
                  </p>
                </>
              )}
              
              {showFeatureDemo === 'podcast' && (
                <>
                  <p>Podcast Mode converts your reading material into engaging audio summaries.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Listen to AI-narrated summaries of any section</li>
                    <li>Perfect for multitasking or accessibility</li>
                    <li>Customizable audio controls and playback</li>
                  </ul>
                  <p className="text-sm text-text-tertiary mt-4">
                    <strong>How to use:</strong> Upload a PDF, then click the Podcast panel in the right sidebar to generate audio summaries.
                  </p>
                </>
              )}
              
              {showFeatureDemo === 'accessibility' && (
                <>
                  <p>Universal Access ensures everyone can read comfortably regardless of their needs.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Dyslexia-friendly fonts and spacing</li>
                    <li>Text-to-speech functionality</li>
                    <li>Color blindness support and high contrast</li>
                    <li>Customizable reading experience</li>
                  </ul>
                  <p className="text-sm text-text-tertiary mt-4">
                    <strong>How to use:</strong> Upload a PDF, then click the Access panel in the right sidebar to customize your reading experience.
                  </p>
                </>
              )}
              
              {showFeatureDemo === 'highlights' && (
                <>
                  <p>Smart Highlights automatically identifies and highlights content relevant to your role and goals.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>AI-powered content relevance detection</li>
                    <li>Automatic highlighting of key sections</li>
                    <li>Personalized based on your persona and job</li>
                  </ul>
                  <p className="text-sm text-text-tertiary mt-4">
                    <strong>How to use:</strong> Upload a PDF and set your role - highlights will appear automatically as you read.
                  </p>
                </>
              )}
              
              {showFeatureDemo === 'progress' && (
                <>
                  <p>Reading Progress helps you track your document consumption and stay organized.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Track reading time and progress</li>
                    <li>Monitor completion across multiple documents</li>
                    <li>Set reading goals and milestones</li>
                  </ul>
                  <p className="text-sm text-text-tertiary mt-4">
                    <strong>How to use:</strong> Progress is tracked automatically as you read through your uploaded documents.
                  </p>
                </>
              )}
              
              {showFeatureDemo === 'themes' && (
                <>
                  <p>Adaptive Themes provide multiple visual options for comfortable reading in any environment.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Light, dark, and high-contrast themes</li>
                    <li>Automatic theme switching</li>
                    <li>Customizable color schemes</li>
                  </ul>
                  <p className="text-sm text-text-tertiary mt-4">
                    <strong>How to use:</strong> Click the theme toggle button in the top navigation bar to switch between themes.
                  </p>
                </>
              )}
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setShowFeatureDemo(null)}
                className="flex-1"
              >
                Got it!
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowFeatureDemo(null);
                  // Focus on the upload section
                  document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Start Reading
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 p-6 border-t border-border-subtle bg-surface-elevated/50">
        <div className="max-w-6xl mx-auto text-center text-sm text-text-secondary">
          <p>Built for intelligent reading • Powered by AI • Accessible by design</p>
        </div>
      </footer>
    </div>
  );
}
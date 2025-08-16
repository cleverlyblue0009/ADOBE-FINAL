import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LibraryPage } from '@/components/LibraryPage';
import { PDFReader, PDFDocument, OutlineItem } from '@/components/PDFReader';
import { DocumentInfo } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserProfile from '@/components/UserProfile';
import GuestModeBanner from '@/components/GuestModeBanner';

const Library = () => {
  const [showReader, setShowReader] = useState(false);
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [persona, setPersona] = useState('');
  const [jobToBeDone, setJobToBeDone] = useState('');
  const navigate = useNavigate();

  const handleDocumentSelect = (selectedDocuments: DocumentInfo[], userPersona: string, userJob: string) => {
    // Convert backend DocumentInfo to frontend PDFDocument format
    const pdfDocs: PDFDocument[] = selectedDocuments.map((doc) => {
      // Convert flat outline to hierarchical structure
      const buildHierarchicalOutline = (flatOutline: any[]): OutlineItem[] => {
        const result: OutlineItem[] = [];
        const stack: OutlineItem[] = [];
        
        flatOutline.forEach((item, index) => {
          const level = parseInt(item.level.replace('H', ''));
          const outlineItem: OutlineItem = {
            id: `${doc.id}-${index}`,
            title: item.text,
            level: level,
            page: item.page,
            children: []
          };
          
          // Find the correct parent based on level hierarchy
          while (stack.length > 0 && stack[stack.length - 1].level >= level) {
            stack.pop();
          }
          
          if (stack.length === 0) {
            // Top level item
            result.push(outlineItem);
          } else {
            // Child item
            const parent = stack[stack.length - 1];
            if (!parent.children) {
              parent.children = [];
            }
            parent.children.push(outlineItem);
          }
          
          stack.push(outlineItem);
        });
        
        return result;
      };
      
      return {
        id: doc.id,
        name: doc.name,
        title: doc.title,
        url: `http://localhost:8000/pdf/${doc.id}`, // Use backend PDF endpoint
        outline: buildHierarchicalOutline(doc.outline)
      };
    });
    
    setDocuments(pdfDocs);
    setPersona(userPersona);
    setJobToBeDone(userJob);
    setShowReader(true);
  };

  const handleBack = () => {
    if (showReader) {
      setShowReader(false);
      setDocuments([]);
      setPersona('');
      setJobToBeDone('');
    } else {
      navigate('/');
    }
  };

  if (showReader && documents.length > 0) {
    return (
      <ProtectedRoute>
        <div className="relative">
          <div className="absolute top-4 right-4 z-50">
            <UserProfile />
          </div>
          <GuestModeBanner />
          <PDFReader 
            documents={documents}
            persona={persona}
            jobToBeDone={jobToBeDone}
            onBack={handleBack}
          />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <UserProfile />
        </div>
        <GuestModeBanner />
        <LibraryPage 
          onDocumentSelect={handleDocumentSelect}
          onBack={handleBack}
        />
      </div>
    </ProtectedRoute>
  );
};

export default Library;
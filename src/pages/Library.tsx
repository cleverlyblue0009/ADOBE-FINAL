import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LibraryPage } from '@/components/LibraryPage';
import { PDFReader, PDFDocument } from '@/components/PDFReader';
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
    const pdfDocs: PDFDocument[] = selectedDocuments.map((doc) => ({
      id: doc.id,
      name: doc.name,
      url: `http://localhost:8000/pdf/${doc.id}`, // Use backend PDF endpoint
      outline: doc.outline.map((item, index) => ({
        id: index.toString(),
        title: item.text,
        level: parseInt(item.level.replace('H', '')),
        page: item.page
      }))
    }));
    
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
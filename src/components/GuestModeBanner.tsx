import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { AlertTriangle, X } from 'lucide-react';

const GuestModeBanner: React.FC = () => {
  const { isGuestMode, enterGuestMode } = useAuth();

  if (!isGuestMode) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-800">
            <strong>Guest Mode:</strong> You're using DocuSense without signing in. 
            Some features may be limited. 
            <Button
              variant="link"
              className="text-yellow-800 underline p-0 h-auto ml-1"
              onClick={() => window.location.reload()}
            >
              Sign in for full access
            </Button>
          </p>
        </div>
        <div className="ml-auto pl-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-yellow-400 hover:text-yellow-600"
            onClick={() => enterGuestMode()}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuestModeBanner; 
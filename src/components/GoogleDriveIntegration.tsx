
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Cloud, Link, Upload, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const GoogleDriveIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const { session } = useAuth();
  const { toast } = useToast();

  const connectGoogleDrive = async () => {
    setLoading(true);
    try {
      // Check if user has Google Drive scope
      if (session?.provider_token) {
        // Test the connection by listing files
        const response = await fetch('https://www.googleapis.com/drive/v3/files', {
          headers: {
            'Authorization': `Bearer ${session.provider_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFiles(data.files || []);
          setIsConnected(true);
          toast({
            title: "Google Drive Connected",
            description: "Successfully connected to your Google Drive.",
          });
        } else {
          throw new Error('Failed to connect to Google Drive');
        }
      } else {
        throw new Error('No Google access token available');
      }
    } catch (error) {
      console.error('Google Drive connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Please sign in again to grant Google Drive access.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadToGoogleDrive = async (content: string, filename: string) => {
    if (!session?.provider_token) {
      toast({
        title: "Not Connected",
        description: "Please connect to Google Drive first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create file metadata
      const metadata = {
        name: filename,
        parents: ['your-folder-id'] // Replace with actual folder ID if needed
      };

      // Upload file
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([content], { type: 'text/plain' }));

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.provider_token}`,
        },
        body: form
      });

      if (response.ok) {
        toast({
          title: "Upload Successful",
          description: `File "${filename}" uploaded to Google Drive.`,
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload file to Google Drive.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Cloud className="w-6 h-6 text-blue-500" />
        <h3 className="text-lg font-semibold">Google Drive Integration</h3>
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          <p className="text-gray-600">Connect your Google Drive to save and sync your financial data.</p>
          <Button 
            onClick={connectGoogleDrive}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Link className="w-4 h-4 mr-2" />
            )}
            Connect Google Drive
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-green-600">
            <Cloud className="w-4 h-4" />
            <span>Connected to Google Drive</span>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Recent Files:</h4>
            {files.slice(0, 5).map((file) => (
              <div key={file.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <FileText className="w-4 h-4" />
                <span className="text-sm">{file.name}</span>
              </div>
            ))}
          </div>

          <Button 
            onClick={() => uploadToGoogleDrive(JSON.stringify({ transactions: 'example' }), 'financial-data.json')}
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Export to Drive
          </Button>
        </div>
      )}
    </Card>
  );
};

export default GoogleDriveIntegration;

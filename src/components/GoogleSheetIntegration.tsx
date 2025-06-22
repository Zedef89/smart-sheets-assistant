import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet as SheetIcon, Link, Upload, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUserSettings, useSaveUserSettings } from '@/hooks/useUserSettings';

const GoogleSheetIntegration = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const { data: settings } = useUserSettings();
  const saveSettings = useSaveUserSettings();

  const [loading, setLoading] = useState(false);
  const [sheetId, setSheetId] = useState('');
  const [sheetTitle, setSheetTitle] = useState('');
  const isConnected = !!settings?.google_sheet_id;

  useEffect(() => {
    if (settings?.google_sheet_id) {
      setSheetId(settings.google_sheet_id);
      setSheetTitle(settings.google_sheet_title || '');
    }
  }, [settings]);

  const extractSheetId = (value: string) => {
    const match = value.match(/[-\w]{25,}/);
    return match ? match[0] : value;
  };

  const connectGoogleSheet = async () => {
    if (!sheetId) return;
    setLoading(true);
    const id = extractSheetId(sheetId);
    try {
      if (session?.provider_token) {
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${id}?fields=properties.title`,
          {
            headers: {
              Authorization: `Bearer ${session.provider_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSheetTitle(data.properties.title);
          setSheetId(id);
          await saveSettings.mutateAsync({
            google_sheet_id: id,
            google_sheet_title: data.properties.title,
          });
          toast({
            title: 'Google Sheet Connected',
            description: `Connected to sheet "${data.properties.title}"`,
          });
        } else {
          throw new Error('Failed to connect to Google Sheet');
        }
      } else {
        throw new Error('No Google access token available');
      }
    } catch (error) {
      console.error('Google Sheet connection error:', error);
      toast({
        title: 'Connection Failed',
        description: 'Please sign in again to grant Google Sheets access.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportExample = async () => {
    if (!session?.provider_token || !sheetId) return;
    setLoading(true);
    try {
      const values = [
        ['Example', '100', new Date().toISOString()],
      ];
      const body = {
        values,
      };
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.provider_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        toast({
          title: 'Export Successful',
          description: 'Data exported to Google Sheet.',
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export to Google Sheet.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-4">
        <SheetIcon className="w-6 h-6 text-green-500" />
        <h3 className="text-lg font-semibold">Google Sheets Integration</h3>
      </div>
      {!isConnected ? (
        <div className="space-y-4">
          <p className="text-gray-600">Connect a specific Google Sheet to sync your financial data.</p>
          <Input
            placeholder="Paste Google Sheet URL or ID"
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
          />
          <Button
            onClick={connectGoogleSheet}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link className="w-4 h-4 mr-2" />}
            Connect Sheet
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-green-600">
            <SheetIcon className="w-4 h-4" />
            <span>Connected to {sheetTitle}</span>
            <a
              href={`https://docs.google.com/spreadsheets/d/${sheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <Button onClick={exportExample} disabled={loading} variant="outline">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Export example
          </Button>
        </div>
      )}
    </Card>
  );
};

export default GoogleSheetIntegration;

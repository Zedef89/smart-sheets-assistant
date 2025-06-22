
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from './useUserSettings';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
  created_at: string;
}

export function useTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user
  });
}

export function useAddTransaction() {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();
  const { data: settings } = useUserSettings();

  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            ...transaction,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (settings?.google_sheet_id && session?.provider_token) {
        try {
          const values = [[
            transaction.description,
            String(transaction.amount),
            transaction.category,
            transaction.type,
            transaction.date,
          ]];
          await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${settings.google_sheet_id}/values/A1:append?valueInputOption=USER_ENTERED`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${session.provider_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ values }),
            }
          );
        } catch (err) {
          console.error('Google Sheet append failed:', err);
        }
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });
}

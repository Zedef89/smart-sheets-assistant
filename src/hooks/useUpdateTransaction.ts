import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpdateTransactionData {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
}

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateTransactionData) => {
      const { error } = await supabase
        .from('transactions')
        .update({
          description: data.description,
          amount: data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount),
          category: data.category,
          type: data.type,
          date: data.date,
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: 'Transazione aggiornata',
        description: 'La transazione è stata aggiornata con successo.',
      });
    },
    onError: (error) => {
      console.error('Errore nell\'aggiornamento della transazione:', error);
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore durante l\'aggiornamento della transazione.',
        variant: 'destructive',
      });
    },
  });
};
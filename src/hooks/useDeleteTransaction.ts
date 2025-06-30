import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch transactions and dashboard stats
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast({
        title: "Transazione eliminata",
        description: "La transazione è stata eliminata con successo.",
      });
    },
    onError: (error) => {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione della transazione.",
        variant: "destructive",
      });
    },
  });
};
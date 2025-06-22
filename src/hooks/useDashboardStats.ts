
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useDashboardStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get current month's transactions
      const currentMonth = new Date();
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, type, category, date')
        .eq('user_id', user.id)
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);

      if (error) throw error;

      const expenses = transactions?.filter(t => t.type === 'expense') || [];
      const income = transactions?.filter(t => t.type === 'income') || [];

      const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
      const balance = totalIncome - totalExpenses;

      // Calculate expenses by category
      const expensesByCategory = expenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

      return {
        balance,
        totalExpenses,
        totalIncome,
        expensesByCategory,
        transactionCount: transactions?.length || 0
      };
    },
    enabled: !!user
  });
}

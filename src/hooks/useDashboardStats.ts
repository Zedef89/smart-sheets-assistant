
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
      const today = new Date(); // Use today instead of last day of month
      
      // Get transactions for current month (from first day to today)
      const { data: monthlyTransactions, error: monthlyError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0])
        .order('date', { ascending: false });
        
      if (monthlyError) {
        throw monthlyError;
      }

      // Get all transactions for total comparison
      const { data: allTransactions, error: allError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
        
      if (allError) {
        throw allError;
      }

      const monthlyExpenses = monthlyTransactions?.filter(t => t.type === 'expense') || [];
      const monthlyIncome = monthlyTransactions?.filter(t => t.type === 'income') || [];
      const allExpenses = allTransactions?.filter(t => t.type === 'expense') || [];

      const totalExpenses = monthlyExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalIncome = monthlyIncome.reduce((sum, t) => sum + Number(t.amount), 0);
      const balance = totalIncome - totalExpenses;

      // Calculate monthly expenses by category (only positive values)
      const monthlyExpensesByCategory = monthlyExpenses.reduce((acc, t) => {
        const amount = Number(t.amount);
        if (amount > 0) { // Only consider positive expenses
          const normalizedCategory = normalizeCategoryName(t.category);
          acc[normalizedCategory] = (acc[normalizedCategory] || 0) + amount;
        }
        return acc;
      }, {} as Record<string, number>);

      // Calculate total expenses by category (only positive values)
      const totalExpensesByCategory = allExpenses.reduce((acc, t) => {
        const amount = Number(t.amount);
        if (amount > 0) { // Only consider positive expenses
          const normalizedCategory = normalizeCategoryName(t.category);
          acc[normalizedCategory] = (acc[normalizedCategory] || 0) + amount;
        }
        return acc;
      }, {} as Record<string, number>);
      


      // Helper function to normalize category names
      function normalizeCategoryName(category: string): string {
        const categoryMap: Record<string, string> = {
          // Italian to standard
          'cibo': 'Cibo',
          'food': 'Cibo',
          'trasporti': 'Trasporti',
          'transportation': 'Trasporti',
          'shopping': 'Shopping',
          'stipendio': 'Stipendio',
          'salary': 'Stipendio',
          'casa': 'Casa',
          'home': 'Casa',
          'salute': 'Salute',
          'health': 'Salute',
          'intrattenimento': 'Intrattenimento',
          'entertainment': 'Intrattenimento',
          'altro': 'Altro',
          'other': 'Altro',
          // Handle common variations
          'alimentari': 'Cibo',
          'ristorante': 'Cibo',
          'supermercato': 'Cibo',
          'benzina': 'Trasporti',
          'carburante': 'Trasporti',
          'metro': 'Trasporti',
          'taxi': 'Trasporti',
          'vestiti': 'Shopping',
          'abbigliamento': 'Shopping',
          'scarpe': 'Shopping',
          'affitto': 'Casa',
          'bollette': 'Casa',
          'utilities': 'Casa',
          'medico': 'Salute',
          'farmacia': 'Salute',
          'cinema': 'Intrattenimento',
          'teatro': 'Intrattenimento',
          'sport': 'Intrattenimento'
        };
        
        const lowerCategory = category.toLowerCase().trim();
        return categoryMap[lowerCategory] || category;
      }

      return {
        balance,
        totalExpenses,
        totalIncome,
        monthlyExpensesByCategory,
        totalExpensesByCategory,
        transactionCount: monthlyTransactions?.length || 0
      };
    },
    enabled: !!user
  });
}

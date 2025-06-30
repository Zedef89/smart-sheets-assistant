import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Plus, TrendingUp, DollarSign, Calendar, Lightbulb, Loader2, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import TransactionInput from './TransactionInput';

import { useTransactions } from '@/hooks/useTransactions';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useCategories } from '@/hooks/useCategories';
import { useDeleteTransaction } from '@/hooks/useDeleteTransaction';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'; 

const Dashboard = () => {
  const [showTransactionInput, setShowTransactionInput] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState(null);
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: categories } = useCategories();
  const deleteTransaction = useDeleteTransaction();

  const handleDeleteTransaction = async () => {
    if (deletingTransactionId) {
      await deleteTransaction.mutateAsync(deletingTransactionId);
      setDeletingTransactionId(null);
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionInput(true);
  };

  const handleCloseTransactionInput = () => {
    setShowTransactionInput(false);
    setEditingTransaction(null);
  };

  if (transactionsLoading || statsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-gray-600">Caricamento dati...</p>
        </div>
      </div>
    );
  }

  // Convert expenses by category to chart data
  const categoryColors = {
    'Cibo': '#ef4444',
    'Trasporti': '#3b82f6',
    'Shopping': '#8b5cf6',
    'Casa': '#f59e0b',
    'Salute': '#10b981',
    'Intrattenimento': '#f97316',
    'Stipendio': '#06b6d4',
    'Altro': '#6b7280',
    'spesa': '#ec4899',
    'spesa generica': '#84cc16',
    'Food': '#ef4444',
    'alimentari': '#dc2626',
    'ristorante': '#f59e0b',
    'trasporti': '#3b82f6',
    'benzina': '#1d4ed8',
    'entertainment': '#f97316',
    'divertimento': '#ea580c',
    'utilities': '#059669',
    'bollette': '#047857',
    'abbonamenti': '#7c3aed',
    'viaggi': '#0891b2',
    'sport': '#16a34a',
    'educazione': '#ca8a04',
    'regali': '#be185d',
    'lavoro': '#374151'
  };
  
  // Generate additional colors for categories not in the predefined list
  const additionalColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
    '#c44569', '#f8b500', '#786fa6', '#f19066', '#778beb',
    '#e77f67', '#cf6679', '#f8b500', '#3d5a80', '#98d8c8'
  ];

  // Helper function to get category color
  const getCategoryColor = (categoryName: string, index: number) => {
    // First, try to find the category in the database
    const dbCategory = categories?.find(cat => cat.name === categoryName);
    if (dbCategory?.color) {
      return dbCategory.color;
    }
    
    // Fallback to predefined colors
    let color = categoryColors[categoryName as keyof typeof categoryColors];
    if (!color) {
      const colorIndex = index % additionalColors.length;
      color = additionalColors[colorIndex];
    }
    return color;
  };

  // Create chart data for monthly expenses
  const monthlyCategoryData = Object.entries(stats?.monthlyExpensesByCategory || {})
    .map(([name, value], index) => ({
      name,
      value: value, // Only positive values are already filtered in the hook
      color: getCategoryColor(name, index)
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value); // Sort by value descending

  // Create chart data for total expenses
  const totalCategoryData = Object.entries(stats?.totalExpensesByCategory || {})
    .map(([name, value], index) => ({
      name,
      value: value, // Only positive values are already filtered in the hook
      color: getCategoryColor(name, index)
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value); // Sort by value descending



  // Recent transactions (last 10)
  const recentTransactions = transactions?.slice(0, 10) || [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header con statistiche rapide */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">La tua Dashboard</h2>
          <Button 
            onClick={() => setShowTransactionInput(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuova Transazione
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100">Saldo Attuale</p>
                <p className="text-2xl font-bold">€{stats?.balance?.toFixed(2) || '0.00'}</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-200" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Spese Mese</p>
                <p className="text-2xl font-bold text-gray-900">€{stats?.totalExpenses?.toFixed(2) || '0.00'}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Entrate Mese</p>
                <p className="text-2xl font-bold text-gray-900">€{stats?.totalIncome?.toFixed(2) || '0.00'}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Transazioni</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.transactionCount || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Grafico spese mensili */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Spese Ultimo Mese per Categoria</h3>
          {monthlyCategoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={monthlyCategoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                  >
                    {monthlyCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [
                      `€${Number(value).toFixed(2)}`, name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                {monthlyCategoryData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      €{item.value.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nessuna spesa registrata questo mese</p>
            </div>
          )}
        </Card>

        {/* Grafico spese totali */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Spese Totali per Categoria</h3>
          {totalCategoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={totalCategoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                  >
                    {totalCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [
                      `€${Number(value).toFixed(2)}`, name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                {totalCategoryData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      €{item.value.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nessuna spesa registrata</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Transazioni recenti */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Transazioni Recenti</h3>
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{transaction.category} • {new Date(transaction.date).toLocaleDateString('it-IT')}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}€{Math.abs(Number(transaction.amount)).toFixed(2)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifica
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeletingTransactionId(transaction.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Elimina
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nessuna transazione registrata</p>
              <Button 
                onClick={() => setShowTransactionInput(true)}
                className="mt-4"
                variant="outline"
              >
                Aggiungi la prima transazione
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 mt-8">
        {/* Insights AI */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Insights AI</h3>
          </div>
          <div className="space-y-4">
            {stats?.totalExpenses ? (
              <>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>📊 Analisi:</strong> Hai registrato €{stats.totalExpenses.toFixed(2)} di spese questo mese con {stats.transactionCount} transazioni.
                  </p>
                </div>
                {stats.balance > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>🎯 Ottimo:</strong> Il tuo saldo è positivo di €{stats.balance.toFixed(2)}. Continua così!
                    </p>
                  </div>
                )}
                {stats.balance < 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ Attenzione:</strong> Le tue spese superano le entrate di €{Math.abs(stats.balance).toFixed(2)}. Considera di rivedere il budget.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  <strong>🚀 Inizia:</strong> Aggiungi le tue prime transazioni per ricevere insights personalizzati sui tuoi dati finanziari.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal per input transazione */}
      {showTransactionInput && (
        <TransactionInput 
          onClose={handleCloseTransactionInput} 
          editingTransaction={editingTransaction}
        />
      )}

      {/* Dialog di conferma eliminazione */}
      <AlertDialog open={!!deletingTransactionId} onOpenChange={() => setDeletingTransactionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa transazione? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTransaction}
              className="bg-red-600 hover:bg-red-700"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;

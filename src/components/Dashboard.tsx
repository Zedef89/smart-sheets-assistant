
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Plus, TrendingUp, DollarSign, Calendar, Lightbulb, Loader2 } from 'lucide-react';
import TransactionInput from './TransactionInput';
import { useTransactions } from '@/hooks/useTransactions';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useCategories } from '@/hooks/useCategories';

const Dashboard = () => {
  const [showTransactionInput, setShowTransactionInput] = useState(false);
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: categories } = useCategories();

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
  const categoryData = categories?.map(cat => ({
    name: cat.name,
    value: stats?.expensesByCategory[cat.name] || 0,
    color: cat.color
  })).filter(item => item.value > 0) || [];

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Grafico a torta delle categorie */}
        <Card className="p-6 lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Spese per Categoria</h3>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {categoryData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">€{item.value.toFixed(2)}</span>
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

        {/* Transazioni recenti */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Transazioni Recenti</h3>
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{transaction.category} • {new Date(transaction.date).toLocaleDateString('it-IT')}</p>
                  </div>
                  <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}€{Math.abs(Number(transaction.amount)).toFixed(2)}
                  </span>
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

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mt-8">
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
        <TransactionInput onClose={() => setShowTransactionInput(false)} />
      )}
    </div>
  );
};

export default Dashboard;


import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Plus, TrendingUp, DollarSign, Calendar, Lightbulb } from 'lucide-react';
import TransactionInput from './TransactionInput';

const mockData = [
  { name: 'Cibo', value: 450, color: '#10b981' },
  { name: 'Trasporti', value: 120, color: '#3b82f6' },
  { name: 'Shopping', value: 200, color: '#f59e0b' },
  { name: 'Bollette', value: 300, color: '#ef4444' },
];

const monthlyData = [
  { month: 'Gen', spese: 800, entrate: 2200 },
  { month: 'Feb', spese: 950, entrate: 2200 },
  { month: 'Mar', spese: 1070, entrate: 2400 },
  { month: 'Apr', spese: 890, entrate: 2200 },
];

const recentTransactions = [
  { id: 1, description: 'Spesa al supermercato', amount: -45.50, category: 'Cibo', date: '2024-01-15' },
  { id: 2, description: 'Stipendio', amount: 2200, category: 'Entrate', date: '2024-01-01' },
  { id: 3, description: 'Benzina', amount: -60, category: 'Trasporti', date: '2024-01-14' },
  { id: 4, description: 'Cena fuori', amount: -35, category: 'Cibo', date: '2024-01-13' },
];

const Dashboard = () => {
  const [showTransactionInput, setShowTransactionInput] = useState(false);

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
                <p className="text-2xl font-bold">€1.230</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-200" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Spese Mese</p>
                <p className="text-2xl font-bold text-gray-900">€890</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Entrate Mese</p>
                <p className="text-2xl font-bold text-gray-900">€2.200</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Risparmi</p>
                <p className="text-2xl font-bold text-gray-900">€1.310</p>
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
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={mockData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
              >
                {mockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `€${value}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {mockData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-semibold">€{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Grafico mensile */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Trend Mensile</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="entrate" fill="#10b981" />
              <Bar dataKey="spese" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Transazioni recenti */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Transazioni Recenti</h3>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-500">{transaction.category} • {transaction.date}</p>
                </div>
                <span className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.amount > 0 ? '+' : ''}€{Math.abs(transaction.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Insights AI */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Insights AI</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>💡 Suggerimento:</strong> Le tue spese per il cibo sono aumentate del 15% rispetto al mese scorso. Considera di cucinare più spesso a casa.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>🎯 Obiettivo:</strong> Stai risparmiando bene! Continua così e raggiungerai il tuo obiettivo di €1.500 entro fine mese.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>📊 Trend:</strong> I tuoi trasporti costano meno della media. Ottimo lavoro nel contenere queste spese!
              </p>
            </div>
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

import React, { useState } from 'react';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAccounts, useAddAccount } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useAddCategory } from '@/hooks/useAddCategory';

const Settings = () => {
  const { data: accounts } = useAccounts();
  const addAccount = useAddAccount();
  const [accountName, setAccountName] = useState('');

  const { data: categories } = useCategories();
  const addCategory = useAddCategory();
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'income' | 'expense' | 'both'>('expense');
  const [catColor, setCatColor] = useState('#10b981');

  const handleAddAccount = async () => {
    if (!accountName) return;
    await addAccount.mutateAsync(accountName);
    setAccountName('');
  };

  const handleAddCategory = async () => {
    if (!catName) return;
    await addCategory.mutateAsync({ name: catName, color: catColor, type: catType });
    setCatName('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Conti</h2>
          <div className="space-y-2">
            {accounts?.map(acc => (
              <div key={acc.id} className="text-gray-800">
                {acc.name}
              </div>
            ))}
          </div>
          <div className="flex space-x-2">
            <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Nuovo conto" />
            <Button onClick={handleAddAccount}>Aggiungi</Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Categorie personalizzate</h2>
          <div className="space-y-2">
            {categories?.map(cat => (
              <div key={cat.id} className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
            <Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Nome categoria" />
            <Input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="w-16" />
            <select
              value={catType}
              onChange={e => setCatType(e.target.value as 'income' | 'expense' | 'both')}
              className="border rounded-md p-2"
            >
              <option value="expense">Spesa</option>
              <option value="income">Entrata</option>
              <option value="both">Entrata e Spesa</option>
            </select>
            <Button onClick={handleAddCategory}>Aggiungi</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;

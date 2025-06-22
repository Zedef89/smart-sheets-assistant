import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GoogleSheetIntegration from './GoogleSheetIntegration';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts, useAddAccount } from '@/hooks/useAccounts';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();
  const addAccount = useAddAccount();
  const [accountName, setAccountName] = useState('');

  const handleAddAccount = async () => {
    if (!accountName.trim()) return;
    try {
      await addAccount.mutateAsync(accountName.trim());
      setAccountName('');
    } catch (e) {
      console.error('Failed to add account', e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Benvenuto!</h2>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Categorie Predefinite</h3>
        <div className="flex flex-wrap gap-2">
          {categories?.map((cat) => (
            <span
              key={cat.id}
              className="px-3 py-1 rounded-full text-sm text-white"
              style={{ backgroundColor: cat.color }}
            >
              {cat.name}
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">I tuoi conti bancari</h3>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Nome conto"
            />
            <Button onClick={handleAddAccount} disabled={addAccount.isPending}>
              Aggiungi
            </Button>
          </div>
          <ul className="list-disc list-inside text-gray-700">
            {accounts?.map((acc) => (
              <li key={acc.id}>{acc.name}</li>
            ))}
          </ul>
        </div>
      </Card>

      <GoogleSheetIntegration />

      <div className="text-center">
        <Button onClick={onComplete} className="mt-4">
          Vai alla Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;

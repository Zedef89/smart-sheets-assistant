
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserCircle, LogOut } from 'lucide-react';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const Header = ({ isAuthenticated, onLogin, onLogout }: HeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">€</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">FinanceAI</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          ) : (
            <Button 
              onClick={onLogin}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex items-center space-x-2"
            >
              <UserCircle className="w-4 h-4" />
              <span>Accedi con Google</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

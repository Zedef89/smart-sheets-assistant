
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { user, signInWithGoogle, signOut, loading } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Failed to sign in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <a href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">€</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">FinanceAI</h1>
        </a>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-700">
                {user.user_metadata?.full_name || user.email}
              </span>
              <a href="/settings" className="text-sm text-emerald-600 hover:underline">
                Impostazioni
              </a>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
                disabled={loading}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleSignIn}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex items-center space-x-2"
              disabled={loading}
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

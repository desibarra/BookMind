
import React from 'react';

interface HeaderProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  language: 'en' | 'es';
  setLanguage: (language: 'en' | 'es') => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, setTheme, language, setLanguage }) => {
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const switchLanguage = (lang: 'en' | 'es') => {
    setLanguage(lang);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-cream/80 dark:bg-gray-blue/80 backdrop-blur-sm">
      <div className="font-serif text-2xl font-bold">
        <span className="text-gray-blue dark:text-cream">BookMind</span>
        <span className="text-gold">.ai</span>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl text-gray-blue dark:text-gold bg-gray-blue/10 dark:bg-cream/10 hover:bg-gold hover:text-cream dark:hover:bg-gold-dark dark:hover:text-gray-blue transition-all"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => switchLanguage('es')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              language === 'es' ? 'text-gray-blue bg-gold' : 'text-gray-blue dark:text-cream hover:text-gold'
            }`}
          >
            🇪🇸 ES
          </button>
          <span className="text-gray-blue/50 dark:text-cream/50">/</span>
          <button
            onClick={() => switchLanguage('en')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              language === 'en' ? 'text-gray-blue bg-gold' : 'text-gray-blue dark:text-cream hover:text-gold'
            }`}
          >
            🇬🇧 EN
          </button>
        </div>
      </div>
    </header>
  );
};

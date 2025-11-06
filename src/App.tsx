import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { StepProgress } from './components/StepProgress';
import { FinalScreen } from './components/FinalScreen';
import { Modal } from './components/Modal';
import { STEPS_CONFIG } from './constants';
import { BookData, Plan, StepConfig, CardOption } from './types';
import { generateBookOutline, generateBookContent } from './services/geminiService';
import { classNames } from './utils';

const initialBookData: BookData = {
  topic: '',
  title: '',
  type: '',
  purpose: '',
  audience: '',
  tone: '',
  language: 'English',
  structure: '',
  finalDetails: {
    dedication: '',
    quotes: '',
    author: '',
    cover: '',
  },
  plan: 'Free',
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({ en: {}, es: {} });
  const [i18nLoaded, setI18nLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bookData, setBookData] = useState<BookData>(initialBookData);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isEditingIndex, setIsEditingIndex] = useState(false);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const [enRes, esRes] = await Promise.all([
          fetch('./locales/en.json'),
          fetch('./locales/es.json')
        ]);
        const [enData, esData] = await Promise.all([
          enRes.json(),
          esRes.json()
        ]);
        setTranslations({ en: enData, es: esData });
      } catch (error) {
        console.error("Failed to load translations:", error);
      } finally {
        setI18nLoaded(true);
      }
    };
    fetchTranslations();
  }, []);
  
  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || key;
  }, [language, translations]);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // FIX: Update function signature for stricter type safety, excluding non-updatable fields.
  const handleUpdateData = (key: keyof Omit<BookData, 'finalDetails' | 'plan'>, value: string | string[]) => {
    setBookData(prev => ({ ...prev, [key]: value }));
  };
  
  const handleUpdateFinalDetails = (key: keyof BookData['finalDetails'], value: string) => {
    setBookData(prev => ({ 
      ...prev, 
      finalDetails: { ...prev.finalDetails, [key]: value } 
    }));
  };

  const currentStepConfig = STEPS_CONFIG[currentStep];
  const canGoNext = useMemo(() => {
    if (!currentStepConfig) return false;
    if (currentStepConfig.type === 'chapter-editor') return true;
    if (currentStepConfig.type === 'final-customization') return true;
    
    const value = bookData[currentStepConfig.key as keyof Omit<BookData, 'plan' | 'finalDetails'>];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return !!value;
  }, [bookData, currentStep, currentStepConfig]);

  const handleNext = () => {
    if (currentStep < STEPS_CONFIG.length - 1) {
      if (currentStepConfig.key === 'language') {
        handleGenerateOutline();
      } else {
        setCurrentStep(prev => prev + 1);
      }
      setIsEditingIndex(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
    setIsEditingIndex(false);
  };
  
  const handleGenerateOutline = async () => {
    setIsLoading('outline');
    const { title, structure } = await generateBookOutline(bookData);
    setBookData(prev => ({ ...prev, title, structure }));
    setIsLoading(null);
    setCurrentStep(prev => prev + 1);
  };
  
  const handleGenerateBook = async () => {
    setIsLoading('book');
    const content = await generateBookContent(bookData, t);
    setGeneratedContent(content);
    setIsLoading(null);
  }

  const handleRestart = () => {
    setBookData(initialBookData);
    setCurrentStep(0);
    setGeneratedContent('');
    setIsEditingIndex(false);
  };

  const renderCurrentStep = () => {
    if (!currentStepConfig) return null;
    const { key, type, placeholder, options } = currentStepConfig;
    const value = bookData[key as keyof Omit<BookData, 'plan'>];

    return (
      <div className="w-full max-w-2xl mx-auto p-4 flex-grow">
        <h2 className="text-3xl font-serif font-bold text-center mb-2 text-gray-blue dark:text-cream">{t(currentStepConfig.labelKey)}</h2>
        {currentStepConfig.type === 'final-customization' && <p className="text-center text-gray-blue/70 dark:text-cream/70 mb-8">{t('step8_subtitle')}</p>}

        {type === 'input' && (
          <input
            type="text"
            className="w-full p-4 bg-white/50 dark:bg-gray-blue/50 border-2 border-gray-blue/20 dark:border-cream/20 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none transition-all text-lg text-gray-blue dark:text-cream"
            placeholder={placeholder ? t(placeholder) : ''}
            value={value as string || ''}
            // FIX: Cast key to satisfy the stricter handleUpdateData signature.
            onChange={(e) => handleUpdateData(key as keyof Omit<BookData, 'finalDetails' | 'plan'>, e.target.value)}
          />
        )}
        {(type === 'single-card' || type === 'multi-card') && options && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map(opt => {
              // FIX: Use Array.isArray for type-safe checking instead of unsafe casting.
              const isSelected = type === 'single-card' 
                ? value === opt.value 
                : Array.isArray(value) && value.includes(opt.value);
              
              const handleClick = () => {
                if (type === 'single-card') {
                  // FIX: Cast key to satisfy the stricter handleUpdateData signature.
                  handleUpdateData(key as keyof Omit<BookData, 'finalDetails' | 'plan'>, opt.value);
                } else {
                  // FIX: Use Array.isArray for type-safe checking instead of unsafe casting.
                  const currentValues = Array.isArray(value) ? value : [];
                  const newValues = isSelected 
                    ? currentValues.filter(v => v !== opt.value)
                    : [...currentValues, opt.value];
                  // FIX: Cast key to satisfy the stricter handleUpdateData signature.
                  handleUpdateData(key as keyof Omit<BookData, 'finalDetails' | 'plan'>, newValues);
                }
              };

              return (
                <button
                  key={opt.value}
                  onClick={handleClick}
                  className={classNames(
                    "p-4 border-2 rounded-lg text-left transition-all transform hover:scale-105",
                    isSelected 
                      ? 'bg-gold/20 border-gold ring-2 ring-gold' 
                      : 'bg-white/50 dark:bg-gray-blue/50 border-gray-blue/20 dark:border-cream/20 hover:border-gold/50'
                  )}
                >
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <h3 className="font-bold text-lg text-gray-blue dark:text-cream">{t(opt.labelKey)}</h3>
                  <p className="text-sm text-gray-blue/70 dark:text-cream/70">{t(opt.descriptionKey)}</p>
                </button>
              );
            })}
          </div>
        )}
        {type === 'chapter-editor' && (
           <div className="bg-white/50 dark:bg-gray-blue/50 rounded-lg shadow-lg p-6 w-full max-w-2xl mx-auto text-center">
                <p className="text-sm text-gray-blue/70 dark:text-cream/70 mb-6">{t('step7_subtitle')}</p>
                <div className="bg-cream dark:bg-gray-blue p-6 rounded-lg text-left shadow-inner">
                    <input 
                        type="text" 
                        value={bookData.title}
                        onChange={(e) => handleUpdateData('title', e.target.value)}
                        readOnly={!isEditingIndex}
                        className={`w-full bg-transparent text-2xl font-serif font-bold text-center text-gold mb-4 p-2 focus:outline-none rounded-md transition-all ${isEditingIndex ? 'ring-1 ring-gold shadow-md' : ''}`}
                    />
                    {isEditingIndex ? (
                        <textarea
                            className="w-full p-2 bg-gray-blue/5 dark:bg-cream/5 border-none focus:outline-none ring-1 ring-gold rounded-md text-gray-blue dark:text-cream h-48 resize-y leading-loose"
                            value={bookData.structure}
                            onChange={(e) => handleUpdateData('structure', e.target.value)}
                        />
                    ) : (
                        <ul className="list-decimal list-inside space-y-2 pl-4 text-gray-blue dark:text-cream">
                            {bookData.structure.split('\n').filter(Boolean).map((chapter, i) => (
                                <li key={i} className="hover:text-gold transition-colors">{chapter}</li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="mt-6">
                    <button 
                        onClick={() => setIsEditingIndex(!isEditingIndex)}
                        className="px-6 py-2 border-2 border-gold text-gold font-bold rounded-lg hover:bg-gold hover:text-gray-blue transition-colors"
                    >
                        {isEditingIndex ? t('step7_save_button') : t('step7_edit_button')}
                    </button>
                </div>
            </div>
        )}
        {type === 'final-customization' && (
           <div className="space-y-4">
            {([
                { key: 'dedication', placeholder: 'final_details_dedication_placeholder', icon: '❤️' },
                { key: 'quotes', placeholder: 'final_details_quotes_placeholder', icon: '“ ”' },
                { key: 'author', placeholder: 'final_details_author_placeholder', icon: '👤' },
                { key: 'cover', placeholder: 'final_details_cover_placeholder', icon: '🖼️' },
            ] as const).map(field => (
                <div key={field.key} className="bg-white/50 dark:bg-gray-blue/50 rounded-lg shadow-md hover:shadow-xl transition-shadow p-4 flex items-start space-x-4">
                    <span className="text-3xl pt-2 text-gold">{field.icon}</span>
                    <div className="w-full">
                        <label className="font-bold text-gray-blue dark:text-cream">{t(`final_details_${field.key}`)}</label>
                        <textarea 
                            placeholder={t(field.placeholder)} 
                            value={bookData.finalDetails[field.key]} 
                            onChange={e => handleUpdateFinalDetails(field.key, e.target.value)} 
                            className="w-full mt-1 p-2 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-gold rounded-md text-gray-blue dark:text-cream resize-y min-h-[4rem]" 
                        />
                    </div>
                </div>
            ))}
        </div>
        )}
      </div>
    );
  };
  
  if (!i18nLoaded) {
    return (
        <div className="min-h-screen bg-cream dark:bg-gray-blue flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        </div>
    );
  }

  if (generatedContent) {
    return (
      <div className="min-h-screen bg-cream dark:bg-gray-blue text-gray-blue dark:text-cream font-sans transition-colors duration-300">
        <Header theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} />
        <main className="pt-24 pb-16">
          <FinalScreen bookData={bookData} generatedContent={generatedContent} onRestart={handleRestart} t={t} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-blue text-gray-blue dark:text-cream font-sans transition-colors duration-300 flex flex-col">
      <Header theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} />
      <main className="pt-24 pb-24 flex-grow flex flex-col">
        <StepProgress currentStep={currentStep} totalSteps={STEPS_CONFIG.length} />
        {renderCurrentStep()}
        <div className="w-full max-w-2xl mx-auto p-4 flex justify-between items-center mt-4">
          <button 
            onClick={handleBack} 
            className={classNames("px-6 py-2 rounded-lg transition-opacity font-bold", currentStep > 0 ? 'opacity-100 hover:text-gold' : 'opacity-0 pointer-events-none')}
          >
           &larr; {t('back')}
          </button>
          
          {currentStepConfig?.key === 'language' ? (
             <button onClick={handleGenerateOutline} disabled={!canGoNext || !!isLoading} className="px-8 py-3 bg-gold text-gray-blue font-bold rounded-lg hover:bg-gold-dark transition-all transform hover:scale-105 disabled:bg-gray-blue/20 disabled:text-gray-blue/50 disabled:scale-100">
               {t('generate_outline')}
             </button>
          ) : currentStepConfig?.type === 'final-customization' ? (
            <button onClick={handleGenerateBook} disabled={!!isLoading} className="px-8 py-3 bg-gold text-gray-blue font-bold rounded-lg hover:bg-gold-dark transition-all transform hover:scale-105 disabled:bg-gray-blue/20 disabled:text-gray-blue/50 disabled:scale-100">
              {t('generate_book')}
            </button>
          ) : (
             <button onClick={handleNext} disabled={!canGoNext || !!isLoading} className="px-8 py-3 bg-gold text-gray-blue font-bold rounded-lg hover:bg-gold-dark transition-all transform hover:scale-105 disabled:bg-gray-blue/20 disabled:text-gray-blue/50 disabled:scale-100">
               {t('next')} &rarr;
             </button>
          )}
        </div>
      </main>
      <Footer t={t} />
      <Modal isOpen={!!isLoading} title={t(isLoading === 'outline' ? 'generating_outline_title' : 'generating_book_title')}>
        <p className="text-center">{t(isLoading === 'outline' ? 'generating_outline_desc' : 'generating_book_desc')}</p>
        <div className="flex justify-center items-center mt-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        </div>
      </Modal>
    </div>
  );
};

export default App;

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { StepProgress } from './components/StepProgress';
import { STEPS_CONFIG } from './constants';
import { Plan, BookData } from './types';
import { generateBookContent } from './services/geminiService';
import { exportAsPdf, exportAsTxt, exportAsZip } from './services/exportService';

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
};

const initialBookData: BookData = {
  topic: '', type: '', purpose: '', audience: '', tone: '', language: 'English', structure: '', customization: '', plan: 'Free',
};

const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const [language, setLanguage] = useLocalStorage<'en' | 'es'>('language', 'es');
  const [currentStep, setCurrentStep] = useLocalStorage('currentStep', 0);
  const [bookData, setBookData] = useLocalStorage<BookData>('bookData', initialBookData);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  
  const [translations, setTranslations] = useState<{ [key: string]: any }>({});
  const [translationsLoaded, setTranslationsLoaded] = useState(false);

  const [selectedTones, setSelectedTones] = useState<string[]>(() => {
    const savedTones = bookData.tone;
    return savedTones ? savedTones.split(', ') : [];
  });

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const [enRes, esRes] = await Promise.all([
          fetch('./locales/en.json'),
          fetch('./locales/es.json'),
        ]);
        if (!enRes.ok || !esRes.ok) throw new Error('Network response was not ok.');
        const enData = await enRes.json();
        const esData = await esRes.json();
        setTranslations({ en: enData, es: esData });
        setTranslationsLoaded(true);
      } catch (error) {
        console.error("Failed to load translation files:", error);
      }
    };
    fetchTranslations();
  }, []);
  
  const t = useCallback((key: string): any => {
    return translations[language]?.[key] || key;
  }, [language, translations]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  const handleNext = () => {
    if (currentStep < STEPS_CONFIG.length + 2) { 
      setCurrentStep(currentStep + 1);
    }
  };

  const handleDataChange = (key: keyof Omit<BookData, 'plan'>, value: string) => {
    setBookData(prev => ({ ...prev, [key]: value }));
  };
  
  const handleToneToggle = (tone: string) => {
    const newTones = selectedTones.includes(tone)
      ? selectedTones.filter(t => t !== tone)
      : [...selectedTones, tone];
    setSelectedTones(newTones);
    handleDataChange('tone', newTones.join(', '));
  };

  const handlePlanSelect = (plan: Plan) => {
    setBookData(prev => ({...prev, plan}));
    setCurrentStep(currentStep + 1); // Move to generation step
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedContent('');
    const messages = t('generating_messages');
    let messageIndex = 0;
    
    const interval = setInterval(() => {
        setLoadingMessage(messages[messageIndex % messages.length]);
        messageIndex++;
    }, 2500);

    const content = await generateBookContent(bookData, t);
    clearInterval(interval);
    setGeneratedContent(content);
    setIsLoading(false);
  };
  
  useEffect(() => {
      if(currentStep === STEPS_CONFIG.length + 1 && !generatedContent && !isLoading) { // Generation starts on step after config
          handleGenerate();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, generatedContent, isLoading]);

  const renderStepContent = () => {
    // Welcome step (currentStep === 0)
    if (currentStep === 0) {
        return (
            <div className="w-full max-w-2xl text-center animate-fade-in">
                <h2 className="font-serif text-2xl md:text-3xl text-gray-blue dark:text-cream">{t('welcomeTitle')}</h2>
                <h1 className="font-serif text-5xl md:text-7xl font-bold my-2">
                    <span className="text-gray-blue dark:text-cream">BookMind</span><span className="text-gold">.ai</span>
                </h1>
                <p className="text-lg md:text-xl my-4 text-gray-blue/80 dark:text-cream/80">{t('welcomeSubtitle')}</p>
                <p className="my-6 text-gray-blue/80 dark:text-cream/80">{t('welcomeBody')}</p>
                <div className="mt-8">
                    <input type="text" value={bookData.topic} onChange={e => handleDataChange('topic', e.target.value)} placeholder={t('step1_label')} className="w-full p-4 bg-white/50 dark:bg-gray-blue/50 border border-gold rounded-lg shadow-sm focus:ring-2 focus:ring-gold-dark outline-none transition"/>
                    <button onClick={handleNext} disabled={!bookData.topic} className="mt-4 px-10 py-3 bg-gold text-gray-blue font-bold rounded-lg shadow-md hover:bg-gold-dark transition-all disabled:bg-gold/50 disabled:cursor-not-allowed">
                        {t('start')} →
                    </button>
                </div>
                <p className="mt-12 font-serif italic text-gray-blue/70 dark:text-cream/70">{t('welcomeSlogan')}</p>
            </div>
        );
    }
    
    // Config steps (currentStep 1 to 8)
    if (currentStep > 0 && currentStep <= STEPS_CONFIG.length) {
      const stepConfig = STEPS_CONFIG[currentStep - 1];
      const value = bookData[stepConfig.key];
      
      if (stepConfig.type === 'single-card' || stepConfig.type === 'multi-card') {
        return (
          <div className="w-full max-w-4xl text-center">
            <h2 className="block font-serif text-3xl md:text-4xl mb-8 text-gray-blue dark:text-cream">{t(stepConfig.labelKey)}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {stepConfig.options?.map(option => {
                const isSelected = stepConfig.type === 'single-card' 
                  ? value === option.value
                  : selectedTones.includes(option.value);

                const handleClick = () => {
                  if (stepConfig.type === 'single-card') {
                    handleDataChange(stepConfig.key, option.value);
                    setTimeout(() => handleNext(), 250); 
                  } else {
                    handleToneToggle(option.value);
                  }
                };
                
                return (
                  <button key={option.value} onClick={handleClick} className={`relative p-6 text-center bg-white/50 dark:bg-gray-blue/50 rounded-xl shadow-sm border-2 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg hover:border-gold ${isSelected ? 'border-gold shadow-lg ring-2 ring-gold-dark' : 'border-transparent'}`}>
                    {isSelected && <span className="absolute top-2 right-2 text-xl">✅</span>}
                    <div className="text-4xl mb-3">{option.icon}</div>
                    <h3 className="font-bold text-lg text-gray-blue dark:text-cream">{t(option.labelKey)}</h3>
                    <p className="text-sm text-gray-blue/70 dark:text-cream/70 mt-1">{t(option.descriptionKey)}</p>
                  </button>
                );
              })}
            </div>
            {stepConfig.type === 'multi-card' && (
              <button onClick={handleNext} disabled={selectedTones.length === 0} className="mt-10 px-10 py-3 bg-gold text-gray-blue font-bold rounded-lg shadow-md hover:bg-gold-dark transition-all disabled:bg-gold/50 disabled:cursor-not-allowed">
                {t('next')} →
              </button>
            )}
          </div>
        );
      }
      
      return (
        <div className="w-full max-w-xl text-center">
          <label htmlFor="stepInput" className="block font-serif text-2xl md:text-3xl mb-6 text-gray-blue dark:text-cream">{t(stepConfig.labelKey)}</label>
          {stepConfig.type === 'input' ? (
            <input id="stepInput" type="text" value={String(value)} onChange={e => handleDataChange(stepConfig.key, e.target.value)} placeholder={stepConfig.placeholder} className="w-full p-4 bg-white/50 dark:bg-gray-blue/50 border border-gold rounded-lg shadow-sm focus:ring-2 focus:ring-gold-dark outline-none transition" />
          ) : (
            <textarea id="stepInput" value={String(value)} onChange={e => handleDataChange(stepConfig.key, e.target.value)} placeholder={stepConfig.placeholder} rows={5} className="w-full p-4 bg-white/50 dark:bg-gray-blue/50 border border-gold rounded-lg shadow-sm focus:ring-2 focus:ring-gold-dark outline-none transition" />
          )}
          <button onClick={handleNext} disabled={!value} className="mt-8 px-10 py-3 bg-gold text-gray-blue font-bold rounded-lg shadow-md hover:bg-gold-dark transition-all disabled:bg-gold/50 disabled:cursor-not-allowed">
            {t('next')} →
          </button>
        </div>
      );
    }
    
    // Plan selection step
    if (currentStep === STEPS_CONFIG.length + 1) { 
        return (
            <div className="w-full max-w-3xl text-center">
                <h2 className="font-serif text-3xl md:text-4xl mb-8 text-gray-blue dark:text-cream">{t('step9_label')}</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {(['Free', 'Pro', 'Creator'] as Plan[]).map(plan => (
                        <div key={plan} onClick={() => handlePlanSelect(plan)} className="p-6 border-2 border-gold/50 rounded-xl cursor-pointer hover:border-gold hover:bg-gold/10 transition-all transform hover:-translate-y-1">
                            <h3 className="font-serif text-2xl font-bold text-gold">{t(`plan_${plan.toLowerCase()}_title`)}</h3>
                            <p className="mt-2 text-gray-blue dark:text-cream/80">{t(`plan_${plan.toLowerCase()}_desc`)}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Generation & Download step
    if (currentStep === STEPS_CONFIG.length + 2) { 
      if (isLoading) {
        return (
          <div className="text-center">
            <h2 className="font-serif text-3xl md:text-4xl mb-4 text-gray-blue dark:text-cream">{t('generating_title')}</h2>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-lg text-gray-blue/80 dark:text-cream/80">{loadingMessage}</p>
          </div>
        )
      }

      const bookTitle = generatedContent.split('\n')[0].replace(/#/g, '').trim() || bookData.topic;

      return (
        <div className="w-full max-w-4xl text-left">
            <h2 className="font-serif text-3xl md:text-4xl mb-6 text-center text-gray-blue dark:text-cream">{t('step10_label')}</h2>
            <div className="bg-white/50 dark:bg-gray-blue/50 p-6 rounded-lg shadow-inner max-h-[40vh] overflow-y-auto mb-6 border border-gold/30">
                <h3 className="font-serif text-xl font-bold mb-4">{t('preview')}: {bookTitle}</h3>
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-blue dark:text-cream">{generatedContent}</pre>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
                <button onClick={() => exportAsPdf(bookTitle, generatedContent)} className="px-6 py-3 bg-gold text-gray-blue font-bold rounded-lg shadow-md hover:bg-gold-dark transition-all">{t('download_pdf')}</button>
                <button onClick={() => exportAsTxt(bookTitle, generatedContent)} className="px-6 py-3 bg-gold text-gray-blue font-bold rounded-lg shadow-md hover:bg-gold-dark transition-all">{t('download_txt')}</button>
                <button disabled className="px-6 py-3 bg-gold/50 text-gray-blue/70 font-bold rounded-lg shadow-md cursor-not-allowed">{t('download_epub')}</button>
                <button onClick={() => exportAsZip(bookTitle, generatedContent)} className="px-6 py-3 bg-gold text-gray-blue font-bold rounded-lg shadow-md hover:bg-gold-dark transition-all">{t('download_zip')}</button>
            </div>
        </div>
      );
    }
    return null;
  };

  if (!translationsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-gray-blue">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gold"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-24 pb-24 font-sans">
      <Header theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} />
      {currentStep > 0 && currentStep <= STEPS_CONFIG.length && <StepProgress currentStep={currentStep - 1} totalSteps={STEPS_CONFIG.length} />}
      <main className="flex-grow flex items-center justify-center w-full px-4">
        {renderStepContent()}
      </main>
      <Footer t={t} />
    </div>
  );
};

export default App;
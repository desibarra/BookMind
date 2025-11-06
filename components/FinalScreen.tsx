import React, { useState, useMemo } from 'react';
import { exportAsZip } from '../services/exportService';
import { BookData } from '../types';
import { Modal } from './Modal';
import { classNames } from '../utils';

interface FinalScreenProps {
  bookData: BookData;
  generatedContent: string;
  coverImage: string | null;
  onRestart: () => void;
  onEdit: () => void;
  t: (key: string) => string;
}

const formatDate = (t) => new Date().toLocaleDateString(t('step6_opt1_desc') === 'Español' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

export const FinalScreen: React.FC<FinalScreenProps> = ({ bookData, generatedContent, coverImage, onRestart, onEdit, t }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    await exportAsZip(generatedContent, bookData, coverImage);
    setIsDownloading(false);
  };
  
  const bookDetails = useMemo(() => [
    { label: t('detail_topic'), value: bookData.topic },
    { label: t('detail_type'), value: bookData.type },
    { label: t('detail_language'), value: bookData.language },
    { label: t('detail_chapters'), value: bookData.structure.split('\n').filter(Boolean).length },
    { label: t('detail_date'), value: formatDate(t) },
    { label: t('detail_plan'), value: bookData.plan, badge: true },
  ], [bookData, t]);

  const planColor = {
    Free: 'bg-blue-200 text-blue-800',
    Pro: 'bg-purple-200 text-purple-800',
    Creator: 'bg-gold/30 text-gold-dark',
  };

  return (
    <>
      <div className="w-full max-w-6xl mx-auto p-4 animate-fade-in-up">
        <header className="text-center mb-12">
            <h1 className="text-5xl font-serif font-bold text-gray-blue dark:text-cream">{t('final_screen_title')}</h1>
            <p className="text-lg mt-2 text-gray-blue/70 dark:text-cream/70">{t('final_screen_subtitle')}</p>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-4"></div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left Column: Cover */}
            <div className="flex flex-col items-center">
                <div className="relative group w-full max-w-sm cursor-pointer transition-transform transform hover:scale-105 duration-300">
                    <div className="absolute -inset-2 bg-gradient-to-br from-gold/50 to-gold/20 rounded-lg blur opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-white dark:bg-gray-blue p-4 rounded-lg shadow-2xl">
                        {coverImage ? (
                            <img src={coverImage} alt="Book Cover" className="w-full h-auto object-cover rounded-md aspect-[3/4]" />
                        ) : (
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-md aspect-[3/4] flex items-center justify-center">
                                <span className="text-gray-500">{t('final_details_cover')}</span>
                            </div>
                        )}
                    </div>
                </div>
                <button 
                    onClick={() => alert("Preview functionality will be available soon.")}
                    className="mt-6 px-6 py-2 bg-white/80 dark:bg-gray-blue/80 backdrop-blur-sm rounded-full font-semibold text-gray-blue dark:text-cream hover:bg-gold hover:text-gray-blue dark:hover:bg-gold-dark transition-all shadow-md"
                >
                    {t('preview_pdf')}
                </button>
                <p className="text-xs text-gray-blue/60 dark:text-cream/60 mt-4 text-center">{t('cover_inspiration')}</p>
            </div>

            {/* Right Column: Details & Actions */}
            <div className="flex flex-col space-y-8">
                <div className="bg-white/50 dark:bg-gray-blue/50 backdrop-blur-sm rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-serif font-bold mb-4 text-gray-blue dark:text-cream">{t('book_details_title')}</h2>
                    <ul className="space-y-3">
                        {bookDetails.map(detail => (
                            <li key={detail.label} className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-gray-blue/80 dark:text-cream/80">{detail.label}</span>
                                {detail.badge ? (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${planColor[detail.value as keyof typeof planColor]}`}>
                                        {detail.value}
                                    </span>
                                ) : (
                                    <span className="text-gray-blue dark:text-cream text-right">{detail.value}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleDownload} disabled={isDownloading} className="p-4 bg-gold text-gray-blue rounded-lg font-bold flex items-center justify-center flex-col text-center hover:bg-gold-dark transition-all transform hover:scale-105 shadow-md">
                        {isDownloading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-blue"></div> : '⬇️'}
                        <span className="mt-1 text-sm">{t('export_as_zip')}</span>
                    </button>
                    <button onClick={onEdit} className="p-4 bg-white/50 dark:bg-gray-blue/50 rounded-lg font-bold flex items-center justify-center flex-col text-center hover:border-gold border-2 border-transparent transition-all transform hover:scale-105 shadow-md">
                        ✏️
                        <span className="mt-1 text-sm">{t('edit_book')}</span>
                    </button>
                    <button onClick={() => alert('EPUB export coming soon!')} className="p-4 bg-white/50 dark:bg-gray-blue/50 rounded-lg font-bold flex items-center justify-center flex-col text-center hover:border-gold border-2 border-transparent transition-all transform hover:scale-105 shadow-md opacity-60">
                        📄
                        <span className="mt-1 text-sm">{t('export_as_epub')}</span>
                    </button>
                     <div className="relative group">
                        <button disabled={bookData.plan !== 'Creator'} className="w-full h-full p-4 bg-white/50 dark:bg-gray-blue/50 rounded-lg font-bold flex items-center justify-center flex-col text-center hover:border-gold border-2 border-transparent transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                            🚀
                            <span className="mt-1 text-sm">{t('publish_book')}</span>
                        </button>
                        {bookData.plan !== 'Creator' && <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">{t('publish_tooltip')}</div>}
                    </div>
                </div>

                <button onClick={onRestart} className="w-full py-4 bg-gray-blue dark:bg-cream text-cream dark:text-gray-blue font-bold rounded-lg text-lg hover:opacity-90 transition-opacity transform hover:scale-102 shadow-xl">
                    ✨ {t('start_new_book')}
                </button>
            </div>
        </div>

        <footer className="text-center mt-16">
            <p className="font-serif text-lg text-gray-blue/70 dark:text-cream/70">{t('final_screen_quote')}</p>
            <p className="text-sm text-gray-blue/50 dark:text-cream/50 mt-1">{t('final_screen_brand_footer')}</p>
        </footer>
      </div>

      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title={bookData.title}>
        {pdfUrl ? (
          <iframe src={pdfUrl} className="w-full h-[70vh] rounded-md" title="PDF Preview" />
        ) : (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
          </div>
        )}
      </Modal>
    </>
  );
};

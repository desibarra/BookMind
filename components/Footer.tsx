
import React from 'react';

interface FooterProps {
  t: (key: string) => string;
}

export const Footer: React.FC<FooterProps> = ({ t }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 p-4 text-center text-xs text-gray-blue/60 dark:text-cream/60 bg-cream/80 dark:bg-gray-blue/80 backdrop-blur-sm">
      <p>{t('footer_brand')}<br />{t('footer_slogan')}</p>
      <p className="mt-2 text-gray-blue/40 dark:text-cream/40">{t('meta_footer')}</p>
    </footer>
  );
};


export type Plan = 'Free' | 'Pro' | 'Creator';

export interface BookData {
  topic: string;
  title: string;
  type: string;
  purpose: string;
  audience: string;
  tone: string;
  language: string;
  structure: string;
  finalDetails: {
    dedication: string;
    quotes: string;
    author: string;
    cover: string;
  };
  plan: Plan;
}

export interface CardOption {
  value: string;
  labelKey: string;
  descriptionKey: string;
  icon: string;
}

export interface StepConfig {
  key: keyof Omit<BookData, 'plan'>;
  labelKey: string;
  placeholder?: string;
  type: 'input' | 'textarea' | 'single-card' | 'multi-card' | 'chapter-editor' | 'final-customization';
  options?: CardOption[];
}

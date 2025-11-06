
import { StepConfig } from './types';

export const STEPS_CONFIG: StepConfig[] = [
  { key: 'topic', labelKey: 'step1_label', placeholder: 'e.g., The history of ancient Rome', type: 'input' },
  { 
    key: 'type', 
    labelKey: 'step2_title', 
    type: 'single-card',
    options: [
      { value: 'Practical Guide', labelKey: 'step2_opt1_label', descriptionKey: 'step2_opt1_desc', icon: '📘' },
      { value: 'Self-Help and Wellness', labelKey: 'step2_opt2_label', descriptionKey: 'step2_opt2_desc', icon: '💭' },
      { value: 'Cooking or Nutrition', labelKey: 'step2_opt3_label', descriptionKey: 'step2_opt3_desc', icon: '🍽️' },
      { value: 'Entrepreneurship or Business', labelKey: 'step2_opt4_label', descriptionKey: 'step2_opt4_desc', icon: '💼' },
      { value: 'Spirituality or Faith', labelKey: 'step2_opt5_label', descriptionKey: 'step2_opt5_desc', icon: '✨' },
      { value: 'Children\'s or Educational', labelKey: 'step2_opt6_label', descriptionKey: 'step2_opt6_desc', icon: '👶' },
      { value: 'History or Memoirs', labelKey: 'step2_opt7_label', descriptionKey: 'step2_opt7_desc', icon: '📚' },
      { value: 'Other', labelKey: 'step2_opt8_label', descriptionKey: 'step2_opt8_desc', icon: '🪶' },
    ]
  },
  { 
    key: 'purpose', 
    labelKey: 'step3_title', 
    type: 'single-card',
    options: [
        { value: 'Teach something specific', labelKey: 'step3_opt1_label', descriptionKey: 'step3_opt1_desc', icon: '🧑‍🏫' },
        { value: 'Inspire others', labelKey: 'step3_opt2_label', descriptionKey: 'step3_opt2_desc', icon: '🌟' },
        { value: 'Solve a problem', labelKey: 'step3_opt3_label', descriptionKey: 'step3_opt3_desc', icon: '💡' },
        { value: 'Document experiences', labelKey: 'step3_opt4_label', descriptionKey: 'step3_opt4_desc', icon: '🖋️' },
        { value: 'Express creativity', labelKey: 'step3_opt5_label', descriptionKey: 'step3_opt5_desc', icon: '🎨' },
        { value: 'Share knowledge', labelKey: 'step3_opt6_label', descriptionKey: 'step3_opt6_desc', icon: '🧠' },
    ]
  },
  { 
    key: 'audience', 
    labelKey: 'step4_title', 
    type: 'single-card',
    options: [
        { value: 'General Public', labelKey: 'step4_opt1_label', descriptionKey: 'step4_opt1_desc', icon: '👥' },
        { value: 'Beginners', labelKey: 'step4_opt2_label', descriptionKey: 'step4_opt2_desc', icon: '🌱' },
        { value: 'Professionals', labelKey: 'step4_opt3_label', descriptionKey: 'step4_opt3_desc', icon: '💼' },
        { value: 'Students', labelKey: 'step4_opt4_label', descriptionKey: 'step4_opt4_desc', icon: '🎓' },
        { value: 'Families', labelKey: 'step4_opt5_label', descriptionKey: 'step4_opt5_desc', icon: '👨‍👩‍👧‍👦' },
        { value: 'Entrepreneurs', labelKey: 'step4_opt6_label', descriptionKey: 'step4_opt6_desc', icon: '🚀' },
    ]
  },
  { 
    key: 'tone', 
    labelKey: 'step5_title', 
    type: 'multi-card',
    options: [
        { value: 'Conversational', labelKey: 'step5_opt1_label', descriptionKey: 'step5_opt1_desc', icon: '🗨️' },
        { value: 'Inspirational', labelKey: 'step5_opt2_label', descriptionKey: 'step5_opt2_desc', icon: '✨' },
        { value: 'Professional', labelKey: 'step5_opt3_label', descriptionKey: 'step5_opt3_desc', icon: '📊' },
        { value: 'Poetic', labelKey: 'step5_opt4_label', descriptionKey: 'step5_opt4_desc', icon: '🌸' },
        { value: 'Scientific', labelKey: 'step5_opt5_label', descriptionKey: 'step5_opt5_desc', icon: '🔬' },
        { value: 'Narrative', labelKey: 'step5_opt6_label', descriptionKey: 'step5_opt6_desc', icon: '📖' },
    ]
  },
  { 
    key: 'language', 
    labelKey: 'step6_title', 
    type: 'single-card',
    options: [
        { value: 'Spanish', labelKey: 'step6_opt1_label', descriptionKey: 'step6_opt1_desc', icon: '🇪🇸' },
        { value: 'English', labelKey: 'step6_opt2_label', descriptionKey: 'step6_opt2_desc', icon: '🇬🇧' },
        { value: 'French', labelKey: 'step6_opt3_label', descriptionKey: 'step6__opt3_desc', icon: '🇫🇷' },
        { value: 'German', labelKey: 'step6_opt4_label', descriptionKey: 'step6_opt4_desc', icon: '🇩🇪' },
    ]
  },
  { 
    key: 'structure', 
    labelKey: 'step7_title', 
    type: 'chapter-editor',
  },
  { 
    key: 'finalDetails', 
    labelKey: 'step8_title',
    type: 'final-customization' 
  },
];

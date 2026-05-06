import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { PALETTE, FONTS } from '../../config/assets';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  // 显示「目标」语言而不是「当前」语言 — 符合用户对切换控件的心智模型 (IxD Mapping)
  const targetLabel = language === 'zh' ? 'EN' : '中文';
  const ariaLabel = language === 'zh' ? 'Switch to English' : '切换到中文';

  return (
    <motion.button
      type="button"
      className="fixed top-6 right-6 z-50"
      onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
      aria-label={ariaLabel}
      style={{
        fontFamily: FONTS.body,
        fontSize: '1rem',
        fontWeight: 700,
        color: '#FFFFFF',
        background: PALETTE.primary,
        padding: '0.875rem 1.75rem',
        border: `3px solid ${PALETTE.secondary}`,
        borderRadius: '100px',
        cursor: 'pointer',
        boxShadow: '3px 3px 0 rgba(139,69,19,0.3)',
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      {targetLabel}
    </motion.button>
  );
}

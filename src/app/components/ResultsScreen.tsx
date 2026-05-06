import { motion, useReducedMotion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { PALETTE, FONTS, getIngredient } from '../../config/assets';
import type { CompletedPlate } from './ProcessingMode';

export function ResultsScreen({
  plates,
  onRestart,
}: {
  plates: CompletedPlate[];
  onRestart: () => void;
}) {
  const { t, language } = useLanguage();
  const reduceMotion = useReducedMotion();

  const totalSlices = plates.reduce((sum, p) => sum + p.slices.length, 0);

  return (
    <div
      className="size-full relative flex flex-col items-center justify-center p-8"
      style={{ background: 'var(--game-bg-gradient)' }}
    >
      {/* 网格背景 */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="result-grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="2" fill="#FFF" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#result-grid)" />
        </svg>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontFamily: FONTS.display,
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: 800,
          color: PALETTE.primary,
          textShadow: '0 4px 12px rgba(0,0,0,0.3)',
          textAlign: 'center',
          marginBottom: '3rem',
        }}
      >
        ✨ {t('resultsTitle')} ✨
      </motion.h1>

      {/* 盘子展示 */}
      <div className="grid grid-cols-3 gap-6 mb-8 max-w-5xl">
        {plates.map((plate, index) => {
          const uniqueIngredients = Array.from(
            new Set(plate.slices.map((s) => s.ingredientId)),
          )
            .map(getIngredient)
            .filter((cfg): cfg is NonNullable<typeof cfg> => !!cfg);

          return (
            <motion.div
              key={plate.id}
              initial={{ scale: 0, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{
                delay: index * 0.2,
                type: 'spring',
                stiffness: 150,
                damping: 15,
              }}
              style={{
                background: 'radial-gradient(circle, #FFFFFF 0%, #F5F5F5 100%)',
                borderRadius: '50%',
                width: '200px',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: `4px solid ${PALETTE.secondary}`,
                boxShadow: '4px 4px 0 rgba(139,69,19,0.3)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '0.25rem',
                  fontSize: '2.5rem',
                  marginBottom: '0.5rem',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {uniqueIngredients.map((cfg) => (
                  <span
                    key={cfg.id}
                    role="img"
                    aria-label={cfg.name[language]}
                  >
                    {cfg.emoji}
                  </span>
                ))}
              </div>

              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: PALETTE.primary,
                  textAlign: 'center',
                  padding: '0 0.5rem',
                }}
              >
                {uniqueIngredients.map((cfg) => cfg.name[language]).join(' + ')}
              </div>

              <div
                style={{
                  fontFamily: FONTS.numeric,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: PALETTE.textMuted,
                  marginTop: '0.25rem',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {t('slicesCount', { count: plate.slices.length })}
              </div>

              {!reduceMotion && (
                <motion.div
                  className="absolute inset-0"
                  style={{
                    borderRadius: '50%',
                    border: `3px solid ${PALETTE.warning}`,
                    opacity: 0,
                    pointerEvents: 'none',
                  }}
                  animate={{ scale: [1, 1.1, 1], opacity: [0, 0.6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 统计信息 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: plates.length * 0.2 + 0.5 }}
        style={{
          background: PALETTE.surface,
          border: `3px solid ${PALETTE.secondary}`,
          borderRadius: '100px',
          padding: '1.5rem 3rem',
          marginBottom: '2rem',
          boxShadow: '3px 3px 0 rgba(139,69,19,0.2)',
        }}
      >
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: '1.5rem',
            fontWeight: 700,
            color: PALETTE.textDark,
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {t('resultsSummary', { plates: plates.length, slices: totalSlices })}
        </p>
      </motion.div>

      <motion.button
        type="button"
        onClick={onRestart}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: plates.length * 0.2 + 0.7 }}
        style={{
          fontFamily: FONTS.display,
          fontSize: '2rem',
          fontWeight: 700,
          color: '#FFFFFF',
          background: 'var(--game-primary-gradient)',
          padding: '1.5rem 4rem',
          border: `4px solid ${PALETTE.secondary}`,
          borderRadius: '100px',
          cursor: 'pointer',
          boxShadow: `0 6px 0 ${PALETTE.primaryShadow}, 4px 4px 0 rgba(139,69,19,0.3)`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {t('restart')}
      </motion.button>
    </div>
  );
}

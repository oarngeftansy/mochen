import { motion, useReducedMotion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useConfig } from '../contexts/ConfigContext';
import { PALETTE, FONTS } from '../../config/assets';

/** 装饰用的食材飘浮位置(围着标题转一圈) */
const FLOAT_POSITIONS = [
  { x: '10%', y: '15%', size: 80, delay: 0 },
  { x: '85%', y: '20%', size: 60, delay: 0.2 },
  { x: '15%', y: '70%', size: 70, delay: 0.4 },
  { x: '80%', y: '75%', size: 65, delay: 0.6 },
  { x: '50%', y: '10%', size: 55, delay: 0.8 },
];

export function StartScreen({ onStart }: { onStart: () => void }) {
  const { t, language } = useLanguage();
  const { ingredients } = useConfig();
  const reduceMotion = useReducedMotion();

  // 取前 N 个食材做装饰,从 config 驱动(编辑器修改会实时反映)
  const decorations = ingredients.slice(0, FLOAT_POSITIONS.length).map((cfg, i) => ({
    ...FLOAT_POSITIONS[i],
    cfg,
  }));

  return (
    <div
      className="size-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--game-bg-gradient)' }}
    >
      {/* 纸张纹理 */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,69,19,0.1) 2px, rgba(139,69,19,0.1) 4px)',
        }}
        aria-hidden="true"
      />

      {/* 飘浮食材装饰 */}
      {decorations.map(({ cfg, x, y, size, delay }) => (
        <motion.div
          key={cfg.id}
          className="absolute"
          aria-hidden="true"
          style={{
            left: x,
            top: y,
            fontSize: `${size}px`,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
          }}
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 0,
            y: reduceMotion ? 0 : [0, -15, 0],
          }}
          transition={{
            opacity: { delay, duration: 0.5 },
            scale: { delay, type: 'spring', stiffness: 200 },
            rotate: { delay, duration: 0.6 },
            y: reduceMotion
              ? { duration: 0 }
              : { delay: delay + 0.6, duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          {cfg.emoji}
        </motion.div>
      ))}

      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        {/* 标题 */}
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 15 }}
          style={{
            fontFamily: FONTS.display,
            fontSize: 'clamp(3rem, 12vw, 8rem)',
            fontWeight: 800,
            color: PALETTE.primary,
            textShadow: '4px 4px 0 rgba(139,69,19,0.15)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            marginBottom: '2rem',
          }}
        >
          {t('gameTitle')}
        </motion.h1>

        {/* 副标题 + 食材徽章 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
          style={{ marginBottom: '3rem' }}
        >
          <div
            className="flex items-center gap-3 px-8 py-4 rounded-full"
            style={{
              background: PALETTE.surface,
              border: `3px solid ${PALETTE.secondary}`,
              boxShadow: '3px 3px 0 rgba(139,69,19,0.2)',
              maxWidth: '90vw',
            }}
          >
            <motion.span
              style={{ fontSize: '2rem' }}
              animate={reduceMotion ? undefined : { rotate: [0, 10, 0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              aria-hidden="true"
            >
              {ingredients[0]?.emoji ?? '🍉'}
            </motion.span>
            <span
              style={{
                fontFamily: FONTS.body,
                fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
                fontWeight: 700,
                color: PALETTE.textDark,
              }}
            >
              {t('gameSubtitle')}
            </span>
            <motion.span
              style={{ fontSize: '2rem' }}
              animate={reduceMotion ? undefined : { rotate: [0, -10, 0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              aria-hidden="true"
            >
              🔪
            </motion.span>
          </div>
        </motion.div>

        {/* 开始按钮 */}
        <motion.button
          type="button"
          onClick={onStart}
          aria-label={t('startGame')}
          style={{
            fontFamily: FONTS.display,
            fontSize: 'clamp(1.75rem, 5vw, 3rem)',
            fontWeight: 700,
            color: '#FFFFFF',
            background: 'var(--game-primary-gradient)',
            padding: '1.5rem clamp(2rem, 8vw, 5rem)',
            border: `4px solid ${PALETTE.secondary}`,
            borderRadius: '100px',
            cursor: 'pointer',
            boxShadow: `0 8px 0 ${PALETTE.primaryShadow}, 4px 4px 0 rgba(139,69,19,0.3)`,
            position: 'relative',
            overflow: 'hidden',
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {!reduceMotion && (
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
                ease: 'easeInOut',
              }}
              aria-hidden="true"
            />
          )}
          <span className="relative z-10">{t('startGame')}</span>
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            fontFamily: FONTS.body,
            fontSize: 'clamp(0.9rem, 2vw, 1.125rem)',
            fontWeight: 600,
            color: PALETTE.textMuted,
            marginTop: '2rem',
          }}
        >
          {t('startHint')}
          {language === 'zh' ? null : null /* 保留 language 引用避免 lint 警告 */}
        </motion.p>
      </div>

      {/* 底部装饰波浪 */}
      {!reduceMotion && (
        <svg
          className="absolute bottom-0 left-0 w-full"
          height="200"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          style={{ opacity: 0.15 }}
          aria-hidden="true"
        >
          <motion.path
            d="M0,100 Q360,150 720,100 T1440,100 L1440,200 L0,200 Z"
            fill="#FFF"
            animate={{
              d: [
                'M0,100 Q360,150 720,100 T1440,100 L1440,200 L0,200 Z',
                'M0,120 Q360,80 720,120 T1440,120 L1440,200 L0,200 Z',
                'M0,100 Q360,150 720,100 T1440,100 L1440,200 L0,200 Z',
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      )}
    </div>
  );
}

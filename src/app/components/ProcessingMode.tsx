import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useConfig } from '../contexts/ConfigContext';
import { GAMEPLAY, PALETTE, FONTS } from '../../config/assets';
import type { CollectedIngredient } from '../shared/types';

type CutType = 'horizontal' | 'vertical' | 'diagonal';

type Slice = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  cutType: CutType;
  selected?: boolean;
  ingredientId: string;
};

export type CompletedPlate = {
  id: string;
  slices: Slice[];
};

type CutPath = { x: number; y: number };

export function ProcessingMode({
  ingredients,
  onComplete,
}: {
  ingredients: CollectedIngredient[];
  onComplete: (plates: CompletedPlate[]) => void;
}) {
  const { t, language } = useLanguage();
  const { ingredients: INGREDIENTS, sfx: SFX, volume: VOLUME } = useConfig();
  const getIngredient = (id: string) => INGREDIENTS.find((i) => i.id === id);
  const reduceMotion = useReducedMotion();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [slices, setSlices] = useState<Slice[]>([]);
  const [knifePos, setKnifePos] = useState({ x: 0, y: 0 });
  const [knifeVisible, setKnifeVisible] = useState(false);
  const [isPlating, setIsPlating] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [platedSlices, setPlatedSlices] = useState<Slice[]>([]);
  const [completedPlates, setCompletedPlates] = useState<CompletedPlate[]>([]);
  const [cutPath, setCutPath] = useState<CutPath[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const currentIngredient = ingredients[currentIdx];
  const currentCfg = currentIngredient ? getIngredient(currentIngredient.ingredientId) : undefined;

  // SFX 池(URL 变化时重新加载,空 URL 不加载)
  useEffect(() => {
    Object.values(audioRefs.current).forEach((a) => a.pause());
    audioRefs.current = {};
    Object.entries(SFX).forEach(([key, url]) => {
      if (url) {
        const a = new Audio(url);
        a.volume = VOLUME.sfx;
        a.preload = 'auto';
        audioRefs.current[key] = a;
      }
    });
    return () => Object.values(audioRefs.current).forEach((a) => a.pause());
  }, [SFX, VOLUME.sfx]);

  // ESC 关闭模态
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelecting) setIsSelecting(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSelecting]);

  const playSound = (name: string) => {
    const a = audioRefs.current[name];
    if (a) {
      a.currentTime = 0;
      a.play().catch(() => {});
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setKnifePos(pos);
    if (isDrawing && !isPlating) {
      setCutPath((prev) => [...prev, pos]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!boardRef.current || !currentCfg || isPlating) return;
    const sameSliceCount = slices.filter((s) => s.ingredientId === currentCfg.id).length;
    if (sameSliceCount >= GAMEPLAY.maxSlicesPerIngredient) return;

    const rect = boardRef.current.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDrawing(true);
    setCutPath([pos]);
  };

  const handleMouseUp = () => {
    if (isDrawing && cutPath.length > 5 && !isPlating && currentCfg) {
      const cutType = analyzeCutType(cutPath);
      playSound('cut');
      const newSlice: Slice = {
        id: `slice-${Date.now()}`,
        x: cutPath[Math.floor(cutPath.length / 2)].x,
        y: cutPath[Math.floor(cutPath.length / 2)].y,
        rotation: getCutRotation(cutPath),
        cutType,
        ingredientId: currentCfg.id,
      };
      setSlices((prev) => [...prev, newSlice]);
    }
    setIsDrawing(false);
    setCutPath([]);
  };

  // 修复 cursor 卡住 bug: 鼠标离开切板隐藏自定义光标
  const handleMouseEnter = useCallback(() => setKnifeVisible(true), []);
  const handleMouseLeave = useCallback(() => {
    setKnifeVisible(false);
    handleMouseUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawing, cutPath, isPlating]);

  const analyzeCutType = (path: CutPath[]): CutType => {
    if (path.length < 2) return 'diagonal';
    const start = path[0];
    const end = path[path.length - 1];
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    if (dx > dy * 2) return 'horizontal';
    if (dy > dx * 2) return 'vertical';
    return 'diagonal';
  };

  const getCutRotation = (path: CutPath[]): number => {
    if (path.length < 2) return 0;
    const s = path[0];
    const e = path[path.length - 1];
    return Math.atan2(e.y - s.y, e.x - s.x) * (180 / Math.PI);
  };

  const toggleSliceSelection = (sliceId: string) => {
    setSlices((prev) =>
      prev.map((s) => (s.id === sliceId ? { ...s, selected: !s.selected } : s)),
    );
  };

  const handleConfirmPlating = () => {
    const selected = slices.filter((s) => s.selected);
    if (selected.length === 0) return;
    autoPlate(selected);
  };

  const autoPlate = (slicesToPlate: Slice[]) => {
    setIsSelecting(false);
    setIsPlating(true);
    playSound('plate');

    const centerX = 300;
    const centerY = 200;
    const horizontals = slicesToPlate.filter((s) => s.cutType === 'horizontal');
    const verticals = slicesToPlate.filter((s) => s.cutType === 'vertical');
    const diagonals = slicesToPlate.filter((s) => s.cutType === 'diagonal');

    const placed = slicesToPlate.map((slice) => {
      let x: number, y: number, rotation: number;
      if (slice.cutType === 'horizontal') {
        const idx = horizontals.indexOf(slice);
        x = centerX - 100 + idx * 50;
        y = centerY - 50;
        rotation = 0;
      } else if (slice.cutType === 'vertical') {
        const idx = verticals.indexOf(slice);
        x = centerX + 50;
        y = centerY - 100 + idx * 50;
        rotation = 90;
      } else {
        const idx = diagonals.indexOf(slice);
        const radius = 100;
        const step = (Math.PI * 2) / Math.max(diagonals.length, 1);
        x = centerX + Math.cos(step * idx - Math.PI / 2) * radius;
        y = centerY + Math.sin(step * idx - Math.PI / 2) * radius;
        rotation = slice.rotation;
      }
      return { ...slice, x, y, rotation };
    });

    setPlatedSlices(placed);

    setTimeout(() => {
      const newPlate: CompletedPlate = { id: `plate-${Date.now()}`, slices: placed };
      setCompletedPlates((prev) => [...prev, newPlate]);
      const platedIds = new Set(slicesToPlate.map((s) => s.id));
      setSlices((prev) => prev.filter((s) => !platedIds.has(s.id)));
      setPlatedSlices([]);
      setIsPlating(false);
    }, 2000);
  };

  const handleNext = () => {
    if (currentIdx < ingredients.length - 1) {
      setCurrentIdx((p) => p + 1);
      setIsPlating(false);
      setIsSelecting(false);
    }
  };

  const handleFinish = () => {
    playSound('complete');
    setTimeout(() => onComplete(completedPlates), 500);
  };

  if (!currentCfg) return null;

  const currentSliceCount = slices.filter((s) => s.ingredientId === currentCfg.id).length;
  const limitReached = currentSliceCount >= GAMEPLAY.maxSlicesPerIngredient;

  return (
    <div
      className="size-full relative flex flex-col items-center justify-center p-8"
      style={{ background: 'var(--game-bg-gradient)' }}
    >
      {/* 网格背景 */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid-bg" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="2" fill="#FFF" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-bg)" />
        </svg>
      </div>

      {/* 标题 */}
      <div className="absolute top-6 left-8 z-10">
        <h1
          style={{
            fontFamily: FONTS.display,
            fontSize: '2rem',
            fontWeight: 800,
            color: PALETTE.textDark,
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {t('processingMode')}
        </h1>
      </div>

      {/* 切菜板 */}
      <div className="relative z-10">
        <div
          ref={boardRef}
          className="w-[600px] h-[400px] rounded-xl relative overflow-hidden"
          style={{
            cursor: knifeVisible ? 'none' : 'auto',
            background: 'linear-gradient(135deg, #D4A574 0%, #C19A6B 100%)',
            border: `6px solid ${PALETTE.secondary}`,
            boxShadow: '4px 4px 0 rgba(139,69,19,0.3), inset 0 2px 4px rgba(0,0,0,0.1)',
          }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="application"
          aria-label={t('cuttingBoardLabel')}
        >
          {/* 网格纹理 */}
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="cut-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cut-grid)" />
            </svg>
          </div>

          {/* 完整食材 */}
          {slices.length === 0 && !isPlating && currentCfg && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.6 }}
            >
              {currentCfg.imageWhole ? (
                <img
                  src={currentCfg.imageWhole}
                  alt={currentCfg.name[language]}
                  className="w-96 h-96 object-contain drop-shadow-2xl"
                />
              ) : (
                <div
                  role="img"
                  aria-label={currentCfg.name[language]}
                  style={{ fontSize: '240px', lineHeight: 1 }}
                >
                  {currentCfg.emoji}
                </div>
              )}
            </motion.div>
          )}

          {/* 切片中 */}
          {!isPlating &&
            slices.map((slice, index) => {
              const cfg = getIngredient(slice.ingredientId);
              if (!cfg) return null;
              return (
                <motion.div
                  key={slice.id}
                  className="absolute pointer-events-none"
                  style={{ left: `${slice.x}px`, top: `${slice.y}px` }}
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{
                    scale: 1,
                    rotate: slice.rotation,
                    x: Math.cos(index) * 40,
                    y: Math.sin(index) * 40,
                  }}
                  transition={{ type: 'spring', duration: 0.4 }}
                >
                  {cfg.imageSliced ? (
                    <img
                      src={cfg.imageSliced}
                      alt={cfg.name[language]}
                      className="w-40 h-40 object-contain drop-shadow-lg"
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label={cfg.name[language]}
                      style={{ fontSize: '120px', lineHeight: 1 }}
                    >
                      {cfg.emoji}
                    </div>
                  )}
                </motion.div>
              );
            })}

          {/* 摆盘动画 */}
          {isPlating && (
            <PlatingAnimation platedSlices={platedSlices} reduceMotion={!!reduceMotion} language={language} />
          )}

          {/* 切割轨迹 */}
          {isDrawing && cutPath.length > 1 && (
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
              <motion.line
                x1={cutPath[0].x}
                y1={cutPath[0].y}
                x2={cutPath[cutPath.length - 1].x}
                y2={cutPath[cutPath.length - 1].y}
                stroke="#ffffff"
                strokeWidth="10"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.1 }}
              />
              <motion.line
                x1={cutPath[0].x}
                y1={cutPath[0].y}
                x2={cutPath[cutPath.length - 1].x}
                y2={cutPath[cutPath.length - 1].y}
                stroke={PALETTE.warning}
                strokeWidth="16"
                strokeLinecap="round"
                style={{ filter: 'blur(6px)', opacity: 0.8 }}
              />
            </svg>
          )}

          {/* 菜刀光标 (仅在板内可见) */}
          {knifeVisible && (
            <motion.div
              className="absolute pointer-events-none"
              style={{
                left: `${knifePos.x}px`,
                top: `${knifePos.y}px`,
                transform: 'translate(-20%, -80%)',
                fontSize: '160px',
              }}
              animate={{ rotate: isDrawing ? -35 : -25, scale: isDrawing ? 1.15 : 1 }}
              transition={{ duration: 0.15, type: 'spring', stiffness: 300 }}
              aria-hidden="true"
            >
              🔪
            </motion.div>
          )}
        </div>

        {/* 操作提示 */}
        <div className="mt-6 text-center">
          {!isPlating ? (
            <>
              <p
                style={{
                  fontFamily: FONTS.body,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: PALETTE.textDark,
                }}
              >
                {t('dragToCut')} {currentCfg.name[language]}!
              </p>
              <p
                style={{
                  fontFamily: FONTS.body,
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: limitReached ? PALETTE.warning : PALETTE.textMuted,
                  marginTop: '0.5rem',
                }}
              >
                {t('sliceProgress')} {currentSliceCount} / {GAMEPLAY.maxSlicesPerIngredient}
                {isDrawing && ` · ${t('slicing')}`}
                {limitReached && ` · ${t('sliceLimitReached')}`}
              </p>

              <div className="flex gap-4 justify-center mt-3">
                {(['horizontalCut', 'verticalCut', 'diagonalCut'] as const).map((key) => (
                  <span
                    key={key}
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: PALETTE.textMuted,
                    }}
                  >
                    {t(key)}
                  </span>
                ))}
              </div>

              <div className="flex gap-4 justify-center mt-6 flex-wrap">
                {slices.length >= GAMEPLAY.minSlicesToPlate && (
                  <PrimaryBtn onClick={() => setIsSelecting(true)}>{t('selectSlices')}</PrimaryBtn>
                )}
                {currentIdx < ingredients.length - 1 && (
                  <SecondaryBtn onClick={handleNext}>{t('nextIngredient')} →</SecondaryBtn>
                )}
                {currentIdx === ingredients.length - 1 && (
                  <PrimaryBtn onClick={handleFinish}>✓ {t('finishAll')}</PrimaryBtn>
                )}
              </div>
            </>
          ) : (
            <motion.p
              style={{
                fontFamily: FONTS.display,
                fontSize: '3.5rem',
                fontWeight: 800,
                color: PALETTE.primary,
                textShadow: '0 0 30px rgba(255,230,109,0.8), 0 4px 12px rgba(0,0,0,0.3)',
              }}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            >
              {t('plating')}
            </motion.p>
          )}
        </div>
      </div>

      {/* 已完成的盘子 */}
      {completedPlates.length > 0 && (
        <div className="absolute left-4 top-32 bottom-4 w-32 z-10 overflow-y-auto">
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: '0.875rem',
              fontWeight: 700,
              color: PALETTE.textDark,
              marginBottom: '0.75rem',
              textAlign: 'center',
            }}
          >
            {t('completedPlates')}
          </p>
          <div className="flex flex-col gap-3">
            {completedPlates.map((plate, index) => (
              <motion.div
                key={plate.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                style={{
                  background: PALETTE.surface,
                  border: `3px solid ${PALETTE.secondary}`,
                  boxShadow: '3px 3px 0 rgba(139,69,19,0.2)',
                  borderRadius: '12px',
                  padding: '0.5rem',
                }}
              >
                <div className="flex flex-wrap justify-center gap-1 mb-1">
                  {Array.from(new Set(plate.slices.map((s) => s.ingredientId))).map((id) => {
                    const cfg = getIngredient(id);
                    return cfg ? (
                      <span key={id} role="img" aria-label={cfg.name[language]} style={{ fontSize: '1.25rem' }}>
                        {cfg.emoji}
                      </span>
                    ) : null;
                  })}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: FONTS.body,
                    fontWeight: 600,
                    color: PALETTE.textDark,
                    textAlign: 'center',
                  }}
                >
                  {t('slicesCount', { count: plate.slices.length })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 选择切片模态 */}
      {isSelecting && !isPlating && (
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSelecting(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="select-slices-title"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              background: 'rgba(255,255,255,0.98)',
              borderRadius: '24px',
              padding: '2rem',
              maxWidth: '900px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              border: `3px solid ${PALETTE.secondary}`,
            }}
          >
            <h2
              id="select-slices-title"
              style={{
                fontFamily: FONTS.display,
                fontSize: '2rem',
                fontWeight: 800,
                color: PALETTE.primary,
                marginBottom: '1.5rem',
                textAlign: 'center',
              }}
            >
              {t('selectSlices')}
            </h2>

            <div className="grid grid-cols-6 gap-3 mb-6">
              {slices.map((slice) => {
                const cfg = getIngredient(slice.ingredientId);
                if (!cfg) return null;
                return (
                  <motion.button
                    type="button"
                    key={slice.id}
                    onClick={() => toggleSliceSelection(slice.id)}
                    aria-pressed={!!slice.selected}
                    style={{
                      cursor: 'pointer',
                      background: slice.selected ? PALETTE.bgLight : 'rgba(231,76,60,0.06)',
                      border: `3px solid ${slice.selected ? PALETTE.warning : PALETTE.secondary + '55'}`,
                      borderRadius: '12px',
                      padding: '0.75rem',
                      textAlign: 'center',
                      position: 'relative',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div role="img" aria-label={cfg.name[language]} style={{ fontSize: '2.5rem' }}>
                      {cfg.emoji}
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: slice.selected ? PALETTE.textDark : PALETTE.primary,
                        marginTop: '0.25rem',
                      }}
                    >
                      {cfg.name[language]}
                    </div>
                    {slice.selected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: PALETTE.success,
                          color: '#FFF',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 800,
                        }}
                        aria-hidden="true"
                      >
                        ✓
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex gap-4 justify-center flex-wrap">
              <SecondaryBtn onClick={() => setIsSelecting(false)}>{t('continueSlicing')}</SecondaryBtn>
              <PrimaryBtn
                onClick={handleConfirmPlating}
                disabled={slices.filter((s) => s.selected).length === 0}
              >
                {t('confirmPlating')} ({slices.filter((s) => s.selected).length})
              </PrimaryBtn>
            </div>
          </motion.div>
        </div>
      )}

      {/* 进度条 */}
      <div className="absolute top-20 right-8 w-64 z-10">
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: PALETTE.textMuted,
            marginBottom: '0.5rem',
            textAlign: 'right',
          }}
        >
          {t('processingProgress')} {currentIdx + 1} / {ingredients.length}
        </div>
        <div
          className="h-3 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={currentIdx + 1}
          aria-valuemin={1}
          aria-valuemax={ingredients.length}
          style={{ background: 'rgba(139,69,19,0.2)' }}
        >
          <motion.div
            className="h-full"
            style={{ background: 'var(--game-primary-gradient)' }}
            initial={{ width: 0 }}
            animate={{ width: `${((currentIdx + 1) / ingredients.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}

function PrimaryBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: FONTS.display,
        fontSize: '1.25rem',
        fontWeight: 700,
        color: '#FFFFFF',
        background: disabled
          ? 'rgba(0,0,0,0.2)'
          : 'var(--game-primary-gradient)',
        padding: '0.75rem 2rem',
        border: `2px solid ${PALETTE.secondary}`,
        borderRadius: '100px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 4px 12px rgba(0,0,0,0.2)',
        opacity: disabled ? 0.5 : 1,
      }}
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}

function SecondaryBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: FONTS.display,
        fontSize: '1.25rem',
        fontWeight: 700,
        color: PALETTE.textDark,
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(10px)',
        padding: '0.75rem 2rem',
        border: `2px solid ${PALETTE.secondary}`,
        borderRadius: '100px',
        cursor: 'pointer',
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}

function PlatingAnimation({
  platedSlices,
  reduceMotion,
  language,
}: {
  platedSlices: Slice[];
  reduceMotion: boolean;
  language: 'zh' | 'en';
}) {
  return (
    <>
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div
          style={{
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #FFFFFF 0%, #F5F5F5 100%)',
            border: `4px solid ${PALETTE.secondary}`,
            boxShadow: '4px 4px 0 rgba(139,69,19,0.3)',
          }}
        />
      </motion.div>

      {!reduceMotion && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          animate={{ scale: [0.8, 1.2], opacity: [0.6, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
        >
          <div
            style={{
              width: '340px',
              height: '340px',
              borderRadius: '50%',
              border: `3px solid ${PALETTE.warning}`,
              boxShadow: '0 0 20px rgba(243,156,18,0.4)',
            }}
          />
        </motion.div>
      )}

      {platedSlices.map((slice, index) => {
        const cfg = getIngredient(slice.ingredientId);
        if (!cfg) return null;
        return (
          <motion.div
            key={slice.id}
            className="absolute pointer-events-none"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{
              left: `${slice.x}px`,
              top: `${slice.y}px`,
              scale: 1.4,
              rotate: slice.rotation,
              opacity: 1,
            }}
            transition={{ type: 'spring', stiffness: 150, damping: 15, delay: index * 0.15 }}
          >
            {cfg.imageSliced ? (
              <img
                src={cfg.imageSliced}
                alt={cfg.name[language]}
                className="w-40 h-40 object-contain"
                style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
              />
            ) : (
              <div
                role="img"
                aria-label={cfg.name[language]}
                style={{
                  fontSize: '120px',
                  lineHeight: 1,
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
                }}
              >
                {cfg.emoji}
              </div>
            )}
          </motion.div>
        );
      })}
    </>
  );
}

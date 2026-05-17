import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LanguageProvider } from './contexts/LanguageContext';
import { ConfigProvider, useConfig } from './contexts/ConfigContext';
import { LanguageToggle } from './components/LanguageToggle';
import { StartScreen } from './components/StartScreen';
import { ConveyorMode } from './components/ConveyorMode';
import { ProcessingMode, type CompletedPlate } from './components/ProcessingMode';
import { ResultsScreen } from './components/ResultsScreen';
import { EditorButton } from './components/Editor/EditorButton';
import type { CollectedIngredient } from './shared/types';

type GameMode = 'start' | 'conveyor' | 'processing' | 'results';

export default function App() {
  return (
    <ConfigProvider>
      <LanguageProvider>
        <GameRoot />
      </LanguageProvider>
    </ConfigProvider>
  );
}

function GameRoot() {
  const [gameMode, setGameMode] = useState<GameMode>('start');
  const [collectedIngredients, setCollectedIngredients] = useState<CollectedIngredient[]>([]);
  const [completedPlates, setCompletedPlates] = useState<CompletedPlate[]>([]);
  const { bgm: bgmUrls, volume } = useConfig();
  const conveyorBgmRef = useRef<HTMLAudioElement | null>(null);
  const processingBgmRef = useRef<HTMLAudioElement | null>(null);

  // BGM 跟随 config 变化重新加载
  useEffect(() => {
    conveyorBgmRef.current?.pause();
    conveyorBgmRef.current = null;
    if (bgmUrls.conveyor) {
      const a = new Audio(bgmUrls.conveyor);
      a.loop = true;
      a.volume = volume.bgm;
      a.preload = 'auto';
      conveyorBgmRef.current = a;
    }
    return () => {
      conveyorBgmRef.current?.pause();
    };
  }, [bgmUrls.conveyor, volume.bgm]);

  useEffect(() => {
    processingBgmRef.current?.pause();
    processingBgmRef.current = null;
    if (bgmUrls.processing) {
      const a = new Audio(bgmUrls.processing);
      a.loop = true;
      a.volume = volume.bgm;
      a.preload = 'auto';
      processingBgmRef.current = a;
    }
    return () => {
      processingBgmRef.current?.pause();
    };
  }, [bgmUrls.processing, volume.bgm]);

  const playBgm = (ref: React.MutableRefObject<HTMLAudioElement | null>) => {
    const bgm = ref.current;
    if (!bgm) return;
    bgm.currentTime = 0;
    bgm.play().catch(() => {
      // 浏览器自动播放策略阻塞时,等用户首次交互再播
      const playOnInteraction = () => {
        bgm.play().catch(() => {});
        document.removeEventListener('click', playOnInteraction);
        document.removeEventListener('keydown', playOnInteraction);
      };
      document.addEventListener('click', playOnInteraction);
      document.addEventListener('keydown', playOnInteraction);
    });
  };

  const handleStart = () => {
    setGameMode('conveyor');
    playBgm(conveyorBgmRef);
  };

  const handleIngredientsCollected = (ingredients: CollectedIngredient[]) => {
    setCollectedIngredients(ingredients);
    setGameMode('processing');
    conveyorBgmRef.current?.pause();
    playBgm(processingBgmRef);
  };

  const handleProcessingComplete = (plates: CompletedPlate[]) => {
    setCompletedPlates(plates);
    setGameMode('results');
    processingBgmRef.current?.pause();
    conveyorBgmRef.current?.pause();
  };

  const handleRestart = () => {
    setGameMode('start');
    setCollectedIngredients([]);
    setCompletedPlates([]);
    conveyorBgmRef.current?.pause();
    processingBgmRef.current?.pause();
  };

  return (
    <div className="size-full overflow-hidden" style={{ background: 'var(--game-bg-gradient)' }}>
      <LanguageToggle />
      <EditorButton />
      <AnimatePresence mode="wait">
          {gameMode === 'start' && (
            <ScreenWrapper key="start">
              <StartScreen onStart={handleStart} />
            </ScreenWrapper>
          )}
          {gameMode === 'conveyor' && (
            <ScreenWrapper key="conveyor">
              <ConveyorMode
                onComplete={handleIngredientsCollected}
                onRestart={handleRestart}
              />
            </ScreenWrapper>
          )}
          {gameMode === 'processing' && (
            <ScreenWrapper key="processing">
              <ProcessingMode
                ingredients={collectedIngredients}
                onComplete={handleProcessingComplete}
              />
            </ScreenWrapper>
          )}
          {gameMode === 'results' && (
            <ScreenWrapper key="results">
              <ResultsScreen
                plates={completedPlates}
                onRestart={handleRestart}
              />
            </ScreenWrapper>
          )}
      </AnimatePresence>
    </div>
  );
}

/**
 * 屏幕切换容器: 提供方向性过渡(IxD continuity 原则)。
 * 进入: 从右滑入 + 渐显; 退出: 向左滑出 + 渐隐。
 * prefers-reduced-motion 由 theme.css 全局兜底缩到 0.01ms。
 */
function ScreenWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="size-full"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

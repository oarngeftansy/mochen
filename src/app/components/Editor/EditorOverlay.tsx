import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useConfig, type Palette, type Fonts, type Bgm, type Sfx } from '../../contexts/ConfigContext';
import { PALETTE, FONTS, type IngredientConfig, type IngredientType } from '../../../config/assets';

type Tab = 'ingredients' | 'theme' | 'audio';

export function EditorOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('ingredients');
  const [exportText, setExportText] = useState<string | null>(null);
  const config = useConfig();

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (exportText) setExportText(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, exportText]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 遮罩 */}
          <motion.div
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* 抽屉 */}
          <motion.aside
            className="fixed top-0 right-0 bottom-0 z-[101] flex flex-col"
            style={{
              width: 'min(440px, 100vw)',
              background: '#FAF6F0',
              borderLeft: `4px solid ${PALETTE.secondary}`,
              boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
              fontFamily: FONTS.body,
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 220, damping: 28 }}
            role="dialog"
            aria-modal="true"
            aria-label="游戏编辑器"
          >
            {/* 标题栏 */}
            <header
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `2px solid ${PALETTE.secondary}33` }}
            >
              <h2 style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: '1.5rem', color: PALETTE.primary }}>
                游戏编辑器
              </h2>
              <IconButton onClick={onClose} ariaLabel="关闭">✕</IconButton>
            </header>

            {/* Tab 切换 */}
            <nav className="flex gap-1 px-3 pt-3" role="tablist">
              <TabBtn active={tab === 'ingredients'} onClick={() => setTab('ingredients')}>食材</TabBtn>
              <TabBtn active={tab === 'theme'} onClick={() => setTab('theme')}>配色 / 字体</TabBtn>
              <TabBtn active={tab === 'audio'} onClick={() => setTab('audio')}>音乐 / 音效</TabBtn>
            </nav>

            {/* Tab 内容 */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {tab === 'ingredients' && <IngredientsTab />}
              {tab === 'theme' && <ThemeTab />}
              {tab === 'audio' && <AudioTab />}
            </div>

            {/* 底部操作栏 */}
            <footer
              className="flex gap-2 px-5 py-4"
              style={{ borderTop: `2px solid ${PALETTE.secondary}33`, background: '#FFF' }}
            >
              <button
                type="button"
                onClick={() => {
                  if (confirm('重置所有修改回到代码默认值?')) config.reset();
                }}
                style={ghostBtnStyle}
              >
                ↺ 重置
              </button>
              <button
                type="button"
                onClick={() => setExportText(config.exportTs())}
                style={primaryBtnStyle}
              >
                ⤓ 导出代码
              </button>
            </footer>
          </motion.aside>

          {/* 导出模态 */}
          {exportText && (
            <ExportModal text={exportText} onClose={() => setExportText(null)} />
          )}
        </>
      )}
    </AnimatePresence>
  );
}

/* ================================================================== */
/* Tabs                                                                 */
/* ================================================================== */

function IngredientsTab() {
  const { ingredients, setIngredients } = useConfig();

  const update = (idx: number, patch: Partial<IngredientConfig>) => {
    const next = ingredients.map((it, i) => (i === idx ? { ...it, ...patch, name: { ...it.name, ...(patch.name ?? {}) } } : it));
    setIngredients(next);
  };

  const remove = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const add = () => {
    const newId = `ingredient-${Date.now()}`;
    setIngredients([
      ...ingredients,
      {
        id: newId,
        name: { zh: '新食材', en: 'New' },
        emoji: '🍎',
        type: 'tap',
      },
    ]);
  };

  return (
    <div className="flex flex-col gap-3">
      <p style={hintStyle}>每个食材都会被传送带随机抽取。改 emoji / 图片 URL 立即在开始界面预览。</p>
      {ingredients.map((ing, idx) => (
        <div
          key={ing.id + idx}
          className="rounded-xl p-3"
          style={{ background: '#FFF', border: `2px solid ${PALETTE.secondary}55` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <input
              value={ing.emoji}
              onChange={(e) => update(idx, { emoji: e.target.value })}
              maxLength={4}
              style={{ ...textInputStyle, width: '48px', textAlign: 'center', fontSize: '1.5rem' }}
              aria-label="食材 emoji"
            />
            <select
              value={ing.type}
              onChange={(e) => update(idx, { type: e.target.value as IngredientType })}
              style={textInputStyle}
              aria-label="食材类型"
            >
              <option value="tap">TAP (快按)</option>
              <option value="hold">HOLD (长按)</option>
            </select>
            <button
              type="button"
              onClick={() => remove(idx)}
              style={{ ...ghostBtnStyle, padding: '0.4rem 0.6rem', color: PALETTE.miss, borderColor: PALETTE.miss }}
              aria-label="删除食材"
            >
              ✕
            </button>
          </div>
          <Row label="中文名">
            <input
              value={ing.name.zh}
              onChange={(e) => update(idx, { name: { ...ing.name, zh: e.target.value } })}
              style={textInputStyle}
            />
          </Row>
          <Row label="English">
            <input
              value={ing.name.en}
              onChange={(e) => update(idx, { name: { ...ing.name, en: e.target.value } })}
              style={textInputStyle}
            />
          </Row>
          <Row label="完整图 URL">
            <input
              value={ing.imageWhole ?? ''}
              onChange={(e) => update(idx, { imageWhole: e.target.value || undefined })}
              placeholder="留空用 emoji"
              style={textInputStyle}
            />
          </Row>
          <Row label="切片图 URL">
            <input
              value={ing.imageSliced ?? ''}
              onChange={(e) => update(idx, { imageSliced: e.target.value || undefined })}
              placeholder="留空用 emoji"
              style={textInputStyle}
            />
          </Row>
        </div>
      ))}
      <button type="button" onClick={add} style={{ ...ghostBtnStyle, alignSelf: 'flex-start' }}>
        + 添加食材
      </button>
    </div>
  );
}

function ThemeTab() {
  const { palette, setPaletteKey, fonts, setFontKey } = useConfig();

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 style={sectionTitleStyle}>调色板</h3>
        <p style={hintStyle}>改颜色会立即同步到所有屏幕(CSS 变量)。</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {(Object.keys(palette) as (keyof Palette)[]).map((k) => (
            <ColorRow
              key={k}
              label={k}
              value={palette[k]}
              onChange={(v) => setPaletteKey(k, v)}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 style={sectionTitleStyle}>字体</h3>
        <p style={hintStyle}>填 CSS font-family。需要先在 fonts.css 加载相应字体。</p>
        {(Object.keys(fonts) as (keyof Fonts)[]).map((k) => (
          <Row key={k} label={k}>
            <input
              value={fonts[k]}
              onChange={(e) => setFontKey(k, e.target.value)}
              style={textInputStyle}
            />
          </Row>
        ))}
      </section>
    </div>
  );
}

function AudioTab() {
  const { bgm, setBgmKey, sfx, setSfxKey, volume, setVolumeKey } = useConfig();

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 style={sectionTitleStyle}>背景音乐 (BGM)</h3>
        <p style={hintStyle}>URL 必须是直链音频(.mp3/.ogg/.wav)。留空 = 静音。改完立刻生效。</p>
        {(Object.keys(bgm) as (keyof Bgm)[]).map((k) => (
          <UrlRowWithTest
            key={k}
            label={k}
            value={bgm[k]}
            onChange={(v) => setBgmKey(k, v)}
            volume={volume.bgm}
          />
        ))}
        <Row label={`总音量 ${Math.round(volume.bgm * 100)}%`}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume.bgm}
            onChange={(e) => setVolumeKey('bgm', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </Row>
      </section>

      <section>
        <h3 style={sectionTitleStyle}>音效 (SFX)</h3>
        <p style={hintStyle}>tap / hold / perfect / good / miss / cut / plate / complete / buttonClick</p>
        {(Object.keys(sfx) as (keyof Sfx)[]).map((k) => (
          <UrlRowWithTest
            key={k}
            label={k}
            value={sfx[k]}
            onChange={(v) => setSfxKey(k, v)}
            volume={volume.sfx}
          />
        ))}
        <Row label={`总音量 ${Math.round(volume.sfx * 100)}%`}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume.sfx}
            onChange={(e) => setVolumeKey('sfx', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </Row>
      </section>
    </div>
  );
}

/* ================================================================== */
/* Sub-components                                                       */
/* ================================================================== */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 mb-2 text-sm">
      <span style={{ minWidth: '90px', color: PALETTE.textDark, fontWeight: 600 }}>{label}</span>
      <div className="flex-1">{children}</div>
    </label>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '36px', height: '32px', border: 'none', cursor: 'pointer', background: 'transparent' }}
        aria-label={label}
      />
      <span style={{ fontSize: '0.75rem', color: PALETTE.textDark, fontWeight: 600, flex: 1 }}>
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...textInputStyle, width: '80px', fontFamily: 'monospace', fontSize: '0.75rem' }}
      />
    </label>
  );
}

function UrlRowWithTest({
  label,
  value,
  onChange,
  volume,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  volume: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const test = () => {
    audioRef.current?.pause();
    if (!value) return;
    const a = new Audio(value);
    a.volume = volume;
    audioRef.current = a;
    a.addEventListener('ended', () => setPlaying(false));
    a.addEventListener('error', () => setPlaying(false));
    a.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  };

  const stop = () => {
    audioRef.current?.pause();
    setPlaying(false);
  };

  useEffect(() => () => audioRef.current?.pause(), []);

  return (
    <Row label={label}>
      <div className="flex gap-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          style={textInputStyle}
        />
        <button
          type="button"
          onClick={playing ? stop : test}
          disabled={!value}
          title={playing ? '停止' : '试听'}
          style={{
            ...ghostBtnStyle,
            padding: '0.4rem 0.6rem',
            opacity: value ? 1 : 0.4,
            cursor: value ? 'pointer' : 'not-allowed',
          }}
        >
          {playing ? '■' : '▶'}
        </button>
      </div>
    </Row>
  );
}

function ExportModal({ text, onClose }: { text: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 兜底:全选
      const el = document.getElementById('export-textarea') as HTMLTextAreaElement | null;
      el?.select();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFF',
          borderRadius: '16px',
          border: `3px solid ${PALETTE.secondary}`,
          padding: '1.5rem',
          width: 'min(720px, 100%)',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <h3 style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: '1.25rem', color: PALETTE.primary }}>
            导出为 TypeScript
          </h3>
          <IconButton onClick={onClose} ariaLabel="关闭">✕</IconButton>
        </div>
        <p style={hintStyle}>
          复制下面的代码,粘贴回 <code>src/config/assets.ts</code> 和 <code>src/config/audio.ts</code>
          对应区段(已在注释里标好)。
        </p>
        <textarea
          id="export-textarea"
          readOnly
          value={text}
          style={{
            flex: 1,
            minHeight: '300px',
            fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
            fontSize: '0.75rem',
            padding: '0.75rem',
            border: `2px solid ${PALETTE.secondary}55`,
            borderRadius: '8px',
            background: '#FAFAFA',
            resize: 'vertical',
          }}
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} style={ghostBtnStyle}>关闭</button>
          <button type="button" onClick={copy} style={primaryBtnStyle}>
            {copied ? '已复制 ✓' : '复制到剪贴板'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem',
        background: active ? PALETTE.primary : 'transparent',
        color: active ? '#FFF' : PALETTE.textDark,
        border: `2px solid ${active ? PALETTE.primary : 'transparent'}`,
        borderBottom: 'none',
        borderRadius: '10px 10px 0 0',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: '0.875rem',
      }}
    >
      {children}
    </button>
  );
}

function IconButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: '32px',
        height: '32px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '1.25rem',
        color: PALETTE.textDark,
        borderRadius: '50%',
      }}
    >
      {children}
    </button>
  );
}

/* ================================================================== */
/* Styles                                                               */
/* ================================================================== */

const textInputStyle: React.CSSProperties = {
  flex: 1,
  width: '100%',
  padding: '0.4rem 0.6rem',
  border: `2px solid ${PALETTE.secondary}55`,
  borderRadius: '6px',
  background: '#FFF',
  fontFamily: 'inherit',
  fontSize: '0.875rem',
};

const ghostBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'transparent',
  color: PALETTE.textDark,
  border: `2px solid ${PALETTE.secondary}`,
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.875rem',
};

const primaryBtnStyle: React.CSSProperties = {
  ...ghostBtnStyle,
  background: PALETTE.primary,
  color: '#FFF',
  border: `2px solid ${PALETTE.primary}`,
  marginLeft: 'auto',
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontWeight: 800,
  fontSize: '1rem',
  color: PALETTE.primary,
  marginBottom: '0.5rem',
};

const hintStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: PALETTE.textMuted,
  lineHeight: 1.5,
  marginBottom: '0.5rem',
};

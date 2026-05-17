import { useState } from 'react';
import { motion } from 'motion/react';
import { PALETTE } from '../../../config/assets';
import { EditorOverlay } from './EditorOverlay';

/**
 * 浮动齿轮按钮 — 打开编辑器抽屉。
 * 位置:左下角(避开右上角 LanguageToggle、底部居中游戏按钮)。
 */
export function EditorButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="打开编辑器"
        className="fixed bottom-6 left-6 z-40"
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: '#FFFFFF',
          border: `3px solid ${PALETTE.secondary}`,
          boxShadow: '3px 3px 0 rgba(139,69,19,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
        }}
        whileHover={{ scale: 1.1, rotate: 30 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        ⚙
      </motion.button>
      <EditorOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}

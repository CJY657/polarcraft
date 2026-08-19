/**
 * Dialog Component
 * 可复用的模态框组件
 */

import { ReactNode, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/classNames';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const dialogVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, duration: 0.3, bounce: 0.3 }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 }
  }
};

export function Dialog({
  isOpen,
  onClose,
  children,
  className = '',
  containerClassName = '',
  closeOnOverlayClick = true,
  closeOnEsc = true
}: DialogProps) {
  // Handle ESC key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEsc) {
      onClose();
    }
  }, [onClose, closeOnEsc]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-4", containerClassName)}>
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleOverlayClick}
          />

          {/* Dialog Content */}
          <motion.div
            className={cn(
              "relative w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl",
              className
            )}
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

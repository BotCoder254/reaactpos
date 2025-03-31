import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: '8px'
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: '8px'
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: '8px'
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: '8px'
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg whitespace-nowrap"
            style={positionStyles[position]}
          >
            {content}
            <div
              className="absolute w-2 h-2 bg-gray-900 transform rotate-45"
              style={{
                ...(position === 'top' && {
                  bottom: '-4px',
                  left: '50%',
                  marginLeft: '-4px'
                }),
                ...(position === 'bottom' && {
                  top: '-4px',
                  left: '50%',
                  marginLeft: '-4px'
                }),
                ...(position === 'left' && {
                  right: '-4px',
                  top: '50%',
                  marginTop: '-4px'
                }),
                ...(position === 'right' && {
                  left: '-4px',
                  top: '50%',
                  marginTop: '-4px'
                })
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 

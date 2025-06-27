
import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';

interface DecryptedTextProps {
  text: string;
  className?: string;
}

const DecryptedText = ({ text, className }: DecryptedTextProps) => {
  const [decryptedText, setDecryptedText] = useState('');
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let currentIndex = 0;
    let iterations = 0;

    const maxIterations = 3;
    const iterationDelay = 50;

    interval = setInterval(() => {
      setDecryptedText(prev => {
        const result = text.split('').map((letter, index) => {
          if (index < currentIndex) {
            return letter;
          }
          return characters[Math.floor(Math.random() * characters.length)];
        }).join('');

        if (iterations >= maxIterations) {
          currentIndex++;
          iterations = 0;
        } else {
          iterations++;
        }

        if (currentIndex >= text.length) {
          clearInterval(interval);
        }

        return result;
      });
    }, iterationDelay);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {decryptedText}
    </motion.span>
  );
};

export default DecryptedText;

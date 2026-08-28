/**
 * Freeze Chrome Extension - Main Content Script
 * Detects code blocks and adds freeze functionality
 */
(() => {
  'use strict';

  /**
   * Add freeze buttons to all code blocks
   */
  const addFreezeButtons = () => {
    const codeBlocks = Detector.findCodeBlocks();
    
    codeBlocks.forEach(codeBlock => {
      if (!Detector.hasFreezeButton(codeBlock)) {
        Detector.addFreezeButton(codeBlock, (code, language) => {
          FloatingWindow.create(code, language);
        });
      }
    });
  };

  /**
   * Initialize the extension
   */
  const init = () => {
    // Add buttons to existing code blocks
    addFreezeButtons();
    
    // Watch for new code blocks (ChatGPT loads messages dynamically)
    Detector.observe(() => {
      addFreezeButtons();
    });
    
    console.log('Freeze extension initialized');
  };

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
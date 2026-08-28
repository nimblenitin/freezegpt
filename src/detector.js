/**
 * Code block detector for ChatGPT
 * Isolated module for easy updates if ChatGPT changes its DOM
 */
const Detector = (() => {
  // Multiple selectors to detect code blocks (fallback strategy)
  const CODE_BLOCK_SELECTORS = [
    'pre > code',
    'pre code',
    '[data-message-author-role="assistant"] pre',
    '.markdown pre',
    '.prose pre'
  ];

  /**
   * Extract code text from a code block element
   */
  const extractCodeText = (codeElement) => {
    if (!codeElement) return '';
    
    // Try to get text content, preserving whitespace
    const clone = codeElement.cloneNode(true);
    
    // Remove any existing freeze buttons
    clone.querySelectorAll('.freeze-btn').forEach(btn => btn.remove());
    
    return clone.textContent || '';
  };

  /**
   * Get language from code block (if available)
   */
  const detectLanguage = (codeElement) => {
    if (!codeElement) return '';
    
    // Check for language class (e.g., language-python, lang-python)
    const pre = codeElement.closest('pre');
    if (pre) {
      const classes = pre.className.split(' ');
      for (const cls of classes) {
        if (cls.startsWith('language-') || cls.startsWith('lang-')) {
          return cls.replace(/^(language-|lang-)/, '');
        }
      }
    }
    
    // Check for data attribute
    if (pre && pre.dataset && pre.dataset.language) {
      return pre.dataset.language;
    }
    
    return '';
  };

  /**
   * Find all code blocks on the page
   */
  const findCodeBlocks = () => {
    const codeBlocks = new Set();
    
    for (const selector of CODE_BLOCK_SELECTORS) {
      document.querySelectorAll(selector).forEach(el => {
        // Get the <pre> element (or the element itself if it's a pre)
        const pre = el.closest('pre') || el;
        if (pre) {
          codeBlocks.add(pre);
        }
      });
    }
    
    return Array.from(codeBlocks);
  };

  /**
   * Check if a code block already has a freeze button
   */
  const hasFreezeButton = (codeBlock) => {
    return codeBlock.querySelector('.freeze-btn') !== null;
  };

  /**
   * Add freeze button to a code block
   */
  const addFreezeButton = (codeBlock, onFreeze) => {
    if (hasFreezeButton(codeBlock)) return;
    
    const btn = document.createElement('button');
    btn.className = 'freeze-btn';
    btn.innerHTML = '📌 Freeze';
    btn.title = 'Freeze this code block';
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const codeElement = codeBlock.querySelector('code') || codeBlock;
      const code = extractCodeText(codeElement);
      const language = detectLanguage(codeElement);
      
      onFreeze(code, language);
    });
    
    // Make the pre element position relative for button positioning
    codeBlock.style.position = 'relative';
    codeBlock.appendChild(btn);
    
    return btn;
  };

  /**
   * Initialize MutationObserver to watch for new code blocks
   */
  const observe = (callback) => {
    const observer = new MutationObserver((mutations) => {
      // Check if any new nodes were added
      const hasNewNodes = mutations.some(mutation => 
        mutation.addedNodes.length > 0
      );
      
      if (hasNewNodes) {
        callback();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return observer;
  };

  // Public API
  return {
    findCodeBlocks,
    hasFreezeButton,
    addFreezeButton,
    extractCodeText,
    detectLanguage,
    observe
  };
})();

// Make available globally for content script
if (typeof window !== 'undefined') {
  window.Detector = Detector;
}
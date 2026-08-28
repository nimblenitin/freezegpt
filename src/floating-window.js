/**
 * Floating window manager for frozen code blocks
 */
const FloatingWindow = (() => {
  const windows = new Map();
  let highestZIndex = 10000;

  /**
   * Create a new floating window
   */
  const create = (code, language = '') => {
    const id = `freeze-window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create window element
    const windowEl = document.createElement('div');
    windowEl.className = 'freeze-floating-window';
    windowEl.id = id;
    
    // Calculate position (bottom-right with offset for multiple windows)
    const offset = (windows.size % 5) * 30;
    const defaultWidth = 400;
    const defaultHeight = 500;
    
    windowEl.style.width = `${defaultWidth}px`;
    windowEl.style.height = `${defaultHeight}px`;
    windowEl.style.right = `${20 + offset}px`;
    windowEl.style.bottom = `${20 + offset}px`;
    windowEl.style.zIndex = ++highestZIndex;
    
    // Header
    const header = document.createElement('div');
    header.className = 'freeze-header';
    header.innerHTML = `
      <span class="freeze-title">📌 Frozen Code</span>
      <div class="freeze-actions">
        <button class="freeze-copy-btn" title="Copy code">Copy</button>
        <button class="freeze-close-btn" title="Close">×</button>
      </div>
    `;
    
    // Content area
    const content = document.createElement('div');
    content.className = 'freeze-content';
    
    // Code element
    const codeEl = document.createElement('pre');
    codeEl.className = 'freeze-code';
    
    if (language) {
      codeEl.dataset.language = language;
    }
    
    // Create code with line numbers
    const lines = code.split('\n');
    const codeContent = document.createElement('div');
    codeContent.className = 'freeze-code-content';
    
    lines.forEach((line, index) => {
      const lineEl = document.createElement('div');
      lineEl.className = 'freeze-line';
      
      const lineNum = document.createElement('span');
      lineNum.className = 'freeze-line-number';
      lineNum.textContent = index + 1;
      
      const lineText = document.createElement('span');
      lineText.className = 'freeze-line-text';
      lineText.textContent = line;
      
      lineEl.appendChild(lineNum);
      lineEl.appendChild(lineText);
      codeContent.appendChild(lineEl);
    });
    
    codeEl.appendChild(codeContent);
    content.appendChild(codeEl);
    
    // Assemble window
    windowEl.appendChild(header);
    windowEl.appendChild(content);
    
    // Add to DOM
    document.body.appendChild(windowEl);
    
    // Store window data
    windows.set(id, {
      element: windowEl,
      code,
      language,
      offset: { x: 0, y: 0 }
    });
    
    // Setup functionality
    setupDrag(id);
    setupResize(id);
    setupActions(id);
    
    return id;
  };

  /**
   * Setup drag functionality
   */
  const setupDrag = (id) => {
    const windowEl = windows.get(id).element;
    const header = windowEl.querySelector('.freeze-header');
    const data = windows.get(id);
    
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    header.addEventListener('mousedown', (e) => {
      // Don't drag if clicking on buttons
      if (e.target.closest('.freeze-actions')) return;
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = windowEl.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      windowEl.style.right = 'auto';
      windowEl.style.bottom = 'auto';
      
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      windowEl.style.left = `${initialX + dx}px`;
      windowEl.style.top = `${initialY + dy}px`;
      
      // Bring to front
      windowEl.style.zIndex = ++highestZIndex;
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.userSelect = '';
      }
    });
  };

  /**
   * Setup resize functionality
   */
  const setupResize = (id) => {
    const windowEl = windows.get(id).element;
    
    // Add resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'freeze-resize-handle';
    windowEl.appendChild(resizeHandle);
    
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = windowEl.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      
      document.body.style.userSelect = 'none';
      e.preventDefault();
      e.stopPropagation();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      const newWidth = Math.max(200, startWidth + dx);
      const newHeight = Math.max(150, startHeight + dy);
      
      windowEl.style.width = `${newWidth}px`;
      windowEl.style.height = `${newHeight}px`;
    });
    
    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.userSelect = '';
      }
    });
  };

  /**
   * Setup action buttons
   */
  const setupActions = (id) => {
    const windowEl = windows.get(id).element;
    const data = windows.get(id);
    
    // Copy button
    const copyBtn = windowEl.querySelector('.freeze-copy-btn');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(data.code);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        copyBtn.textContent = 'Failed';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
        }, 2000);
      }
    });
    
    // Close button
    const closeBtn = windowEl.querySelector('.freeze-close-btn');
    closeBtn.addEventListener('click', () => {
      close(id);
    });
    
    // Bring to front when clicked
    windowEl.addEventListener('mousedown', () => {
      windowEl.style.zIndex = ++highestZIndex;
    });
  };

  /**
   * Close a window
   */
  const close = (id) => {
    const windowEl = windows.get(id)?.element;
    if (windowEl) {
      windowEl.remove();
      windows.delete(id);
    }
  };

  /**
   * Close all windows
   */
  const closeAll = () => {
    windows.forEach((data, id) => {
      close(id);
    });
  };

  /**
   * Get window count
   */
  const getCount = () => windows.size;

  // Public API
  return {
    create,
    close,
    closeAll,
    getCount
  };
})();

// Make available globally for content script
if (typeof window !== 'undefined') {
  window.FloatingWindow = FloatingWindow;
}
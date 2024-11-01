let isEnabled = true;
let currentMode = 'blur';
let profaneWords = [];

// Load words once and cache them
fetch(chrome.runtime.getURL('data/profane-words.txt'))
    .then(response => response.text())
    .then(text => {
        profaneWords = text.split('\n').filter(word => word.trim().length > 0);
    });

// Get current mode immediately
chrome.storage.local.get(['mode', 'enabled'], function(result) {
    currentMode = result.mode || 'blur';
    isEnabled = result.enabled;
    if (isEnabled) {
        scanDocument();
    }
});

function filterText(node) {
    if (!isEnabled || !node || !profaneWords.length) return;
    
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        let text = node.textContent;
        let wasFiltered = false;
        
        profaneWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            if (regex.test(text)) {
                text = text.replace(regex, '*'.repeat(word.length));
                wasFiltered = true;
            }
        });

        if (wasFiltered) {
            node.textContent = text;
            if (currentMode === 'blur') {
                const parent = node.parentElement;
                if (parent && !parent.style.filter) {
                    parent.style.filter = 'blur(5px)';
                    parent.style.transition = 'filter 0.2s';
                }
            }
        }
    }
}

// Optimize mutation observer
const observer = new MutationObserver((mutations) => {
    if (!isEnabled) return;
    
    requestAnimationFrame(() => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    scanNode(node);
                } else if (node.nodeType === Node.TEXT_NODE) {
                    filterText(node);
                }
            });
        });
    });
});

function scanNode(node) {
    const walker = document.createTreeWalker(
        node,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    while (walker.nextNode()) {
        filterText(walker.currentNode);
    }
}

function scanDocument() {
    scanNode(document.body);
}

observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'filter') {
        isEnabled = message.enabled;
        currentMode = message.mode;
        
        if (isEnabled) {
            scanDocument();
        } else {
            document.querySelectorAll('*').forEach(el => {
                el.style.filter = 'none';
            });
        }
    }
});

function filterImages() {
    if (!isEnabled) return;
    
    // Select all images and stickers
    const images = document.querySelectorAll('img, .sticker, .emoji');
    
    images.forEach(img => {
        // Check image alt text and surrounding text for profanity
        const altText = img.alt?.toLowerCase() || '';
        const nearbyText = img.parentElement?.textContent?.toLowerCase() || '';
        
        let shouldBlur = false;
        profaneWords.forEach(word => {
            if (altText.includes(word) || nearbyText.includes(word)) {
                shouldBlur = true;
            }
        });
        
        if (shouldBlur) {
            img.style.filter = 'blur(15px)';
            img.style.transition = 'filter 0.3s';
        }
    });
}

// Initial scan
scanDocument();
filterImages();
observer.observe(document.body, {
    childList: true,
    subtree: true
});

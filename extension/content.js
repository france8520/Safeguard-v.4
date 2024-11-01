let isEnabled = true;
let profaneWords = [];

fetch(chrome.runtime.getURL('data/profane-words.txt'))
    .then(response => response.text())
    .then(text => {
        profaneWords = text.split('\n').filter(word => word.trim().length > 0);
    });

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'filter') {
        isEnabled = message.enabled;
        if (isEnabled) {
            scanDocument();
        } else {
            document.querySelectorAll('*').forEach(el => {
                el.style.filter = 'none';
            });
        }
    }
});

function filterText(node) {
    if (!isEnabled) return;
    
    if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent;
        profaneWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            text = text.replace(regex, '*'.repeat(word.length));
        });
        if (text !== node.textContent) {
            node.textContent = text;
            node.parentElement.style.filter = 'blur(5px)';
        }
    }
}

function scanDocument() {
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT
    );
    while (walker.nextNode()) {
        filterText(walker.currentNode);
    }
}

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

// Add to existing observer
const observer = new MutationObserver((mutations) => {
    if (!isEnabled) return;
    mutations.forEach(mutation => {
        filterText(mutation.target);
        filterImages(); // Check new images
    });
});

// Initial scan
scanDocument();
filterImages();
observer.observe(document.body, {
    childList: true,
    subtree: true
});

chrome.storage.local.get(['enabled'], function(result) {
    isEnabled = result.enabled;
    if (isEnabled) {
        scanDocument();
    }
});

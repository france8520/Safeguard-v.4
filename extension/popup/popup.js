document.addEventListener('DOMContentLoaded', function() {
    const stats = {
        wordsFiltered: 0,
        pagesProtected: 0
    };

    function updateStats() {
        chrome.storage.local.get(['stats'], function(result) {
            if (result.stats) {
                Object.assign(stats, result.stats);
                document.getElementById('words-filtered').textContent = stats.wordsFiltered;
                document.getElementById('pages-protected').textContent = stats.pagesProtected;
            }
        });
    }

    // Add click handlers for each mode option
    document.querySelectorAll('.mode-option').forEach(option => {
        option.addEventListener('click', () => {
            const mode = option.dataset.mode;
            updateMode(mode);
            
            // Send message to content script
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'filter',
                    mode: mode,
                    enabled: mode !== 'disable'
                });
            });
        });
    });

    function updateMode(mode) {
        chrome.storage.local.set({ 
            enabled: mode !== 'disable',
            mode: mode 
        });

        document.querySelectorAll('.mode-option').forEach(el => {
            el.classList.toggle('active', el.dataset.mode === mode);
        });
    }

    // Initialize mode selector
    chrome.storage.local.get(['mode'], function(result) {
        updateMode(result.mode || 'blur');
    });

    // Update stats every 5 seconds
    updateStats();
    setInterval(updateStats, 5000);
});
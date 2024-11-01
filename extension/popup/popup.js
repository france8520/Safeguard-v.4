document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggleFilter');
    
    // Make button click more responsive
    toggleButton.addEventListener('click', function() {
        chrome.storage.local.get(['enabled'], function(result) {
            const newState = !result.enabled;
            chrome.storage.local.set({ enabled: newState }, function() {
                toggleButton.textContent = newState ? 'Disable Filter' : 'Enable Filter';
                // Force refresh current tab
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.reload(tabs[0].id);
                });
            });
        });
    });

    // Set initial button state
    chrome.storage.local.get(['enabled'], function(result) {
        toggleButton.textContent = result.enabled ? 'Disable Filter' : 'Enable Filter';
    });
});
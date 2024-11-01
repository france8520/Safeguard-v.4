document.addEventListener('DOMContentLoaded', function() {
    const selector = document.querySelector('.mode-selector');
    const needle = document.querySelector('.selector-needle');
    let currentMode = 'blur';

    selector.addEventListener('click', function(e) {
        const rect = selector.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate angle and set mode
        const angle = Math.atan2(x - rect.width/2, rect.height - y) * 180/Math.PI;
        
        if (angle < -60) {
            currentMode = 'disable';
            needle.style.transform = 'rotate(-75deg)';
        } else if (angle > 60) {
            currentMode = 'blur';
            needle.style.transform = 'rotate(75deg)';
        } else {
            currentMode = 'change';
            needle.style.transform = 'rotate(0deg)';
        }

        chrome.storage.local.set({ 
            enabled: currentMode !== 'disable',
            mode: currentMode 
        });

        chrome.tabs.reload();
    });

    // Set initial position
    chrome.storage.local.get(['mode'], function(result) {
        currentMode = result.mode || 'blur';
        switch(currentMode) {
            case 'disable': needle.style.transform = 'rotate(-75deg)'; break;
            case 'change': needle.style.transform = 'rotate(0deg)'; break;
            case 'blur': needle.style.transform = 'rotate(75deg)'; break;
        }
    });
});
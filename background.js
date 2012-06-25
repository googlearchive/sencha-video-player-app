chrome.experimental.app.onLaunched.addListener(function() { 
    chrome.appWindow.create("index.html", {
        width: 1000, 
        height: 700
    });
});
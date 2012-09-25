chrome.app.runtime.onLaunched.addListener(function(launchData) {
    var opt = {
        width: 1000,
        height: 700
    };

    chrome.app.window.create('index.html', opt, function (win) {
        win.launchData = launchData;
    });

});

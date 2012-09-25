# Take media assets offline

## 1. Requirements

To store assets locally we use helper library filer.js . Its a library written by Eric Bidelman and is available [here](http://ericbidelman.tumblr.com/post/14866798359/introducing-filer-js).

Information on different available storage options and directives could be found in [Managing HTML5 Offline Storage](https://developers.google.com/chrome/whitepapers/storage) section of Google Chrome docuemntation.

By default Chrome allows just 5Mb to be stored locally, but as even single audio file could be more than this, we should as permission to store unlimited data. This can be done by setting permission property 'unlimitedStorage' inside manifest.json

    "permissions": [
            "http://*/*",
            "unlimitedStorage"
        ]

## 2. Workflow

As most of 'hard' work is done inside filer.js library, sample workflow is straightforward.

When user select files and initiates 'Take offline' action we send message to parent frame with a key 'download-media'. This will call downloadMedia() function for initialtin the download process.

To abstract download process we have utility method DownloadProcess with methods run and cancel. We inform controller, with message 'download-progresss', so it can update views and progeress.

To get data from Media server we create new xhr request, and wait for completion status, which will initiate onload callback. Inside that callback then we check the received content and using filer.js method save(), saving data locally.

For detailed implementation please check the following main files:

 - index.js
 - app/controller/MediaExplorer.js
 - app/controller/MediaServers.js



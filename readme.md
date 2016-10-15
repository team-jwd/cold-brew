# My Awesome API

This file file serves as your book's preface, a great place to describe your book's content and ideas.

---

## Install

```bash
npm install --save cold-brew
```

---

## Require
```javascript
const coldBrewRTC = require('cold-brew/rtc');
```

---

## Modify

Your normal webRTC Peer Connection should look something like this.

```javascript
const peerConnection = new RTCPeerConnection(
      servers,
      [configuration]
);
```


In order to make our library work you will have to change that RTC peer connection to coldBrewRTC. Everything works the same, but we are putting a wrapper around your peer Connection object in order to monitor the events that occur.

```javascript
const peerConnection = coldBrewRTC(
      servers,
      [configuration]
);
```

Now you're ready to get testing!

---
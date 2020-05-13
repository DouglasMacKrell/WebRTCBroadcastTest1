// The only difference between Broadcast.js and Watch.js is 
// that Watch opens only ONE peer connection
// to the current broadcaster - and that connection receives the video
// instead of streaming it.

let peerConnection;
const config = {
    iceServers: [
        {
            urls: ["stun:stun.l.google.com:19302"]
        }
    ]
};

const socket = io.connect(window.location.origin);
const video = document.querySelector("video");

socket.on("offer", (id, description) => {
    peerConnection = new RTCPeerConnection(config);
    peerConnection
        .setRemoteDescription(description)
        // we call the createAnswer() function to send back a connection
        // answer to the request of the broadcaster.
        .then(() => peerConnection.createAnswer())
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
            socket.emit("answer", id, peerConnection.localDescription);
        });
    // After the connection is established we can continue by getting
    // the video stream using the ontrack event listener of the
    // peerConnection object.
    peerConnection.ontrack = event => {
        video.srcObject = event.streams[0];
    };
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("candidate", id, event.candidate);
        }
    };
});

socket.on("candidate", (id, candidate) => {
    peerConnection
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch(e => console.error(e));
});

socket.on("connect", () => {
    socket.emit("watcher");
});

socket.on("broadcaster", () => {
    socket.emit("watcher");
});

socket.on("disconnectPeer", () => {
    peerConnection.close();
});

window.onunload = window.onbeforeunload = () => {
    socket.close();
};
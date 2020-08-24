const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {
  host: "/",
  port: "3001",
});
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};

let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      console.log("Receiving");
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      setTimeout(() => {
        connectToNewUser(userId, stream);
      }, 1000);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    console.log("calling");
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

// ! messages

let text = $("input");

$("html").keydown((e) => {
  if (e.which == 13 && text.val().length !== 0) {
    socket.emit("message", text.val());
    text.val("");
  }
});

socket.on("createMessage", (message) => {
  $("ul").append(`<li class="message"><b>user</b><br/>${message}</li>`);
  scrollToBottom();
});

const scrollToBottom = () => {
  let chatWindow = $(".chatWindow");
  chatWindow.scrollTop(chatWindow.prop("scrollHeight"));
};

// ! mute/ stop

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setMuteButton = () => {
  // console.log("mute");
  const html = `<i class="fas fa-microphone"></i>
                <span>Mute</span>`;
  document.querySelector(".muteBtn").innerHTML = html;
};

const setUnmuteButton = () => {
  // console.log("unmute");
  const html = `<i class="unmute fas fa-microphone-slash"></i>
                <span>Unmute</span>`;
  document.querySelector(".muteBtn").innerHTML = html;
};

// !start stop video

const startStop = () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setStartButton();
  } else {
    setStopButton();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const setStartButton = () => {
  // console.log("mute");
  const html = `<i class="stop fas fa-video-slash"></i>
                <span>Play Video</span>`;
  document.querySelector(".videoBtn").innerHTML = html;
};

const setStopButton = () => {
  // console.log("unmute");
  const html = `<i class="fas fa-video"></i>
                <span>Stop Video</span>`;
  document.querySelector(".videoBtn").innerHTML = html;
};

const disconnect = () => {
  window.close();
};

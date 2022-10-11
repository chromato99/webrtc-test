let socket = io("/", {
  transports: ["websocket"]
});

let videoGrid = document.getElementById("video-grid");
let myVideo = document.createElement("video");
let chatForm = document.getElementById('chatForm');
myVideo.muted = true;

let username = prompt('Enter username', Math.random());
let peer = new Peer();
let conns = new Array(); // 동접한 사람의 data channel
let calls = new Array();

let myVideoStream;
let myPeerId;

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
        calls.push({
          cal : call,
          video: video
        }); // 전화 받은 클라이언트
      });
    });

    socket.on("user-connected", (peerId) => {
      connectToNewUser(peerId, stream); // 전화를 주는 클라이언트
    });
  });

peer.on("open", (peerId) => {
  socket.emit("join-room", roomname, peerId, username);
  myPeerId = peerId;

});

socket.on("user has left",(disPeerId)=> {

  for (const key of conns.keys()) {
    if(conns[key].peer === disPeerId){
      var removedConn = conns.splice(key, 1);
      //console.log(removedConn)
      removedConn.close();

    }

  }

  for (const key of calls.keys()) {
    console.log(calls)
    if(calls[key].cal.peer === disPeerId){
      var removedCall = calls.splice(key, 1);
      console.log(removedCall)
      removedCall.cal.close();

      console.log(removedCall.video)
      removedCall.video.remove();
    }
  }
// TODO : 유저가 다 나간후 RoomList 제거

  // conns = conns.filter((element) => element !== disPeerId);
  // calls = calls.filter((element) => element !== disPeerId);


});


peer.on('connection', function (conn) {
  conn.on('open', () => {
    conn.on('data', (data) => {
      console.log("Datachannel Received");
      var chatArea = document.getElementById('chatArea');
      chatArea.append("\n" + data.username + " : " + data.msg);
      document.getElementById("chatArea").scrollTop = document.getElementById("chatArea").scrollHeight;
    });
    conns.push(conn);
  })
});

const connectToNewUser = (peerId, stream) => {
  const call = peer.call(peerId, stream);
  const conn = peer.connect(peerId);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  calls.push({
    cal: call,
    video: video
  });
  console.log(video)
  conn.on('open', () => {
    console.log("DataChannel connected");
    conn.on('data', (data) => {
      var chatArea = document.getElementById('chatArea');
      chatArea.append("\n" + data.username + " : " + data.msg);
      document.getElementById("chatArea").scrollTop = document.getElementById("chatArea").scrollHeight;
    });
    
    conns.push(conn);
  })

};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
    // video.remove();
  });
};

// Chat send button onclicked
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  var chatInput = document.getElementById('chatInput');
  var chatArea = document.getElementById('chatArea');
  chatArea.append("\n" + username + " : " + chatInput.value);
  document.getElementById("chatArea").scrollTop = document.getElementById("chatArea").scrollHeight;

  conns.forEach((conn) => {
    conn.send({
        username: username,
        msg: chatInput.value,
    });
  })

  chatInput.value = "";
});
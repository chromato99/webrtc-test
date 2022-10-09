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
        calls.push(call); // 전화 받은 클라이언트 
      });
    });

    socket.on("user-connected", (peerId) => {
      connectToNewUser(peerId, stream); // 전화를 주는 클라이언트
    });
  });

peer.on("open", (peerId) => {
  socket.emit("join-room", roomname, peerId, username);
  myPeerId = peerId;
  socket.on("user has left",(socketId)=> {
      socket.emit("peerid for user has left", myPeerId);
      
  });
  socket.on("disconnect with this peerid", (peerId)=>{
      if(myPeerId !== peerId){
          conns = conns.filter((element) => element !== peerId);
          calls = calls.filter((element) => element !== peerId);
      }
  })
});


peer.on('connection', function (conn) {
  conn.on('open', () => {
    conn.on('data', (data) => {
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
  calls.push(call);
  conn.on('open', () => {
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
  });
};

// Chat send button onclicked
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  var chatInput = document.getElementById('chatInput');

  conns.forEach((conn) => {
    conn.on('open', () => {
        conn.send({
            username: username,
            msg: chatInput,
        });
    })
  })

  chatInput.value = "";
});
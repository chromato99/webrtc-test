let express = require('express'); // 웹서버 구축
let app = express();
let port = 8006;

let server = require('http').createServer(app); 
var compression = require('compression')

let io = require('socket.io')(server); // 임포트
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

let roomList = new Array();

app.set('view engine', 'ejs'); // Set render engine mode to ejs
app.set('views', __dirname + '/views'); // Specify the folder where ejs is located

app.use(compression());
app.use(express.static('public')); // Set static file location

app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.render('index', {roomList: roomList});
});

app.get('/room/:roomname', (req, res) => {
  roomList.forEach((elem) => {
      if(elem.name == req.params.roomname) { // If already exist
        res.render('room', {roomname: elem.name});
      }
  });
  roomList[0]
  let room = { // Create new room data
      name: req.body.roomname,
  };
  roomList.push(room);
  res.render('room', {roomname: room.name});
});

io.on('connection', (socket) => {
  socket.on('join-room', (roomname, peerId, username) => {
    socket.join(roomname);
    socket.to(roomname).emit("user-connected", peerId);
    
  });
  socket.on("disconnect", (reason) => {
     for (const room of socket.rooms){ // 소켓이 속한 룸의 정보
         if (room !== socket.id){
             socket.to(room).emit("user has left", socket.id);
             socket.on("peerid for user has left", (peerid)=>{
                socket.to(room).emit("disconnect with this peerid", peerid)
             })
         }
     }
    });
});

server.listen(port, function () { // Open server
  console.log(`Listening on https://localhost:${port}/`);
});


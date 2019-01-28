// Imports
let express = require("express");
let app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');


app.use(express.static(__dirname + '/front'));

app.get('/', function (req, res) {
  res.sendFile('index.html', { root: path.join(__dirname) });
});

let gridGame = null;
let numberOfFood =15;
let users = [];
let numberOfLines = 50;
let numberOfColumns = 100;

let isPlaying = false;

io.on('connection', function (socket) {

  socket.on('user-login', function (name) {
    socket.score = 0;
    socket.name = name;
    socket.color = getRandomColor();
    io.emit('updateGame', addNewPlayer(socket.color));

    users.push({ name: name, color: socket.color, score: 0 });
    io.emit('updateScore', users);

    let userMessage = {
      text: 'You are connected as ' + name,
      type: 'login'
    }
    socket.emit('user-message', userMessage);

    let broadcastMessage = {
      text: 'The user ' + name + ' is now connected',
      type: 'login'
    }

    socket.broadcast.emit('user-message', broadcastMessage);

  });

  socket.on('disconnect', function () {

    for (i=0; i<users.length;i++){
      if(users[i].name == socket.name) {
        users.splice(i,1);
      }
    }

    console.log(users)

    let userDisconnectMessage = {
      text: socket.name + ' leaves the game '
    };

    socket.broadcast.emit('user-message', userDisconnectMessage);

    if( isPlaying ) {
      console.log('eh')
      io.emit('updateGame', removePlayer(socket.color));
      io.emit('updateScore', users);
    }
    
  });



  socket.on('move', direction => {
    io.emit('updateGame', moveUser(socket, direction));
    if (numberOfFood == 0) {
      finishGame();
      isPlaying=false;
    }
  })

});

function initGame() {

  let grid = [];
  for (i = 0; i < numberOfColumns; i++) {
    grid[i] = [];
    for (j = 0; j < numberOfLines; j++) {
      grid[i][j] = -1;
    }
  }

  for (i = 0; i < numberOfFood; i++) {
    grid[Math.floor(Math.random() * numberOfColumns)][Math.floor(Math.random() * numberOfLines)] = "f";
  }

  return grid;
}

function addNewPlayer(color) {
  let isAdded = false;
  while (!isAdded) {

    let i = Math.floor(Math.random() * numberOfColumns);
    let j = Math.floor(Math.random() * numberOfLines);

    if (gridGame[i][j] == -1) {
      gridGame[i][j] = color;
      isAdded = true;
      return gridGame;
    }
  }

}

function removePlayer(color) {
  for (i = 0; i < numberOfColumns; i++) {
    for (j = 0; j < numberOfLines; j++) {
      if (gridGame[i][j] == color) {
        gridGame[i][j] = -1;
        return gridGame;
      }
    }
  }
  return gridGame;
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function moveUser(socket, direction) {

  for (i = 0; i < numberOfColumns; i++) {
    for (j = 0; j < numberOfLines; j++) {
      if (gridGame[i][j] == socket.color) {
        let oldValue;
        let newI;
        let newJ;
        switch (direction) {
          case 'up':
            newI = i;
            newJ = j - 1;
            break;
          case 'down':
            newI = i;
            newJ = j + 1;
            break;
          case 'right':
            newI = i + 1;
            newJ = j;
            break;
          case 'left':
            newI = i - 1;
            newJ = j;
            break;
        }

        if (isPossibleToMove(newI, newJ)) {
          oldValue = gridGame[newI][newJ];
          gridGame[i][j] = -1;
          gridGame[newI][newJ] = socket.color;
          if (oldValue == 'f') {
            addOnePoint(socket);
            numberOfFood--;
          }
        }
        return gridGame;
      }
    }
  }
}

function addOnePoint(socket) {
  for (i = 0; i < users.length; i++) {
    if (users[i].name == socket.name) {
      users[i].score += 1;
      io.emit('updateScore', users);
    }
  }
}
function isPossibleToMove(i, j) {
  return i >= 0 && i < numberOfColumns && j >= 0 && j < numberOfLines && (gridGame[i][j] == 'f' || gridGame[i][j] == -1);
}

function finishGame() {
  for(i= 0 ; i< users.length; i++){ 
        for(var j=i+1; j< users.length; j++){
               if(users[j].score > users[i].score){
                   var temp = users[j];
                   users[j]=users[i];
                   users[i]=temp;
                }
        }
    }
  io.emit('finishGame', users);
  setTimeout(() => {
    numberOfFood = 15;
    gridGame = initGame();
    isPlaying = true;
  
    for (i=0; i<users.length; i++) {
      users[i].score = 0;
      io.emit('updateGame', addNewPlayer(users[i].color))
    }
    io.emit('updateScore', users);
  }, 3000);
  
}

http.listen(80, function () {
  console.log('listening on *:80');
  gridGame = initGame();
  isPlaying = true;
});

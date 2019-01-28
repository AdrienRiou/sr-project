
var socket = io();
var canvas = document.getElementById('gameCanvas');
canvas.width = 1000;
canvas.height = 500;
var ctx = canvas.getContext("2d");

let numberOfColumns = 100;
let numberOfLines = 50;


$('form').submit(function () {
    let inputName = $('#nameUser').val()
    if(inputName != '') {
        socket.emit('user-login', inputName);
        login();
    }
    $('#nameUser').val('');
    return false;
});

socket.on('user-message', function (message) {
    console.log(message)
    $('#user-message').text(message.text);
})

socket.on('updateGame', (grid) => {
    for (i = 0; i < numberOfColumns; i++) {
        for (j = 0; j < numberOfLines; j++) {

            switch (grid[i][j]) {
                case -1:
                    ctx.fillStyle = "white";
                    ctx.fillRect(i * 10, j * 10, 10, 10)
                    break;
                case 'f':
                    ctx.fillStyle = "blue";
                    ctx.fillRect(i * 10, j * 10, 10, 10);
                    break;
                default:
                    ctx.fillStyle = grid[i][j];
                    ctx.fillRect(i * 10, j * 10, 10, 10);


            }
        }
    }
})

socket.on('score', (data) => {
    let newDiv = document.createElement('div');
    newDiv.setAttribute('id', data.name);
    newDiv.append(data.name + ' = ' + data.score);
    document.getElementById('scores').append(newDiv)
})
socket.on('updateScore', (users) => {
    $('#messages').text('Total of connected users : ' + users.length);

    document.getElementById('scores').innerHTML = "Scores";
    for (i = 0; i < users.length; i++) {
        let newDiv = document.createElement('div');
        newDiv.setAttribute('id', users[i].name);
        newDiv.style.color = users[i].color;
        newDiv.append(users[i].name + ' = ' + users[i].score);
        document.getElementById('scores').append(newDiv)
    }
})

socket.on('finishGame', users => {
    document.getElementById('scores').innerHTML = users[0].name + ' won ! <br>'; 
    document.getElementById('scores').innerHTML += 'Please wait, a new game will begin.. '; 

}) 


function login() {
    document.getElementById('loginForm').style.display = "none";
    document.getElementById('user-message').style.display = "block";
    document.getElementById('Game').style.display = "block";
}

window.addEventListener("keydown", function (event) {

    switch (event.keyCode) {
        case 37:
            // Handle "left"
            socket.emit('move', 'left');
            break;
        case 38:
            // Handle "up"
            socket.emit('move', 'up');
            break;
        case 39:
            // Handle "right"
            socket.emit('move', 'right');
            break;
        case 40:
            // Handle "down"
            socket.emit('move', 'down');
            break;
    }

});


var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var events = require('events');
var eventEmitter = new events.EventEmitter();
var path = require('path');
var sockets = [];

app.set('view engine', 'jade');
// Make assets accessible for the browser
app.use(express.static(path.join(__dirname, 'public')));

var Game = require('./game.js');
var Player = require('./player.js');
var GameManager =  new Game(eventEmitter);

var nextUserId = 1;

var timerWaitForPlayers = null;
// Timeout in ms
var timeoutTime = 30000;


function getGameData(){

    var data = {
        playerCount: GameManager.getPlayerCount(),
        players: GameManager.getPlayers()
    }

    return data;
}

function checkStartGame(){

    var playerCount = GameManager.getPlayerCount();

    // You need atleast 2 players to start the game
    if( playerCount < 2){
        console.log("Not enough players to start the game");
        return false;
    }

    // Count the amount of players that are ready
    var readyPlayers = 0;
    var players =  GameManager.getPlayers();

    for( var i = 0; i < players.length; i++){
        if(players[i].isReady()) {
            readyPlayers++;
        }
    }

    // Check if all players are ready
    if( readyPlayers < playerCount){
        console.log("Waiting for all players to ready");
        return false;
    }

    // Yeah start the game! Let's go Whoo!
    GameManager.start();
    io.sockets.emit('startGame');

}

// Entry point
app.get('/', function (req, res){
    // Return the page
    var data = getGameData();
    res.render('index', data);
});



io.on('connection', function(socket) {

    sockets.push(socket);

    // New player connects to server
    if( !GameManager.isStarted() ){
        // If game isn't started prompt the user to choose a nickname
        socket.emit('chooseNickname');
    }
    else{
        // Let the user know that the game already started
        socket.emit('lateJoin');
    }


    // What happens when the player has chosen a nickname
    socket.on('register', function(name){

        if( typeof socket.player != "undefined" || GameManager.isStarted() )
            return false;

        // Create new player instance
        socket.player = new Player(nextUserId, name, socket.id);

        // Add player to the Game
        GameManager.addPlayer(socket.player);

        console.log(socket.player);
        console.log( name + " joined the game");

        // Make sure that the next player gets a diffrent id
        nextUserId++;
        return eventEmitter.emit('registerd');
    });

    // User closed the browser
    socket.on('disconnect', function(){

        // If a guest leaves, don't do anything
        if(typeof socket.player == "undefined")
            return false;

        console.log(socket.player._nickname + ' left the game');
        GameManager.removePlayer( socket.player._id);
        return eventEmitter.emit('playerLeft');
    });

    socket.on('ready', function(){
        // If a guest leaves, don't do anything
        if(typeof socket.player == "undefined")
            return false;

        if( !socket.player.isReady()) {
            socket.player.ready();
        }
        var data = getGameData();
        io.sockets.emit('playerReady', data);

        checkStartGame();
    });


    socket.on('unready', function(){
        // If a guest leaves, don't do anything
        if(typeof socket.player == "undefined")
            return false;

        if( socket.player.isReady()) {
            socket.player.unReady();
        }

        var data = getGameData();
        io.sockets.emit('playerUnReady', data);
    });

    socket.on('askCards', function(){
        if(typeof socket.player == "undefined" || !GameManager.isStarted())
            return false;

        console.log("CLIENT "+socket.player._nickname + " IS ASKING FOR CARDS");

        dealCardsHandler(socket);
    });

    socket.on('gotHand', function(){

        if(typeof socket.player == "undefined" || !GameManager.isStarted())
            return false;



        socket.player._inGame = true;

        // Count ready players
        var players = GameManager.getPlayers();
        var readyPlayers = 0;
        for( var i = 0; i < players.length; i++){
            if( players[i]._inGame){
                readyPlayers++;
            }
        }



        if( readyPlayers == players.length){
            console.log('All players are ready to begin');

            // Kill timeout function that kicks all inactive players
            clearTimeout(timerWaitForPlayers);

            // If conditions to end the game aren't met, give the first player the turn
            if( !checkEndGame() ){
                firstPlayerTurn();
            }

        }
        else{
            console.log(readyPlayers+' out of '+ players.length + ' players are ready');
            console.log('wait for other players..');
        }

    });

    socket.on('move', function(card){
        console.log('new move');
        if(typeof socket.player == "undefined" || !GameManager.isStarted())
            return false;

        if( !GameManager.move(socket.player, card) ){
            socket.emit('falseMove', card);
            return false;
        }


        socket.broadcast.emit('placed', card);

        if( GameManager.allDone() ){
            // todo: End game
            var playerList = GameManager._playersDone;
            playerList.push( GameManager.getLoser() );

            GameManager.stop();
            io.sockets.emit('stopped', {reason:2, playerList: playerList});
            return false
        }

        GameManager.nextTurn();
        return true;

    });

    socket.on('takeCard', function(){
        var cards = GameManager.takeCards(socket.player, 1);
        if( cards != false) {
            GameManager.nextTurn();
            socket.emit('takenCards', cards);
        }
    });


});



// Let the client know that a player has left the game
function playerLeftHandler(){
    var data = getGameData();
    //eventEmitter.removeListener('playerLeft', playerLeftHandler);
    io.sockets.emit('playerLeft', data);
}

// Once all the players receive cards, the server must know
// When it's time to give the first player the turn
// So we wait until all players are ready
function waitForPlayersToStartGame (){

   timerWaitForPlayers = setTimeout(
       function() {
           var players = GameManager.getPlayers();

           for( var i = 0; i < players.length; i++){
               if( !players[i]._inGame){
                   var playerName = players[i]._nickname;
                   var socketId = players[i]._socketid;
                   GameManager.kickPlayerByIndex(i);
                   console.log("Kicked player "+ playerName + " for being inactive");

                   var socketPlayer = io.sockets.connected[socketId];
                   socketPlayer.emit('kicked');
                   // Disconnect the player from the server
                   socketPlayer.disconnect();
               }
           }
           // If conditions to end the game aren't met, give the first player the turn
           if( !checkEndGame() ){
               firstPlayerTurn();
           }
       },
   timeoutTime);

}

// Check if conditions to end the game are met
function checkEndGame(){

    // Check if we still have enough players in the game
    var players = GameManager.getPlayers();

    if( players.length < 2){
        notEnoughPlayers();
        return true;
    }


    return false;
}

eventEmitter.on('playerLeft', playerLeftHandler);
eventEmitter.on('waitForPlayers', waitForPlayersToStartGame);

// Let the client know that a new player joined the game
eventEmitter.on('registerd', function(){

    var data = getGameData();
    io.sockets.emit ('newPlayer', data);

});

eventEmitter.on('nextTurn', function(player){

    var socket = getSocket(player._socketid);
    ///console.log(socket);
    // Tell the players its his turn
    socket.emit('giveTurn');

    // Tell all the others that it's players turn
    socket.broadcast.emit('newTurn', player);

});

eventEmitter.on('reshuffle', function(lastCard){
    io.sockets.emit('reshuffle', lastCard);
});

eventEmitter.on('noCardsLeft', function(){
    io.sockets.emit('noCardsLeft');
});

eventEmitter.on('deckEmpty', function(){
    io.sockets.emit('noCardsLeft');
});
//eventEmitter.on('dealCards', dealCardsHandler);
//
function dealCardsHandler(socket){

    var players = GameManager.getPlayers();
    var socketPlayer = socket.player;


    for( var i = 0; i < players.length; i++){
        var player = players[i];
        if(socketPlayer._socketid == player._socketid) {

            console.log('Give hand to ' + player._nickname);
            var hand = player.getHand();
            io.sockets.connected[player._socketid].emit('giveHand', hand);

        }
    }


    //for (var client in clients) {
    //    console.log(client);
    //    // Check is important, because the object has also prototype properties
    //    if (clients.hasOwnProperty(client)) {
    //
    //        console.log(client.player);
    //
    //
    //        console.log('Give hand to '+ client.player._nickname);
    //        var hand = client.player.getHand();
    //        //client.emit('giveHand', hand);
    //    }
    //}
    //io.sockets.emit('giveHand', clients);
    //console.log(clients.connected.player);
    //for( var i = 0; i < clients.length; i++){
    //    var client = clients[i];
    //    console.log('Give hand to '+ client.player._nickname);
    //    var hand = client.player.getHand();
    //    socket.emit('giveHand', hand);
    //}
}

function getSocket(id){
    for(var i = 0; i < sockets.length; i++){
        if (id == sockets[i].id){
            return sockets[i];
        }
    }
}

// Not enough players to play the game
function notEnoughPlayers(){
    GameManager.stop();

    var data = {
      reason: 1
    };
    console.log('Game has been ended because there are not enough players.')
    io.sockets.emit('stopped', data);
}

function firstPlayerTurn(){
    // Give first turn to a random player
    GameManager.firstTurn();
}
// Start the server
http.listen(3000, function(){
    console.log('listening on *:3000');
});


// Start the game
/*GameManager.addPlayer("Dmitri");
GameManager.addPlayer("Adam");
GameManager.start();
*/

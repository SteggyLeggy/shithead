var lobbyState = {
    create: function(){

        // Add background
        game.add.sprite( 0, 0, 'backgroundLobby');

        music = game.add.audio('lobbyMusic');
        music.loop = true;
        music.play();

    },

    startGame: function(){
        //console.log("LOBBY TRIGGER START GAME");
        game.state.start('play');
    }
};
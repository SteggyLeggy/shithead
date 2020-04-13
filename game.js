var DeckBuilder = require('./deckBuilder.js');
var Deck = require('./deck.js');
var rules = require('./public/js/rules.js');
const { HandType } = require('./player.js');

var Game = function(eventEmitter) {
  this._eventEmitter = eventEmitter;
  // The amount of cards that the dealer gives each player at the start
  this._initialCardCount = 3;

  // The current game state
  this._started = false;
  this._players = [];
  this._playersDone = [];
  this._deck = null;
  this._deckBuilder = new DeckBuilder();
  this._discardPile = [];
  this._currentTurn = null;
  this._rotationReversed = false;
  this._nominateRound = true;

  // End turn after placing card (modified by special effect)
  this._endTurn = true;

  // Check if jack card effect is active
  this._jackActive = false;

  // The suit that is chosen by player with Jack Effect
  this._jackSuit = null;

   // The amount of cards a player must take (triggerd by special effect card)
  this._debt = 0;
}

Game.prototype.addPlayer = function(player){
    this._players.push(player);
}

Game.prototype.start = function() {
    console.log("Game has been started");
    this._started = true;
    this.createDeck();
    // Wait for all players to be ready
    this._eventEmitter.emit('waitForPlayers');

};

// Create new Deck
Game.prototype.createDeck = function() {

    this._deckBuilder.setPlayerCount(this._players.length);
    var cards = this._deckBuilder.build();

    this._deck = new Deck(cards, this._eventEmitter);

    this.shuffleCards();
    this.dealCards();

}

Game.prototype.shuffleCards = function(){
    this._deck.shuffle();
}

// Deal cards to all players
Game.prototype.dealCards = function(){
    for (let type of Object.values(HandType)) {
        for( var i = 0; i < this._initialCardCount; i++ ){
            for( var j = 0; j < this._players.length; j++ ){
                let player = this._players[j];
                let card = this._deck.take(1);
                if (player._shithead == false && type == HandType.TABLE){
                    player.give(card, HandType.NORMAL);
                } else {
                    player.give(card, type);
                }
                console.log("Dealt card " + card + " with type " + type + " to player " + this._players[j]._nickname);
            }
        }
    }

    //return this._eventEmitter.emit('dealCards');
}

Game.prototype.removePlayer = function(playerId){

    var cards = null;
    for( var i = 0; i < this._players.length; i++){

        if( this._players[i].getId() == playerId ){
            // Remove the cards from
            cards = this._players[i].getAllCards();
            this._players[i].removeCards();
            this._players.splice(i, 1);
        }
    }

    if( cards != null)
        this._deck.returnCards(cards);
}
Game.prototype.getPlayerCount = function(){
    return this._players.length;
}

Game.prototype.getPlayers = function(){
    return this._players;
}

// Get all that about the players without giving away too much info for the client side
Game.prototype.getPlayersClientSide = function(){
    var players = [];

    for( var i = 0; i < this._players.length; i++){

        var player = {
            nickname: this._players[i]._nickname,
            handCount: this._players[i].getHand(HandType.NORMAL).length,
            blindCount: this._players[i].getHand(HandType.BLIND).length,
            tableCards: this._players[i].getHand(HandType.TABLE),
            onTurn: (i == this._currentTurn),
            ready: this._players[i]._ready
        };

        players.push(player);
    }

    return players;
}

Game.prototype.getPlayerById = function(playerId) {
    for( var i = 0; i < this._players.length; i++){
        if( this._players[i].getId() == playerId ){
            return this._players[i]
        }
    }
}

Game.prototype.nominateTableCards = function(player, tableCards) {
    let result = true;
    for (let card of tableCards) {
        result = player.moveCard(card, HandType.NORMAL, HandType.TABLE);
        if (result === false)
        {
            return result
        }
    }
    return result
}

Game.prototype.isStarted = function(){
    return this._started;
}

Game.prototype.nextTurn = function(){

    if( !this._endTurn )
        return false;

    this.setNextTurn();

    this._eventEmitter.emit('nextTurn', this._players[this._currentTurn]);
    return true;
}

Game.prototype.kickPlayerByIndex = function(index){
    if( typeof this._players[index] == "undefined")
        return false;
    this._players.splice(index, 1);
}

Game.prototype.stop = function(){
    // Reset all vars
    this._started = false;
    this._players = [];
    this._playersDone = [];
    this._deck = null;
    this._currentTurn = null;
    this._rotationReversed = false;
    this._endTurn = true;
    this._jackActive = false;
    this._jackSuit = null;
    this._debt = 0;
}

Game.prototype.firstTurn = function(){
    let lowestCard;
    let lowestPlayer;
    for (let player of this._players) {
        for (let card of player.getHand(HandType.NORMAL)) {
            if (card.isSpecial()) {
                continue;
            }
            if (lowestCard === undefined || (card._value < lowestCard._value)) {
                lowestCard = card;
                lowestPlayer = player;
            }
        }
    }

    console.log("Making first move with " + lowestPlayer.getNickname() + " with card " + lowestCard.toString())
    this._currentTurn = this._players.indexOf(lowestPlayer)
    this.move(lowestPlayer, [lowestCard])
}

Game.prototype.move = function(player, cards){

    if (cards === undefined || cards.length === 0){
        console.log(player._nickname + " didn't send any cards to play");
        return false;
    }

    // User actually has the card
    var playerHasCards = player.hasCards(cards);

    if( !playerHasCards ){
        console.log(player._nickname + " tried to place a cards he/she does not have");
        return false;
    }

    // cards should all be the same value
    let checkCard;
    for (let card of cards) {
        if (checkCard !== undefined) {
            if (checkCard._value != card._value){
                console.log(player.getNickname() + " tried to play cards of different values");
                return false;
            }
        }
        checkCard = card;
    }

    let lastGraveyardCards = this._deck.getLastCardsOfValue(checkCard._value);
    if (lastGraveyardCards.length + cards.length > 4){
        console.log(player.getNickname() + " tried to play move than 4 of the same type");
        return false
    } else if(lastGraveyardCards.length + cards.length === 4) {
        player.takeCards(cards);
        this._deck.placeCards(cards);
        self._deck.burnCards();
    }

    if (!checkCard.isWild()){
        let currentCard = this._deck.getLastVisibleCard();

        if (currentCard) {
            if (currentCard.getSpecial() != "LOWER"){
                if (checkCard._value < currentCard._value){
                    console.log(player.getNickname() + " tried to play too LOW a card");
                    return false;
                }
            } else {
                if (checkCard._value > currentCard._value){
                    console.log(player.getNickname() + " tried to play too HIGH a card");
                    return false;
                }
            }
        }
    }

    // Take the card from the player
    player.takeCards(cards);

    // Place card in the deck
    this._deck.placeCards(cards);

    if (this._deck.canTake()) {
        player.give(this._deck.take(cards.length), HandType.NORMAL);
    }

    this.checkDone(player);

    this.triggerSpecialEffect(checkCard, cards.length, player);

    this.nextTurn();

    return true;
}

Game.prototype.shop = function(player) {
    let graveYard = this._deck.getAndEmptyGraveyard();
    for (let card of graveYard) {
        player.give(card);
    }
    this.nextTurn();
    return true;
}

// Get the only player that is not finished
Game.prototype.getLoser = function(){

    for( var i = 0; i < this._players.length; i++){
        if( !this._players[i]._done){
            return this._players[i];
        }
    }
}

Game.prototype.checkDone = function(player){
    if(player.checkDone() ){
        this._playersDone.push(player);
    }
}
Game.prototype.allDone = function(){
    var notDone = 0;

    for( var i = 0; i < this._players.length; i++){
        if( !this._players[i]._done){
            notDone++;
        }
    }

    // There are still more than one players who are not finished yet
    if( notDone > 1){
        return false;
    }

    return true;

}

Game.prototype.takeCards = function(player, amount) {
    this._endTurn = true;
    var cards = this._deck.take(amount);

    if( !cards){
        this._eventEmitter.emit('noCardsLeft', player);
        return false;
    }

    player.give(cards);

    console.log( player._nickname + " has taken "+cards.length + " cards");
    return cards;
}

Game.prototype.skipTurn = function(player){

    // Check if the player currently on turn is actually existing
    if( typeof this._players[ this._currentTurn ] == "undefined"){
        return false;
    }

    var currentTurnPlayer = this._players[ this._currentTurn ];
    // Verify that the current socket is the actual player that is on turn
    if( currentTurnPlayer._socketid != player._socketid){
        return false;
    }
    // The player may only skip a turn if the deck is empty
    if( !this._deck.isEmpty()){
        return false;
    }
    // Can't skip turn with debt!
    if( this._debt > 0){
        return false;
    }

    this.nextTurn();
}

Game.prototype.triggerSpecialEffect = function(card, count, player){
    if (card.isSpecial()) {
        var special = card.getSpecial()
        switch (special){
            case "SKIP":
                for (let x = 0; x < count; x++){
                    this.setNextTurn();
                }
                break;
            case "BURN":
                this._deck.burnCards();
                break;
            case "REVERSE":
                this.flipRotation();
                break;
        }
    }
}

Game.prototype.messageNextPlayer = function(event, data){
    var nextTurnIndex = this.getNextTurn();
    var nextPlayer = this._players[nextTurnIndex];

    this._eventEmitter.emit('messageNextPlayer', {
        event: event,
        nextPlayer: nextPlayer,
        data: data
    });
    return true;
}

Game.prototype.payDebt = function(player){
    var cards = this.takeCards(player, this._debt);
    console.log(player._nickname + " paid his debt of "+ this._debt + " cards");

    // Reset debt
    this._debt = 0;

    return cards;
}

 Game.prototype.flipRotation = function(){
     if( this._rotationReversed ){
         this._rotationReversed = false;
         return false;
     }
     this._rotationReversed = true;
 }

Game.prototype.setNextTurn = function(){

    if( this._currentTurn == null){
        this._currentTurn = 0;
        return false;
    }
    var next = this.getNextTurn();
    this._currentTurn = next;
}

Game.prototype.getNextTurn = function(){
    var next = this.getNextPlayer(this._currentTurn);

    if( typeof this._players[next] == "undefined"){
        return false;
    }

    return next;
}

Game.prototype.getNextPlayer = function(currentIndex){

    if( this.notEnoughPlayers() )
    {
        this._eventEmitter.emit('endGame');
        return false;
    }
    let next;
    if( !this._rotationReversed ) {

        next = ++currentIndex;
        if( next > this._players.length -1){
            next = 0;
        }
    }
    else{
        next = --currentIndex;
        if (next < 0) {
            next = this._players.length - 1;
        }
    }

    if (typeof this._players[next] == "undefined" || this._players[next]._done) {
        return this.getNextPlayer(next);
    }

    return next;
}

Game.prototype.notEnoughPlayers = function(){
    if( this._players.length == 1)
        return true;

    var playersDone = 0;
    for( var i = 0; i < this._players.length; i++){
        if( this._players[i]._done ){
            playersDone++;
        }
    }

    if( playersDone >= this._players.length - 1){
        return true;
    }

    return false;
}

Game.prototype.currentTurnPlayer = function(){
    console.log("Current turn is " + this._currentTurn + " which is player " + this._players[this._currentTurn])
    return this._players[this._currentTurn];
}

module.exports = Game;

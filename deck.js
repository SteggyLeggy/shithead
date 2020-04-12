var Deck = function( cards, eventEmitter ){
  this._cards = cards;
  this._graveYard = [];
  this._burnt = [];
  this._eventEmitter = eventEmitter;
}


// Shuffle the cards in the deck randomly
Deck.prototype.shuffle = function(){

  // Check if we have cards atleast
  if( this.isEmpty() )
    return false;

    var v = this._cards;
    for(var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
    this._cards = v;

}

// Check if the deck is empty
Deck.prototype.isEmpty = function(){

  if( typeof this._cards == "undefined" || this._cards.length < 1){
    return true;
  }

  return false;

}

Deck.prototype.take = function(amount){

  var cardsTaken = [];

  for( var i = 0; i < amount; i++ ){

    var card = this.takeOne();

    if( !card)
      break;

    cardsTaken.push(card);
  }

  return cardsTaken;
}

Deck.prototype.takeOne = function(){

  if( this.canTake()){
    return false;
  }

  return this._cards.pop();
}

Deck.prototype.place = function(card){

  // set clientside values to server side

  this._graveYard.push(card);
}

Deck.prototype.placeCards = function(cards){
  for(let card of cards) {
    this.place(card);
  }
}

Deck.prototype.getLastCards = function(num) {
  let returnCards = [];
  for (let x = this._graveYard.length - 1; x >= 0; x--) {
    returnCards.unshift(this._graveYard[x]);
  }
  return returnCards;
}

Deck.prototype.getLastCard = function(){
  if( this._graveYard.length == 0)
    return null;

  return this.getLastCards(1);
}

Deck.prototype.getLastVisibleCard = function() {
  for (let x = this._graveYard.length - 1; x >= 0; x--) {
    let card = this._graveYard[x];
    if (card.getSpecial() != "INVISIBLE") {
      return card;
    }
  }

  return false;
}

Deck.prototype.getLastCardsOfValue = function(cardValue) {
  let cards = [];
  for (let x = this._graveYard.length - 1; x >= 0; x--) {
    let card = this._graveYard[x];
    if (card._value !== cardValue) {
      break;
    }
    cards.push(card);
  }

  return cards;
}

Deck.prototype.burnCards = function() {
  let card;
  while (card = this._graveYard.unshift()) {
    this._burnt.push(card);
  }
}

Deck.prototype.getAndEmptyGraveyard = function() {
  let cards = this._graveYard;
  this._graveYard = [];
  return cards;
}

Deck.prototype.reshuffleCards = function(take){
  console.log('Deck is empty, shuffling cards');

  if( !this.canReshuffle() ){
    console.log('not enough cards in graveYard');
    this._eventEmitter.emit('deckEmpty');
    return false;
  }

  var lastCard = this._graveYard[ this._graveYard.length -1 ];

  // Put back all cards except the last
  for( var i = 0; i < this._graveYard.length; i++){
    this._cards.push(this._graveYard[i]);
    this._graveYard.splice(i, 1);
  }


  if( typeof lastCard != "undefined" ) {
    console.log("lastCard: ");
    console.log(lastCard);

    this._eventEmitter.emit('reshuffle', lastCard);
  }

  this.shuffle();


}

Deck.prototype.returnCards = function(cards){
  for( var i = 0; i < cards.length; i++){
    this._cards.unshift(cards[i]);
  }
}

Deck.prototype.canTake = function(){
  return this.isEmpty();
}
module.exports = Deck;

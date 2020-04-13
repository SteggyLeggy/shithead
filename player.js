const HandType = {
    NORMAL: "normal",
    BLIND: "blind",
    TABLE: "table"
}
var Player = function(id, nickname, socketid, shithead){
    this._id = id;
    this._nickname = nickname;
    this._hand = [];
    this._blind = [];
    this._table = [];
    // Keep track if the player has pressed the ready button in lobby
    this._ready = false;
    this._socketid = socketid;
    this._inGame = false;
    // Check if a player has placed al his cards
    this._done = false;
    this._shithead = shithead;
};

Player.prototype.getNickname = function(){
    return this._nickname;
}

Player.prototype.getId = function(){
    return this._id;
}

Player.prototype.getHand = function(type) {
    switch (type){
        case HandType.NORMAL:
            return this._hand;
        case HandType.BLIND:
            return this._blind;
        case HandType.TABLE:
            return this._table;
        default:
            console.log("Error couldn't find hand with type " + type)
    }
}

Player.prototype.getAllCards = function() {
    cards = []
    for (let type of Object.values(HandType)){
        cards.push(this.getHand(type));
    }
    return cards;
}

Player.prototype.give = function(cards, type=HandType.NORMAL) {
    console.log("Giving cards " + type);
    if( cards == null || typeof cards.length == "undefined")
        return false;

    var hand = this.getHand(type);
    //console.log("to this hand " + hand);

    for(var i = 0; i < cards.length; i++) {
        //console.log('given card to player '+ this._nickname);
        hand.push(cards[i]);
    }
}

Player.prototype.take = function(card, type=HandType.NORMAL){

    var hand = this.getHand(type)

    for(var i = 0; i < hand.length; i++){

        var handCard = hand[i];

        if( handCard._value != card._value){
            continue;
        }

        else if( handCard._suit != card._suit){
            continue;
        }

        hand.splice(i, 1);
    }
}

Player.prototype.takeCards = function(cards, type=HandType.NORMAL) {
    for (let card of cards){
        this.take(card, type);
    }
}

Player.prototype.ready = function () {
    console.log( this._nickname + " is ready");
    this._ready = true;
}

Player.prototype.unReady = function () {
    console.log( this._nickname + " is not ready");
    this._ready = false;
}

Player.prototype.isReady = function(){
    return this._ready;
}

Player.prototype.tableReady = function() {
    return this._table.length == this._hand.length;
}

Player.prototype.moveCard = function(card, fromType, toType) {
    if (!this.hasCard(card, fromType)) {
        console.log("player doesn't have card " + card + " in hand " + this.getHand(fromType));

        return false;
    }
    this.take(card, fromType);
    this.give(card, toType);
    return true;
}

Player.prototype.hasCard = function(card, type=HandType.NORMAL) {
    return this.hasCards([card], type);
}

Player.prototype.hasCards = function(cards, type=HandType.NORMAL){
    // We receive the input from the client, so it's unsure if
    // we get the right data to check the card in hand

    var hand = this.getHand(type)

    let filteredHand = hand.filter(function(handCard, index, arr) {
        for (let checkCard of cards) {
            if (handCard.isEqual(checkCard)){
                return true;
            }
        }
        return false;
    });

    for (let checkCard of cards) {
        let filteredIndex = -1;
        for (let x = 0; x < filteredHand.length; x++){
            let filterCard = filteredHand[x];
            if (checkCard.isEqual(filterCard)){
                filteredIndex = x;
                break;
            }
        }
        if (filteredIndex < 0) {
            return false;
        }
        filteredHand.splice(filteredIndex, 1);
    }

    return true;
}

Player.prototype.checkDone = function(){
    if( this._hand.length == 0){
        this._done = true;
        return true;
    }

    return false;
}

Player.prototype.removeCards = function(){
    this._hand = [];
    this._table = [];
    this._blind = [];
}
exports.Player = Player;
exports.HandType = HandType

const HandType = {
    NORMAL: "normal",
    BLIND: "blind",
    TABLE: "table"
}
var Player = function(id, nickname, socketid){
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

Player.prototype.hasCard = function(card, type=HandType.NORMAL){
    // We receive the input from the client, so it's unsure if
    // we get the right data to check the card in hand
    console.log('check: ', card._suit, card._value);

    if( typeof card._value == "undefined" ) {
        console.log('NO VALUE');
        return false;
    }

    // Added to make the joker card compatible
    if( card._value != 0 && typeof card._suit == "undefined") {
        console.log('No suit found with value of ' +card._value);
        return false;
    }

    var hand = this.getHand(type)

    // Assume we have all the necessary data here
    for(var i = 0; i < hand.length; i++){

        var handCard = hand[i];

        if( handCard._value != card._value){
            console.log('Not same value', card._value, handCard._value);
            continue;
        }

        else if( typeof handCard._suit != "undefined" && handCard._suit != card._suit){
            console.log('Not same suit', card._suit, handCard._suit);
            continue;
        }

        return true;

    }
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

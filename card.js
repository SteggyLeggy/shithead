var Card = function(value, suit) {
  /*
    Value of the card

    2 = 2
    3 = 3
    4 = 4
    5 = 5
    6 = 6
    7 = 7
    8 = 8
    9 = 9
    10 = 10
    11 = Jack
    12 = Queen
    13 = King
    14 = Ace
  */
  this._value = value;

  /* String representation of the suit (diamonds, spades, etc..) */
  this._suit = suit;


}

Card.FromSocket = function(socket_value){
    return new Card(socket_value._value, socket_value.suit);
}

Card.prototype.getSpecial = function(){
    switch(this._value) {
        case 2:
            return "RESET"
        case 3:
            return "INVISIBLE"
        case 7:
            return "LOWER"
        case 8:
            return "SKIP"
        case 10:
            return "BURN"
        case 13:
            return "REVERSE"
        default:
            return ""
    }
}

Card.prototype.isSpecial = function(){
    var special = this.getSpecial()
    return special != ""
}

Card.prototype.isWild = function(){
    return [2, 3, 10].includes(this._value)
}

module.exports = Card;

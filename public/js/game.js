const CARD_WIDTH = 140;
const CARD_HEIGHT = 190;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600

var game = new Phaser.Game(GAME_WIDTH, GAME_HEIGHT, Phaser.AUTO, 'game');

const HAND_POSITION = {
    x: (GAME_WIDTH / 2),
    y: GAME_HEIGHT, // - (CARD_HEIGHT / 2) - 20,
    spacingX: 40
}

const BLIND_POSITION = {
    x: (GAME_WIDTH / 2),
    y: HAND_POSITION.y - CARD_HEIGHT - 20,
    spacingX: CARD_WIDTH + 10,
    tableShiftX: 10,
    tableShiftY: 5
}

const GRAVEYARD_POSITION = {
    x: (GAME_WIDTH / 2) - (CARD_WIDTH / 2),
    y: 10,
    spacingX: 1,
    spacingY: 1
}

const DECK_POSITION = {
    x: GAME_WIDTH - (CARD_WIDTH - 20),
    y: 20
}

var loaded = false;
var sprite;
var handCards = [];
var tableCards = [];
var blindCardCount = 0;
var graveyardCards = [];
var deckCardCount = 0;
var burntCardCount = 0;
var tableCardsSent = 0;

var handCardsGroup;
var tableCardsGroup;
var blindCardsGroup;
var graveyardCardsGroup;
var deckCardsGroup;
var burntCardGroup;

var button;

var self;
var spacing = CARD_WIDTH;
var cardsInView = 5;
var currentView = 0;
var tableCards = null;
var rectLeft = null;
var rectRight = null;
// Check if the it's the player's turn currently
var turn = false;
var playerStage = "";
var turnText = null;
var deckCard = null;
var skipTurn = null;
var takeCards = null;
var hasDebt = false;
var music = null;

var soundPlace = null;
var soundSlide = null;
var soundShuffle = null;

var drawEnabled = true;

game.state.add('load', loadState);
game.state.add('lobby', lobbyState);
game.state.add('play', playState);
game.state.add('gameOver', gameOverState);

game.state.start('load');

function resetGlobalVars(){
    loaded = false;
    sprite = null;

    handCards = [];
    tableCards = [];
    blindCardCount = 0;
    deckCardCount = 0;
    graveyardCards = [];
    burntCardCount = 0;
    playerStage = "";

    button = null;
    self = null;
    spacing = CARD_WIDTH;
    cardsInView = 5;
    currentView = 0;
    tableCards = null;
    rectLeft = null;
    rectRight = null;
// Check if the it's the player's turn currently
    turn = false;
    turnText = null;
    deckCard = null;
    skipTurn = null;
    takeCards = null;
    hasDebt = false;
    music = null;

    soundPlace = null;
    soundSlide = null;
    soundShuffle = null;

    drawEnabled = true;
}

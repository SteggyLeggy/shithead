/* global cardTranslator, game, socket, CARD_WIDTH, CARD_HEIGHT, HAND_POSITION, BLIND_POSITION, GRAVEYARD_POSITION, DECK_POSITION, loaded, sprite, handCards, tableCards, blindCardCount, graveyardCards, deckCardCount, burntCardCount, handCardsGroup, tableCardsGroup, blindCardsGroup, graveyardCardsGroup, deckCardsGroup, burntCardGroup, button, playState, spacing, cardsInView, currentView, tableCardresetGlobalVarsLeft, rectRight, turn, playerStage, turnText, deckCard, skipTurn, takeCards, hasDebt, music, soundPlace, soundSlide, soundShuffle, drawEnabled, resetGlobalVars, tableCardsSent */
/* eslint-disable no-global-assign */

const playerStages = {
    NEED_TABLE: "NEED_TABLE",
    SENT_TABLE: "SENT_TABLE",
    NORMAL_PLAY: "NORMAL_PLAY",
    TABLE_PLAY: "TABLE_PLAY",
    BLIND_PLAY: "BLIND_PLAY",
    FINISHED: "FINISHED"
}

var playState = {

    restart: function(){
        resetGlobalVars();
        game.state.start('lobby');
    },

    stop: function(){
        game.state.start('gameOver');
    },

    create: function(){

        if( music != null)
            music.stop();

        soundPlace = game.add.audio('soundPlace');
        soundSlide = game.add.audio('soundSlide');
        soundShuffle = game.add.audio('soundShuffle');

        playState.started = true;
        game.add.sprite( 0, 0, 'playTable');
        //console.log("STARTING GAME");
        //this.dealCards();
        //x = (game.world.centerX - (CARD_WIDTH/2 ) );
        // y = ( game.world.height - CARD_HEIGHT + 60);

        // rectLeft = game.add.button(0,0);
        // rectLeft.width = 140;
        // rectLeft.height = 190;
        // rectLeft.x = 0 - CARD_WIDTH + 40;
        // rectLeft.y = game.world.height - rectLeft.height + 60;
        // rectLeft.onInputDown.add(playState.onClickRectLeft);
        // rectLeft.alpha = 0;
        // rectLeft.visible = false;

        // rectRight = game.add.button(0,0);
        // rectRight.width = 140;
        // rectRight.height = 190;
        // rectRight.x = game.world.width - rectRight.width;
        // rectRight.y = game.world.height - rectRight.height + 60;
        // rectRight.onInputDown.add(playState.onClickRectRight);
        // rectRight.alpha = 0;
        // rectRight.visible = false;

        playState.reshuffle();

        playState.placeDeckCard();

        socket.emit('askCards');
        //console.log("ASK CARDS CLIENT");
    },

    dealCards: function(data){
        this.updateCards(data)
        if (handCards.length !== tableCards.length) {
            playerStage = playerStages.NEED_TABLE;
        } else {
            playerStage = playerStages.SENT_TABLE;
            tableCardsSent = tableCards.length;
        }
    },

    updateCards: function(data){
        handCards = data.hand;
        tableCards = data.table;
        blindCardCount = data.blindLength;

        if (playerStage !== playerStages.NEED_TABLE) {
            if (handCards.length > 0) {
                playerStage = playerStages.NORMAL_PLAY;
            } else if (tableCards.length > 0) {
                playerStage = playerStages.TABLE_PLAY;
            } else if (blindCardCount > 0) {
                playerStage = playerStages.BLIND_PLAY;
            } else {
                playerStage = playerStages.FINISHED;
            }
        }
        this.drawBlindCards();
        this.drawTableCards();
        this.drawHandCards();
    },

    yourTurn: function(){
        turn = true;
        drawEnabled = true;
        playState.renderTurnText("It's your turn!");
        playState.addSkipButton();
    },

    newTurn: function(player){
        turn = false;
        drawEnabled = false;
        playState.renderTurnText("it's "+player._nickname+"'s turn" );
        playState.removeSkipButton();
        playState.removeTakeCardsButton();
    },

    renderTurnText: function(text){

        if( turnText != null)
            turnText.destroy();

        turnText = game.add.text(10, 10, text, {
            font: '30px Arial',
            fill: '#ffffff'
        });
    },

    drawCard: function(card, group, x, y, onClickCallback) {
        let cardKey;
        if (card !== null){
            // console.log("Drawing card " + card._value + " " + card._suit);
            cardKey = cardTranslator.translate(card._value, card._suit);
        } else {
            cardKey = 'back';
        }
        let button = game.make.button(x, y, cardKey, onClickCallback);
        if (card !== null){
            button._value = card._value;
            button._suit = card._suit;
        }
        button.active = false
        group.add(button)
        return button;
    },

    drawHandCards: function() {
        let fullLength = (handCards.length * HAND_POSITION.spacingX) + (CARD_WIDTH - HAND_POSITION.spacingX);
        let runningX = (HAND_POSITION.x - (fullLength / 2));
        let y = (HAND_POSITION.y - (CARD_HEIGHT / 2));

        if (handCardsGroup !== undefined) {
            handCardsGroup.destroy();
        }

        handCardsGroup = game.add.group();

        console.log("Drawing cards, starting from X: " + runningX + " Y: " + y);

        for(let card of handCards) {
            this.drawCard(card, handCardsGroup, runningX, y, playState.onCardClick)
            runningX += HAND_POSITION.spacingX
        }
    },
    drawBlindCards: function() {
        let fullLength = (blindCardCount * BLIND_POSITION.spacingX) + (CARD_WIDTH - BLIND_POSITION.spacingX);
        let runningX = (BLIND_POSITION.x - (fullLength / 2));
        let y = (BLIND_POSITION.y - (CARD_HEIGHT / 2));

        if (blindCardsGroup !== undefined) {
            blindCardsGroup.destroy();
        }
        blindCardsGroup = game.add.group();

        console.log("Drawing "+blindCardCount+" blind cards, starting from X: " + runningX + " Y: " + y);

        for(let x = 0; x < blindCardCount; x++) {
            this.drawCard(null, blindCardsGroup, runningX, y, playState.onBlindCardClick)
            runningX += BLIND_POSITION.spacingX
        }
    },
    drawTableCards: function() {
        let fullLength = (blindCardCount * BLIND_POSITION.spacingX) + (CARD_WIDTH - BLIND_POSITION.spacingX);
        let runningX = (BLIND_POSITION.x - (fullLength / 2)) + BLIND_POSITION.tableShiftX;
        let y = (BLIND_POSITION.y - (CARD_HEIGHT / 2)) + BLIND_POSITION.tableShiftY;

        if (tableCardsGroup !== undefined) {
            tableCardsGroup.destroy();
        }
        tableCardsGroup = game.add.group();

        console.log("Drawing table cards, starting from X: " + runningX + " Y: " + y);

        for(let card of tableCards) {
            this.drawCard(card, tableCardsGroup, runningX, y, playState.onTableCardClick)
            runningX += BLIND_POSITION.spacingX
        }
    },

    giveCard: function(cardKey, value, suit, button_area, card_y){

    //     //console.log(item);
    //     //handCardsGroup.create( x, y, item);
    //     var button = game.make.button(x, card_y, cardKey, playState.onCardClick);
    //     button._value = value;
    //     button._suit = suit;
    //     // Check to see if the card is already clicked
    //     button.active = false;
    //     button_area.add(button);
    //     x += spacing;

    //     playState.shiftCards();
    },

    shiftCards: function(){
    //     var totalCards = handCardsGroup.length;
    //     var totalLength = totalCards * CARD_WIDTH;
    //     //console.log(totalCards);
    //     //console.log(totalLength);
    //     //console.log("CurrentView: "+currentView);
    //     //console.log('total lenght: '+ totalLength);

    //     table.x = (game.world.width - (table.length * CARD_WIDTH)) / 2;

    //     if( totalLength <= game.world.width) {
    //         var newX = (game.world.width - totalLength) / 2;
    //         //console.log(newX);

    //         handCardsGroup.x = (newX);
    //         playState.resetCardsPlacement();
    //     }
    //     else {
    //         handCardsGroup.x = 0;
    //         var increment = CARD_WIDTH + ((game.world.width - totalLength) / totalCards);

    //         var newCardX = 0;
    //         var n = 0;

    //         handCardsGroup.forEachExists(function (item) {
    //             //console.log(n);
    //             if (n < currentView || n == 0){
    //                 // Dirty trick to skip the first
    //                 newCardX = 0;
    //             }
    //             else if( n == currentView ){
    //                 //console.log("CANCER");
    //                 newCardX = 40;
    //             }
    //             else if(  n >= (currentView + cardsInView)){
    //                 newCardX = (CARD_WIDTH * 5) - 40;
    //             }
    //             else {
    //                 newCardX += CARD_WIDTH;
    //             }

    //             item.x = newCardX;

    //             n++;
    //         });
    //     }

    //     playState.checkView();
    },

    onCardClick: function(){

        // Not your turn buddy!
        if(!turn && playerStage != playerStages.NEED_TABLE)
            return false;

        if( this.active ){
            //console.log('Play this card');
            this.active = false;
            this.y +=  60;
        }
        else{
            //console.log('You clicked this card the first time');
            // playState.resetCardsActive();
            this.active = true;
            this.y -= 60;
        }
    },

    onBlindCardClick: function(){
        if (playerStage === playerStages.NEED_TABLE)
        {
            var cards = playState.getActiveCards();

            // console.log(card);
            if( cards == null) {
                return false;
            }
            console.log('Click blind ' + cards);

            //console.log(socket);
            let data = [];
            for (let card of cards) {
                tableCards.push(card);
                data.push({
                    _value: card._value,
                    _suit: card._suit
                })
            }
            socket.emit('setTable', data);
            tableCardsSent += cards.length;
            if (tableCardsSent >= 3) {
                playerStage = playerStages.SENT_TABLE;
            }
        } else if (playerStage === playerStages.BLIND_PLAY) {
            // Flip card and attempt to play
        } else {
            return false;
        }
    },

    onTableCardClick: function(){
        if (playerStage === playerStages.TABLE_PLAY) {
            if(!turn ){
                return false;
            }

            if( this.active ){
                //console.log('Play this card');
                this.active = false;
                this.y +=  60;
            }
            else {
                //console.log('You clicked this card the first time');
                // playState.resetCardsActive();
                this.active = true;
                this.y -= 60;
            }
            return true;
        }
        return false;
    },

    onClickRectLeft: function(){
        // //console.log('Clicked left button rectangle');

        // if( currentView == 0)
        //     return false;

        // currentView--;
        // //console.log(currentView);

        // playState.shiftCards();
        // playState.resetCardsActive();
    },

    onClickRectRight: function(){

        // if( (currentView + cardsInView + 1) > handCardsGroup.length )
        //     return false;

        // currentView++;
        // //console.log(currentView);
        // playState.shiftCards();
        // playState.resetCardsActive();
    },

    checkView: function(){
        // //console.log("Checking view");

        // // Hide all buttons by default
        // rectRight.visible = false;
        // rectLeft.visible = false;

        // // If we have more cards in our hand than we can see and have some cards in a pile
        // // on right side of the screen then show the button
        // if( handCardsGroup.length > cardsInView && (currentView + cardsInView) < handCardsGroup.length ){
        //     rectRight.visible = true;
        //     game.world.bringToTop(rectRight);
        //     //console.log('Show button right');
        // }

        // if( handCardsGroup.length > cardsInView && currentView > 0){
        //     rectLeft.visible = true;
        //     game.world.bringToTop(rectLeft);
        //     //console.log('Show button left');
        // }
    },

    resetCardsActive: function(){
        //console.log('reset other active cards');
        handCardsGroup.forEachExists(function (item) {

            //console.log(item.active);
            if( item.active == true ) {
                item.active = false;
                item.y += 60;
            }
        });
    },
    onClickGraveyardCard: function(){

        var cards = playState.getActiveCards();

       // console.log(card);
        if( cards != null) {
            console.log('Click table');
            if(playState.clientSideCheckMove(cards) ) {
                console.log('check card');
                playState.addCardsToTable(cards);
                //console.log(socket);
                let data = [];
                for (let card of cards) {
                    data.push({
                        _value: card._value,
                        _suit: card._suit
                    })
                }
                socket.emit('move', data);
            }
        } else {
            socket.emit('shop');
        }
    },

    getActiveCards: function(){
        if( typeof handCardsGroup == "undefined" || handCardsGroup == null)
            return false;

        var cards = [];
        handCardsGroup.forEachExists(function (item) {
            ///console.log(item);
            if( item.active == true ) {
                cards.push(item);
            }
        });

        return cards;
    },

    addCardsToTable: function(cards) {
        // // Not your turn buddy
        // if(!turn)
        //     return false;

        // for (let card of cards){
        //     playState.place(card);
        //     card.destroy();
        // }

        // soundPlace.play();
        // playState.shiftCards();
    },
    resetCardsPlacement: function(){
        var x = 0;
        handCardsGroup.forEach(function(item){
            item.x = x;
            x+= spacing;
        });
    },

    clientSideCheckMove: function(card){
        // Todo: check rules
        return true;
    },

    place: function(card){
        var tableCard = game.add.button(0,0, card.key);
        tableCard.width = CARD_WIDTH;
        tableCard.height = CARD_HEIGHT;
        tableCard.x = 50; // game.world.centerX - CARD_WIDTH / 2;
        tableCard.y = 50; // game.world.centerY - CARD_HEIGHT / 2;
        tableCard.onInputDown.add(playState.onClickTableCard);
        tableCard._value = card._value;
        tableCard._suit = card._suit;

        tableCards.add(tableCard);
        soundPlace.play();
    },

    drawGraveyard: function() {
        console.log("drawing graveyard card " + graveyardCards.length);

        if (graveyardCardsGroup !== undefined) {
            graveyardCardsGroup.destroy();
        }
        graveyardCardsGroup = game.add.group();
        if (graveyardCards.length > 0){
            let runningX = (GRAVEYARD_POSITION.x + (GRAVEYARD_POSITION.spacingX * graveyardCards.length));
            let runningY = GRAVEYARD_POSITION.y + (GRAVEYARD_POSITION.spacingY * graveyardCards.length);

            console.log("Drawing graveyard cards, starting from X: " + runningX + " Y: " + runningY);

            for(let card of graveyardCards) {
                this.drawCard(card, graveyardCardsGroup, runningX, runningY, playState.onClickGraveyardCard)
                runningX -= GRAVEYARD_POSITION.spacingX;
                runningY -= GRAVEYARD_POSITION.spacingY;
            }
        } else {
            console.log("Drawing blank graveyard card")
            // Add an empty card to have something clickable if the table is empty
            var defaultCard = game.add.button(0,0);
            defaultCard.width = CARD_WIDTH;
            defaultCard.height = CARD_HEIGHT;
            defaultCard.x = GRAVEYARD_POSITION.x;
            defaultCard.y = GRAVEYARD_POSITION.y;
            defaultCard.onInputDown.add(playState.onClickGraveyardCard);
            defaultCard.alpha = 0;
            graveyardCardsGroup.add(defaultCard);
        }
    },

    drawDeck: function(){

    },

    drawBurntPile: function() {

    },

    serverUpdate: function(data){
        console.log(data);
        if (typeof data.currentCards !== "undefined"){
            graveyardCards = data.currentCards;
            deckCardCount = data.deckCardsRemaining;
            burntCardCount = data.burntCards;
        }

        playState.drawGraveyard();
        playState.drawDeck();
        playState.drawBurntPile();
    },

    getLastCard: function(){
        var lastCard = tableCards.getChildAt( tableCards.length - 1);
        //console.log(lastCard);
        if(typeof lastCard._value == "undefined")
            return null;

        return lastCard;
    },
    onClickDeckCard: function(){
        if(!turn || !drawEnabled)
            return false;
        // Prevent from clicking again
        drawEnabled = false;
        playState.resetCardsActive();
        socket.emit('takeCard');

    },

    endTurn: function(){
        turn = false;
        playState.removeSkipButton();
    },
    takenCards: function(cards){

            soundSlide.play();
            playState.addCardsToHand(cards);
            playState.endTurn();

    },

    addCardsToHand: function(cards){
        // for( var i = 0; i < cards.length; i++){
        //     // For some reason this doesn't work :/
        //     //    playState.actionOnClick();

        //     // So yeah
        //     //console.log(data[i][0]);
        //     var cardKey = cardTranslator.translate(cards[i]._value, cards[i]._suit);
        //     //console.log(cardKey);
        //     playState.giveCard(cardKey, cards[i]._value, cards[i]._suit);
        // }
    },

    reshuffle: function(lastCard){

        // soundShuffle.play();
        // if( tableCards != null){
        //     tableCards.destroy();
        // }

        // if( lastCard != null) {
        //     playState.serverPlace(lastCard);
        // }
    },

    removeDeck: function(){
        if(deckCard != null) {
            deckCard.destroy();
            deckCard = null;
        }
    },

    placeDeckCard: function(){
        deckCard = game.add.button(0,0, 'back');
        deckCard.x = game.world.width - CARD_WIDTH - 16;
        deckCard.y = 14;
        deckCard.onInputDown.add(playState.onClickDeckCard);
    },

    addSkipButton: function(){
        console.log(deckCard);
        if( deckCard == null ) {
            skipTurn = game.add.button(0, 0, 'skipTurn');
            skipTurn.x = game.world.width - CARD_WIDTH - 150;
            skipTurn.y = 280;
            skipTurn.onInputDown.add(function(){
                socket.emit('skipTurn');
            });
        }
    },

    removeSkipButton: function(){
        if( skipTurn != null){
            skipTurn.destroy();
        }
    },

    addTakeCardsButton: function(){

            takeCards = game.add.button(0, 0, 'takeCards');
            takeCards.x = game.world.width - CARD_WIDTH - 150;
            takeCards.y = 340;
            takeCards.onInputDown.add(function(){
                socket.emit('takeCards');
            });

    },

    removeTakeCardsButton: function(){
        hasDebt = false;
        if( takeCards != null){
            takeCards.destroy();
        }
    },

    hasDebt: function(){
        // Don't allow the player to bypass the debt by drawing a card
        playState.enableDraw(false);
        hasDebt = true;
        this.addTakeCardsButton();
    },

    paidDebt: function(cards){
        playState.enableDraw(true);
        playState.addCardsToHand(cards);
        playState.removeTakeCardsButton();
    },

    enableDraw: function(bool){
        drawEnabled = bool;
    }

};

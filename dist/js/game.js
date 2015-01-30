var Game = function () {
};

Game.PlayingState = {Watching: 0, Joining: 1, Playing: 2};
Game.color = {BLACK:"BLACK", WHITE: "WHITE"};

Game.Controller = function (size, url) {
    var idGame = window.location.search.substring(1);
    this.firebase = new FB(url, idGame);

    this.board = new Board(size, this.firebase);

    this.playingState = Game.PlayingState.Watching;
    this.playerNum = null;

    this.waitToJoin();
};

Game.Controller.prototype.getColor = function () {
    if (this.playerNum == null) {
        return null;
    }
    return (this.playerNum == 0) ? Game.color.BLACK : Game.color.WHITE;
};

Game.Controller.prototype.waitToJoin = function () {
    var self = this;

    // Listen on 'online' location for player0 and player1.
    function join(numPlayer) {
        self.firebase.ref().child('player' + numPlayer + '/online').on('value', function (onlineSnap) {
            if (_.isNull(onlineSnap.val()) && _.isEqual(self.playingState, Game.PlayingState.Watching)) {
                self.tryToJoin(numPlayer);
            }
            self.presence(numPlayer, onlineSnap.val());
        });
    }
    join(0);
    join(1);

    this.watchForNewStones();
};

Game.Controller.prototype.tryToJoin = function (playerNum) {
    this.playerNum = playerNum;
    console.log("player" + playerNum + " tryToJoin");
    
    // Set ourselves as joining to make sure we don't try to join as both players. :-)
    this.playingState = Game.PlayingState.Joining;

    // Use a transaction to make sure we don't conflict with other people trying to join.
    var self = this;
    this.firebase.ref().child('player' + playerNum + '/online').transaction(function (onlineVal) {
        console.log("tryToJoin transaction ", onlineVal);
        if (onlineVal === null) {
            self.firebase.setToken(playerNum);
            return true; // Try to set online to true
        } else {
            return; // Somebody must have beat us.  Abort the transaction.
        }
    }, function (error, committed) {
        console.log("tryToJoin error ", committed);
        if (committed) { // We got in!
            self.playingState = Game.PlayingState.Playing;
            self.startPlaying(playerNum);
        } else {
            self.playingState = Game.PlayingState.Watching;
        }
    });
};

/**
 * Once we've joined, enable controlling our player.
 */
Game.Controller.prototype.startPlaying = function (playerNum) {
    this.myPlayerRef = this.firebase.ref().child('player' + playerNum);

    // Clear our 'online' status when we disconnect so somebody else can join.
    this.myPlayerRef.child('online').onDisconnect().remove();

    var self = this;
    $(".cell").click(function (event) {
        var ids = event.target.id.split("-");
        var coord = {x:ids[0], y:ids[1], color:self.getColor()};
        var color = self.board.get(coord);

        if (color != undefined && _.isEqual(color, self.getColor())) {
            self.board.removeStone(coord);
            return;
        }
        self.board.setStoneFirebase(coord, playerNum);
    });
};

/**
 * Detect when our opponent pushes extra rows to us.
 */
Game.Controller.prototype.watchForNewStones = function () {
    var self = this;
    var boardRef = this.firebase.ref().child('board');

    boardRef.on('child_changed', function (snapshot) {
        var coord = snapshot.key();
        var stone = snapshot.val();
        self.board.setStone({x:parseInt(coord.charAt(0)), y:parseInt(coord.charAt(1)), color:stone});
    });

    boardRef.on('child_added', function (snapshot) {
        var coord = snapshot.key();
        var stone = snapshot.val();
        self.board.setStone({x:parseInt(coord.charAt(0)), y:parseInt(coord.charAt(1)), color:stone});
    });

    boardRef.on('child_removed', function (snapshot) {
        var coord = snapshot.key();
        self.board.removeStone({x:coord.charAt(0), y:coord.charAt(1)});
    });
};

Game.Controller.prototype.presence = function (playerNum, user) {
    if (_.isEqual(playerNum, this.playerNum)) {
        return;
    }

    if (user) {
        $("#presence").text("Opponent : ★ online");
    } else {
        $("#presence").text("Opponent : ☆ idle");
    }
};

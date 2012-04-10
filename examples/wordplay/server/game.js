Meteor.methods({
  start_new_game: function (evt) {
    // create a new game w/ fresh board
    var game_id = Games.insert({board: new_board(),
                                clock: 120});

    // move everyone in the lobby to the game
    Players.update({game_id: null, idle: false},
                   {$set: {game_id: game_id}},
                   {multi: true});
    // Save a record of who is in the game, so when they leave we can
    // still show them.
    var p = Players.find({game_id: game_id},
                         {fields: {_id: true, name: true}}).fetch();
    Games.update({_id: game_id}, {$set: {players: p}});


    // wind down the game clock
    var clock = 120;
    var interval = Meteor.setInterval(function () {
      clock -= 1;
      Games.update(game_id, {$set: {clock: clock}});
      if (clock === 0)
        Meteor.clearInterval(interval);
    }, 1000);

    return game_id;
  },


  keepalive: function (player_id) {
    Players.update({_id: player_id},
                  {$set: {last_keepalive: (new Date()).getTime(),
                          idle: false}});
  }
});

Meteor.setInterval(function () {
  var now = (new Date()).getTime();
  var idle_threshold = now - 70*1000; // 70 sec
  var remove_threshold = now - 60*60*1000; // 1hr

  Players.update({$lt: {last_keepalive: idle_threshold}},
                 {$set: {idle: true}});

  // XXX need to deal with people coming back!
  // Players.remove({$lt: {last_keepalive: remove_threshold}});

}, 30*1000);
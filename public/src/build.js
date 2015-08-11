var emojinary=angular.module("emojinary",["ngRoute"]).config(["$routeProvider",function(a){a.when("/",{controller:"SplashController",templateUrl:"templates/splash.html"}).when("/lobby",{controller:"LobbyController",templateUrl:"templates/lobby.html"}).when("/game",{controller:"GameController",templateUrl:"templates/game.html"}).otherwise({redirectTo:"/404"})}]).run(["$rootScope","$location",function(a,b){b.path("/"),a.username="",a.room=null,a.socket=null,a.score=0}]);emojinary.controller("SplashController",["$scope","$rootScope","$http","$location",function(a,b,c,d){b.socket&&(b.socket.disconnect(),b.username="",b.socket=null,b.score=0),a.play=function(){b.username=prompt("Select a username:"),b.username&&(b.socket=io(),d.path("/lobby"))}}]),emojinary.controller("LobbyController",["$scope","$rootScope","$http","$location",function(a,b,c,d){a.rooms=[],a.createRoom=function(){var a=prompt("Type a name for your room:");return(a=a.replace(/\s/g,"_"))?void c.post("/rooms",{room:a}).success(function(c){c.success?(b.room=a,d.path("/game")):alert(c.error)}):void d.path("/")},a.joinRoom=function(a){b.room=a,d.path("/game")},c.get("/rooms").success(function(b){a.rooms=b})}]),emojinary.controller("GameController",["$scope","$rootScope","$http","$timeout","$location",function(a,b,c,d,e){a.players=[],a.currentAsker=0,a.you=null,a.guess="",a.emojis="",a.ready=!1,a.emojiLog=[],a.movieChoices=[],a.movie="",a.hint="",a.hintsLeft=2,a.results={},a.typeInput=function(b){13===b.keyCode&&a.submitGuess()},a.submitGuess=function(){a.currentAsker===a.you?a.isOnlyEmoji(a.emojis)&&a.emojis&&(b.socket.emit("emote",{room:b.room,emojis:a.emojis}),a.emojis=""):(b.socket.emit("guess",{username:b.username,room:b.room,guess:a.guess}),a.guess="")},a.selectWinner=function(c){b.socket.emit("guess",{username:a.players[c].name,room:b.room,guess:a.movie}),a.movie=""},a.selectMovie=function(c){a.movie=a.movieChoices[c],a.movieChoices=[],b.socket.emit("ready",{username:b.username,room:b.room,movie:a.movie})},a.giveHint=function(){0!==a.hintsLeft&&(a.hintsLeft--,b.socket.emit("hint",{username:b.username,room:b.room}))},b.socket.on("player-join",function(d){if(d.error)return alert(d.error),void e.path("/");g(d.players);for(var f=0;f<d.players.length;f++)d.players[f].name===b.username&&(a.you=f);a.players.length>1&&a.currentAsker===a.you&&0===a.movieChoices.length&&!a.ready&&c.get("/movies").success(function(b){a.movieChoices=b}),a.$digest()}),b.socket.on("player-leave",function(c){if(g(c.players),a.players.length>1&&!c.reset)for(var d=0;d<c.players.length;d++)c.players[d].name===b.username&&(a.you=d);else f();a.$digest()}),b.socket.on("ready",function(){a.ready=!0,a.$digest()}),b.socket.on("skip",function(){f(),a.$digest()}),b.socket.on("emote",function(b){a.emojiLog.push(b.emojis),a.$digest()}),b.socket.on("hint",function(b){a.hint=b.hint,a.$digest()}),b.socket.on("guess",function(c){a.results.username=c.username,a.results.answer=c.answer,a.results.points=c.points,a.$digest(),d(function(){c.username===b.username&&(b.score+=c.points),f(),b.$digest()},5e3)}),a.skipRound=function(){a.movie="",b.socket.emit("skip",{room:b.room})};var f=function(){a.results={},a.emojiLog=[],a.movie="",a.hint="",a.hintsLeft=2,a.ready=!1,a.currentAsker++,a.currentAsker>=a.players.length&&(a.currentAsker=0),a.players.length>1&&a.currentAsker===a.you&&c.get("/movies").success(function(b){a.movieChoices=b})},g=function(b){a.players=b};a.isOnlyEmoji=function(a){return/^([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDEFF]|[\u25A0-\u27BF]|[\u2900-\u297F]|\s)*$/gm.test(a)},c.get("/room?"+b.room).success(function(c){c.error?console.log("Empty room response: "+c.error):(a.currentAsker=c.currentAsker,g(c.players)),b.socket.emit("join",{name:b.username,room:b.room})})}]);
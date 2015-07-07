emojinary.controller('GameController', ['$scope', '$rootScope', '$http', '$timeout', '$location', function ($scope, $rootScope, $http, $timeout, $location) {
  $scope.players = [];

  $scope.currentAsker = 0;
  $scope.you = null;
  $scope.guess = '';
  $scope.emojis = '';
  $scope.ready = false;

  $scope.emojiLog = [];
  $scope.movieChoices = [];
  $scope.movie = '';
  $scope.results = {};

  $scope.typeInput = function (evt) {
    if (evt.keyCode === 13) {
      $scope.submitGuess();
    }
  };

  $scope.submitGuess = function () {
    if ($scope.currentAsker === $scope.you) {
      if ($scope.isOnlyEmoji($scope.emojis) && $scope.emojis) {
        $rootScope.socket.emit('emote', {
          room: $rootScope.room,
          emojis: $scope.emojis
        });
        $scope.emojis = '';
      }
    } else {
      $rootScope.socket.emit('guess', {
        username: $rootScope.username,
        room: $rootScope.room,
        guess: $scope.guess
      });
      $scope.guess = '';
    }
  };

  $scope.selectMovie = function (n) {
    $scope.movie = $scope.movieChoices[n];
    $scope.movieChoices = [];

    $rootScope.socket.emit('ready', {
      username: $rootScope.username,
      room: $rootScope.room,
      movie: $scope.movie
    });
  };

  // socket.io stuff. Remember to $digest() manually...

  $rootScope.socket.on('player-join', function (data) {
    if (data.error) {
      alert(data.error);
      $location.path('/');
      return;
    }

    initPlayers(data.players);

    // This assumes names are unique. Handle that server side.
    for (var i = 0; i < data.players.length; i++) {
      if (data.players[i].name === $rootScope.username) {
        $scope.you = i;
      }
    }

    if ($scope.players.length > 1 && $scope.currentAsker === $scope.you) {
      $http.get('/movies').success(function (data) {
        $scope.movieChoices = data;
      });
    }

    $scope.$digest();
  });

  $rootScope.socket.on('player-leave', function (data) {
    initPlayers(data.players);

    // This assumes names are unique. Handle that server side.
    for (var i = 0; i < data.players.length; i++) {
      if (data.players[i].name === $rootScope.username) {
        $scope.you = i;
      }
    }

    $scope.$digest();
  });

  $rootScope.socket.on('ready', function () {
    $scope.ready = true;
    $scope.$digest();
  });

  $rootScope.socket.on('emote', function (data) {
    $scope.emojiLog.push(data.emojis);
    $scope.$digest();
  });

  $rootScope.socket.on('guess', function (data) {
    // broadcast results, switch currentAsker
    $scope.results.username = data.username;
    $scope.results.answer = data.answer;
    $scope.results.points = data.points;
    $scope.$digest();

    $timeout(function () {
      if (data.username === $rootScope.username) {
        $rootScope.score += data.points;
      }
      newRound();
      $rootScope.$digest();
    }, 5000);
  });

  // game utils

  var newRound = function () {
    $scope.results = {};
    $scope.emojiLog = [];
    $scope.ready = false;
    $scope.currentAsker++;
    if ($scope.currentAsker >= $scope.players.length) {
      $scope.currentAsker = 0;
    }
  };

  var initPlayers = function (players) {
    $scope.players = players;
  };

  $scope.isOnlyEmoji = function (str) {
    return (/^([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF]|\uD83D[\uDE80-\uDEF3]|\uD83D[\uDE00-\uDE4f]|[\u2600-\u27BF]|\s)*$/gm).test(str);
  };

  // initial room construction

  $http.get('/room?0').success(function (data) {
    if (data.error) {
      console.log('Empty room response: ' + data.error);
    } else {
      $scope.currentAsker = data.currentAsker;
      initPlayers(data.players);
    }

    $rootScope.socket.emit('join', $rootScope.username);
  });
}]);

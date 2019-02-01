angular.module('plane.tablo', [ 'ngSanitize', 'ui.bootstrap', 'ngTable'])

angular.module('plane.tablo').controller('AlertDemoCtrl', function ($scope, $http, NgTableParams) {
  $scope.start = new Date();
  $scope.start.setHours(0, 0, 0)
  $scope.end = new Date();
  $scope.end.setHours(24, 0, 0)

  $scope.parseTime = function(data){ 
    return Date.parse(data);
  }

  $scope.add = function(p){
    return ("0" + p).slice(-2)
  }

  $scope.parseTimeToString = function(data){
    return data.getFullYear()+'-'+$scope.add(data.getMonth()+1)+"-"+$scope.add(data.getDate())+"T"+$scope.add(data.getHours())+":00:00%2B03:00"
  }

  $scope.getTime = function(parse){
    parse = new Date(parse)
    parse.setHours(parse.getUTCHours()+3)
    return $scope.add(parse.getHours())+ ":" + $scope.add(parse.getMinutes());
  }

  $scope.repl = function(str,repl){
    return str.replace( /(\d*:\d*)/gm, $scope.getTime($scope.parseTime(repl)))
  }

  $scope.loadDirection = function(direction, search=false) {
    $scope.direction = direction;
    let url = 'http://labelimg.ru/timetable.php?direction='+ direction + ((search)?'&search='+search:'')+'&dateStart='+$scope.parseTimeToString($scope.start)+'&dateEnd='+$scope.parseTimeToString($scope.end)+'&perPage=9999&page=0&locale=ru'
    $scope.loadingHttp = true;
    $http.get(url).then(function successCallback(response) {
      for(let i = 0; i< response.data.items.length;i++){
        if(response.data.items[i].main_flight != ''){
          for(let x = 0; x< response.data.items.length;x++){
            if(response.data.items[i].main_flight == response.data.items[x].i_id){
              var s = response.data.items[i];
              if(response.data.items[x]['Flight'] == undefined){ response.data.items[x]['Flight'] = [] }
              response.data.items[x]['Flight'].push({'code':s.co.code, 'id':s.co.livreiImageId.id, 'flt':s.flt})
            }
          }
        }
      }

      let addFlightNull = response.data.items.filter(function(n) {
        return n.main_flight == '';
      });

      if($scope.statusStep != 'Все'){
        addFlightNull = addFlightNull.filter(function(n) {
          return n.vip_status_rus.match($scope.statusStep);
        });
      }

      $scope.tableParams = new NgTableParams({ count: 15}, { counts: [30, 40, 50], dataset: addFlightNull});
      $scope.loadingHttp = false;
    }, function errorCallback(response) { });

  };

  $scope.searchLocation = function(val) {
    return $http.get('http://labelimg.ru/search.php?q=' + val + '&locale=ru').then(function(response){
      return response.data.slice(0, 15).map(function(item){
        return item
      });
    });
  };

  $scope.search = function(s){
    $scope.loadDirection($scope.direction,s.replace(/\"/gm,''))
  }

$scope.loadDirection('departure')

$scope.timeStep = 'Любое время';
$scope.dayStep = 'Сегодня';
$scope.statusStep = 'Все';
$scope.options = {
    timeStep: ['Любое время',
    '00:00 - 02:00',
    '02:00 - 04:00',
    '04:00 - 06:00',
    '06:00 - 08:00',
    '08:00 - 10:00',
    '10:00 - 12:00',
    '12:00 - 14:00',
    '14:00 - 16:00',
    '16:00 - 18:00',
    '18:00 - 20:00',
    '20:00 - 22:00',
    '22:00 - 24:00'
    ],
    dayStep: ['Вчера', 'Сегодня', 'Завтра', 'Послезавтра'],
    statusStep: ['Все', 'В полете', 'Прибыл', 'Отменен', 'Регистрация']
  };

$scope.changed = function(){
  var d = new Date();
  const regex = /(\d*):00 - (\d*):00/;
  $scope.start = new Date();
  $scope.end = new Date();
  switch ($scope.dayStep) {
    case 'Вчера':
      $scope.start.setDate(d.getDate()-1)
      $scope.end.setDate(d.getDate())
      break;
    case 'Сегодня':
     $scope.start.setDate(d.getDate())
     $scope.end.setDate(d.getDate())
      break;
    case 'Завтра':
      $scope.start.setDate(d.getDate()+1)
      $scope.end.setDate(d.getDate()+1)
      break;
    case 'Послезавтра':
      $scope.start.setDate(d.getDate()+2)
      $scope.end.setDate(d.getDate()+2)
     break;
  }
  switch ($scope.timeStep) {
    case 'Любое время':
      $scope.start.setHours(0, 0, 0)
      $scope.end.setHours(24, 0, 0)
      break;
    default:
      ti = $scope.timeStep.match(regex)
      $scope.start.setHours(parseInt(ti[1]), 0, 0)
      $scope.end.setHours(parseInt(ti[2]), 0, 0)
  }
  $scope.loadDirection('departure')
}

});
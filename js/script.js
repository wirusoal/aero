angular.module('plane.tablo', ['ngSanitize', 'ui.bootstrap', 'ngTable'])

angular.module('plane.tablo').controller('AlertDemoCtrl', function($scope, $http, NgTableParams) {
  $scope.start = new Date();
  $scope.start.setHours(0, 0, 0)
  $scope.end = new Date();
  $scope.end.setHours(24, 0, 0)

  // Разбираем строковое представление которое нам возвращает сервер аэропорта
  $scope.parseTime = function(data) {
    return Date.parse(data);
  }
  
 // Добавляем ноль если часы,минуты  10
  $scope.addZero = function(p) {
    return ("0" + p).slice(-2)
  }

  // Подготавливаем строку со временем, для отправки на сервер т.к toISOString() сервер не обрабатывает
  $scope.parseTimeToString = function(data) {
    return data.getFullYear() + '-' + $scope.addZero(data.getMonth() + 1) + "-" + $scope.addZero(data.getDate()) + "T" + $scope.addZero(data.getHours()) + ":00:00%2B03:00"
  }

  // Возвращем время формата час:минута
  $scope.getTime = function(parse) {
    parse = new Date(parse)
    parse.setHours(parse.getUTCHours() + 3)
    return $scope.addZero(parse.getHours()) + ":" + $scope.addZero(parse.getMinutes());
  }
  
  // Основная каша, которая получает результат с сервера аэропорта,через прокси сервер и обрабатывает его.
  $scope.loadDirection = function(direction, search = false) {
    $scope.direction = direction;
    let url = 'https://labelimg.ru/timetable.php?direction=' + direction + ((search) ? '&search=' + search : '') + '&dateStart=' + $scope.parseTimeToString($scope.start) + '&dateEnd=' + $scope.parseTimeToString($scope.end) + '&perPage=9999&page=0&locale=ru'
    $scope.loadingHttp = true;
    $http.get(url).then(function successCallback(response) {
    //***************************
    // Код ниже выполняет фильтрацию и объеденение попутных рейсов в одну сторону.
    // К примеру вместо:
    // -----------------
    // | N4 3533 Самара|
    // | N9 2345 Самара|
    // -----------------
    // Выводит красивое
    // -----------------
    // | N4 3533 Самара|
    // | N9 2345       |
    // -----------------
    //***************************
      for (let i = 0; i < response.data.items.length; i++) { // Перебираем рейсы
        if (response.data.items[i].main_flight != '') { // Если у этого рейса main_flight не пустой, значит он является попутным
          for (let x = 0; x < response.data.items.length; x++) { // Снова перебираем рейсы
            if (response.data.items[i].main_flight == response.data.items[x].i_id) { // И ищем совпадения
              var s = response.data.items[i];
              if (response.data.items[x]['Flight'] == undefined) { // Если нашли совпадение, то добавляем объект,в который будем записывать рейсы
                response.data.items[x]['Flight'] = []
              }
              response.data.items[x]['Flight'].push({
                'code': s.co.code,
                'id': s.co.livreiImageId.id,
                'flt': s.flt
              })
            }
          }
        }
      }

      let addFlightNull = response.data.items.filter(function(n) { // Фильтруем только основные рейсы,а не попутные
        return n.main_flight == '';
      });

      if ($scope.statusStep != 'Все') { // Т.к в задании был пункт просмотра задержаных рейсов,а api этого не позволяет, то будем каждый перебирать и читать его статус
        addFlightNull = addFlightNull.filter(function(n) {
          return n.vip_status_rus.match($scope.statusStep);
        });
      }

      $scope.tableParams = new NgTableParams({
        count: 15
      }, {
        counts: [30, 40, 50],
        dataset: addFlightNull
      });
      $scope.loadingHttp = false;
    });

  };
  // Функция автодополнения, по рейсу, городу, тоже воруем с сервера аэропорта
  $scope.searchLocation = function(val) {
    return $http.get('https://labelimg.ru/search.php?q=' + val + '&locale=ru').then(function(response) {
      return response.data.slice(0, 15).map(function(item) { // Выводим 15 результатов
        return item
      });
    });
  };
  
  $scope.search = function(s) {
    $scope.loadDirection($scope.direction, s.replace(/\"/gm, ''))
  }

  // Работа со временем,днем, статусом
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

  $scope.changed = function() {
    var d = new Date();
    const regex = /(\d*):00 - (\d*):00/;
    $scope.start = new Date();
    $scope.end = new Date();
    switch ($scope.dayStep) {
      case 'Вчера':
        $scope.start.setDate(d.getDate() - 1)
        $scope.end.setDate(d.getDate())
        break;
      case 'Сегодня':
        $scope.start.setDate(d.getDate())
        $scope.end.setDate(d.getDate())
        break;
      case 'Завтра':
        $scope.start.setDate(d.getDate() + 1)
        $scope.end.setDate(d.getDate() + 1)
        break;
      case 'Послезавтра':
        $scope.start.setDate(d.getDate() + 2)
        $scope.end.setDate(d.getDate() + 2)
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
    $scope.loadDirection('departure')
});
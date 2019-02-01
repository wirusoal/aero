<?php
header('Access-Control-Allow-Origin: *');
$query = parse_url($_SERVER['REQUEST_URI'])['query'];//direction=departure&dateStart=2019-01-30T00:00:00%2B03:00&dateEnd=2019-01-31T00:00:00%2B03:00&perPage=9999&page=0&locale=ru
$data = file_get_contents('https://www.svo.aero/bitrix/timetable/?'.$query);
echo $data;
?>
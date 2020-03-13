/**
 * Map2D Plugin *
 *  - при клике на карте - отправляет караван туда
 *  - в update проверяет прибытие в город
 */
Map2DPlugin = {
    // чтобы не гонять DOM каждый раз - гоняем только когда обновляются координаты игрока
    // для этогоп делаем проверку через это поле
    lastPlayerPosition: {x: -1000, y: -1000},
    // маркер "мы в городе" - соответствует "открыт диалог города"
    inTown: false,
    // последний посещенный город
    lastTown: {x: -1000, y: -1000},
};

var findCityByNumber = function(number, world)
{
    for (var i = 0; i < world.cities.length; i++) {
        if(world.cities[i].number===number){
            return world.cities[i];
        }
    }

    return null;
}

Map2DPlugin.init = function (world) {
    this.world = world;

    // элементы для отображения карты
    this.view = {};
    this.view.player = document.getElementById('map-player'); // маркер игрока
	var map = document.getElementById('game-map2d');
	var map_player = document.getElementById('map-player');
    // добавляем в них города - пока два
    this.view.towns = document.getElementsByClassName('town');

    // вешаем на города обработчики кликов, чтобы отправлять туда караван
    var map2dPlugin = this;
	
	map_player.addEventListener("click", function (e) {            
			 e.stopPropagation();
        });
	
	map.addEventListener("click", function (e) {
            if (world.uiLock) return; // если какой-то плагин перехватил работу с пользователем, то есть открыто модальное окно, не реагируем на действия пользователя
			
             world.from = {x: world.caravan.x, y: world.caravan.y};//todo
             world.to = {x: e.offsetX, y: e.offsetY};
             world.stop = false;
             map2dPlugin.inTown = false; // все, покидаем город
			 e.stopPropagation();
        });
		
	var i;
    for (i = 0; i < this.view.towns.length; i++) {
        this.view.towns[i].addEventListener("click", function (e) {
            if (world.uiLock) return; // если какой-то плагин перехватил работу с пользователем, то есть открыто модальное окно, не реагируем на действия пользователя
            var element = e.target || e.srcElement;
            world.from = {x: world.caravan.x, y: world.caravan.y};//todo
            var city = findCityByNumber(element.cityNumber,world);
            world.to = {x: city.x, y: city.y};
            world.stop = false;
            map2dPlugin.inTown = false; // все, покидаем город    
			e.stopPropagation()			
        });
    }
	
    // если найдены города на карте, помещаем игрока в первый попавшийся
	
    if (this.world.cities.length > 0) {
		var startCity = this.world.cities[0];
        world.caravan.x = startCity.x;
        world.caravan.y = startCity.y;
        // запоминаем его как последний, чтобы не торговать в нем же при быстром возвращении
        this.lastTown = startCity;
		this.lastTown.isFirstStop = true;
        world.stop = true; // чтобы не двигался
        this.movePlayerViewTo(world.caravan.x, world.caravan.y);		
    }
		
};

Map2DPlugin.update = function () {
    if (this.inTown) return; // если открыт диалог города - ничего не делаем

    // обновляем DOM только когда есть изменения в координатах
    if (this.lastPlayerPosition.x != this.world.caravan.x ||
        this.lastPlayerPosition.y != this.world.caravan.y) {
        this.movePlayerViewTo(this.world.caravan.x, this.world.caravan.y);
        this.lastPlayerPosition.x = this.world.caravan.x;
        this.lastPlayerPosition.y = this.world.caravan.y;
    }
	
	//проверяем достижение города на остановках
    if (this.world.stop) {
        var i;
		for (i = 0; i < this.world.cities.length; i++) {
			var city = this.world.cities[i];
			if(areNearPoints(this.world.caravan, city, Caravan.TOUCH_DISTANCE))
			{
				this.inTown = true;
				this.world.uiLock = true; // маркируем интерфейс как блокированный
				addLogMessage(this.world, Goodness.positive, `Вы достигли города ${city.name}`);
				// проверка что мы были в этом городе
				var revisit = this.lastTown.number===city.number && !this.lastTown.isFirstStop;
				this.lastTown.isFirstStop = false;
				// запоминаем последений посещенный город
				this.lastTown = city;
				DialogWindow.show(TownDialogs, this.world, revisit, this);
			}				
        }
    }    
};


Map2DPlugin.movePlayerViewTo = function (x, y) {
    this.view.player.style.left = x-34/2 + "px"; // сдвигаем маркер на карте
    this.view.player.style.top = y -26/3+ "px"; // сдвигаем маркер на карте
};

Map2DPlugin.onDialogClose = function () {
    // запоминаем этот город, как последний, чтобы не было чита с автоторговлей
    this.world.uiLock = false;
};

Game.addPlugin(Map2DPlugin);
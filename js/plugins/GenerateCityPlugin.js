/*
 *      Плагин создания городов
 * */
GenerateCity = {};

GenerateCity.init = function (world) {
      this.world = world;
      world.cities = [
	  {
		name:"Moscow",
		x:0,
		y:0,
		number:1,
		size:10
	  },
	  {
		name:"St.Petersburg",
		x:160,
		y:40,
		number:2,
		size:8
	  }
	  ]
	  
	  updateVisibleCities(world);
	  
};

var updateVisibleCities = function(world)
{
	for (i = 0; i < world.cities.length; i++) {
        var city = world.cities[i];
        if(areNearPoints(city,world.caravan,100)){
			var cityElement = document.getElementById("city"+city.number);
			cityElement.classList.remove("hidden");
			cityElement.style=`top:${city.y}px;left:${city.x}px;`
		}
    }
};

GenerateCity.update = function () {
   updateVisibleCities(this.world);
};

Game.addPlugin(GenerateCity);
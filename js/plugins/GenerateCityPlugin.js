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
		x:75,
		y:75,
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
        if(areNearPoints(city,world.caravan,50)){
			var cityElement = document.getElementById("city"+city.number);
			cityElement.classList.remove("hidden");
		}
    }
};

GenerateCity.update = function () {
   updateVisibleCities(this.world);
};

Game.addPlugin(GenerateCity);
/*
 *      Плагин создания городов
 * */
GenerateCity = {};

GenerateCity.init = function (world) {
	  hideAllCities();
	
      this.world = world;
	  var cities = [
	  {
		name:"Moscow",
		x:99999,
		y:99999,
		number:1,
		size:12615
	  },
	  {
		name:"St.Petersburg",
		x:99999,
		y:99999,
		number:2,
		size:5383
	  },
	  {
		name:"Novosibirsk",
		x:99999,
		y:99999,
		number:3,
		size:1618
	  },
	  {
		name:"Ekaterinburg",
		x:99999,
		y:99999,
		number:4,
		size:1483
	  },
	  {
		name:"N.Novgorod",
		x:99999,
		y:99999,
		number:5,
		size:1253 
	  },
	  {
		name:"Kazan",
		x:99999,
		y:99999,
		number:6,
		size:1251 
	  },
	  {
		name:"Chelyabinsk",
		x:99999,
		y:99999,
		number:7,
		size:1200 
	  },
	  {
		name:"Omsk",
		x:99999,
		y:99999,
		number:8,
		size:1164 
	  },
	  {
		name:"Samara",
		x:99999,
		y:99999,
		number:9,
		size:1156 
	  },
	  {
		name:"Rostov",
		x:99999,
		y:99999,
		number:10,
		size:1133 
	  },
	  {
		name:"Ufa",
		x:99999,
		y:99999,
		number:11,
		size:1124 
	  },
	  {
		name:"Krasnoyarsk",
		x:99999,
		y:99999,
		number:12,
		size:1095
	  },
	  {
		name:"Voronezh",
		x:99999,
		y:99999,
		number:13,
		size:1054
	  },
	  {
		name:"Perm",
		x:99999,
		y:99999,
		number:14,
		size:1053
	  },
	  {
		name:"Volgograd",
		x:99999,
		y:99999,
		number:15,
		size:1013
	  }
	  ];
	  
	  	  
	  
	  world.cities=[];
	  
      var cityCount = 10;
	  for (i = 0; i < cityCount; i++) {
		  
		var cityNumber = getRandomInt(cities.length);
		  
        var city = cities[cityNumber];
		cities.splice(cityNumber, 1);
        
		var cityPlaced = false;
		do {
			i = i + 1;
			cityPlaced = putCity(world,city);
			
		} while (i < 10 && !cityPlaced);
		
		if(cityPlaced){
				world.cities.push(city);
		}
	}
	  
	  
	  updateVisibleCities(world);
	  
};

var putCity = function(world, city)
{
	city.x = getRandomInt(world.maxX);
	city.y = getRandomInt(world.maxY);
	
	for (i = 0; i < world.cities.length; i++) {
		  
		var checkingCity = world.cities[i]
		
		//var result = areNearPoints(city, checkingCity, city.size*2/100+checkingCity.size*2/100);
		//var result = areNearPoints(city, checkingCity, Caravan.TOUCH_DISTANCE*4);
		var result = areNearPoints(city, checkingCity, 32*4);
		
		if(result)
		{
			return false;
		}				
	}
	
	return true;
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

var hideAllCities = function()
{
	var cities = document.getElementsByClassName("city");
	for (i = 0; i < cities.length; i++) {
        var city = cities[i];
        city.classList.add("hidden");
    }
};

GenerateCity.update = function () {
   updateVisibleCities(this.world);
};

Game.addPlugin(GenerateCity);
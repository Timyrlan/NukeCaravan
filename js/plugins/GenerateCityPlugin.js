/*
 *      Плагин создания городов
 * */
GenerateCity = {};

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

GenerateCity.init = function(world) {
    hideAllCities();

    this.world = world;
    const cities = [
        {
            name: "Moscow",
            x: 99999,
            y: 99999,
            number: 1,
            size: 12615
        },
        {
            name: "St.Petersburg",
            x: 99999,
            y: 99999,
            number: 2,
            size: 5383
        },
        {
            name: "Novosibirsk",
            x: 99999,
            y: 99999,
            number: 3,
            size: 1618
        },
        {
            name: "Ekaterinburg",
            x: 99999,
            y: 99999,
            number: 4,
            size: 1483
        },
        {
            name: "N.Novgorod",
            x: 99999,
            y: 99999,
            number: 5,
            size: 1253
        },
        {
            name: "Kazan",
            x: 99999,
            y: 99999,
            number: 6,
            size: 1251
        },
        {
            name: "Chelyabinsk",
            x: 99999,
            y: 99999,
            number: 7,
            size: 1200
        },
        {
            name: "Omsk",
            x: 99999,
            y: 99999,
            number: 8,
            size: 1164
        },
        {
            name: "Samara",
            x: 99999,
            y: 99999,
            number: 9,
            size: 1156
        },
        {
            name: "Rostov",
            x: 99999,
            y: 99999,
            number: 10,
            size: 1133
        },
        {
            name: "Ufa",
            x: 99999,
            y: 99999,
            number: 11,
            size: 1124
        },
        {
            name: "Krasnoyarsk",
            x: 99999,
            y: 99999,
            number: 12,
            size: 1095
        },
        {
            name: "Voronezh",
            x: 99999,
            y: 99999,
            number: 13,
            size: 1054
        },
        {
            name: "Perm",
            x: 99999,
            y: 99999,
            number: 14,
            size: 1053
        },
        {
            name: "Volgograd",
            x: 99999,
            y: 99999,
            number: 15,
            size: 1013
        }
    ];


    world.cities = [];
    var map = document.getElementById('game-map2d');
    const cityCount = 10;
    for (var i = 0; i < cityCount; i++) {

        const cityNumber = getRandomInt(cities.length);

        const city = cities[cityNumber];
        cities.splice(cityNumber, 1);

        let cityPlaced = false;
        do {
            i = i + 1;
            cityPlaced = putCity(world, city);

        } while (i < 10 && !cityPlaced);

        

        if (cityPlaced) {
            world.cities.push(city);
            var cityHtml = `<div id="city${city.number}" class="city hidden" style="top:${city.y - 64 / 2}px;left:${city.x - 64 / 2}px;"> <div class="town "></div> <div class="townCaption" style="top: 70px; "><p id="cityCaption${city.number}">${city.name}</p></div> </div>`;
            var cityElement = htmlToElement(cityHtml);
            map.appendChild(cityElement);
        }
    }
};



var putCity = function(world, city) {
    city.x = getRandomInt(world.maxX);
    city.y = getRandomInt(world.maxY);

    for (var i = 0; i < world.cities.length; i++) {

        const checkingCity = world.cities[i];

        //var result = areNearPoints(city, checkingCity, city.size*2/100+checkingCity.size*2/100);
        //var result = areNearPoints(city, checkingCity, Caravan.TOUCH_DISTANCE*4);
        const result = areNearPoints(city, checkingCity, 32 * 4);

        if (result) {
            return false;
        }
    }

    return true;
};

var updateVisibleCities = function(world) {
    for (var i = 0; i < world.cities.length; i++) {
        const city = world.cities[i];
        if (areNearPoints(city, world.caravan, 100)) {
            const cityElement = document.getElementById(`city${city.number}`);
            cityElement.classList.remove("hidden");
        }
    }
};

var hideAllCities = function() {
    const cities = document.getElementsByClassName("city");
    for (var i = 0; i < cities.length; i++) {
        const city = cities[i];
        city.classList.add("hidden");
    }
};

GenerateCity.update = function() {
    updateVisibleCities(this.world);
};

Game.addPlugin(GenerateCity);
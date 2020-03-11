String.prototype.withArg = function (arg1, arg2) {
    var str = this.replace("$1", arg1);
    if (arg2) {
        str = str.replace("$2", arg2);
    }
    return str;
};

Array.prototype.getRandom = function () {
    // Math.random() will never be 1, nor should it.
    return this[Math.floor(Math.random() * this.length)];
};

// функция для взятия описания по числу от 0 до 1
// описания в массиве идут от 0 до 1, описаний может быть сколько угодно
Array.prototype.getByDegree = function (number) {
    if (number > 1) number = 1;
    var maxI = this.length - 1;
    return this[Math.floor(maxI * number)];
};

// функция проверки для выпадения случаного события с вероятностью от 0 до 1
function checkProbability(probability) {
    return Math.random() <= probability;
}

// функция для проверки выпадения случайного события на текущем шаге игры
function checkEventForStep(dayProbability) {
    var probability = dayProbability * GameConstants.STEP_IN_MS / GameConstants.DAY_IN_MS;
    return checkProbability(probability);
}/**
 *  Простое универсальное диалоговое окно для магазинов, атак и дропа
 *  1. один раз за игру вызываем init для привязки к DOM-элементам
 *  2. в любом плагине создаем набор диалогов в формате
 *  var SomeDialogs = {
 *      "start": { // обязательный тег
            icon: "ПУТЬ К ИКОНКЕ",
            exit: false, // или true если надо показать кнопку закрытия диалога
            title: "Заголовок диалога",
            desc: "Описание диалога",
            desc_action: function (arg1, arg2) { // любой набор операций, лишь бы возвращалась строка,
                которая добавиться к описанию диалога},
            choices: [ // массив объектов для операций выбора в формате
                        {
                            text: "Выбор первый",
                            action: function(arg1, arg2) {
                                // любой набор операций с объектами arg1 и arg2
                                // и любыми глобальными объектами
                            }

                        },
                        ...
                        {...}
                     ]
 *  }
 *
 *  3. В плагине обязательно реализуем функцию для выполнения операций ПОСЛЕ закрытия диалога
  *     для примера
         SomePlugin.onDialogClose = function () {
                this.world.uiLock = false; // снимаем захват с действий пользователя
                this.world.stop = false; // продолжаем путешествие
            };

    4. Вызываем в плагине диалог в формате
        this.world.uiLock = true; // снимаем захват с действий пользователя
        this.world.stop = true; // продолжаем путешествие
        dialogView.show(SomeDialogs, arg1, arg2, this);
        где
            SomeDialogs - подготовленный как указано выше ассоциативный массив диалогов
            arg1, arg2 - любые объекты для операций в диалогах (обычно world и собственный дата-объект плагина)
            this - ссылка на сам плагин, чтобы диалог при закрытии активировал onDialogClose
 */

var DialogWindow = {
    // массив финишных тегов, которые служат маркерами для выхода
    // они проверяются только в случае, если в описаниях диалогов нет таких диалогов
    // таким образом, эти теги можно переопределять
    finish_tags: [ "finish", "exit", "stop"]
};

DialogWindow.init = function () {
    // два аргумента, через которые при вызове диалога конкретны плагином, можно передавать данные для модификации
    this.arg1 = {};
    this.arg2 = {};
    // описания диалогов, в одном окне может быть куча диалогов
    this.dialogs = [];
    // коллбэки для диалогов
    this.dialogActions = [];
    // вызывающий объект
    this.parent = {};

    // находим и сохраняем все DOM-элементы, необходимые для вывода информации
    this.view = {};
    this.view.window = document.getElementById('dialog'); // по сути не само окно, а окно с большой тенью
    this.view.title = document.getElementById('dialog-title');
    this.view.icon = document.getElementById('dialog-icon');
    this.view.hint = document.getElementById('dialog-hint');
    this.view.choices = document.getElementById('dialog-choices');
    this.view.exitButton = document.getElementById('dialog-exit-button');

    // Обработка кликов
    // класс для кнопки выбора
    this.CHOICE_CLASS_NAME = 'dialog-choice';
    this.CHOICE_ATTRIBUTE = 'choice';

    // Добавляем реакцию на клик пользователя
    // используется универсальный listener для всего диалога
    // просто отслеживаем конкретно на чем кликнули
    var dialogWindow = this;
    this.view.window.addEventListener('click', this.listener.bind(this));
};

DialogWindow.listener = function (e) {
    var target = e.target || e.src;
    // клик на кнопке. Кнопка у нас - выход
    if (target.tagName == 'BUTTON') {
        this.close(); // выход
        return; // обработка закончилась
    }
    // клик на каком-то из выборов
    if (target.tagName == 'DIV' && target.className.indexOf(this.CHOICE_CLASS_NAME) !== -1) {
        // получаем из атрибута номер коллбэка
        var choiceIndex = target.getAttribute(this.CHOICE_ATTRIBUTE);
        // передаем этому коллбэку аргументы диалога
        // и получаем тег для следующего диалога
        var choiceTag = this.dialogActions[choiceIndex](this.arg1, this.arg2);
        this.showDialog(choiceTag);
        return; // обработка закончилась
    }
};

/*
 *   При вызове диалога ему следует передать ассоциативный массив описаний диалогов
 *   и два аргумента, которые можно использовать в коллбэках выбора в конкретном диалоге
 * */
DialogWindow.show = function (dialogs, arg1, arg2, parent) {
    this.dialogs = dialogs;
    this.arg1 = arg1;
    this.arg2 = arg2;
    this.parent = parent;
    this.showDialog("start");
    this.view.window.classList.remove("hidden");
};

// прячем окно и очищаем используемые переменные
DialogWindow.close = function () {
    this.arg1 = {};
    this.arg2 = {};
    this.dialogs = [];
    this.dialogActions = [];
    this.view.exitButton.classList.add("hidden");
    this.view.window.classList.add("hidden");
    if(typeof this.parent.onDialogClose==="function"){
        this.parent.onDialogClose();
    }
};

/*
 *   Показываем диалог с тегом.
 * */
DialogWindow.showDialog = function (dialogTag) {
    // если такого тега нет - проверяем выход или ошибку
    if (!this.dialogs.hasOwnProperty(dialogTag)) {
        // если команда выхода - выходим
        if(this.finish_tags.indexOf(dialogTag)){
            this.close();
            return;
        }
        // иначе сообщение об ошибке
        console.log("!! DialogWindow Error! Диалог с названием " + dialogTag + " не найден");
        return;
    }
    var dialog = this.dialogs[dialogTag];
    this.view.title.innerHTML = this.getString(dialog, "title"); // устанавливаем заголовок диалога
    var imageSrc = this.getString(dialog, "icon");
    if(imageSrc.length>0){
        this.view.icon.setAttribute("src",imageSrc ); // устанавливаем картинку
        this.view.icon.classList.remove("hidden");
    }
    else {
        this.view.icon.classList.add("hidden");
    }


    // Описание. С возможностью вычисляемых параметров.
    var description = this.getString(dialog, "desc"); // если есть базовое описание - ставим его
    // Вычисляем дополнительную инфу для диалога - если у него реализована функция desc_action
    if (typeof dialog.desc_action === "function") {
        description += dialog.desc_action(this.arg1, this.arg2);
    }
    this.view.hint.innerHTML = description;

    // Очищаем предыдущие выборы
    this.dialogActions = []; // очищаем массив коллбэков
    this.view.choices.innerHTML = ''; // очищаем видимые элементы предыдущего выбора

    // если есть выборы - добавляем их
    var choices = this.getArr(dialog, "choices");
    var i, choice;
    for (i = 0; i < choices.length; i++) {
        choice = dialog.choices[i];
        this.addChoice(i, choice.text); // создаем div со специальным атрибутом с номером выполняемой функции
        this.dialogActions[i] = choice.action; // запоминаем коллбэк под этой же функцией
    }

    if (this.getBoolean(dialog, "exit")) {
        this.view.exitButton.classList.remove("hidden");
    }
    else {
        this.view.exitButton.classList.add("hidden");
    }
};


// добавляем кнопку выбора действий в окно с текстом
DialogWindow.addChoice = function (index, text) {
    this.view.choices.innerHTML += '<div class="' + this.CHOICE_CLASS_NAME + '" ' + this.CHOICE_ATTRIBUTE + '="' + index + '">' + text + '</div>';
};

// проверяем, есть ли поле у объекта, если нет - возвращаем пустую строку
DialogWindow.getString = function (dialog, fieldName) {
    return dialog.hasOwnProperty(fieldName) ? dialog[fieldName] : "";
};

// проверяем, есть ли поле у объекта, если нет - возвращаем пустой массив
DialogWindow.getArr = function (dialog, arrFieldName) {
    return dialog.hasOwnProperty(arrFieldName) ? dialog[arrFieldName] : [];
};

DialogWindow.getBoolean = function (dialog, booleanFieldName) {
    return dialog.hasOwnProperty(booleanFieldName) ? dialog[booleanFieldName] : false;
};/*
 *   Дата класс для хранения состояния мира игры
 * */
function WorldState(stats) {
    this.day = 0;           // текущий день, с десятичными долям
    this.crew = stats.crew; // количество людей
    this.oxen = stats.oxen; // количество быков
    this.food = stats.food; // запасы еды
    this.firepower = stats.firepower; // единиц оружия
    this.cargo = stats.cargo;   // товаров для торговли
    this.money = stats.money;   //деньги

    // лог событий, содержит день, описание и характеристику
    //  { day: 1, message: "Хорошо покушали", goodness: Goodness.positive}
    this.log = [];

    // координаты каравана, пункта отправления и назначения
    this.caravan = { x: 0, y: 0};
    this.from = {x: 0, y: 0};
    this.to = {x: 0, y: 0};

    this.distance = 0; // сколько всего пройдено

    this.gameover = false;  // gameover
    this.stop = false;    // маркер для обозначения того, что караван стоит
    this.uiLock = false; // маркер для блокировки интерфейса
}/**
 *  Функции для вычисления данных по параметрам мира
 */

// детекция, что точка 1 находится рядом с точкой 2
// nearDistance - расстояние срабатывания
function areNearPoints(point1, point2, nearDistance) {
    return getDistance(point1, point2) <= nearDistance;
}

// расстояние между двумя точками (объектами с полями x и y)
function getDistance(point1, point2) {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

// максимальный вес, который может нести караван
function getCaravanMaxWeight(world) {
    return world.oxen * Caravan.WEIGHT_PER_OX + world.crew * Caravan.WEIGHT_PER_PERSON;
}

// текущий вес, который тащит  караван
function getCaravanWeight(world) {
    return world.food * Caravan.FOOD_WEIGHT
        + world.firepower * Caravan.FIREPOWER_WEIGHT
        + world.cargo;
}

// не перегружен ли караван
function hasCaravanOverweight(world) {
    return getCaravanWeight(world) > getCaravanMaxWeight(world);
}

// Награда за прибытие в город - премия за сохраненный груз
function sellCargo(world) {
    var cargo = world.cargo;
    var money = cargo * Caravan.CARGO_PRICE;
    world.money += money;
    world.cargo = 0;
    return {money: money, cargo: cargo};
}

// Покупка груза, учитывает вес уже купленного и наличие денег
function buyCargo(world) {
    var cargoMax = world.money / Caravan.CARGO_BUY_PRICE;
    var newCargo = world.oxen * Caravan.CARGO_PER_OX - world.cargo; // сколько можем купить
    newCargo = Math.min(cargoMax, newCargo); // вычисляем адекватную нагрузку по кошельку
    var money = newCargo * Caravan.CARGO_BUY_PRICE;
    world.cargo += newCargo;
    world.money -= money;
    return {money: money, cargo: newCargo};
}

// добавляем сообщение в лог
function addLogMessage(world, goodness, message) {
    world.log.push({
        day: world.day,
        message: message,
        goodness: goodness
    });

    // если лог превысил указанный размер, удаляем старые сообщения
    if(Object.keys(world.log).length > GameConstants.MAX_LOG_MESSAGES){
        world.log.shift();
    }
}

/**
 *  Тип события для лога - положительный, отрицательный, нейтральный
 */
var Goodness = {
    positive: 'positive',
    negative: 'negative',
    neutral: 'neutral'
};/**
 *  Стартовые параметры мира / каравана
 */

var StartWorldState = {
    crew: 8, // число людей в команде
    oxen: 4, // число тягловой силы, помимо людей
    food: 300, // еда на людей
    firepower: 4, // единиц оружия
    money: 1000,  // денег в караване
    cargo: 250,  // товары для продажи в городе
};/**
 *  Константы по времени игры
 */

var GameConstants = {
    STEP_IN_MS: 20, // интервал между обновлениями игры
    DAY_IN_MS: 2000, // 2000 // день каравана в наших миллисекундах
    MAX_LOG_MESSAGES: 10, // максимум сообщений в логе
};/**
 *   Базовые константы каравана
 *   для настроек событий и встреч - смотри соответствующие константы
 */
var Caravan = {
    WEIGHT_PER_PERSON: 30, // вес, который может нести один человек
    WEIGHT_PER_OX: 200, // вес на одного быка / средство передвижения

    FOOD_WEIGHT: 0.6,  // вес 1 порции еды
    FIREPOWER_WEIGHT: 5,    // вес 1 единицы оружия, примерно возьмем за основу вес калашаникова с 2 рожками

    FOOD_PER_PERSON: 3,  // порций еды на 1 человека в день

    MEAT_PER_OX: 40,  // порций еды из 1 брамина при автопоедании

    FULL_SPEED: 55,  // максимальная скорость каравана в день,
    SLOW_SPEED: 38, // минимальная скорость каравана в день,

    CARGO_PRICE: 2, // за сколько продаем 1 единицу товара (cargo)
    CARGO_PER_OX: 150, // сколько берем товаров, в пересчете на вола, в новом городе
    CARGO_BUY_PRICE: 1, // за сколько покупаем 1 единицу товара (cargo)

    TOUCH_DISTANCE: 10, // расстояние до точки прибытия, при котором срабатывает прибытие

};/**
 *  Условия и параметры для встреч с бандитами
 *  логика в BanditPlugin
 */
var BanditConstants = {
    DISTANCE_MIN: 100, // минимальное расстояние между стычками и от городов
    EVENT_PROBABILITY: 0.1, // базовая вероятность случайного события в текущий день
    ATTACK_PROBABILITY: 0.75, // вероятность атаки

    GOLD_PER_FIREPOWER: 5, // соотношение золота к количеству стволов - для генерации золота

    FIGHT_DEFENSE_K: 0.5, // Понижающий коээфициент для лута и потерь при обороне
    RUN_DAMAGE_K: 0.7, // Понижающий коээфициент для дамага по команде при побеге

    // коэффициенты потерь при побеге
    // конкретно тут логика такая, что еду и деньги мы прячем лучше
    // а бедным волам-браминам тяжело уворачиваться от пуль
    // ну и вообще бежать с грузом
    RUN_CARGO_LOST_K: 0.75, // для товаров
    RUN_OXES_LOST_K: 0.75, // для волов
    RUN_FOOD_LOST_K: 0.85, // для еды
    RUN_GOLD_LOST_K: 0.95, // для денег


    // Текст для голодного найма
    HIRE_INFO: "Людей для найма: $1. Оружия при них: $2.",
    HIRE_PRICE_INFO: "Цена найма: $$1",

    HIRE_PRICE_PER_PERSON: 60, // базовая ставка найма бандитов за 1 голову


    NOTICE_MESSAGE: "Вы наткнулись на бандитов!", // сообщение о том, что вы заметили бандитов, а они вас
    MEET_UP_CHOICE: "Подойти", // текст на кнопке для встречи с бандитами, есть шанс разойтись миром
    RUN_CHOICE: "Бежать", // текст на кнопке для побега. Теперь они в любом случае попробуют вас атаковать

    HUNGER_CARAVAN_FOOD_PER_PERSON_THRESHOLD: 3, // число порций еды на человека в караване, с которых считается, что у вас относительно много еды
    HUNGER_THRESHOLD: 0.5, // начиная с этой величины и меньше бандиты считаются голодными
    HUNGER_DEATH_THRESHOLD: 0.2, // начиная с этой величины бандиты считаются очень голодными и готовы присоединиться бесплатно

    HUNGER_GANG_MESSAGE: "Ослепленные вашим оружием и воодушевленные вашими запасами еды, бандиты решили примкнуть к вам!", // сообщение, что бандиты оказались голодны и слабовооружены, поэтому хотят примкнуть к вам за дешевый прайс, может и бесплатно
    HUNGER_HIRE_CHOICE: "Нанять $1 человек за $$2", //  вместо $1 будет вычисленное число
    HIRE_DECLINE_CHOICE: "Отказать", //
    HUNGER_ATTACK_CHOICE: "Атаковать слабаков", // Во время атаки могут погибнуть ваши люди, но вы получаете оружие и деньги

    ATTACK_MESSAGE: "Увидев вашу слабость, подонки нападают!", // и когда бежишь, и когда встречаешься, но слаб
    ATTACK_CHOICE: "Принять бой",

    // на случай максимального голода - бандиты просятся бесплатно
    HUNGER_MAX_DECLINE_MESSAGE: "Бандиты догоняют вас и просят принять к себе",
    HUNGER_MAX_DECLINE_DESC: "Если вы откажете, мы умрем с голоду в этой проклятой пустоши!",
    // варианты выбора  такие же как и при первом голодном найме

    RUN_MESSAGE: "Вы позорно бежали, преследуемые улюлюкающими бандитами",

    // тексты для разных результов боя
    FIGHT_LOST_MESSAGE: "Поражение!",
    FIGHT_LOST_DESC: "Бандиты одержали победу в бою",
    FIGHT_WIN_MESSAGE: "Победа!",
    FIGHT_WIN_DESC: "Вы одержали славную победу над бесславными ублюдками",

    // следующие тексты могут быть и при неудачном бое, и при побеге, просто различаются количеством
    LOST_WEAPON_MESSAGE: "Потеряно оружия: $1", //  вместо $1 будет вычисленное число
    LOST_CREW_MESSAGE: "Погибло ваших людей: $1",
    LOST_MONEY_MESSAGE: "Потеряно денег: $$1",

    // это тексты - для победы
    LOOT_TITLE: "С павших бандитов вы подняли: ",
    LOOT_WEAPON_MESSAGE: "оружие: $1", //  вместо $1 будет вычисленное число
    LOOT_MONEY_MESSAGE: "деньги: $$1",

    HIRE_FINISHED_TEXT: "Бандиты перешли на вашу сторону. Людей: +$1, Оружия: +$2",

    // финальная кнопка, все закончилось
    EXIT_BUTTON: "Дальше"
};


// Возможное вооружение бандитов
// можно добавлять свои варианты, сохраняя порядок возрастания
var BanditFirepowers = [
    'безоружны',
    'слабо вооружены',
    'вооружены',
    'хорошо вооружены',
    'вооружены до зубов'
];

// Возможное число бандитов
// можно добавлять свои варианты, сохраняя порядок возрастания
var BanditNumbers = [
    'очень мало',
    'мало',
    'достаточно',
    'много',
    'очень много'
];

// Просто дополнительное описание бандитов, берется рандомом, порядок не важен
// пожалуй, важно сохранять нейтрально-оценивающий характер
var BanditAtmospheric = [
    'ковыряются в зубах и смотрят на вас с плотоядным интересом',
    'оценивающе смотрят на ваш груз и стволы',
    'видят ваш караван',
    'возбужденно перекликиваются между собой и тычут пальцами в вашу сторону',
    'заметили вас и направляются к каравану'
];


// разные варианты для поражения, выбираются случайно
var BanditLostMessages = [
    'Вы потерпели унизительное поражение. Ваш караван уничтожен.',
    'Ваши кости остались лежать в этой пустоши, вместе с костями ваших браминов.',
    'Бандиты убили всех людей в вашем караване.',
    'Караван погиб в стычке с рейдерами',
    'Увы, никто не узнает, где ваша могила',
    'Радиоактивный ветер воет над вашим остывающим телом. Все, что у вас было - отобрали бандиты. Включая жизнь.',
    'Следующий караван найдет ваши кости и поймет, что эта дорога опасна',
    'Пустынные бродяги торопливо обшаривают ваши тела и скрываются вдали'
];

// разные варианты для поражения, выбираются случайно
var BanditWinMessages = [
    'Вы одержали славную победу, уничтожив всех бандитов.',
    'Подлые налетчики убиты в честном бою.',
    'Чудом выжив, вы приходите в себя после перестрелки и понимаете, что победили в этот раз.',
    'Хо-хо! Караван выстоял в этой битве. Пришла пора обшарить трупы.',
    'Никто не смеет недооценивать мою мощь!',
    'Хотели напасть на мою прелесссть! Ха, теперь вы мертвы. Посмотрим, что у вас в карманцах!',
    'Смерть бандитам. Караванский уклад един!'
];

// Разные варианты просьб для очень голодных бандитов

var BanditDeathHungerMessages = [
    'Если вы не возьмете нас, мы погибнем здесь от голода, в этой проклятой пустыне!',
    'Возьмите нас с собой! Мы согласны служить за еду, только не оставляйте нас на голодную смерть.',
    'Мы не видели еды уже восемь дней. Если вы откажете нам, нам придется начать есть друг друга... или умереть от голода.',
    'Пожалуйста... Умоляем вас... Иначе мы умрем тут',
    'Еда... Мы готовы сделать что угодно за еду',
];

/*
 *   Возможные варианты бандитов
 * */
var BanditEvents = [
    {
        text: 'Радиоактивные гули',
        crew: 4,
        firepower: 3
    }, {
        text: 'Рейдеры',
        crew: 6,
        firepower: 12
    }, {
        text: 'Бродяги',
        crew: 2,
        firepower: 1
    }, {
        text: 'Дикари',
        crew: 8,
        firepower: 4
    },
];/**
 *  Описания диалогов с бандитами
 *  вся структура и логика переходов - здесь
 *  Это объект, используемый как ассоциативный массив
 *  названия полей служат для идентификации диалогов
 */
var BanditDialogs = {
    /*
     *   Заготовка для диалога, копируйте и используйте для новых вариантов
     * */
    "none": { //
        icon: "images/pic_bandit_meet.jpg", // true для иконки переговоров или победы. Не обязательный параметр.
        exit: false, // наличие кнопки выхода, после которой мы возвращаемся в обычную игру. Необязательный параметр.
        title: "Заголовок окна под иконкой",
        desc: "Возможно многословное описание ситуации мелким шрифтом. Можно пустую строку. Можно вообще не использовать параметр",

        // Необязательная функция. Можно в принципе не указывать
        // Позволяет добавлять вычисляемые параметры после desc.
        // Возвращайте строку. Если нет вычислений - пишите только в desc.
        desc_action: function (world, bandits) {
            return " ";
        },

        // массив выборов - может быть сколько угодно
        // может быть пустым
        // можно не указывать параметр вообще - в BanditPlugin есть проверка на наличие,
        // если не указывать - никаких выборов не будет выведено
        choices: [
            {
                text: "Вариант 1",
                action: function (world, bandits) {
                    return "none"; // могут быть разные вычисления и много return
                }
            },
            {
                text: "Вариант 2",
                action: function (world, bandits) {
                    return "none"; // могут быть разные вычисления и много return
                }
            }
        ],
    },


    /*
     *   Стартовый диалог
     * */
    "start": {
        icon: "images/pic_bandit_meet.jpg",
        title: "Вы наткнулись на бандитов!",
        desc_action: function (world, bandits) {
            var desc = bandits.text + " " + BanditAtmospheric.getRandom() + ". ";
            desc += "Они " + BanditFirepowers.getByDegree(bandits.firepower / bandits.crew) + ".";
            desc += "Число людей в банде: " + BanditNumbers.getByDegree(bandits.crew / 10) + ".";
            addLogMessage(world, Goodness.negative, this.title); // логируем описание
            addLogMessage(world, Goodness.negative, desc); // логируем описание
            return desc;
        },
        choices: [
            {
                text: "Подойти", // что показывается на кнопке
                action: function (world, bandits) {
                    // первоначальная идея была такая
                    // бандиты наглеют и лезут в бой, если у них больше оружия
                    // но решено было отказаться - так как при накоплении оружия в караване все бандиты отказываются от атаки
                    // это нереалистично и неинтересно. Всегда есть отморозки и оружие к тому же трудно оценить точно.

                    // if (bandits.firepower > world.firepower) return "fight"; // ...................

                    // поэтому оставили вариант с голым рандомом
                   if (checkProbability(BanditConstants.ATTACK_PROBABILITY)) return "fight";

                    // переменные для найма
                    var maxForHire;   // максимум нанимающихся
                    var firepowerAvg = bandits.firepower / bandits.crew; // среднее количество оружия у 1 бандита

                    // голодный найм,
                    if (bandits.hunger < BanditConstants.HUNGER_THRESHOLD) {
                        bandits.price = Math.floor(bandits.price * bandits.hunger); // бандиты сбрасывают цену
                        // защита от выпадения нуля
                        maxForHire = BanditPlugin.getMaxHire(world, bandits);

                        bandits.hired = {}; // добавляем в бандитов инфу о цене и количестве
                        bandits.hired.crew = bandits.crew; // голодные хотят наняться все
                        // разумеется, нанять мы можем не больше, чем у нас есть денег
                        // условие наличия денег проверяется перед вызовом диалога
                        bandits.hired.crew = Math.min(maxForHire, bandits.hired.crew);

                        // вычисляем окончательную цену
                        bandits.hired.price = Math.floor(bandits.price * bandits.hired.crew);
                        bandits.hired.firepower = Math.ceil(bandits.hired.crew * firepowerAvg);
                        return "hunger_talk";
                    }


                    // обычный найм, если силы равны и никто не голоден, и у вас есть деньги
                    maxForHire = BanditPlugin.getMaxHire(world, bandits);
                    if (maxForHire > 0) {
                        bandits.hired = {}; // добавляем в бандитов инфу о цене и количестве
                        bandits.hired.crew = Math.floor(Math.random() * bandits.crew * 0.5); // сытые хотят наниматься не все
                        bandits.hired.crew = Math.min(maxForHire, bandits.hired.crew); // гарантируем, что не нанимаем больше, чем у нас есть денег
                        // если выпал ноль
                        if(bandits.hired.crew == 0){
                            return "no_hire";
                        }
                        // вычисляем окончательную цену
                        bandits.hired.price = Math.floor(bandits.price * bandits.hired.crew);
                        bandits.hired.firepower = Math.ceil(bandits.hired.crew * firepowerAvg);
                        return "hire_talk";
                    }

                    // нет денег
                    addLogMessage(world, Goodness.neutral, "Вы расходитесь с бандитами миром");
                    return "hire_talk_nomoney";
                }
            },
            {
                text: "Бежать",
                action: function (world, bandits) {
                    return "run"; // если бежим - бандиты при любом раскладе атакуют, зато меньше потерь
                }
            }
        ],
    },

    "fight": { //
        icon: "images/pic_bandit_meet.jpg",
        title: "Сражение!",
        desc: "Наглые бастарды атаковали ваш караван с целью наживы",
        choices: [
            {   // полновесная стычка, где побеждает тот, у кого больше стволов
                text: "Открыть огонь из всех стволов!",
                action: function (world, bandits) {
                    var damage = BanditPlugin.getDamage(world, bandits);                            world.crew -= damage;
                    addLogMessage(world, Goodness.negative, 'В яростной атаке вы потеряли ' + damage + ' человек.');
                    var isWin = world.crew > 0;
                    return isWin ? "win" : "lost";
                }
            },
            {   // осторожный бой, по сути активное бегство, теряем людей, но меньше, чем при обычном бое
                text: "Занять круговую оборону и принять бой!",
                action: function (world, bandits) {
                    bandits.lootK = BanditConstants.FIGHT_DEFENSE_K; // коээфициент лута и потерь
                    var damage = BanditPlugin.getDamage(world, bandits);
                    damage = Math.floor(damage*bandits.lootK);
                    world.crew -= damage;
                    addLogMessage(world, Goodness.negative, 'В бою погибло ' + damage + ' человек.');
                    var isWin = world.crew > 0;
                    return isWin ? "win" : "lost";
                }
            },
            {   // Караван, который пытается сбежать... грустное, должно быть, зрелище
                // теряем меньше всего людей
                // но неизбежно теряем какой-то процент браминов/волов/передвижных средств
                // и еды
                text: "Попытаться сбежать",
                action: function (world, bandits) {
                    return "run"; // или гибнем, или успешно бежим
                }
            }
        ],
    },

    "hunger_talk": { //
        icon: "images/pic_bandit_meet.jpg",
        title: "Бандиты хотят присоединиться!",
        desc: "Восхищенные вашим оружием и едой, голодные оборванцы хотят служить в вашем караване за минимальную цену!",
        desc_action: function (world, bandits) {
            var info = " " + BanditConstants.HIRE_INFO.withArg(bandits.hired.crew, bandits.hired.firepower);
            info += " " + BanditConstants.HIRE_PRICE_INFO.withArg(bandits.hired.price);
            return info;
        },

        // массив выборов - может быть сколько угодно
        choices: [
            {
                text: "Нанять",
                action: function (world, bandits) {
                    world.crew += bandits.hired.crew;
                    world.firepower += bandits.hired.firepower;
                    world.money -= bandits.hired.price;
                    return "hire_success";
                }
            },
            {
                text: "Отказать",
                action: function (world, bandits) {
                    // если бандиты очень голодны - они попросятся еще раз
                    var isDeathHunger = bandits.hunger <= BanditConstants.HUNGER_DEATH_THRESHOLD;
                    var nextDialog = isDeathHunger ? "hunger_death_talk" : "hire_decline"
                    return nextDialog;
                }
            }
        ],
    },

    "hire_talk": { //
        icon: "images/pic_bandit_meet.jpg",
        title: "Разговор на равных",
        desc: "Бандиты выказывают респект вашему вооружению. Часть из них хочет примкнуть к вашему каравану.",
        desc_action: function (world, bandits) {
            var info = " " + BanditConstants.HIRE_INFO.withArg(bandits.hired.crew, bandits.hired.firepower);
            info += " " + BanditConstants.HIRE_PRICE_INFO.withArg(bandits.hired.price);
            return info;
        },

        choices: [
            {
                text: "Нанять",
                action: function (world, bandits) {
                    world.crew += bandits.hired.crew;
                    world.firepower += bandits.hired.firepower;
                    world.money -= bandits.hired.price;
                    return "hire_success";
                }
            },
            {
                text: "Отказать",
                action: function (world, bandits) {
                    addLogMessage(world, Goodness.neutral, "Вы расходитесь с бандитами миром");
                    return "hire_decline";
                }
            }
        ]
    },

    "hire_decline": {
        icon: "images/pic_bandit_meet.jpg",
        exit: true, // финал,
        title: "Бандиты подавлены",
        desc: "Они хотели бы служить у вас, но вы отказали им по своей причине. Уходя, вы слышите выстрел. Кажется, кто-то из неудачников застрелился."
    },

    "hire_success": {
        icon: "images/pic_bandit_meet.jpg",
        exit: true, // финал
        title: "Переговоры прошли успешно",
        desc_action: function (world, bandits) {
            var isAll = bandits.hired.crew == bandits.crew;
            var message = isAll ? "К вам присоединились все бандиты. " :"К вам присоединилась часть бандитов. ";
            message += "Людей: +" + bandits.hired.crew + ". ";
            message += "Оружия: +" + bandits.hired.firepower + ". ";

            var priceMessage = bandits.hired.price > 0 ? "Денег: -" + bandits.hired.price : " Это не стоило вам ничего";
            message += priceMessage;
            addLogMessage(world, Goodness.positive, message);
            return message;
        }
    },

    "hire_talk_nomoney": {
        icon: "images/pic_bandit_meet.jpg",
        exit: true,
        title: "Бандиты разочарованы",
        desc: "Они хотели бы наняться к вам, но у вас слишком мало денег",
    },

    "no_hire": {
        icon: "images/pic_bandit_meet.jpg",
        exit: true,
        title: "Разговор в пустыне",
        desc: "Бандиты рассказывают последние новости о том, кого ограбили и убили. Затем вы прощаетесь со странным чувством. По какой-то причине они не стали нападать. И наняться к вам тоже никто не захотел. Возможно, все дело в вашей харизме?",
    },

    "run": {
        icon: "images/pic_bandit_meet.jpg",
        title: "Побег",
        exit: true, // возвращение к обычной игре
        desc: "Воодушевленные вашим отступлением, бандиты стреляют вам вслед и улюлюкают.",
        desc_action: function (world, bandits) {
            var damage = BanditPlugin.getDamage(world, bandits);
            damage = Math.ceil(damage*BanditConstants.RUN_DAMAGE_K); // как минимум 1 выживет, так как округляем вверх, и коэффициент не 1


            world.crew -= damage;

            // караван несет потери
            var lostOxen = Math.min(world.oxen, Math.ceil(world.oxen * BanditConstants.RUN_OXES_LOST_K));
            var lostFood = Math.min(world.food, Math.ceil(world.food * BanditConstants.RUN_FOOD_LOST_K));
            var lostMoney = Math.min(world.money, Math.ceil(world.money * BanditConstants.RUN_GOLD_LOST_K));
            var lostCargo = Math.min(world.cargo, Math.ceil(world.cargo * BanditConstants.RUN_CARGO_LOST_K));
            world.oxen -= lostOxen;
            world.food -= lostFood;
            world.money -= lostMoney;
            world.cargo -= lostCargo;

            // создаем описание
            var desc = " Ваши потери: люди: " + damage;
            desc += " / браминов: " + lostOxen + " / eда: " + lostFood + ". Денег: " + lostMoney;
            addLogMessage(world, Goodness.negative, desc); // логируем описание

            return desc;
        }
    },

    "lost": {
        icon: "images/pic_bandit_meet.jpg",
        exit: true,
        title: "Поражение!",
        desc_action: function (world, bandits) {
            var desc = BanditLostMessages.getRandom();
            addLogMessage(world, Goodness.positive, desc);
            return BanditLostMessages.getRandom();
        }
    },

    "win": {
        icon: "images/pic_bandit_meet.jpg",
        exit: true,
        title: "Победа!",
        desc_action: function (world, bandits) {
            var lootFirepower = Math.floor(bandits.lootK * bandits.firepower);
            var lootMoney = Math.floor(bandits.lootK * bandits.money);

            var desc = BanditWinMessages.getRandom();
            desc += " " + BanditConstants.LOOT_TITLE;
            desc += " " + BanditConstants.LOOT_WEAPON_MESSAGE.withArg(lootFirepower);
            desc += ", " + BanditConstants.LOOT_MONEY_MESSAGE.withArg(lootMoney);

            world.firepower += lootFirepower;
            world.money += lootMoney;

            addLogMessage(world, Goodness.positive, desc);
            return desc;
        }
    },

    "hunger_death_talk": {
        icon: "images/pic_bandit_meet.jpg",
        title: "Бандиты просят принять их",
        desc:"Они готовы служить вам бесплатно. Вот что они говорят: ",
        desc_action: function (world, bandits) {
            return '"'+BanditDeathHungerMessages.getRandom()+'"';
        },
        choices: [
            {
                text:"Спасти оборванцев от голодной смерти",
                action: function (world, bandits) {
                    bandits.hired = {};
                    bandits.hired.crew = bandits.crew; // смертельно голодные хотят наняться все
                    bandits.hired.price = 0; // и бесплатно
                    bandits.hired.firepower = bandits.firepower;
                    return "hire_success";
                }
            },
            {
                text: "Отказать",
                action: function (world, bandits) {
                    return "hire_decline";
                }
            }
        ]
    },
};var RandomEventConstants = {
    EVENT_PROBABILITY: 1, // 3 // примерное число событий в день, реально будет колебаться около этого значения
};

/*
 *   Набор рандомных событий, происходят по генератору, правил пока никаких
 *   type - один из вариантов Goodness
 *       (позитивное, нейтральное, отрицательное изменение)
 *
 *   $1  - используется для указание реального значения параметра
 * */
var RandomEvents = [
    {
        goodness: Goodness.negative,
        stat: 'crew',
        value: -4,
        text: 'На караван напал смертокогть! Людей: -$1'
    },
    {
        goodness: Goodness.negative,
        stat: 'crew',
        value: -3,
        text: 'Радиоактивная буря убила часть команды. Людей: -$1'
    },
    {
        goodness: Goodness.positive,
        stat: 'crew',
        value: 2,
        text: 'Вы встретили одиноких путников, которые с радостью хотят присоединиться к вам. Людей: +$1'
    },

    // food states ---------------------------
    {
        goodness: Goodness.negative,
        stat: 'food',
        value: -10,
        text: 'Кротокрысы на привале сожрали часть еды. Пропало пищи: -$1'
    },

    {
        goodness: Goodness.negative,
        stat: 'food',
        value: -15,
        text: 'Радиоактивные осадки испортили часть запасов. Пищи: -$1'
    },

    {
        goodness: Goodness.negative,
        stat: 'food',
        value: -5,
        text: 'В запасах еды завелись черви. Пропало пищи: -$1'
    },

    {
        goodness: Goodness.positive,
        stat: 'food',
        value: 20,
        text: 'Следопыты нашли съедобный кактус. Запасы пищи: +$1'
    },

    {
        goodness: Goodness.positive,
        stat: 'food',
        value: 20,
        text: 'Ваши люди подстрелили нападающих кротокрысов. Запасы пищи: +$1'
    },

    {
        goodness: Goodness.positive,
        stat: 'food',
        value: 30,
        text: 'Атака гекконов успешно отражена. Запасы еды: +$1'
    },

    {
        goodness: Goodness.positive,
        stat: 'food',
        value: 10,
        text: 'В руинах дома следопыты нашли довоенные консервы. Запасы еды: +$1'
    },

    {
        goodness: Goodness.positive,
        stat: 'food',
        value: 5,
        text: 'На дороге найдены хорошие довоенные кожаные сапоги. Запасы еды: +$1'
    },

    // money states ---------------------------
    {
        goodness: Goodness.negative,
        stat: 'money',
        value: -50,
        text: 'Воры выследили ваш караван. Денег: -$1'
    },

    {
        goodness: Goodness.positive,
        stat: 'money',
        value: 15,
        text: 'У дороги найден мертвый путешественник. На теле найдены монеты. Денег: +$1'
    },

    {
        goodness: Goodness.positive,
        stat: 'money',
        value: 5,
        text: 'Встречные охотники купили у вас товары. Денег: +$1'
    },

    {
        goodness: Goodness.positive,
        stat: 'money',
        value: 5,
        text: 'Вы поймали вора, затаившегося у дороги, и отняли у него часть добычи! Денег: +$1'
    },

    {
        goodness: Goodness.positive,
        stat: 'money',
        value: 12,
        text: 'Следопыты нашли и раскопали свежую могилу. Денег: +$1'
    },

// Волы -------------------------

    {
        goodness: Goodness.negative,
        stat: 'oxen',
        value: -1,
        text: 'Радиоактивные гекконы напали на ваших быков. Браминов: -$1'
    },

    {
        goodness: Goodness.positive,
        stat: 'oxen',
        value: 1,
        text: 'Найден одичалый брамин. Браминов: +$1'
    },
];/**
 *  Константы для настройки магазинов
 */
var ShopEventConstants = {
    SHOP_DISTANCE_MIN: 100,   // минимальное расстояние между магазинами
    SHOP_PROBABILITY: 0.5,   // шанс встретить магазин или караван в день
    SHOP_NO_MONEY_MESSAGE: 'Кончились деньги и вы пошли дальше...',   // сообщение о нехватке денег
    SHOP_BUY_MESSAGE: 'Получено: ',   // сообщение о нехватке денег
    SHOP_HINT: 'Можно купить: ',   // сообщение о нехватке денег
    SHOP_EXIT: 'Пойти дальше',   // сообщение о нехватке денег
    SHOP_PIC: "images/pic_welcome.jpg",   // относительный index.html путь к картинке
};

//  описания возможных магазинов
var Shops = [{
    text: 'Вы нашли магазин в этой жуткой пустоши',
    products: [
        {item: 'food', text: 'Еда', qty: 20, price: 50},
        {item: 'oxen', text: 'Брамины', qty: 1, price: 200},
        {item: 'firepower', text: 'Оружие', qty: 2, price: 50},
    ]
},
    {
        text: 'Вы встретили другой караван!',
        products: [
            {item: 'food', text: 'Еда', qty: 30, price: 50},
            {item: 'oxen', text: 'Брамины',qty: 1, price: 200},
            {item: 'firepower', text: 'Оружие',qty: 2, price: 20},
            {item: 'crew', text: 'Наемники',qty: 1, price: 200}
        ]
    },
    {
        text: 'Следопыты встретили охотников',
        products: [
            {item: 'food', text: 'Еда', qty: 20, price: 60},
            {item: 'oxen', text: 'Брамины', qty: 1, price: 300},
            {item: 'firepower', text: 'Оружие', qty: 2, price: 80},
            {item: 'crew', text: 'Охотники', qty: 1, price: 300}
        ]
    },
];/**
 * Правила смерти
 * по 1 параметру
 *
 *      param - строковое название численного параметра в WorldState
 *      death - граница смерти
 *      alive - любое значение параметра, при котором жив (служит для определения пересечения границы,
 *      когда нет точно совпадения
 *      text - сообщение для лога
 */

var DeathRules = [
    {
        param: 'food',
        death: 0,
        live: 1,
        text: 'Ваш караван погиб от голода'
    },

    {
        param: 'crew',
        death: 0,
        live: 1,
        text: 'В караване не осталось живых людей'
    }
];
/**
 *  Диалоги для смерти и рестарта.
 */
var DeathDialogs = {
    "start": {
        icon: "images/pic_death.jpg",
        title: "Погибший в пустоши",
        desc: "",
        desc_action: function (world, rule) {
            var desc = " Причина смерти: "+rule.text+". Вы сумели пройти "+Math.floor(world.distance) + " миль и накопить "+Math.floor(world.money) + " денег. ";
            desc += "Может быть, следующим караванщикам повезет больше?"
            return desc;
        },
        choices:[
            {
                text: 'Начать новую игру',
                action: function () { return "stop"; }
            }
        ]
    },
};/**
 * Константы для плагина сброса лишнего груза
 */

var DropDialogs = {
    "start": {
        icon: "images/pic_overweight.jpg",
        exit: false,
        title: "Перевес",
        desc_action: function (world) {
            var desc = "Караван перегружен и не может двигаться";
            addLogMessage(world, Goodness.negative, desc); // логируем
            return desc;
        },
        choices: [
            {
                text: "Сбросить 100 единиц груза",
                action: function (world) {
                    world.cargo = Math.max(0, world.cargo - 100);
                    var next = hasCaravanOverweight(world) ? "start" : "stop";
                    return next;
                }
            },
            {
                text: "Сбросить 10 единиц груза",
                action: function (world) {
                    world.cargo = Math.max(0, world.cargo - 10);
                    var next = hasCaravanOverweight(world) ? "start" : "stop";
                    return next;
                }
            }, {
                text: "Сбросить 10 единиц еды",
                action: function (world) {
                    world.food = Math.max(0, world.food - 10);
                    var next = hasCaravanOverweight(world) ? "start" : "stop";
                    return next;
                }
            }, {
                text: "Сбросить 1 единицу оружия",
                action: function (world) {
                    world.firepower = Math.max(0, world.firepower - 1);
                    var next = hasCaravanOverweight(world) ? "start" : "stop";
                    return next;
                }
            }
        ]
    }
};/**
 *  Диалоги для городов
 */
var TownDialogs = {
    "start": {
        icon: "images/pic_wagons.jpg",
        title: "Вы прибыли в город",
        desc: "",
        desc_action: function (world, revisit) {
            if( revisit ) {
                return "Вы уже торговали в этом городе. Надо идти в другой.";
            }
            var desc = "Вы входите на местный рынок. ";
            var sell = sellCargo(world);
            if (sell.money > 0) {
                desc += "Продано $1 товаров на сумму $$2. ".withArg(sell.cargo, sell.money);
            }
            else {
                desc += "Товаров нет, поэтому ничего продать не удалось. ";
            }
            addLogMessage(world, Goodness.neutral, desc);
            var sellMessage;

            var buy = buyCargo(world);
            if (buy.money > 0) {
                sellMessage = "Куплено $1 товаров на сумму $$2. ".withArg(buy.cargo, buy.money);
            }
            else {
                sellMessage = "Купить ничего не удалось: не хватает денег или быков. ";
            }
            addLogMessage(world, Goodness.neutral, sellMessage);
            desc += sellMessage;

            var income = sell.money - buy.money;
            var signStr = income >= 0 ? "+" : "-";
            var goodness = income > 0 ? Goodness.positive : Goodness.negative;
            var incomeMessage = "Прибыль от посещения города: "+signStr+"$" + Math.abs(income);
            addLogMessage(world, goodness, incomeMessage);

            desc += incomeMessage;
            return desc;
        },
        choices: [
            {
                text: 'Выйти из города',
                action: function () {
                    return "stop";
                }
            }
        ]
    },
};var Game = {
    plugins: [],  // генераторы событий
};

Game.init = function () {
    // создаем мир по стартовому состоянию
    // все редактируемые переменные - в директории data
    this.world = new WorldState(StartWorldState);

    var i;
    for (i = 0; i < this.plugins.length; i++) {
        this.plugins[i].init(this.world);
    }
};

// добавление плагинов
Game.addPlugin = function (plugin) {
    this.plugins.push(plugin);
};

// игровой цикл
Game.update = function () {
    if (this.world.gameover) return; // никаких действий
    var i;
    for (i = 0; i < this.plugins.length; i++) {
        this.plugins[i].update();
    }
};


// запуск цикла игры, использую setInterval для совместимости со старым Safari
// bind позволяет привязать this объекта
// так как по дефолту setInterval передает в функцию this от window
Game.resume = function () {
    this.interval = setInterval(this.update.bind(this), GameConstants.STEP_IN_MS);
};

Game.stop = function () {
    clearInterval(this.interval);
};

Game.restart = function () {
    this.init();
    this.resume();
};/**
 *  Core Plugin - базовые события
 *  - изменение дня
 *  - потребление пищи
 *  - перемещение к цели
 */

CorePlugin = {};

CorePlugin.init = function (world) {
    this.world = world;
    this.time = 0; // общее время с начала игры, в миллисекундах
    this.dayDelta = GameConstants.STEP_IN_MS / GameConstants.DAY_IN_MS; // сколько дней в одном шаге игру
    this.lastDay = -1;  // отслеживаем наступление нового дня
    this.speedDelta = Caravan.FULL_SPEED - Caravan.SLOW_SPEED; // разница между полной и минимальной скоростью
};

CorePlugin.update = function () {
    if (this.world.stop) return; // если стоим - никаких изменений
    this.time += GameConstants.STEP_IN_MS; // увеличение времени
    this.world.day = Math.ceil(this.time / GameConstants.DAY_IN_MS); // текущий день, целый

    // Движение каравана в зависимости от того, сколько дней прошло
    this.updateDistance(this.dayDelta, this.world);

    // события связанные с наступлением нового дня
    if (this.lastDay < this.world.day) {
        this.consumeFood(this.world);
        this.lastDay = this.world.day;
    }
};

// еда выдается один раз в день
CorePlugin.consumeFood = function (world) {
    var needFood = world.crew * Caravan.FOOD_PER_PERSON;
    var eated = Math.min(needFood, world.food); // съесть можем не больше того, что имеем
    world.food -= eated; // съедаем запасы еды

    if (world.food == 0) {
        // автопоедание быков при минимальных запасах еды - временный фикс
        if (world.oxen > 0) {
            world.food += Caravan.MEAT_PER_OX;
            world.oxen--;
            addLogMessage(world, Goodness.negative, "Кончились запасы еды. 1 брамин забит на мясо.")
        }
    }
};

// обновить пройденный путь в зависимости от потраченного времени в днях
CorePlugin.updateDistance = function (dayDelta, world) {
    var maxWeight = getCaravanMaxWeight(world);
    var weight = getCaravanWeight(world);

    // при перевесе - Caravan.SLOW_SPEED
    // при 0 весе - Caravan.FULL_SPEED
    var speed = Caravan.SLOW_SPEED + (this.speedDelta) * Math.max(0, 1 - weight / maxWeight);

    // расстояние, которое может пройти караван при такой скорости
    var distanceDelta = speed * dayDelta;

    // вычисляем расстояние до цели
    var dx = world.to.x - world.caravan.x;
    var dy = world.to.y - world.caravan.y;

    // если мы находимся около цели - останавливаемся
    if (areNearPoints(world.caravan, world.to, Caravan.TOUCH_DISTANCE)) {
        world.stop = true;
        return;
    }

    // до цели еще далеко - рассчитываем угол перемещения
    // и получаем смещение по координатам
    var angle = Math.atan2(dy, dx);
    world.caravan.x += Math.cos(angle) * distanceDelta;
    world.caravan.y += Math.sin(angle) * distanceDelta;
    world.distance += distanceDelta;
};

Game.addPlugin(CorePlugin);/**
 * Map2D Plugin *
 *  - при клике на городе на карте - отправляет караван туда
 *  - в update проверяет прибытие в город
 */
Map2DPlugin = {
    // чтобы не гонять DOM каждый раз - гоняем только когда обновляются координаты игрока
    // для этогоп делаем проверку через это поле
    lastPlayerPosition: {x: 0, y: 0},
    // маркер "мы в городе" - соответствует "открыт диалог города"
    inTown: false,
    // последний посещенный город
    lastTown: { x: -1, y: -1 },
};

Map2DPlugin.init = function (world) {
    this.world = world;

    // элементы для отображения карты
    this.view = {};
    this.view.player = document.getElementById('map-player'); // маркер игрока

    // добавляем в них города - пока два
    this.view.towns = document.getElementsByClassName('town');

    // вешаем на города обработчики кликов, чтобы отправлять туда караван
    var i, map2dPlugin = this;
    for (i = 0; i < this.view.towns.length; i++) {
        this.view.towns[i].addEventListener("click", function (e) {
            if (world.uiLock) return; // если какой-то плагин перехватил работу с пользователем, то есть открыто модальное окно, не реагируем на действия пользователя
            var element = e.target || e.srcElement;
            world.from = {x: world.caravan.x, y: world.caravan.y};
            world.to = {x: element.offsetLeft, y: element.offsetTop};
            world.stop = false;
            map2dPlugin.inTown = false; // все, покидаем город

            addLogMessage(world, Goodness.positive, "Путешествие через пустыню начинается!");
        });
    }

    // если найдены города на карте, помещаем игрока в первый попавшийся
    if (this.view.towns.length > 0) {
        world.caravan.x = this.view.towns[0].offsetLeft;
        world.caravan.y = this.view.towns[0].offsetTop;
        // запоминаем его как последний, чтобы не торговать в нем же при быстром возвращении
        this.lastTown = {x: world.caravan.x, y: world.caravan.y };
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

    // проверяем достижение города на остановках
    if (this.world.stop && this.isAboutTarget(this.world)) {
        this.inTown = true;
        this.world.uiLock = true; // маркируем интерфейс как блокированный
        addLogMessage(this.world, Goodness.positive, "Вы достигли города!");
        // проверка что мы были в этом городе
        var revisit = this.world.to.x === this.lastTown.x && this.world.to.y === this.lastTown.y;
        // запоминаем последений посещенный город
        this.lastTown = { x: this.world.to.x, y: this.world.to.y};
        DialogWindow.show(TownDialogs, this.world, revisit, this);
    }
};

// проверка, что координаты каравана около заданной цели
Map2DPlugin.isAboutTarget = function (world) {
    return areNearPoints(world.caravan, world.to, Caravan.TOUCH_DISTANCE);
};

Map2DPlugin.movePlayerViewTo = function (x, y) {
    this.view.player.style.left = x + "px"; // сдвигаем маркер на карте
    this.view.player.style.top = y + "px"; // сдвигаем маркер на карте
};

Map2DPlugin.onDialogClose = function () {
    // запоминаем этот город, как последний, чтобы не было чита с автоторговлей
    this.world.uiLock = false;
};

Game.addPlugin(Map2DPlugin);/**
 * Плагин рандомных событий
 * - основного геймплея в оригинале игры с караваном
 */
RandomEventPlugin = {};

RandomEventPlugin.init = function (world) {
    this.world = world;
    this.events = RandomEvents;
};

RandomEventPlugin.update = function () {
    if (this.world.stop) return; // если стоим на месте - рандомных событий нет
    // проверка на выпадение события вообще
    if(!checkEventForStep(RandomEventConstants.EVENT_PROBABILITY)) return;

    var event = this.events.getRandom();
    var valueChange = event.value;

    valueChange = Math.floor(Math.random() * valueChange); // случайные значения изменений

    if (valueChange == 0) return; // если случайное значение выпало ноль - никаких изменений, событие отменяется

    // если выпало отрицательное значение, а параметр уже нулевой - ничего не происходит
    if (valueChange < 0 && this.world[event.stat] <= 0) return;

    // отрицательные значения не могут быть по модулю больше текущего параметра
    if (valueChange < 0 && Math.abs(valueChange) > this.world[event.stat]) {
        valueChange = Math.floor(this.world[event.stat]);
    }

    this.world[event.stat] += valueChange;
    var message = event.text.withArg(Math.abs(valueChange));
    addLogMessage(this.world, event.goodness, message);
};

Game.addPlugin(RandomEventPlugin);/**
 *  Плагин магазина
 *  основная концепция - минимальная связь с другими классами
 *
 *  1. модуль вызывается из Game
 *  2. модуль имеет функцию отображения своего интерфейса
 *  3. модуль  меняет состояние мира.
 *
 */

var ShopPlugin = {};

ShopPlugin.init = function (world) {
    this.world = world;
    this.shops = Shops; // возможные случаи магазинов, основы для генерация конкретной встречи

    this.lastShop = {x: -1, y: -1}; // координаты предыдущего магазина - чтобы не слишком часто
    this.lastTown = {x: -1, y: -1}; // координаты предыдущего города - чтобы не встречать караван в том же сегменте
    this.products = []; // продукты в конкретном магазине, генерируем
};

ShopPlugin.update = function () {
    var world = this.world;
    if (world.stop) return; // если стоим - никаких новых магазинов

    // проверяем, не были ли выхода из города - если да, то запоминаем его
    if(this.lastTown.x != world.from.x || this.lastTown.y != world.from.y)
    {
        this.lastTown = { x: world.from.x, y: world.from.y };
        this.lastShop = { x: world.from.x, y: world.from.y };
    }

    // проверяем расстояние до предыдущего магазина, чтобы не частили
    var prevShopDistance = getDistance(world.caravan, this.lastShop);
    if (prevShopDistance < ShopEventConstants.SHOP_DISTANCE_MIN) return;

    // проверка на выпадение случайного магазина
    if (!checkEventForStep(ShopEventConstants.SHOP_PROBABILITY)) return;

    // стоп-условия выполнились
    world.stop = true; // караван остановился
    world.uiLock = true; // обозначаем, что действия пользователя теперь исключительно наши, пример: чтобы караван случайно не пошел по карте, если кликнем по ней при работе с магазином

    this.lastShop =  { x: world.caravan.x, y: world.caravan.y };  // запоминаем магазинчик
    this.show(this.shops.getRandom()); // показываем магазин
};

ShopPlugin.show = function (shop) {
    // добавляем сообщение о магазине в лог
    addLogMessage(this.world, Goodness.neutral, shop.text);
    // создаем набор продуктов по ассортименту данного магазина
    this.products = this.generateProducts(shop);
    // Создаем объект для отображения 1 диалога
    var ShopDialog = {
        start: {
            icon: ShopEventConstants.SHOP_PIC, // пока у магазина никакой иконки
            title: shop.text,  // заголовок
            desc: ShopEventConstants.SHOP_HINT, // описание
            choices: [], // выбор продуктов и
        }
    };

    // генерируем набор кнопок для продуктов
    var shopPlugin = this;
    var buttonText; // временная переменная для создания текста на кнопке продукта
    this.products.forEach(function (product) {
        buttonText = product.text + ' [' + product.qty + '] за $' + product.price;
        ShopDialog.start.choices.push({
            text: buttonText,
            action: function () {
                if (product.price > shopPlugin.world.money) {
                    addLogMessage(shopPlugin.world, Goodness.negative, ShopEventConstants.SHOP_NO_MONEY_MESSAGE);
                    return "stop";
                }
                shopPlugin.buy(product);
                return "start";
            }
        });
    });

    // и добавляем кнопку для просто выхода
    ShopDialog.start.choices.push({
        text: ShopEventConstants.SHOP_EXIT,
        action: function () { return "stop";}
    });

    DialogWindow.show(ShopDialog, null, null, this);
};

// Обязательная функция при использовании диалогов - коллбэк, вызываемый при закрытии
ShopPlugin.onDialogClose = function () {
    this.world.uiLock = false; // снимаем захват с действий пользователя
    this.world.stop = false; // продолжаем путешествие
};

// генерируем набор продуктов на основе базового
ShopPlugin.generateProducts = function (shop) {
    var PRODUCTS_AMOUNT = 4;
    var numProds = Math.ceil(Math.random() * PRODUCTS_AMOUNT);
    var products = [];
    var j, priceFactor;

    for (var i = 0; i < numProds; i++) {
        j = Math.floor(Math.random() * shop.products.length); // берем случайный продукт из набора
        priceFactor = 0.7 + 0.6 * Math.random(); // //multiply price by random factor +-30%
        products.push({
            item: shop.products[j].item,
            text: shop.products[j].text,
            qty: shop.products[j].qty,
            price: Math.round(shop.products[j].price * priceFactor)
        });
    }
    return products;
};

ShopPlugin.buy = function (product) {
    var world = this.world;
    world.money -= product.price;
    world[product.item] += product.qty;
    addLogMessage(world, Goodness.positive, ShopEventConstants.SHOP_BUY_MESSAGE + ' ' + product.text + ' +' + product.qty);
};

Game.addPlugin(ShopPlugin);/**
 *  Столкновения с бандитами
 *
 *
 - встречи делятся на два этапа
 - приблизиться // возможны разные варианты, смотри ниже
 - бежать // вас атакуют в любом случае

 - у бандитов есть параметры
 - описание банды
 - число оружия
 - число человек
 - голод  0..1

 - бандиты нападают всегда, если у вас меньше оружия и людей (на 1 человека нападут всегда)

 - бандиты могут захотеть примкнуть к вам, если у вас столько же оружия или больше,
 есть еда и они голодны
 - цена снижается

 - бандитов можно перекупить, если у вас есть деньги
 - цена зависит от количества стволов и человек
 - цена высокая
 - вы не получаете денег
 *
 */

BanditPlugin = {};

BanditPlugin.init = function (world) {
    this.world = world;
    this.dialogView = DialogWindow;
    this.lastMeet = {x: -1, y: -1}; // координаты предыдущего стычки - чтобы не слишком часто
    this.lastTown = {x: -1, y: -1}; // координаты предыдущего города - чтобы не встречать караван в том же сегменте
};

BanditPlugin.update = function () {
    var world = this.world;
    // если стоим на месте - бандиты не появляются
    if (world.stop || world.gameover) return;
    // проверка на выпадение события вообще
    // я использую стоп-условие, так как оно позволяет избегать лесенки c if
    // но вы можете использовать классический блок if

    // проверяем, не были ли выхода из города - если да, то запоминаем его
    if(this.lastTown.x != world.from.x || this.lastTown.y != world.from.y)
    {
        this.lastTown = { x: world.from.x, y: world.from.y };
        this.lastMeet = { x: world.from.x, y: world.from.y };
    }

    // проверяем расстояние между последней стычкой и текущими координатами
    var prevShopDistance = getDistance(world.caravan, this.lastMeet);
    if (prevShopDistance < BanditConstants.DISTANCE_MIN) return;

    if (!checkEventForStep(BanditConstants.EVENT_PROBABILITY)) return;

    // ну, понеслась!
    // караван останавливается
    world.stop = true;
    // флаг для блокировки UI в других плагинах включается
    world.uiLock = true;
    // генерируется случайная банда
    var bandits = BanditEvents.getRandom();
    // она голодная по рандому от 0 до 1, 0 - самый сильный, "смертельный", голод
    bandits.hunger = Math.random();
    // количество денег у бандитов - это явно функция от количества стволов
    bandits.money = bandits.firepower * BanditConstants.GOLD_PER_FIREPOWER;

    // цена найма бандитов за 1 человека
    bandits.price = BanditConstants.HIRE_PRICE_PER_PERSON;
    // коээффициент лута и потерь (будет менять от разных факторов)
    bandits.lootK = 1;
    // показываем окно с первым диалогом
    // this.showDialog("start");
    this.dialogView.show(BanditDialogs, world, bandits, this);
};

// отправляемся дальше
BanditPlugin.onDialogClose = function () {
    this.world.uiLock = false; // снимаем захват с действий пользователя
    this.world.stop = false; // продолжаем путешествие
};

/*  Вычисление ущерба для команды от открытого сражения с бандитами
 *     1. ущерб - число погибших в команде
 *     2. ущерб не может быть больше команды, естественно
 *     3. ущерб растет в зависимости от силы оружия бандитов
 *     4. ущерб уменьшается при накапливании оружия в караване, но не уходит в ноль
 *     5. ущерб имеет рандомный разброс
 * */
BanditPlugin.getDamage = function (world, bandits) {
    // перевес каравана по оружию, минимум 0
    var caravanOverpowered = Math.max(0, world.firepower - bandits.firepower);
    // по мере возрастания caravanOverpowered - caravanOverPowerK будет стремиться от 1 к нулю,
    // не уходя в него полностью.
    // получаем коэффицинт от 1 до 0.01, уменьшающий дамаг
    var caravanOverPowerK = 1 / Math.sqrt(caravanOverpowered + 1);
    // таки в среднем baseDamage будет колебаться около bandits.firepower
    var baseDamage = bandits.firepower * 2 * Math.random();
    // получаем уменьшающийся с прокачкой дамаг. Иногда даже будет вылетать ноль
    var damage = Math.round(baseDamage * caravanOverPowerK);
    // не может погибнуть больше, чем в команде
    damage = Math.min(damage, world.crew);
    return damage;
};

/*
 *  Вычисляем, сколько бандитов могут наняться к вам
 * */
BanditPlugin.getMaxHire = function (world, bandits) {
    // вычисляем по своему кошельку и их цене, или берем всех, если бандиты бесплатные
    var max = bandits.price > 0 ? Math.floor(world.money / bandits.price) : bandits.crew;
    return max;
};

Game.addPlugin(BanditPlugin);/**
 *   Проверяет условия смерти
 *   по DeathRules
 *   если смерть
 *   - устанавливает world.gameover = true
 *   - устанавливает world.stop = true
 */

DeathCheck = {};

DeathCheck.init = function (world) {
    this.world = world;
    this.rules = DeathRules;
};

DeathCheck.update = function () {
    if (this.world.gameover) return; // если уже мертвы, проверять бесполезно

    // проверка условий по массиву DeathRules
    var i, rule, sign;
    for (i = 0; i < this.rules.length; i++) {
        rule = this.rules[i];
        sign = (rule.live - rule.death) / Math.abs(rule.live - rule.death);
        if (this.world[rule.param] == rule.death || this.world[rule.param] * sign <= rule.death) {
            this.onDeath(this.world, rule);
            break;
        }
    }
};

DeathCheck.onDeath = function (world, rule) {
    Game.stop();
    addLogMessage(world, Goodness.negative, rule.text);
    world.gameover = true;
    world.stop = true;
    DialogWindow.show(DeathDialogs, world, rule, this);
};

DeathCheck.onDialogClose = function () {
    Game.restart();
};

Game.addPlugin(DeathCheck);/**
 *  Модуль интерфейса для дропа, если есть перевес
 *
 *  - каждый модуль интерфейса должен содержать функцию init(world, game)
 *  - в листенерах при изменении параметров world должен вызываться game.onWorldUpdate
 */

var DropPlugin = {};

DropPlugin.init = function (world) {
    this.world = world;
};

DropPlugin.onDialogClose = function () {
    this.world.uiLock = false; // снимаем захват с действий пользователя
    this.world.stop = false; // продолжаем путешествие
};

DropPlugin.update = function () {
    // если стоим или нет перевеса - ничего не делаем
    if(this.world.stop || !hasCaravanOverweight(this.world)) return;

    // Перевес! стопим караван
    this.world.uiLock = true; // стопим захват с действий пользователя
    this.world.stop = true; // стопим путешествие
    DialogWindow.show(DropDialogs, this.world, null, this); // показываем диалог
};

Game.addPlugin(DropPlugin);/*
 *      Функция для отображения текущего состояния мира
 *       и лога событий
 * */
var WorldView =  {
    // модель для хранения состояния View: предыдущие отображаемые значения
    // чтобы не дергать UI каждый раз, только при изменениях
    viewModel: {
        day: 0,
        crew: 0,
        oxen: 0,
        food: 0,
        firepower: 0,
        cargo: 0,
        money: 0,
        lastMessage: "", // обновление лога мониторим по последнему сообщению, так как размер лога теперь ограничен
        distance: 0,
        weight: 0,
        maxWeight: 0,
    }
};

WorldView.init = function (world) {
    this.world = world;

    this.UI_DAY_TEXT = "День";

    // элементы DOM находим сразу и запоминаем
    this.view = {};
    this.view.distance = document.getElementById('game-stat-distance');
    this.view.days = document.getElementById('game-stat-day');
    this.view.crew = document.getElementById('game-stat-crew');
    this.view.oxen = document.getElementById('game-stat-oxen');
    this.view.food = document.getElementById('game-stat-food');
    this.view.money = document.getElementById('game-stat-money');
    this.view.firepower = document.getElementById('game-stat-firepower');
    this.view.cargo = document.getElementById('game-stat-cargo');
    this.view.log = document.getElementById('game-log');
    this.view.weightBarText = document.getElementById('game-weight-bartext');
    this.view.weightBarFill = document.getElementById('game-weight-barfill');
    this.view.weight = document.getElementById('game-stat-cargo');
};

// Обновляем параметры по текущему состоянию мира
// если какой-то параметр не менялся - обновления для него не происходит
WorldView.update = function () {
    var world = this.world;
    if(this.viewModel.distance != world.distance){
        this.view.distance.innerHTML = Math.floor(world.distance);
        this.viewModel.distance = world.distance;
    }

    if(this.viewModel.day != world.day){
        this.view.days.innerHTML = Math.ceil(world.day);
        this.viewModel.day = world.day;
    }

    if(this.viewModel.crew != world.crew){
        this.view.crew.innerHTML = world.crew;
        this.viewModel.crew = world.crew;
    }

    if(this.viewModel.oxen != world.oxen){
        this.view.oxen.innerHTML = world.oxen;
        this.viewModel.oxen = world.oxen;
    }

    if(this.viewModel.food != world.food){
        this.view.food.innerHTML = Math.ceil(world.food);
        this.viewModel.food = world.food;
    }

    if(this.viewModel.money != world.money){
        this.view.money.innerHTML = Math.ceil(world.money);
        this.viewModel.money = world.money;
    }

    if(this.viewModel.firepower != world.firepower){
        this.view.firepower.innerHTML = Math.ceil(world.firepower);
        this.viewModel.firepower = world.firepower;
    }

    if(this.viewModel.cargo != world.cargo){
        this.view.cargo.innerHTML = Math.ceil(world.cargo);
        this.viewModel.cargo = world.cargo;
    }

    var lastMessage = world.log[world.log.length-1];
    if (this.viewModel.lastMessage != lastMessage) {
        this.refreshLog(world.log);
        this.viewModel.lastMessage = lastMessage;
    }

    var weight = getCaravanWeight(world);
    var maxWeight = getCaravanMaxWeight(world);
    if(weight!=this.viewModel.weight || maxWeight!=this.viewModel.maxWeight){
        var percent = Math.ceil(100*(Math.min(1, weight / maxWeight)));
        this.view.weightBarFill.style.width = percent+"%";
        this.view.weightBarText.innerHTML = "общий вес "+Math.ceil(weight) + " / максимальный вес " + Math.ceil(maxWeight);
        this.viewModel.weight = weight;
        this.viewModel.maxWeight = maxWeight;
    }
};

WorldView.refreshLog = function (log) {
    var messageLog = "", index;
    // лог показываем снизу вверх
    for (index = log.length - 1; index >= 0; index--) {
        messageLog += this.formatMessage(log[index]);
    }
    this.view.log.innerHTML = messageLog;
};

WorldView.formatMessage = function (message) {
    var messageClass = 'log-message-'+message.goodness;
    var formatted = '<div class="' + messageClass + '">' + this.UI_DAY_TEXT + ' ' + Math.ceil(message.day) + ': ' + message.message + '</div>';
    return formatted;
};

Game.addPlugin(WorldView);
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * English stock-photo search keyword per product id.
     * Used to fetch a relevant image from Pixabay when a product has no local image.
     */
    private array $imageQueries = [
        1 => 'garden rake', 2 => 'watering can', 3 => 'chainsaw', 4 => 'herbicide spray',
        5 => 'fertilizer', 6 => 'fertilizer granules', 7 => 'carrot', 8 => 'tomato',
        9 => 'cucumber', 10 => 'bell pepper', 11 => 'corn', 12 => 'zucchini',
        13 => 'pumpkin', 14 => 'radish', 15 => 'raspberry', 16 => 'apple',
        17 => 'sweet corn', 18 => 'cucumber', 19 => 'carrot', 20 => 'beetroot',
        21 => 'radish', 22 => 'zucchini', 23 => 'pumpkin', 24 => 'lettuce',
        25 => 'dill', 26 => 'parsley', 27 => 'basil', 28 => 'spinach',
        29 => 'green beans', 30 => 'green peas', 31 => 'watermelon', 32 => 'melon',
        33 => 'strawberry', 34 => 'blackberry', 35 => 'currant berry', 36 => 'gooseberry',
        37 => 'grapes', 38 => 'cherry', 39 => 'apricot', 40 => 'pear',
        41 => 'apple tree seedling', 42 => 'pear tree seedling', 43 => 'lawn mower', 44 => 'garden tiller',
        45 => 'garden sprayer', 46 => 'garden sprayer', 47 => 'pruning shears', 48 => 'splitting axe',
        49 => 'shovel', 50 => 'pitchfork', 51 => 'hand cultivator', 52 => 'snow shovel',
        53 => 'metal wire', 54 => 'wire brush', 55 => 'tree loppers', 56 => 'leaf rake',
        57 => 'hand cultivator', 58 => 'garden hoe', 59 => 'cordless drill', 60 => 'grass trimmer',
        61 => 'chainsaw', 62 => 'plant grow light', 63 => 'garden path', 64 => 'compost bin',
        65 => 'liquid fertilizer', 66 => 'fungicide', 67 => 'spray bottle', 68 => 'grass seed',
        69 => 'lawn grass', 70 => 'dill', 71 => 'radish', 72 => 'onion',
        73 => 'leaf blower', 74 => 'hand plane tool', 75 => 'wheelbarrow', 76 => 'compost bag',
        77 => 'gardening gloves', 78 => 'garden cart', 79 => 'garden tools set', 80 => 'garden hose',
        81 => 'garden lantern', 82 => 'garden fountain', 83 => 'radish', 84 => 'parsley',
        85 => 'dill', 86 => 'folding knife', 87 => 'garden sprayer', 88 => 'chili pepper',
        89 => 'broccoli', 90 => 'flower seeds', 91 => 'pumpkin', 92 => 'lettuce',
        93 => 'parsley root', 94 => 'string trimmer head', 95 => 'plant ties', 96 => 'potting soil',
        97 => 'seedling soil', 98 => 'garden bed border', 99 => 'bbq grill', 100 => 'tomato plant support',
    ];

    public function run(): void
    {
        $products = [
            ['id' => 1,  'name' => 'Грабли садовые',                    'price' => 1490,  'images' => json_encode(['/dataImg/grabl.png']),              'description' => 'Качественные грабли для работы в саду',          'available_quantity' => 40,  'categories' => [1,3]],
            ['id' => 2,  'name' => 'Лейка садовая 10л',                 'price' => 890,   'images' => json_encode(['/dataImg/leik.png']),               'description' => 'Удобная лейка на 10 литров',                     'available_quantity' => 25,  'categories' => [1,4]],
            ['id' => 3,  'name' => 'Пила цепная электрическая',         'price' => 4990,  'images' => json_encode(['/dataImg/accumulator_saw.webp']),   'description' => 'Мощная электрическая цепная пила для сада',      'available_quantity' => 10,  'categories' => [1,2,19,20]],
            ['id' => 4,  'name' => 'Гербицид от сорняков',              'price' => 2500,  'images' => json_encode(['/dataImg/gerbis.png']),              'description' => 'Эффективное средство от сорняков',               'available_quantity' => 80,  'categories' => [24,32,34]],
            ['id' => 5,  'name' => 'Удобрение комплексное',             'price' => 999,   'images' => json_encode(['/dataImg/ydobr.png']),               'description' => 'Комплексное удобрение для всех растений',        'available_quantity' => 150, 'categories' => [24,25]],
            ['id' => 6,  'name' => 'Минеральное удобрение NPK',         'price' => 1290,  'images' => json_encode(['/dataImg/fertilizer.jpg']),          'description' => 'Минеральное удобрение для овощей и цветов',      'available_quantity' => 100, 'categories' => [24,25]],
            ['id' => 7,  'name' => 'Семена моркови',                    'price' => 60,    'images' => json_encode(['/dataImg/carrot.webp']),             'description' => 'Семена моркови для посадки',                     'available_quantity' => 250, 'categories' => [36,37]],
            ['id' => 8,  'name' => 'Семена томата',                     'price' => 80,    'images' => json_encode(['/dataImg/tomato.webp']),             'description' => 'Семена томата для рассады',                      'available_quantity' => 180, 'categories' => [36,37]],
            ['id' => 9,  'name' => 'Семена огурца',                     'price' => 75,    'images' => json_encode(['/dataImg/cucumber.webp']),           'description' => 'Семена огурца для открытого грунта',             'available_quantity' => 160, 'categories' => [36,37]],
            ['id' => 10, 'name' => 'Семена перца',                      'price' => 90,    'images' => json_encode(['/dataImg/pepper.webp']),             'description' => 'Семена сладкого перца',                          'available_quantity' => 120, 'categories' => [36,37]],
            ['id' => 11, 'name' => 'Семена кукурузы',                   'price' => 70,    'images' => json_encode(['/dataImg/corn.webp']),               'description' => 'Семена кукурузы для посадки',                    'available_quantity' => 90,  'categories' => [36,37]],
            ['id' => 12, 'name' => 'Семена кабачка',                    'price' => 65,    'images' => json_encode(['/dataImg/zucchini.webp']),           'description' => 'Семена кабачка для дачи',                        'available_quantity' => 100, 'categories' => [36,37]],
            ['id' => 13, 'name' => 'Семена тыквы',                      'price' => 80,    'images' => json_encode(['/dataImg/pumplin.webp']),            'description' => 'Семена тыквы для посадки',                       'available_quantity' => 80,  'categories' => [36,37]],
            ['id' => 14, 'name' => 'Семена редиса',                     'price' => 55,    'images' => json_encode(['/dataImg/radish.webp']),             'description' => 'Семена редиса для ранней посадки',               'available_quantity' => 110, 'categories' => [36,37]],
            ['id' => 15, 'name' => 'Семена малины',                     'price' => 120,   'images' => json_encode(['/dataImg/rasberry.webp']),           'description' => 'Семена малины для сада',                         'available_quantity' => 70,  'categories' => [36,40]],
            ['id' => 16, 'name' => 'Семена яблони',                     'price' => 130,   'images' => json_encode(['/dataImg/apple.jpg']),               'description' => 'Семена яблони для посадки',                      'available_quantity' => 50,  'categories' => [36,40]],
            ['id' => 17, 'name' => 'Семена кукурузы сахарной',          'price' => 85,    'images' => json_encode(['/dataImg/corn.webp']),               'description' => 'Семена сахарной кукурузы',                       'available_quantity' => 60,  'categories' => [36,37]],
            ['id' => 18, 'name' => 'Семена огурца для теплиц',          'price' => 95,    'images' => json_encode(['/dataImg/cucumber.webp']),           'description' => 'Семена огурца для теплиц',                       'available_quantity' => 80,  'categories' => [36,37]],
            ['id' => 19, 'name' => 'Семена моркови ранней',             'price' => 70,    'images' => json_encode(['/dataImg/carrot.webp']),             'description' => 'Семена ранней моркови',                          'available_quantity' => 90,  'categories' => [36,37]],
            ['id' => 20, 'name' => 'Семена свеклы',                     'price' => 60,    'images' => null,                                              'description' => 'Семена свеклы для посадки',                      'available_quantity' => 70,  'categories' => [36,37]],
            ['id' => 21, 'name' => 'Семена редьки',                     'price' => 65,    'images' => null,                                              'description' => 'Семена редьки для посадки',                      'available_quantity' => 60,  'categories' => [36,37]],
            ['id' => 22, 'name' => 'Семена кабачка цукини',             'price' => 75,    'images' => json_encode(['/dataImg/zucchini.webp']),           'description' => 'Семена цукини для дачи',                         'available_quantity' => 80,  'categories' => [36,37]],
            ['id' => 23, 'name' => 'Семена тыквы крупноплодной',        'price' => 95,    'images' => json_encode(['/dataImg/pumplin.webp']),            'description' => 'Семена крупноплодной тыквы',                     'available_quantity' => 50,  'categories' => [36,37]],
            ['id' => 24, 'name' => 'Семена салата',                     'price' => 55,    'images' => null,                                              'description' => 'Семена салата для посадки',                      'available_quantity' => 70,  'categories' => [36,37]],
            ['id' => 25, 'name' => 'Семена укропа',                     'price' => 50,    'images' => null,                                              'description' => 'Семена укропа для огорода',                      'available_quantity' => 90,  'categories' => [36,37]],
            ['id' => 26, 'name' => 'Семена петрушки',                   'price' => 60,    'images' => null,                                              'description' => 'Семена петрушки для зелени',                     'available_quantity' => 100, 'categories' => [36,37]],
            ['id' => 27, 'name' => 'Семена базилика',                   'price' => 70,    'images' => null,                                              'description' => 'Семена базилика для приправ',                    'available_quantity' => 80,  'categories' => [36,37]],
            ['id' => 28, 'name' => 'Семена шпината',                    'price' => 65,    'images' => null,                                              'description' => 'Семена шпината для салатов',                     'available_quantity' => 60,  'categories' => [36,37]],
            ['id' => 29, 'name' => 'Семена фасоли',                     'price' => 80,    'images' => null,                                              'description' => 'Семена фасоли для посадки',                      'available_quantity' => 50,  'categories' => [36,37]],
            ['id' => 30, 'name' => 'Семена гороха',                     'price' => 70,    'images' => null,                                              'description' => 'Семена гороха для посадки',                      'available_quantity' => 70,  'categories' => [36,37]],
            ['id' => 31, 'name' => 'Семена арбуза',                     'price' => 90,    'images' => null,                                              'description' => 'Семена арбуза для посадки',                      'available_quantity' => 40,  'categories' => [36,37]],
            ['id' => 32, 'name' => 'Семена дыни',                       'price' => 95,    'images' => null,                                              'description' => 'Семена дыни для посадки',                        'available_quantity' => 50,  'categories' => [36,37]],
            ['id' => 33, 'name' => 'Семена клубники',                   'price' => 110,   'images' => null,                                              'description' => 'Семена клубники для сада',                       'available_quantity' => 60,  'categories' => [36,40]],
            ['id' => 34, 'name' => 'Семена ежевики',                    'price' => 120,   'images' => null,                                              'description' => 'Семена ежевики для посадки',                     'available_quantity' => 50,  'categories' => [36,40]],
            ['id' => 35, 'name' => 'Семена смородины',                  'price' => 115,   'images' => null,                                              'description' => 'Семена смородины для сада',                      'available_quantity' => 70,  'categories' => [36,40]],
            ['id' => 36, 'name' => 'Семена крыжовника',                 'price' => 110,   'images' => null,                                              'description' => 'Семена крыжовника для посадки',                  'available_quantity' => 50,  'categories' => [36,40]],
            ['id' => 37, 'name' => 'Семена винограда',                  'price' => 130,   'images' => null,                                              'description' => 'Семена винограда для сада',                      'available_quantity' => 60,  'categories' => [36,40]],
            ['id' => 38, 'name' => 'Семена черешни',                    'price' => 140,   'images' => null,                                              'description' => 'Семена черешни для посадки',                     'available_quantity' => 40,  'categories' => [36,40]],
            ['id' => 39, 'name' => 'Семена абрикоса',                   'price' => 135,   'images' => null,                                              'description' => 'Семена абрикоса для сада',                       'available_quantity' => 50,  'categories' => [36,40]],
            ['id' => 40, 'name' => 'Семена груши',                      'price' => 125,   'images' => null,                                              'description' => 'Семена груши для посадки',                       'available_quantity' => 60,  'categories' => [36,40]],
            ['id' => 41, 'name' => 'Саженец яблони (полу-штамб)',       'price' => 990,   'images' => json_encode(['/dataImg/oak.jpg']),                 'description' => 'Саженец яблони для участка',                     'available_quantity' => 35,  'categories' => [41,42]],
            ['id' => 42, 'name' => 'Саженец груши',                     'price' => 1050,  'images' => json_encode(['/dataImg/apple.jpg']),               'description' => 'Саженец груши для сада',                         'available_quantity' => 30,  'categories' => [41,42]],
            ['id' => 43, 'name' => 'Газонокосилка электрическая',       'price' => 8990,  'images' => null,                                              'description' => 'Электрическая газонокосилка для участка',        'available_quantity' => 8,   'categories' => [43,44]],
            ['id' => 44, 'name' => 'Мотоблок легкий',                   'price' => 24900, 'images' => null,                                              'description' => 'Мощный мотоблок для дачи',                       'available_quantity' => 6,   'categories' => [43,45]],
            ['id' => 45, 'name' => 'Опрыскиватель ручной 5л',           'price' => 650,   'images' => null,                                              'description' => 'Ручной опрыскиватель для садовых растений',      'available_quantity' => 100, 'categories' => [1,9]],
            ['id' => 46, 'name' => 'Опрыскиватель электрический 12л',   'price' => 3490,  'images' => null,                                              'description' => 'Электрический опрыскиватель для сада',           'available_quantity' => 20,  'categories' => [19,23]],
            ['id' => 47, 'name' => 'Секатор профессиональный',          'price' => 720,   'images' => null,                                              'description' => 'Секатор для обрезки веток',                      'available_quantity' => 50,  'categories' => [1,7]],
            ['id' => 48, 'name' => 'Топор колун',                       'price' => 1190,  'images' => null,                                              'description' => 'Топор для рубки дров',                           'available_quantity' => 35,  'categories' => [1,15]],
            ['id' => 49, 'name' => 'Лопата штыковая',                   'price' => 650,   'images' => null,                                              'description' => 'Штыковая лопата для копки',                      'available_quantity' => 70,  'categories' => [1,5]],
            ['id' => 50, 'name' => 'Вилы садовые',                      'price' => 890,   'images' => null,                                              'description' => 'Вилы для работы с компостом',                    'available_quantity' => 45,  'categories' => [1,8]],
            ['id' => 51, 'name' => 'Рыхлитель ручной',                  'price' => 450,   'images' => null,                                              'description' => 'Рыхлитель почвы для грядок',                     'available_quantity' => 55,  'categories' => [1,17]],
            ['id' => 52, 'name' => 'Скребок для снега',                 'price' => 520,   'images' => null,                                              'description' => 'Скребок для снега и льда',                       'available_quantity' => 35,  'categories' => [1,18]],
            ['id' => 53, 'name' => 'Проволока садовая 50м',             'price' => 220,   'images' => null,                                              'description' => 'Проволока для подвязки растений',                'available_quantity' => 180, 'categories' => [1,14]],
            ['id' => 54, 'name' => 'Щетка металлическая',               'price' => 330,   'images' => null,                                              'description' => 'Щетка для уборки и очистки',                     'available_quantity' => 80,  'categories' => [1,12]],
            ['id' => 55, 'name' => 'Сучкорез телескопический',          'price' => 2190,  'images' => null,                                              'description' => 'Сучкорез для высоких веток',                     'available_quantity' => 25,  'categories' => [1,13]],
            ['id' => 56, 'name' => 'Грабли веерные',                    'price' => 520,   'images' => json_encode(['/dataImg/grabl.png']),               'description' => 'Грабли веерные для уборки листьев',              'available_quantity' => 90,  'categories' => [1,3]],
            ['id' => 57, 'name' => 'Культиватор ручной 3 зуба',         'price' => 740,   'images' => null,                                              'description' => 'Ручной культиватор для рыхления почвы',          'available_quantity' => 35,  'categories' => [1,10]],
            ['id' => 58, 'name' => 'Мотыга универсальная',              'price' => 330,   'images' => null,                                              'description' => 'Мотыга для прополки и рыхления',                 'available_quantity' => 60,  'categories' => [1,11]],
            ['id' => 59, 'name' => 'Электродрель аккумуляторная',       'price' => 4290,  'images' => null,                                              'description' => 'Аккум. дрель для дачи и ремонта',                'available_quantity' => 15,  'categories' => [19,22]],
            ['id' => 60, 'name' => 'Электрический триммер',             'price' => 5590,  'images' => null,                                              'description' => 'Триммер для подстригания травы',                  'available_quantity' => 12,  'categories' => [19,21]],
            ['id' => 61, 'name' => 'Электропила маленькая',             'price' => 3990,  'images' => json_encode(['/dataImg/accumulator_saw.webp']),   'description' => 'Удобная малая электропила',                      'available_quantity' => 8,   'categories' => [19,20]],
            ['id' => 62, 'name' => 'Тепличная лампа LED',               'price' => 1290,  'images' => null,                                              'description' => 'LED лампа для подсветки растений',               'available_quantity' => 50,  'categories' => [29,31]],
            ['id' => 63, 'name' => 'Декоративная дорожка',              'price' => 2990,  'images' => null,                                              'description' => 'Плитка для садовых дорожек',                     'available_quantity' => 30,  'categories' => [29,30]],
            ['id' => 64, 'name' => 'Компостный контейнер 200л',         'price' => 4990,  'images' => null,                                              'description' => 'Контейнер для компоста',                         'available_quantity' => 20,  'categories' => [24,27]],
            ['id' => 65, 'name' => 'Гумат калия 1л',                    'price' => 450,   'images' => null,                                              'description' => 'Стимулятор роста растений',                      'available_quantity' => 90,  'categories' => [24,26,27]],
            ['id' => 66, 'name' => 'Фунгицид для роз 0.5л',             'price' => 790,   'images' => null,                                              'description' => 'Защита от грибковых заболеваний',                'available_quantity' => 50,  'categories' => [32,35]],
            ['id' => 67, 'name' => 'Пульверизатор 2л',                  'price' => 420,   'images' => null,                                              'description' => 'Ручной пульверизатор для опрыскиваний',          'available_quantity' => 130, 'categories' => [1,9]],
            ['id' => 68, 'name' => 'Семена газонной травы 1кг',         'price' => 990,   'images' => null,                                              'description' => 'Смесь для устройства газона',                    'available_quantity' => 50,  'categories' => [36,39]],
            ['id' => 69, 'name' => 'Семена газонной травы 5кг',         'price' => 3990,  'images' => null,                                              'description' => 'Большая упаковка для газона',                    'available_quantity' => 25,  'categories' => [36,39]],
            ['id' => 70, 'name' => 'Семена укропа крупного',            'price' => 55,    'images' => null,                                              'description' => 'Укроп для огорода',                              'available_quantity' => 110, 'categories' => [36,37]],
            ['id' => 71, 'name' => 'Семена редиса сверхранний',         'price' => 60,    'images' => json_encode(['/dataImg/radish.webp']),             'description' => 'Редис для раннего урожая',                       'available_quantity' => 80,  'categories' => [36,37]],
            ['id' => 72, 'name' => 'Семена лука репчатого',             'price' => 70,    'images' => null,                                              'description' => 'Семена лука для хранения',                       'available_quantity' => 70,  'categories' => [36,37]],
            ['id' => 73, 'name' => 'Пылесос садовый (сдув)',            'price' => 6990,  'images' => null,                                              'description' => 'Садовый пылесос для листьев',                    'available_quantity' => 10,  'categories' => [19,20]],
            ['id' => 74, 'name' => 'Рубанок ручной',                    'price' => 450,   'images' => null,                                              'description' => 'Инструмент для обработки древесины',             'available_quantity' => 35,  'categories' => [1,12]],
            ['id' => 75, 'name' => 'Садовая тачка 100л',                'price' => 3290,  'images' => null,                                              'description' => 'Тачка для перевозки грунта и растений',          'available_quantity' => 20,  'categories' => [1]],
            ['id' => 76, 'name' => 'Мешок для компоста 200л',           'price' => 490,   'images' => null,                                              'description' => 'Пакет для компоста и органики',                  'available_quantity' => 180, 'categories' => [24,27]],
            ['id' => 77, 'name' => 'Садовые перчатки L',                'price' => 290,   'images' => null,                                              'description' => 'Защитные перчатки для работы в саду',            'available_quantity' => 280, 'categories' => [1]],
            ['id' => 78, 'name' => 'Садовая тележка складная',          'price' => 4290,  'images' => null,                                              'description' => 'Удобная тележка для дачи',                       'available_quantity' => 15,  'categories' => [1]],
            ['id' => 79, 'name' => 'Набор инструментов 5 в 1',          'price' => 1290,  'images' => null,                                              'description' => 'Базовый набор для ухода за садом',               'available_quantity' => 80,  'categories' => [1]],
            ['id' => 80, 'name' => 'Садовый шланг 20м',                 'price' => 1190,  'images' => null,                                              'description' => 'Гибкий шланг для полива',                        'available_quantity' => 110, 'categories' => [1,4]],
            ['id' => 81, 'name' => 'Светодиодный фонарь садовый',       'price' => 790,   'images' => null,                                              'description' => 'Фонарь для освещения дорожек',                   'available_quantity' => 70,  'categories' => [29,31]],
            ['id' => 82, 'name' => 'Декоративный фонтанчик малый',      'price' => 4990,  'images' => null,                                              'description' => 'Декоративный садовый фонтанчик',                 'available_quantity' => 12,  'categories' => [29]],
            ['id' => 83, 'name' => 'Семена редиса пакет 20г',           'price' => 45,    'images' => json_encode(['/dataImg/radish.webp']),             'description' => 'Мелкая фасовка семян редиса',                    'available_quantity' => 180, 'categories' => [36,37]],
            ['id' => 84, 'name' => 'Семена петрушки пакет 20г',         'price' => 50,    'images' => null,                                              'description' => 'Мелкая фасовка петрушки',                        'available_quantity' => 160, 'categories' => [36,37]],
            ['id' => 85, 'name' => 'Семена укропа пакет 20г',           'price' => 45,    'images' => null,                                              'description' => 'Мелкая фасовка укропа',                          'available_quantity' => 180, 'categories' => [36,37]],
            ['id' => 86, 'name' => 'Садовый нож складной',              'price' => 690,   'images' => null,                                              'description' => 'Маленький складной нож для сада',                'available_quantity' => 110, 'categories' => [1]],
            ['id' => 87, 'name' => 'Пульверизатор аккумуляторный 8л',   'price' => 5990,  'images' => null,                                              'description' => 'Аккум. пульверизатор для обработки растений',    'available_quantity' => 18,  'categories' => [19,23]],
            ['id' => 88, 'name' => 'Семена перца острый',               'price' => 85,    'images' => json_encode(['/dataImg/pepper.webp']),             'description' => 'Семена острого перца',                           'available_quantity' => 100, 'categories' => [36,37]],
            ['id' => 89, 'name' => 'Семена брокколи',                   'price' => 95,    'images' => null,                                              'description' => 'Семена брокколи для выращивания',                'available_quantity' => 80,  'categories' => [36,37]],
            ['id' => 90, 'name' => 'Семена цветочной смесь 100г',       'price' => 220,   'images' => null,                                              'description' => 'Мешаная смесь семян цветов',                     'available_quantity' => 50,  'categories' => [36,38]],
            ['id' => 91, 'name' => 'Семена тыквы карманной',            'price' => 70,    'images' => json_encode(['/dataImg/pumplin.webp']),            'description' => 'Семена карманной тыквы',                         'available_quantity' => 70,  'categories' => [36,37]],
            ['id' => 92, 'name' => 'Семена салата латук',               'price' => 60,    'images' => null,                                              'description' => 'Семена салата латук',                            'available_quantity' => 110, 'categories' => [36,37]],
            ['id' => 93, 'name' => 'Семена петрушки корневой',          'price' => 65,    'images' => null,                                              'description' => 'Корневая петрушка для огорода',                  'available_quantity' => 60,  'categories' => [36,37]],
            ['id' => 94, 'name' => 'Насадка-мульчер для триммера',      'price' => 1990,  'images' => null,                                              'description' => 'Насадка для мульчирования травы',                'available_quantity' => 15,  'categories' => [19,21]],
            ['id' => 95, 'name' => 'Набор подвязок для растений 50шт',  'price' => 220,   'images' => null,                                              'description' => 'Комплект подвязок и крепежей',                   'available_quantity' => 290, 'categories' => [1,14]],
            ['id' => 96, 'name' => 'Грунт универсальный 20л',           'price' => 450,   'images' => null,                                              'description' => 'Грунт для цветов и овощей',                      'available_quantity' => 180, 'categories' => [24]],
            ['id' => 97, 'name' => 'Грунт для рассады 5л',              'price' => 220,   'images' => null,                                              'description' => 'Легкий грунт для рассады',                       'available_quantity' => 160, 'categories' => [24]],
            ['id' => 98, 'name' => 'Лента для грядок 10м',              'price' => 150,   'images' => null,                                              'description' => 'Декоративная лента для грядок',                  'available_quantity' => 240, 'categories' => [29]],
            ['id' => 99, 'name' => 'Печь для копчения шашлыка',         'price' => 8990,  'images' => null,                                              'description' => 'Компактная печь-барбекю для дачи',               'available_quantity' => 10,  'categories' => [29]],
            ['id' => 100,'name' => 'Набор для подвязки помидоров 20шт', 'price' => 330,   'images' => null,                                              'description' => 'Набор для подвязки томатов',                     'available_quantity' => 180, 'categories' => [1,14]],
        ];

        $hasApiKey = !empty(config('services.pixabay.key'));
        $fetched = 0;

        foreach ($products as $productData) {
            $categoryIds = $productData['categories'];
            unset($productData['categories']);

            // A few products are intentionally left without a photo so staff can
            // find them via the "Нет фото" filter in the admin panel.
            $noImageIds = [44, 49, 50, 64, 73, 82, 96, 99];

            // Fill missing images with a relevant stock photo from Pixabay.
            if (empty($productData['images']) && $hasApiKey && !in_array($productData['id'], $noImageIds, true)) {
                $query = $this->imageQueries[$productData['id']] ?? null;
                if ($query) {
                    $slug = $productData['id'] . '-' . Str::slug($query);
                    $path = $this->fetchPixabayImage($query, $slug);
                    if ($path) {
                        $productData['images'] = json_encode([$path]);
                        $fetched++;
                    }
                }
            }

            $productData['created_at'] = now();
            $productData['updated_at'] = now();

            DB::table('products')->insert($productData);

            foreach ($categoryIds as $catId) {
                DB::table('category_product')->insert([
                    'product_id'  => $productData['id'],
                    'category_id' => $catId,
                ]);
            }
        }

        // Discounts — max 30%, used by the "Скидки до 30%" homepage slide.
        // 12 discounted products, two of them exactly at 30%.
        $discounts = [
            6 => 30, 43 => 30,            // топовые скидки 30%
            1 => 25, 41 => 25,
            3 => 20, 13 => 20, 61 => 20,
            5 => 15, 11 => 15,
            7 => 10, 9 => 10, 56 => 10,
        ];
        foreach ($discounts as $productId => $percent) {
            DB::table('products')->where('id', $productId)->update(['discount_percent' => $percent]);
        }

        if (!$hasApiKey) {
            $this->command?->warn('PIXABAY_API_KEY не задан в .env — товары без локальных фото остались без изображений.');
        } else {
            $this->command?->info("Pixabay: загружено изображений — {$fetched}.");
        }
    }

    /**
     * Fetch the first matching photo from Pixabay and store it in public/dataImg/seed.
     * Returns the public path (e.g. /dataImg/seed/7-carrot.jpg) or null on failure.
     * Already-downloaded files are reused, so re-seeding is fast and works offline.
     */
    private function fetchPixabayImage(string $query, string $slug): ?string
    {
        $key = config('services.pixabay.key');
        if (!$key) {
            return null;
        }

        $destDir    = public_path('dataImg/seed');
        $destFile   = $destDir . DIRECTORY_SEPARATOR . $slug . '.jpg';
        $publicPath = '/dataImg/seed/' . $slug . '.jpg';

        if (file_exists($destFile)) {
            return $publicPath; // cached from a previous seed run
        }

        if (!is_dir($destDir)) {
            mkdir($destDir, 0775, true);
        }

        try {
            // withoutVerifying(): local dev convenience — many Windows/OSPanel PHP
            // installs ship without a configured CA bundle (cURL error 60).
            $resp = Http::withoutVerifying()->timeout(20)->get('https://pixabay.com/api/', [
                'key'         => $key,
                'q'           => $query,
                'image_type'  => 'photo',
                'orientation' => 'horizontal',
                'safesearch'  => 'true',
                'per_page'    => 3,
            ]);

            if (!$resp->ok()) {
                return null;
            }

            $hits = $resp->json('hits') ?? [];
            $url  = $hits[0]['webformatURL'] ?? $hits[0]['largeImageURL'] ?? null;
            if (!$url) {
                return null;
            }

            $img = Http::withoutVerifying()->timeout(30)->get($url);
            if (!$img->ok()) {
                return null;
            }

            file_put_contents($destFile, $img->body());

            return $publicPath;
        } catch (\Throwable $e) {
            return null;
        }
    }
}

<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\FetchesStockImages;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    use FetchesStockImages;

    private const PLACEHOLDER = '/dataImg/noimagebig.png';

    /**
     * Английские поисковые запросы для категорий без предзагруженного фото.
     * Если у категории иконка-заглушка, картинка подтягивается с Pixabay.
     */
    private array $imageQueries = [
        1  => 'garden tools',        5  => 'garden shovel',     6  => 'garden hoe',
        7  => 'pruning shears',      8  => 'pitchfork',         9  => 'garden sprayer',
        10 => 'hand cultivator',     11 => 'garden hoe tool',   12 => 'cleaning brush',
        13 => 'tree loppers',        14 => 'garden wire',       15 => 'axe tool',
        16 => 'scythe',              17 => 'soil cultivator',   18 => 'snow scraper',
        19 => 'power tools',         21 => 'grass trimmer',     22 => 'electric drill',
        23 => 'electric sprayer',    27 => 'compost',           28 => 'fertilizer granules',
        29 => 'garden decor',        30 => 'garden path',       31 => 'garden lighting',
        35 => 'plant fungicide',     36 => 'seed packets',      38 => 'flower seeds',
        39 => 'lawn grass',          43 => 'garden machinery',  44 => 'lawn mower',
        45 => 'garden tiller',
    ];

    public function run(): void
    {
        $categories = [
            ['id' => 1, 'name' => 'Инструменты', 'icon' => self::PLACEHOLDER, 'description' => 'Садовый инструмент', 'parent_id' => null],
            ['id' => 2, 'name' => 'Пилы', 'icon' => '/dataImg/accumulator_saw.webp', 'description' => 'Садовые пилы и ножовки', 'parent_id' => 1],
            ['id' => 3, 'name' => 'Грабли', 'icon' => '/dataImg/grabl.png', 'description' => 'Грабли для сада', 'parent_id' => 1],
            ['id' => 4, 'name' => 'Лейки', 'icon' => '/dataImg/leik.png', 'description' => 'Лейки для полива', 'parent_id' => 1],
            ['id' => 5, 'name' => 'Лопаты', 'icon' => self::PLACEHOLDER, 'description' => 'Садовые лопаты', 'parent_id' => 1],
            ['id' => 6, 'name' => 'Тяпки', 'icon' => self::PLACEHOLDER, 'description' => 'Тяпки и мотыги', 'parent_id' => 1],
            ['id' => 7, 'name' => 'Секаторы', 'icon' => self::PLACEHOLDER, 'description' => 'Секаторы и ножницы', 'parent_id' => 1],
            ['id' => 8, 'name' => 'Вилы', 'icon' => self::PLACEHOLDER, 'description' => 'Садовые вилы', 'parent_id' => 1],
            ['id' => 9, 'name' => 'Опрыскиватели', 'icon' => self::PLACEHOLDER, 'description' => 'Опрыскиватели для растений', 'parent_id' => 1],
            ['id' => 10, 'name' => 'Культиваторы ручные', 'icon' => self::PLACEHOLDER, 'description' => 'Ручные культиваторы', 'parent_id' => 1],
            ['id' => 11, 'name' => 'Мотыги', 'icon' => self::PLACEHOLDER, 'description' => 'Мотыги для рыхления почвы', 'parent_id' => 1],
            ['id' => 12, 'name' => 'Щётки', 'icon' => self::PLACEHOLDER, 'description' => 'Щётки для уборки', 'parent_id' => 1],
            ['id' => 13, 'name' => 'Сучкорезы', 'icon' => self::PLACEHOLDER, 'description' => 'Сучкорезы для обрезки веток', 'parent_id' => 1],
            ['id' => 14, 'name' => 'Проволока садовая', 'icon' => self::PLACEHOLDER, 'description' => 'Проволока для подвязки растений', 'parent_id' => 1],
            ['id' => 15, 'name' => 'Топоры', 'icon' => self::PLACEHOLDER, 'description' => 'Садовые топоры', 'parent_id' => 1],
            ['id' => 16, 'name' => 'Косы', 'icon' => self::PLACEHOLDER, 'description' => 'Косы для травы', 'parent_id' => 1],
            ['id' => 17, 'name' => 'Рыхлители', 'icon' => self::PLACEHOLDER, 'description' => 'Рыхлители почвы', 'parent_id' => 1],
            ['id' => 18, 'name' => 'Скребки', 'icon' => self::PLACEHOLDER, 'description' => 'Скребки для снега и земли', 'parent_id' => 1],
            ['id' => 19, 'name' => 'Электроинструменты', 'icon' => self::PLACEHOLDER, 'description' => 'Электрические инструменты для сада и ремонта', 'parent_id' => 1],
            ['id' => 20, 'name' => 'Электропилы', 'icon' => '/dataImg/accumulator_saw.webp', 'description' => 'Цепные и дисковые электропилы', 'parent_id' => 19],
            ['id' => 21, 'name' => 'Электрические триммеры', 'icon' => self::PLACEHOLDER, 'description' => 'Триммеры для травы и кустов', 'parent_id' => 19],
            ['id' => 22, 'name' => 'Электродрели', 'icon' => self::PLACEHOLDER, 'description' => 'Дрели и шуруповерты', 'parent_id' => 19],
            ['id' => 23, 'name' => 'Электрические опрыскиватели', 'icon' => self::PLACEHOLDER, 'description' => 'Опрыскиватели с электроприводом', 'parent_id' => 19],
            ['id' => 24, 'name' => 'Удобрения', 'icon' => '/dataImg/ydobr.png', 'description' => 'Удобрения и травы', 'parent_id' => null],
            ['id' => 25, 'name' => 'Минеральные удобрения', 'icon' => '/dataImg/fertilizer.jpg', 'description' => 'Минеральные удобрения', 'parent_id' => 24],
            ['id' => 26, 'name' => 'Органические удобрения', 'icon' => '/dataImg/fertilizer.jpg', 'description' => 'Органические удобрения', 'parent_id' => 24],
            ['id' => 27, 'name' => 'Компост', 'icon' => self::PLACEHOLDER, 'description' => 'Компост и органика', 'parent_id' => 26],
            ['id' => 28, 'name' => 'Гуматы', 'icon' => self::PLACEHOLDER, 'description' => 'Гуминовые удобрения', 'parent_id' => 26],
            ['id' => 29, 'name' => 'Декор', 'icon' => self::PLACEHOLDER, 'description' => 'Садовый декор', 'parent_id' => null],
            ['id' => 30, 'name' => 'Дорожки', 'icon' => self::PLACEHOLDER, 'description' => 'Декоративные дорожки', 'parent_id' => 29],
            ['id' => 31, 'name' => 'Освещение', 'icon' => self::PLACEHOLDER, 'description' => 'Садовое освещение', 'parent_id' => 29],
            ['id' => 32, 'name' => 'Химия', 'icon' => '/dataImg/gerbis.png', 'description' => 'Бытовая химия', 'parent_id' => null],
            ['id' => 33, 'name' => 'Средства от вредителей', 'icon' => '/dataImg/copper_sulfate.webp', 'description' => 'Химия для защиты растений', 'parent_id' => 32],
            ['id' => 34, 'name' => 'Гербициды', 'icon' => '/dataImg/gerbis.png', 'description' => 'Средства от сорняков', 'parent_id' => 32],
            ['id' => 35, 'name' => 'Фунгициды', 'icon' => self::PLACEHOLDER, 'description' => 'Средства от грибков', 'parent_id' => 32],
            ['id' => 36, 'name' => 'Семена', 'icon' => self::PLACEHOLDER, 'description' => 'Семена растений', 'parent_id' => null],
            ['id' => 37, 'name' => 'Овощные семена', 'icon' => '/dataImg/carrot.webp', 'description' => 'Семена овощей', 'parent_id' => 36],
            ['id' => 38, 'name' => 'Цветочные семена', 'icon' => self::PLACEHOLDER, 'description' => 'Семена цветов', 'parent_id' => 36],
            ['id' => 39, 'name' => 'Газонные травы', 'icon' => self::PLACEHOLDER, 'description' => 'Семена газонных трав', 'parent_id' => 36],
            ['id' => 40, 'name' => 'Семена фруктовых', 'icon' => '/dataImg/apple.jpg', 'description' => 'Семена фруктовых культур', 'parent_id' => 36],
            ['id' => 41, 'name' => 'Саженцы деревьев', 'icon' => '/dataImg/oak.jpg', 'description' => 'Саженцы декоративных и плодовых деревьев', 'parent_id' => null],
            ['id' => 42, 'name' => 'Саженцы плодовых', 'icon' => '/dataImg/apple.jpg', 'description' => 'Саженцы яблонь, груш, слив и других плодовых', 'parent_id' => 41],
            ['id' => 43, 'name' => 'Техника', 'icon' => self::PLACEHOLDER, 'description' => 'Садовая техника', 'parent_id' => null],
            ['id' => 44, 'name' => 'Газонокосилки', 'icon' => self::PLACEHOLDER, 'description' => 'Газонокосилки и триммеры', 'parent_id' => 43],
            ['id' => 45, 'name' => 'Мотоблоки', 'icon' => self::PLACEHOLDER, 'description' => 'Мотоблоки и культиваторы', 'parent_id' => 43],
        ];

        $useStock = $this->stockImagesEnabled();
        $fetched = 0;

        foreach ($categories as $cat) {
            // Если фото нет (заглушка) — пытаемся подтянуть стоковое изображение.
            if ($useStock && $cat['icon'] === self::PLACEHOLDER && isset($this->imageQueries[$cat['id']])) {
                $slug = 'cat-' . $cat['id'] . '-' . \Illuminate\Support\Str::slug($this->imageQueries[$cat['id']]);
                $path = $this->fetchStockImage($this->imageQueries[$cat['id']], $slug);
                if ($path) {
                    $cat['icon'] = $path;
                    $fetched++;
                }
            }

            $cat['created_at'] = now();
            $cat['updated_at'] = now();
            DB::table('categories')->insert($cat);
        }

        if (!$useStock) {
            $this->command?->warn('PIXABAY_API_KEY не задан — категории без локальных иконок остались с заглушкой.');
        } else {
            $this->command?->info("Pixabay (категории): загружено изображений — {$fetched}.");
        }
    }
}

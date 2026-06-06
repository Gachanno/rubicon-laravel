<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['id' => 1, 'name' => 'Инструменты', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Садовый инструмент', 'parent_id' => null],
            ['id' => 2, 'name' => 'Пилы', 'icon' => '/dataImg/accumulator_saw.webp', 'description' => 'Садовые пилы и ножовки', 'parent_id' => 1],
            ['id' => 3, 'name' => 'Грабли', 'icon' => '/dataImg/grabl.png', 'description' => 'Грабли для сада', 'parent_id' => 1],
            ['id' => 4, 'name' => 'Лейки', 'icon' => '/dataImg/leik.png', 'description' => 'Лейки для полива', 'parent_id' => 1],
            ['id' => 5, 'name' => 'Лопаты', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Садовые лопаты', 'parent_id' => 1],
            ['id' => 6, 'name' => 'Тяпки', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Тяпки и мотыги', 'parent_id' => 1],
            ['id' => 7, 'name' => 'Секаторы', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Секаторы и ножницы', 'parent_id' => 1],
            ['id' => 8, 'name' => 'Вилы', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Садовые вилы', 'parent_id' => 1],
            ['id' => 9, 'name' => 'Опрыскиватели', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Опрыскиватели для растений', 'parent_id' => 1],
            ['id' => 10, 'name' => 'Культиваторы ручные', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Ручные культиваторы', 'parent_id' => 1],
            ['id' => 11, 'name' => 'Мотыги', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Мотыги для рыхления почвы', 'parent_id' => 1],
            ['id' => 12, 'name' => 'Щётки', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Щётки для уборки', 'parent_id' => 1],
            ['id' => 13, 'name' => 'Сучкорезы', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Сучкорезы для обрезки веток', 'parent_id' => 1],
            ['id' => 14, 'name' => 'Проволока садовая', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Проволока для подвязки растений', 'parent_id' => 1],
            ['id' => 15, 'name' => 'Топоры', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Садовые топоры', 'parent_id' => 1],
            ['id' => 16, 'name' => 'Косы', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Косы для травы', 'parent_id' => 1],
            ['id' => 17, 'name' => 'Рыхлители', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Рыхлители почвы', 'parent_id' => 1],
            ['id' => 18, 'name' => 'Скребки', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Скребки для снега и земли', 'parent_id' => 1],
            ['id' => 19, 'name' => 'Электроинструменты', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Электрические инструменты для сада и ремонта', 'parent_id' => 1],
            ['id' => 20, 'name' => 'Электропилы', 'icon' => '/dataImg/accumulator_saw.webp', 'description' => 'Цепные и дисковые электропилы', 'parent_id' => 19],
            ['id' => 21, 'name' => 'Электрические триммеры', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Триммеры для травы и кустов', 'parent_id' => 19],
            ['id' => 22, 'name' => 'Электродрели', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Дрели и шуруповерты', 'parent_id' => 19],
            ['id' => 23, 'name' => 'Электрические опрыскиватели', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Опрыскиватели с электроприводом', 'parent_id' => 19],
            ['id' => 24, 'name' => 'Удобрения', 'icon' => '/dataImg/ydobr.png', 'description' => 'Удобрения и травы', 'parent_id' => null],
            ['id' => 25, 'name' => 'Минеральные удобрения', 'icon' => '/dataImg/fertilizer.jpg', 'description' => 'Минеральные удобрения', 'parent_id' => 24],
            ['id' => 26, 'name' => 'Органические удобрения', 'icon' => '/dataImg/fertilizer.jpg', 'description' => 'Органические удобрения', 'parent_id' => 24],
            ['id' => 27, 'name' => 'Компост', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Компост и органика', 'parent_id' => 26],
            ['id' => 28, 'name' => 'Гуматы', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Гуминовые удобрения', 'parent_id' => 26],
            ['id' => 29, 'name' => 'Декор', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Садовый декор', 'parent_id' => null],
            ['id' => 30, 'name' => 'Дорожки', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Декоративные дорожки', 'parent_id' => 29],
            ['id' => 31, 'name' => 'Освещение', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Садовое освещение', 'parent_id' => 29],
            ['id' => 32, 'name' => 'Химия', 'icon' => '/dataImg/gerbis.png', 'description' => 'Бытовая химия', 'parent_id' => null],
            ['id' => 33, 'name' => 'Средства от вредителей', 'icon' => '/dataImg/copper_sulfate.webp', 'description' => 'Химия для защиты растений', 'parent_id' => 32],
            ['id' => 34, 'name' => 'Гербициды', 'icon' => '/dataImg/gerbis.png', 'description' => 'Средства от сорняков', 'parent_id' => 32],
            ['id' => 35, 'name' => 'Фунгициды', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Средства от грибков', 'parent_id' => 32],
            ['id' => 36, 'name' => 'Семена', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Семена растений', 'parent_id' => null],
            ['id' => 37, 'name' => 'Овощные семена', 'icon' => '/dataImg/carrot.webp', 'description' => 'Семена овощей', 'parent_id' => 36],
            ['id' => 38, 'name' => 'Цветочные семена', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Семена цветов', 'parent_id' => 36],
            ['id' => 39, 'name' => 'Газонные травы', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Семена газонных трав', 'parent_id' => 36],
            ['id' => 40, 'name' => 'Семена фруктовых', 'icon' => '/dataImg/apple.jpg', 'description' => 'Семена фруктовых культур', 'parent_id' => 36],
            ['id' => 41, 'name' => 'Саженцы деревьев', 'icon' => '/dataImg/oak.jpg', 'description' => 'Саженцы декоративных и плодовых деревьев', 'parent_id' => null],
            ['id' => 42, 'name' => 'Саженцы плодовых', 'icon' => '/dataImg/apple.jpg', 'description' => 'Саженцы яблонь, груш, слив и других плодовых', 'parent_id' => 41],
            ['id' => 43, 'name' => 'Техника', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Садовая техника', 'parent_id' => null],
            ['id' => 44, 'name' => 'Газонокосилки', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Газонокосилки и триммеры', 'parent_id' => 43],
            ['id' => 45, 'name' => 'Мотоблоки', 'icon' => '/dataImg/noimagebig.png', 'description' => 'Мотоблоки и культиваторы', 'parent_id' => 43],
        ];

        foreach ($categories as $cat) {
            $cat['created_at'] = now();
            $cat['updated_at'] = now();
            DB::table('categories')->insert($cat);
        }
    }
}

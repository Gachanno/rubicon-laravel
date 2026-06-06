<?php

namespace Database\Seeders;

use App\Models\Slide;
use Illuminate\Database\Seeder;

class SlideSeeder extends Seeder
{
    public function run(): void
    {
        $slides = [
            [
                'title'       => 'Всё лучшее для вашего сада',
                'description' => 'Качественные товары для сада, бытовая химия и инструменты от проверенных производителей',
                'link'        => '/catalog',
                'image'       => '/dataImg/mainNew.png',
            ],
            [
                // Ссылка ведёт на список товаров со скидкой, отсортированный от большей скидки к меньшей.
                // В сидере 12 товаров со скидкой, максимум — 30%.
                'title'       => 'Скидки до 30%',
                'description' => 'Более 10 товаров со скидкой — садовый инвентарь и удобрения. Максимальная выгода — 30%',
                'link'        => '/products?hasDiscount=true&sortBy=discount_percent&sortDir=desc',
                'image'       => '/dataImg/mainNew.png',
            ],
            [
                // Ссылка ведёт на список товаров, отсортированный по популярности (числу одобренных отзывов).
                'title'       => 'Популярные товары',
                'description' => 'То, что чаще всего покупают и обсуждают — по количеству отзывов покупателей',
                'link'        => '/products?sortBy=popularity&sortDir=desc',
                'image'       => '/dataImg/mainNew.png',
            ],
        ];

        foreach ($slides as $slide) {
            Slide::create($slide);
        }
    }
}

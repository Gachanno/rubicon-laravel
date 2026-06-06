<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $now = '2025-12-01 10:00:00';

        // "выдано" orders so users can leave reviews
        $orders = [
            ['id' => 20, 'user_id' => 3, 'status' => 'выдано', 'physical_point_id' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 21, 'user_id' => 4, 'status' => 'выдано', 'physical_point_id' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 22, 'user_id' => 5, 'status' => 'выдано', 'physical_point_id' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 23, 'user_id' => 6, 'status' => 'выдано', 'physical_point_id' => 1, 'created_at' => $now, 'updated_at' => $now],
        ];
        DB::table('orders')->insert($orders);

        // order items
        $items = [];
        foreach ([20 => 3, 21 => 4] as $orderId => $userId) {
            for ($p = 1; $p <= 5; $p++) {
                $items[] = ['order_id' => $orderId, 'product_id' => $p, 'quantity' => 1];
            }
        }
        foreach ([22 => 5, 23 => 6] as $orderId => $userId) {
            for ($p = 6; $p <= 10; $p++) {
                $items[] = ['order_id' => $orderId, 'product_id' => $p, 'quantity' => 1];
            }
        }
        DB::table('order_items')->insert($items);

        // 20 reviews: users 3,4 on products 1-5; users 5,6 on products 6-10
        $reviews = [];
        $bodies = [
            'Отличный товар, очень доволен покупкой!',
            'Хорошее качество, соответствует описанию.',
            'Средний товар, есть небольшие недостатки.',
            'Не очень понравился, ожидал лучшего.',
            'Разочарован качеством, не рекомендую.',
        ];

        $ratingsA = [5, 4, 3, 2, 1];
        $ratingsB = [1, 2, 3, 4, 5];

        for ($i = 0; $i < 5; $i++) {
            $reviews[] = [
                'user_id' => 3, 'product_id' => $i + 1,
                'rating' => $ratingsA[$i], 'body' => $bodies[$i],
                'images' => null, 'status' => 'approved', 'created_at' => $now, 'updated_at' => $now,
            ];
            $reviews[] = [
                'user_id' => 4, 'product_id' => $i + 1,
                'rating' => $ratingsB[$i], 'body' => $bodies[4 - $i],
                'images' => null, 'status' => 'approved', 'created_at' => $now, 'updated_at' => $now,
            ];
            $reviews[] = [
                'user_id' => 5, 'product_id' => $i + 6,
                'rating' => $ratingsA[$i], 'body' => $bodies[$i],
                'images' => null, 'status' => 'approved', 'created_at' => $now, 'updated_at' => $now,
            ];
            $reviews[] = [
                'user_id' => 6, 'product_id' => $i + 6,
                'rating' => $ratingsB[$i], 'body' => $bodies[4 - $i],
                'images' => null, 'status' => 'approved', 'created_at' => $now, 'updated_at' => $now,
            ];
        }

        // A couple of reviews left in moderation to populate the admin queue
        $reviews[] = [
            'user_id' => 5, 'product_id' => 1,
            'rating' => 5, 'body' => 'Отличные грабли, жду одобрения отзыва.',
            'images' => null, 'status' => 'pending', 'created_at' => $now, 'updated_at' => $now,
        ];
        $reviews[] = [
            'user_id' => 6, 'product_id' => 2,
            'rating' => 4, 'body' => 'Удобная лейка, отзыв на модерации.',
            'images' => null, 'status' => 'pending', 'created_at' => $now, 'updated_at' => $now,
        ];

        DB::table('reviews')->insert($reviews);
    }
}

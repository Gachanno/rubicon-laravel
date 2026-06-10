<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $orders = [
            ['id' => 1, 'user_id' => 3, 'status' => 'подтверждено', 'delivery_method' => 'pickup', 'delivery_carrier' => null, 'delivery_address' => null, 'created_at' => '2025-10-01'],
            ['id' => 2, 'user_id' => 3, 'status' => 'в ожидании', 'delivery_method' => 'delivery', 'delivery_carrier' => 'sdek', 'delivery_address' => 'г. Москва, ул. Ленина, д. 12, кв. 34', 'created_at' => '2025-10-15'],
            ['id' => 3, 'user_id' => 4, 'status' => 'отменено', 'delivery_method' => 'delivery', 'delivery_carrier' => 'pochta', 'delivery_address' => 'г. Санкт-Петербург, Невский пр-т, д. 78, кв. 5', 'created_at' => '2025-09-30'],
            ['id' => 4, 'user_id' => 4, 'status' => 'в ожидании', 'delivery_method' => 'pickup', 'delivery_carrier' => null, 'delivery_address' => null, 'created_at' => '2025-11-05'],
            ['id' => 5, 'user_id' => 3, 'status' => 'в ожидании', 'delivery_method' => 'delivery', 'delivery_carrier' => 'sdek', 'delivery_address' => 'г. Москва, ул. Ленина, д. 12, кв. 34', 'created_at' => '2025-11-10'],
            ['id' => 6, 'user_id' => 3, 'status' => 'подтверждено', 'delivery_method' => 'pickup', 'delivery_carrier' => null, 'delivery_address' => null, 'created_at' => '2025-11-12'],
            ['id' => 7, 'user_id' => 3, 'status' => 'выдано', 'delivery_method' => 'delivery', 'delivery_carrier' => 'pochta', 'delivery_address' => 'г. Москва, ул. Ленина, д. 12, кв. 34', 'created_at' => '2025-11-12'],
            ['id' => 8, 'user_id' => 3, 'status' => 'подтверждено', 'delivery_method' => 'pickup', 'delivery_carrier' => null, 'delivery_address' => null, 'created_at' => '2025-11-12'],
            ['id' => 9, 'user_id' => 3, 'status' => 'выдано', 'delivery_method' => 'pickup', 'delivery_carrier' => null, 'delivery_address' => null, 'created_at' => '2025-11-12'],
            ['id' => 10, 'user_id' => 3, 'status' => 'подтверждено', 'delivery_method' => 'delivery', 'delivery_carrier' => 'sdek', 'delivery_address' => 'г. Москва, ул. Ленина, д. 12, кв. 34', 'created_at' => '2025-11-12'],
            ['id' => 11, 'user_id' => 3, 'status' => 'подтверждено', 'delivery_method' => 'pickup', 'delivery_carrier' => null, 'delivery_address' => null, 'created_at' => '2025-11-12'],
            ['id' => 12, 'user_id' => 3, 'status' => 'подтверждено', 'delivery_method' => 'delivery', 'delivery_carrier' => 'pochta', 'delivery_address' => 'г. Москва, ул. Ленина, д. 12, кв. 34', 'created_at' => '2025-11-12'],
        ];

        foreach ($orders as $order) {
            $order['updated_at'] = $order['created_at'];
            DB::table('orders')->insert($order);
        }

        $orderItems = [
            ['order_id' => 1, 'product_id' => 1, 'quantity' => 2],
            ['order_id' => 1, 'product_id' => 2, 'quantity' => 1],
            ['order_id' => 2, 'product_id' => 2, 'quantity' => 3],
            ['order_id' => 3, 'product_id' => 3, 'quantity' => 1],
            ['order_id' => 4, 'product_id' => 1, 'quantity' => 1],
            ['order_id' => 4, 'product_id' => 4, 'quantity' => 2],
            ['order_id' => 5, 'product_id' => 2, 'quantity' => 1],
            ['order_id' => 6, 'product_id' => 3, 'quantity' => 2],
        ];

        DB::table('order_items')->insert($orderItems);
    }
}

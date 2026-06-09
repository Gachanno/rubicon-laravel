<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Продажи с физической точки (вкладка «Статистика» → офлайн-источник).
 * Разбросаны по дням за период, как обычные заказы, чтобы графики
 * по дням/неделям/месяцам/кварталам были наполнены.
 */
class ManualSaleSeeder extends Seeder
{
    public function run(): void
    {
        // Кто оформлял продажи на точке — сотрудники (админ + менеджеры)
        $staff = [1, 2, 7];

        $prices = DB::table('products')->pluck('price', 'id'); // id => цена
        $productIds = $prices->keys()->all();
        if (empty($productIds)) {
            return;
        }
        $pCount = count($productIds);

        $start = strtotime('2025-12-01');
        $end   = strtotime('2026-06-08');
        $days  = max(1, (int) (($end - $start) / 86400));

        $salesCount = 60;
        $now = now();

        $sales = [];
        for ($i = 1; $i <= $salesCount; $i++) {
            // Равномерно по периоду + небольшое смещение, чтобы даты не были «ровными»
            $offset = (int) round(($i - 1) * $days / $salesCount);
            $offset = min($days, $offset + ($i % 4));
            $date   = date('Y-m-d', $start + $offset * 86400);

            $sales[] = [
                'id'         => $i,
                'sale_date'  => $date,
                'created_by' => $staff[$i % count($staff)],
                'created_at' => $date . ' 12:00:00',
                'updated_at' => $date . ' 12:00:00',
            ];
        }
        DB::table('manual_sales')->insert($sales);

        $items = [];
        foreach ($sales as $s) {
            $n = 1 + ($s['id'] % 3); // 1..3 позиции в продаже
            for ($k = 0; $k < $n; $k++) {
                $pid = $productIds[($s['id'] * 3 + $k) % $pCount];
                $items[] = [
                    'manual_sale_id' => $s['id'],
                    'product_id'     => $pid,
                    'quantity'       => 1 + (($s['id'] + $k) % 4), // 1..4 шт
                    'price'          => $prices[$pid],
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ];
            }
        }
        foreach (array_chunk($items, 500) as $chunk) {
            DB::table('manual_sale_items')->insert($chunk);
        }
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Наполняет сайт «жизнью»: создаёт выданные заказы и множество отзывов
 * с разными оценками, текстами и датами. Несколько отзывов остаются
 * на модерации, чтобы наполнить очередь модерации.
 *
 * Каждый отзыв обеспечен выданным заказом того же пользователя с этим
 * товаром — логика «оставить отзыв можно только на полученный товар»
 * остаётся согласованной.
 */
class ReviewSeeder extends Seeder
{
    private array $users = [3, 4, 5, 6, 8, 9, 11, 12, 14, 15];

    private array $ratingPool = [5, 5, 5, 4, 5, 4, 5, 4, 3, 5, 4, 5, 2, 5, 4, 3, 5, 4, 1, 5];

    private array $positive = [
        'Отличный товар, полностью соответствует описанию. Рекомендую!',
        'Качество на высоте, пользуюсь уже несколько недель — очень доволен.',
        'Брал для дачи, всё отлично. Доставка быстрая, упаковано надёжно.',
        'Прекрасное соотношение цены и качества. Спасибо магазину!',
        'Всё пришло вовремя, товар как на фото. Буду заказывать ещё.',
        'Очень удобно в использовании, сделано добротно.',
        'Покупкой доволен, работает отлично. Магазину спасибо за сервис.',
        'Заказывал не первый раз — качество стабильно хорошее.',
    ];

    private array $good = [
        'Хороший товар, но упаковка могла быть получше. В целом доволен.',
        'Своих денег стоит. Небольшие нюансы есть, но всё работает.',
        'Нормально, пользуюсь. Ожидал чуть большего, но не жалею.',
        'Качество хорошее, рекомендую к покупке.',
    ];

    private array $neutral = [
        'Средний товар, есть мелкие недостатки. На троечку.',
        'Ожидал большего за эти деньги, но пользоваться можно.',
        'Так себе, ничего особенного, но и не плохо.',
    ];

    private array $negative = [
        'Не очень понравился, ожидал лучшего качества.',
        'Есть претензии к качеству, скорее не рекомендую.',
    ];

    public function run(): void
    {
        $uCount = count($this->users);

        // ─── План отзывов: (пользователь, товар), без дублей по товару ───
        $plan = [];
        // Популярные товары 1..24 — по 3-5 отзывов
        for ($p = 1; $p <= 24; $p++) {
            $n = 3 + ($p % 3);
            for ($k = 0; $k < $n; $k++) {
                $plan[] = ['user' => $this->users[($p + $k) % $uCount], 'product' => $p];
            }
        }
        // Остальные товары 25..60 — по 1-2 отзыва
        for ($p = 25; $p <= 60; $p++) {
            $n = 1 + ($p % 2);
            for ($k = 0; $k < $n; $k++) {
                $plan[] = ['user' => $this->users[($p * 3 + $k) % $uCount], 'product' => $p];
            }
        }

        // Несколько отзывов оставляем на модерации (на товарах, где есть и одобренные)
        $pendingProducts = [1, 2, 3, 7, 12, 18, 25];
        $lastIdxForProduct = [];
        foreach ($plan as $i => $row) {
            $lastIdxForProduct[$row['product']] = $i;
        }
        $pendingIdx = [];
        foreach ($pendingProducts as $pp) {
            if (isset($lastIdxForProduct[$pp])) {
                $pendingIdx[$lastIdxForProduct[$pp]] = true;
            }
        }

        // ─── Распределяем по пользователям ───
        $byUser = [];
        $base = strtotime('2025-12-05');
        foreach ($plan as $i => $row) {
            $u = $row['user'];
            $p = $row['product'];
            $status = isset($pendingIdx[$i]) ? 'pending' : 'approved';
            $rating = $this->ratingPool[($p + $u + $i) % count($this->ratingPool)];
            $body   = $this->bodyForRating($rating, $p + $i);
            $date   = date('Y-m-d H:i:s', $base + (($i * 5) % 185) * 86400);

            $byUser[$u][] = compact('p', 'status', 'rating', 'body', 'date');
        }

        // ─── Создаём выданные заказы + позиции + отзывы ───
        $orderId    = 100;
        $orderRows  = [];
        $itemRows   = [];
        $reviewRows = [];
        $userIndex  = 0;

        foreach ($byUser as $u => $entries) {
            $oid = $orderId++;
            $orderDate = date('Y-m-d H:i:s', strtotime('2025-11-20') + $userIndex * 86400);
            $userIndex++;

            $orderRows[] = [
                'id'               => $oid,
                'user_id'          => $u,
                'status'           => 'выдано',
                'delivery_method'  => 'pickup',
                'delivery_carrier' => null,
                'delivery_address' => null,
                'created_at'       => $orderDate,
                'updated_at'       => $orderDate,
            ];

            foreach ($entries as $e) {
                $itemRows[] = [
                    'order_id'   => $oid,
                    'product_id' => $e['p'],
                    'quantity'   => 1 + ($e['p'] % 2),
                ];
                $reviewRows[] = [
                    'user_id'    => $u,
                    'product_id' => $e['p'],
                    'rating'     => $e['rating'],
                    'body'       => $e['body'],
                    'images'     => null,
                    'status'     => $e['status'],
                    'created_at' => $e['date'],
                    'updated_at' => $e['date'],
                ];
            }
        }

        DB::table('orders')->insert($orderRows);
        foreach (array_chunk($itemRows, 500) as $chunk) {
            DB::table('order_items')->insert($chunk);
        }
        foreach (array_chunk($reviewRows, 500) as $chunk) {
            DB::table('reviews')->insert($chunk);
        }
    }

    private function bodyForRating(int $rating, int $salt): string
    {
        $pool = match (true) {
            $rating >= 5 => $this->positive,
            $rating === 4 => $this->good,
            $rating === 3 => $this->neutral,
            default      => $this->negative,
        };

        return $pool[abs(crc32((string) ($rating . $salt))) % count($pool)];
    }
}

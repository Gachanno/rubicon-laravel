<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'status',
        'delivery_method', 'delivery_carrier', 'delivery_address',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Отменяет оформленные заказы, оставшиеся без позиций (например, после
     * удаления последнего товара заказа). Владельцу создаётся уведомление.
     */
    public static function cancelEmptyOrders(): void
    {
        // «выдано» не трогаем — заказ уже исполнен, его статус должен сохраниться,
        // даже если товары впоследствии удалили.
        $empty = self::whereNotIn('status', ['отменено', 'не оформлено', 'выдано'])
            ->whereDoesntHave('items')
            ->get();

        foreach ($empty as $order) {
            $order->status = 'отменено';
            $order->save();

            if ($order->user_id) {
                OrderNotification::create([
                    'user_id'  => $order->user_id,
                    'order_id' => $order->id,
                    'status'   => 'отменено',
                ]);
            }
        }
    }
}

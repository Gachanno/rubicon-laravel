<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentCard extends Model
{
    protected $fillable = ['user_id', 'number', 'expiry'];

    // Шифрование/расшифровка прозрачно на уровне модели (ключ приложения APP_KEY).
    protected $casts = [
        'number' => 'encrypted',
        'expiry' => 'encrypted',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

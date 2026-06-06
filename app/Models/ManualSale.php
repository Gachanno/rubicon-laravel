<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ManualSale extends Model
{
    protected $fillable = ['sale_date', 'created_by'];

    public function items()
    {
        return $this->hasMany(ManualSaleItem::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

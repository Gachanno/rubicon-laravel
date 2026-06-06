<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ManualSaleItem extends Model
{
    protected $fillable = ['manual_sale_id', 'product_id', 'quantity', 'price'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function sale()
    {
        return $this->belongsTo(ManualSale::class, 'manual_sale_id');
    }
}

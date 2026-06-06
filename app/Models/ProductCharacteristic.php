<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductCharacteristic extends Model
{
    public $timestamps = false;

    protected $fillable = ['product_id', 'template_id', 'name', 'value'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function template()
    {
        return $this->belongsTo(CharacteristicTemplate::class, 'template_id');
    }
}

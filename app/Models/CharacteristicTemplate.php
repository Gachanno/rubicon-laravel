<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CharacteristicTemplate extends Model
{
    protected $fillable = ['category_id', 'name', 'type', 'options', 'is_filterable'];

    protected $casts = [
        'options'       => 'array',
        'is_filterable' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function productCharacteristics()
    {
        return $this->hasMany(ProductCharacteristic::class, 'template_id');
    }
}

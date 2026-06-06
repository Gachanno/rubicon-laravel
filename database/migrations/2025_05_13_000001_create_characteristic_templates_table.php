<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('characteristic_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            // text | select | range | boolean
            $table->string('type')->default('text');
            // select: ["Красный","Синий"] | range: {"unit":"л","min":0,"max":100} | null for text/boolean
            $table->json('options')->nullable();
            $table->boolean('is_filterable')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('characteristic_templates');
    }
};

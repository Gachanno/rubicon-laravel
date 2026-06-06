<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_characteristics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('template_id')->nullable();
            $table->foreign('template_id')
                  ->references('id')->on('characteristic_templates')
                  ->nullOnDelete();
            $table->string('name');
            $table->string('value');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_characteristics');
    }
};

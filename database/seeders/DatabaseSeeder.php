<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            CharacteristicTemplateSeeder::class,
            ProductSeeder::class,
            ProductCharacteristicSeeder::class,
            OrderSeeder::class,
            ReviewSeeder::class,
            SlideSeeder::class,
        ]);
    }
}

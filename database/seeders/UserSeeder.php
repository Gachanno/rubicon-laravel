<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['first_name' => 'Администратор', 'last_name' => '', 'middle_name' => null, 'email' => 'admin', 'phone' => '+7 (615) 733 69 15', 'address' => null, 'password' => Hash::make('Admin1234'), 'role' => 'Администратор', 'created_at' => '2024-01-01'],
            ['first_name' => 'Менеджер', 'last_name' => '', 'middle_name' => null, 'email' => 'manager', 'phone' => '+7 (615) 733 69 16', 'address' => null, 'password' => Hash::make('Manager1234'), 'role' => 'Менеджер', 'created_at' => '2024-01-02'],
            ['first_name' => 'Иван', 'last_name' => 'Петров', 'middle_name' => 'Сергеевич', 'email' => 'ivan@gmail.com', 'phone' => '+7 (615) 733 69 17', 'address' => 'г. Москва, ул. Ленина, д. 12, кв. 34', 'password' => Hash::make('Ivan1234'), 'role' => 'Пользователь', 'created_at' => '2024-01-03'],
            ['first_name' => 'Мария', 'last_name' => 'Сидорова', 'middle_name' => 'Александровна', 'email' => 'maria@example.com', 'phone' => '+7 (615) 733 69 18', 'address' => 'г. Санкт-Петербург, Невский пр-т, д. 78, кв. 5', 'password' => Hash::make('User4567'), 'role' => 'Пользователь', 'created_at' => '2024-01-04'],
            ['first_name' => 'Алексей', 'last_name' => 'Ковалёв', 'middle_name' => 'Игоревич', 'email' => 'aleksey.kovalev@example.com', 'phone' => '+7 (615) 733 69 19', 'address' => 'г. Казань, ул. Баумана, д. 3', 'password' => Hash::make('Aleksey2024'), 'role' => 'Пользователь', 'created_at' => '2024-01-05'],
            ['first_name' => 'Ольга', 'last_name' => 'Смирнова', 'middle_name' => 'Дмитриевна', 'email' => 'olga.smirnova@example.com', 'phone' => '+7 (615) 733 69 20', 'address' => null, 'password' => Hash::make('OlgaPass1'), 'role' => 'Пользователь', 'created_at' => '2024-01-06'],
            ['first_name' => 'Дмитрий', 'last_name' => 'Иванов', 'middle_name' => 'Олегович', 'email' => 'dmitriy.ivanov@example.com', 'phone' => '+7 (615) 733 69 21', 'address' => null, 'password' => Hash::make('Dmitriy777'), 'role' => 'Менеджер', 'created_at' => '2024-01-07'],
            ['first_name' => 'Елена', 'last_name' => 'Новикова', 'middle_name' => 'Викторовна', 'email' => 'elena.novikova@example.com', 'phone' => '+7 (615) 733 69 22', 'address' => 'г. Новосибирск, Красный пр-т, д. 101, кв. 12', 'password' => Hash::make('Elena_123'), 'role' => 'Пользователь', 'created_at' => '2024-01-08'],
            ['first_name' => 'Сергей', 'last_name' => 'Кузнецов', 'middle_name' => 'Андреевич', 'email' => 'sergey.kuznetsov@example.com', 'phone' => '+7 (615) 733 69 23', 'address' => null, 'password' => Hash::make('Serg12345'), 'role' => 'Пользователь', 'created_at' => '2024-01-09'],
            ['first_name' => 'Наталья', 'last_name' => 'Орлова', 'middle_name' => 'Павловна', 'email' => 'natalya.orlova@example.com', 'phone' => '+7 (615) 733 69 24', 'address' => null, 'password' => Hash::make('Natalya90'), 'role' => 'Модератор', 'created_at' => '2024-01-10'],
            ['first_name' => 'Константин', 'last_name' => 'Лебедев', 'middle_name' => 'Николаевич', 'email' => 'konstantin.lebedev@example.com', 'phone' => '+7 (615) 733 69 25', 'address' => 'г. Екатеринбург, ул. Малышева, д. 51', 'password' => Hash::make('Kostya2024'), 'role' => 'Пользователь', 'created_at' => '2024-01-11'],
            ['first_name' => 'Виктория', 'last_name' => 'Морозова', 'middle_name' => 'Сергеевна', 'email' => 'viktoriya.morozova@example.com', 'phone' => '+7 (615) 733 69 26', 'address' => null, 'password' => Hash::make('VikaPass12'), 'role' => 'Пользователь', 'created_at' => '2024-01-12'],
            ['first_name' => 'Павел', 'last_name' => 'Соколов', 'middle_name' => 'Романович', 'email' => 'pavel.sokolov@example.com', 'phone' => '+7 (615) 733 69 27', 'address' => null, 'password' => Hash::make('Pavel321'), 'role' => 'Курьер', 'created_at' => '2024-01-13'],
            ['first_name' => 'Анна', 'last_name' => 'Дмитриева', 'middle_name' => 'Михайловна', 'email' => 'anna.dmitrieva@example.com', 'phone' => '+7 (615) 733 69 28', 'address' => 'г. Ростов-на-Дону, ул. Большая Садовая, д. 47, кв. 8', 'password' => Hash::make('AnnaD!23'), 'role' => 'Пользователь', 'created_at' => '2024-01-14'],
            ['first_name' => 'Максим', 'last_name' => 'Григорьев', 'middle_name' => 'Денисович', 'email' => 'maksim.grigoryev@example.com', 'phone' => '+7 (615) 733 69 29', 'address' => null, 'password' => Hash::make('Maksim#1'), 'role' => 'Пользователь', 'created_at' => '2024-01-15'],
        ];

        foreach ($users as $user) {
            $user['updated_at'] = $user['created_at'];
            DB::table('users')->insert($user);
        }
    }
}

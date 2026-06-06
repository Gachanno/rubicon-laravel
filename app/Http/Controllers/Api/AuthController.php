<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'firstName'  => 'required|string|min:2|max:255',
            'lastName'   => 'required|string|min:2|max:255',
            'middleName' => 'nullable|string|max:255',
            'email'      => 'required|email|max:255',
            'phone'      => 'required|string|max:50',
            'password'   => 'required|string|min:8',
        ]);

        if (User::where('email', $validated['email'])->exists()) {
            return response()->json(['email' => 'Этот email уже зарегистрирован'], 409);
        }

        if (User::where('phone', $validated['phone'])->exists()) {
            return response()->json(['phone' => 'Этот телефон уже зарегистрирован'], 409);
        }

        $user = User::create([
            'first_name'  => $validated['firstName'],
            'last_name'   => $validated['lastName'] ?? null,
            'middle_name' => $validated['middleName'] ?? null,
            'email'       => $validated['email'],
            'phone'       => $validated['phone'],
            'password'    => Hash::make($validated['password']),
            'role'        => 'Пользователь',
        ]);

        Auth::login($user);

        return response()->json([
            'user' => [
                'id'         => $user->id,
                'firstName'  => $user->first_name,
                'lastName'   => $user->last_name,
                'middleName' => $user->middle_name,
                'email'      => $user->email,
                'phone'      => $user->phone,
                'role'       => $user->role,
            ],
        ]);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'emailOrPhone' => 'required|string',
            'password' => 'required|string',
        ]);

        $emailOrPhone = $validated['emailOrPhone'];
        $password = $validated['password'];

        $user = User::where('email', $emailOrPhone)
            ->orWhere('phone', $emailOrPhone)
            ->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json(['error' => 'Неверные учетные данные'], 401);
        }

        Auth::login($user);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'firstName' => $user->first_name,
                'lastName' => $user->last_name,
                'middleName' => $user->middle_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'role' => $user->role,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}

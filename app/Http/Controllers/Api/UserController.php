<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        $users = User::all()->map(fn($u) => [
            'id' => $u->id,
            'firstName' => $u->first_name,
            'lastName' => $u->last_name,
            'middleName' => $u->middle_name,
            'email' => $u->email,
            'phone' => $u->phone,
            'address' => $u->address,
            'role' => $u->role,
            'createdAt' => $u->created_at?->toISOString(),
        ]);

        return response()->json($users);
    }

    public function show(int $id)
    {
        $user = User::findOrFail($id);

        return response()->json([
            'id' => $user->id,
            'firstName' => $user->first_name,
            'lastName' => $user->last_name,
            'middleName' => $user->middle_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => $user->address,
            'role' => $user->role,
            'createdAt' => $user->created_at?->toISOString(),
        ]);
    }

    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $data = [];
        if ($request->has('firstName')) $data['first_name'] = $request->input('firstName');
        if ($request->has('lastName')) $data['last_name'] = $request->input('lastName');
        if ($request->has('middleName')) $data['middle_name'] = $request->input('middleName');
        if ($request->has('address')) $data['address'] = $request->input('address');
        if ($request->has('role')) $data['role'] = $request->input('role');

        if ($request->has('email') && $request->input('email') !== $user->email) {
            if (User::where('email', $request->input('email'))->where('id', '!=', $id)->exists()) {
                return response()->json(['email' => 'Этот email уже занят'], 409);
            }
            $data['email'] = $request->input('email');
        }

        if ($request->has('phone') && $request->input('phone') !== $user->phone) {
            if (User::where('phone', $request->input('phone'))->where('id', '!=', $id)->exists()) {
                return response()->json(['phone' => 'Этот телефон уже занят'], 409);
            }
            $data['phone'] = $request->input('phone');
        }

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->input('password'));
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'firstName' => $user->first_name,
                'lastName' => $user->last_name,
                'middleName' => $user->middle_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'role' => $user->role,
                'createdAt' => $user->created_at?->toISOString(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $emailOrLogin = trim($request->input('emailOrLogin', ''));

        if (!$emailOrLogin) {
            return response()->json(['emailOrLogin' => 'Введите почту/логин'], 422);
        }

        if (User::where('email', $emailOrLogin)->exists()) {
            return response()->json(['emailOrLogin' => 'Этот логин уже занят'], 409);
        }

        $role = $request->input('role');
        if (!in_array($role, ['Менеджер', 'Администратор'])) {
            $role = 'Менеджер';
        }

        $user = User::create([
            'first_name'  => $request->input('firstName'),
            'last_name'   => $request->input('lastName'),
            'middle_name' => $request->input('middleName'),
            'email'       => $emailOrLogin,
            'phone'       => $request->input('phone'),
            'password'    => Hash::make($request->input('password')),
            'role'        => $role,
        ]);

        return response()->json([
            'success' => true,
            'user' => [
                'id'         => $user->id,
                'firstName'  => $user->first_name,
                'lastName'   => $user->last_name,
                'middleName' => $user->middle_name,
                'email'      => $user->email,
                'phone'      => $user->phone,
                'address'    => $user->address,
                'role'       => $user->role,
                'createdAt'  => $user->created_at?->toISOString(),
            ],
        ]);
    }

    public function destroy(int $id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['success' => true]);
    }
}

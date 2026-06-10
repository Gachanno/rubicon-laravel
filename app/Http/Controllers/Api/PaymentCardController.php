<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentCard;
use Illuminate\Http\Request;

class PaymentCardController extends Controller
{
    public function index(Request $request)
    {
        $cards = PaymentCard::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($cards->map(fn($c) => $this->format($c)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'number' => 'required|string',
            'expiry' => 'required|string',
        ]);

        $digits = preg_replace('/\D/', '', $validated['number']);
        if (strlen($digits) !== 16) {
            return response()->json(['number' => 'Введите корректный номер карты (16 цифр)'], 422);
        }
        if (!preg_match('/^\d{2}\/\d{2}$/', $validated['expiry'])) {
            return response()->json(['expiry' => 'Введите срок в формате ММ/ГГ'], 422);
        }

        // Не дублируем уже сохранённую карту этого пользователя
        foreach (PaymentCard::where('user_id', $request->user()->id)->get() as $existing) {
            if ($existing->number === $digits) {
                return response()->json(['success' => true, 'card' => $this->format($existing)]);
            }
        }

        $card = PaymentCard::create([
            'user_id' => $request->user()->id,
            'number'  => $digits,
            'expiry'  => $validated['expiry'],
        ]);

        return response()->json(['success' => true, 'card' => $this->format($card)], 201);
    }

    public function destroy(Request $request, int $id)
    {
        PaymentCard::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Наружу отдаём только маску (последние 4 цифры) и срок — полный номер не покидает сервер.
     * Обращение к $c->number автоматически расшифровывает значение.
     */
    private function format(PaymentCard $c): array
    {
        return [
            'id'     => $c->id,
            'last4'  => substr($c->number, -4),
            'expiry' => $c->expiry,
        ];
    }
}

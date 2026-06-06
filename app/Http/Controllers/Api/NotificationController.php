<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Return the current user's unseen order-status notifications and mark them seen.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = OrderNotification::where('user_id', $user->id)
            ->whereNull('seen_at')
            ->orderBy('id')
            ->get();

        $data = $notifications->map(fn($n) => [
            'id'      => $n->id,
            'orderId' => $n->order_id,
            'status'  => $n->status,
            'message' => "У заказа №{$n->order_id} сменился статус на «{$n->status}»",
        ])->values();

        // Mark as seen so they are shown only once
        if ($notifications->isNotEmpty()) {
            OrderNotification::whereIn('id', $notifications->pluck('id'))
                ->update(['seen_at' => now()]);
        }

        return response()->json($data);
    }
}

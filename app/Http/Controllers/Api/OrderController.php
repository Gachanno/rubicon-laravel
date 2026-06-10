<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    private function fullName($user): string
    {
        return trim(implode(' ', array_filter([
            $user->last_name,
            $user->first_name,
            $user->middle_name,
        ])));
    }

    public function index(Request $request)
    {
        $query = Order::with(['items.product', 'user']);

        // Exclude cart orders from listings
        $query->where('status', '!=', 'не оформлено');

        if ($userId = $request->input('userId')) {
            $query->where('user_id', $userId);
        }

        if ($q = $request->input('q')) {
            $query->where(function ($qb) use ($q) {
                $nameSearch = fn($u) => $u->where('first_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('middle_name', 'like', "%{$q}%");
                if (is_numeric($q)) {
                    // Число ищем и по номеру заказа, и по ID покупателя
                    $qb->where('orders.id', (int) $q)
                       ->orWhere('orders.user_id', (int) $q)
                       ->orWhereHas('user', $nameSearch);
                } else {
                    $qb->whereHas('user', $nameSearch);
                }
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($deliveryMethod = $request->input('deliveryMethod')) {
            $query->where('delivery_method', $deliveryMethod);
        }

        if ($dateFrom = $request->input('dateFrom')) {
            $query->where('orders.created_at', '>=', $dateFrom . ' 00:00:00');
        }

        if ($dateTo = $request->input('dateTo')) {
            $query->where('orders.created_at', '<=', $dateTo . ' 23:59:59');
        }

        // Sorting
        $sortBy = $request->input('sortBy', 'id');
        $sortDir = $request->input('sortDir', 'asc');
        $sortMap = [
            'userId' => 'user_id',
            'createdAt' => 'created_at',
        ];
        if (isset($sortMap[$sortBy])) {
            $sortBy = $sortMap[$sortBy];
        }

        if ($sortBy === 'total') {
            $query->orderByRaw(
                '(SELECT COALESCE(SUM(oi.quantity * p.price), 0) FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = orders.id) ' . ($sortDir === 'desc' ? 'DESC' : 'ASC')
            );
        } elseif ($sortBy === 'itemsCount') {
            $query->orderByRaw(
                '(SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = orders.id) ' . ($sortDir === 'desc' ? 'DESC' : 'ASC')
            );
        } else {
            $allowedSorts = ['id', 'status', 'created_at', 'user_id'];
            if (in_array($sortBy, $allowedSorts)) {
                $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
            }
        }

        // Pagination
        $limit = (int) $request->input('limit', 5);
        $page = (int) $request->input('page', 1);

        $total = $query->count();
        $orders = $query->skip(($page - 1) * $limit)->take($limit)->get();

        $index = ($page - 1) * $limit;
        $data = $orders->map(function ($o) use (&$index) {
            $index++;
            $items = $o->items->map(fn($c) => [
                'id' => $c->id,
                'productId' => $c->product_id,
                'productName' => $c->product?->name ?? 'Удалённый товар',
                'quantity' => $c->quantity,
            ]);

            $total = $o->items->sum(function ($c) {
                return ($c->product?->price ?? 0) * $c->quantity;
            });

            return [
                'id' => $o->id,
                'index' => $index,
                'userId' => $o->user_id,
                'userName' => $o->user ? $this->fullName($o->user) : null,
                'status' => $o->status,
                'deliveryMethod' => $o->delivery_method,
                'deliveryCarrier' => $o->delivery_carrier,
                'deliveryAddress' => $o->delivery_address,
                'createdAt' => $o->created_at?->toISOString(),
                'items' => $items,
                'total' => $total,
            ];
        });

        return response()->json([
            'data' => $data,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pendingCount' => Order::where('status', 'в ожидании')->count(),
        ]);
    }

    public function show(int $id)
    {
        $order = Order::with(['items.product'])->findOrFail($id);

        $items = $order->items->map(fn($c) => [
            'id' => $c->id,
            'productId' => $c->product_id,
            'productName' => $c->product?->name ?? 'Удалённый товар',
            'quantity' => $c->quantity,
        ]);

        return response()->json([
            'id' => $order->id,
            'userId' => $order->user_id,
            'status' => $order->status,
            'deliveryMethod' => $order->delivery_method,
            'deliveryCarrier' => $order->delivery_carrier,
            'deliveryAddress' => $order->delivery_address,
            'createdAt' => $order->created_at?->toISOString(),
            'items' => $items,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'userId' => 'required|integer|exists:users,id',
            'status' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.productId' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'deliveryMethod'  => 'nullable|string|in:pickup,delivery',
            'deliveryCarrier' => 'nullable|string|in:pochta,sdek',
            'deliveryAddress' => 'nullable|string|max:500',
        ]);

        $order = Order::create([
            'user_id' => $validated['userId'],
            'status' => $validated['status'] ?? 'в ожидании',
            'delivery_method'  => $validated['deliveryMethod']  ?? null,
            'delivery_carrier' => $validated['deliveryCarrier'] ?? null,
            'delivery_address' => $validated['deliveryAddress'] ?? null,
        ]);

        $status = $validated['status'] ?? 'в ожидании';

        foreach ($validated['items'] as $item) {
            $product = Product::find($item['productId']);
            $qty = $item['quantity'];

            if ($product) {
                $qty = min($qty, $product->available_quantity);
            }
            if ($qty <= 0) {
                continue;
            }

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['productId'],
                'quantity' => $qty,
            ]);

            if ($status !== 'не оформлено' && $product) {
                $product->available_quantity = max(0, $product->available_quantity - $qty);
                $product->save();
            }
        }

        return response()->json(['success' => true, 'order' => $order->load('items')]);
    }

    public function update(Request $request, int $id)
    {
        $request->validate([
            'status'           => 'nullable|string',
            'deliveryMethod'   => 'nullable|string|in:pickup,delivery',
            'deliveryCarrier'  => 'nullable|string|in:pochta,sdek',
            'deliveryAddress'  => 'nullable|string|max:500',
        ]);

        $order = Order::findOrFail($id);

        $oldStatus = $order->status;

        if ($request->has('status')) {
            $order->status = $request->input('status');
        }

        // Manager can change delivery method / carrier / address
        if ($request->has('deliveryMethod')) {
            $method = $request->input('deliveryMethod') ?: null;
            $order->delivery_method  = $method;
            $order->delivery_carrier = $method === 'delivery' ? ($request->input('deliveryCarrier') ?: null) : null;
            $order->delivery_address = $method === 'delivery' ? ($request->input('deliveryAddress') ?: null) : null;
        } else {
            if ($request->has('deliveryCarrier')) {
                $order->delivery_carrier = $request->input('deliveryCarrier') ?: null;
            }
            if ($request->has('deliveryAddress')) {
                $order->delivery_address = $request->input('deliveryAddress') ?: null;
            }
        }

        $order->save();

        // Возврат / повторное списание остатков при переключении «отменено»
        if ($order->status !== $oldStatus) {
            $wasCancelled = $oldStatus === 'отменено';
            $nowCancelled = $order->status === 'отменено';

            if ($wasCancelled !== $nowCancelled) {
                // отмена → вернуть товары на склад; снятие отмены → снова списать
                $sign = $nowCancelled ? '+' : '-';
                foreach ($order->items()->get() as $it) {
                    Product::where('id', $it->product_id)
                        ->update(['available_quantity' => DB::raw("available_quantity {$sign} {$it->quantity}")]);
                }
            }

            // Уведомление владельцу о смене статуса
            if ($order->user_id) {
                \App\Models\OrderNotification::create([
                    'user_id'  => $order->user_id,
                    'order_id' => $order->id,
                    'status'   => $order->status,
                ]);
            }
        }

        $order->load(['items.product', 'user']);

        $items = $order->items->map(fn($c) => [
            'id' => $c->id,
            'productId' => $c->product_id,
            'productName' => $c->product?->name ?? 'Удалённый товар',
            'quantity' => $c->quantity,
        ]);

        $total = $order->items->sum(function ($c) {
            return ($c->product?->price ?? 0) * $c->quantity;
        });

        return response()->json([
            'success' => true,
            'order' => [
                'id' => $order->id,
                'userId' => $order->user_id,
                'userName' => $order->user ? $this->fullName($order->user) : null,
                'status' => $order->status,
                'deliveryMethod' => $order->delivery_method,
                'deliveryCarrier' => $order->delivery_carrier,
                'deliveryAddress' => $order->delivery_address,
                'createdAt' => $order->created_at?->toISOString(),
                'items' => $items,
                'total' => $total,
            ],
        ]);
    }
}

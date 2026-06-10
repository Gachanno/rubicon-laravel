<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;

class CartController extends Controller
{
    private function formatCart(?Order $order)
    {
        if (!$order) {
            return ['id' => null, 'items' => []];
        }

        $order->load('items.product');

        $items = $order->items->map(fn($c) => [
            'productId' => $c->product_id,
            'quantity' => $c->quantity,
            'product' => $c->product ? [
                'id' => $c->product->id,
                'name' => $c->product->name,
                'price' => $c->product->price,
                'image' => (is_array($c->product->images) && !empty($c->product->images))
                    ? $c->product->images[0]
                    : '/dataImg/noimagebig.png',
                'available_quantity' => $c->product->available_quantity,
            ] : null,
        ])->filter(fn($item) => $item['product'] !== null)->values();

        return ['id' => $order->id, 'items' => $items];
    }

    private function getUserCart(int $userId): ?Order
    {
        return Order::where('user_id', $userId)
            ->where('status', 'не оформлено')
            ->first();
    }

    public function index(Request $request)
    {
        return response()->json(
            $this->formatCart($this->getUserCart($request->user()->id))
        );
    }

    public function addItem(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'productId' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $order = $this->getUserCart($user->id);

        if (!$order) {
            $order = Order::create([
                'user_id' => $user->id,
                'status' => 'не оформлено',
            ]);
        }

        $product = Product::findOrFail($validated['productId']);

        $existing = OrderItem::where('order_id', $order->id)
            ->where('product_id', $validated['productId'])
            ->first();

        $currentQty = $existing ? $existing->quantity : 0;
        $newTotal = $currentQty + $validated['quantity'];

        if ($newTotal > $product->available_quantity) {
            $newTotal = $product->available_quantity;
        }

        if ($newTotal <= 0) {
            return response()->json($this->formatCart($order->fresh()));
        }

        if ($existing) {
            $existing->quantity = $newTotal;
            $existing->save();
        } else {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $validated['productId'],
                'quantity' => $newTotal,
            ]);
        }

        return response()->json($this->formatCart($order->fresh()));
    }

    public function updateItem(Request $request, int $productId)
    {
        $user = $request->user();
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $order = $this->getUserCart($user->id);
        if (!$order) {
            return response()->json(['error' => 'Корзина не найдена'], 404);
        }

        $item = OrderItem::where('order_id', $order->id)
            ->where('product_id', $productId)
            ->first();

        if (!$item) {
            return response()->json(['error' => 'Товар не найден в корзине'], 404);
        }

        $product = Product::find($item->product_id);
        // Отрицательный остаток (перепродажа) трактуем как 0 доступных для покупателя
        $maxQty = $product ? max(0, $product->available_quantity) : $validated['quantity'];
        $item->quantity = min($validated['quantity'], $maxQty);
        $item->save();

        return response()->json($this->formatCart($order->fresh()));
    }

    public function removeItem(Request $request, int $productId)
    {
        $user = $request->user();
        $order = $this->getUserCart($user->id);

        if (!$order) {
            return response()->json(['id' => null, 'items' => []]);
        }

        OrderItem::where('order_id', $order->id)
            ->where('product_id', $productId)
            ->delete();

        if ($order->items()->count() === 0) {
            $order->delete();
            return response()->json(['id' => null, 'items' => []]);
        }

        return response()->json($this->formatCart($order->fresh()));
    }

    public function clear(Request $request)
    {
        $user = $request->user();
        $order = $this->getUserCart($user->id);

        if ($order) {
            $order->items()->delete();
            $order->delete();
        }

        return response()->json(['id' => null, 'items' => []]);
    }

    public function confirm(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'productIds'       => 'nullable|array',
            'productIds.*'     => 'integer',
            'deliveryMethod'   => 'nullable|string|in:pickup,delivery',
            'deliveryCarrier'  => 'nullable|string|in:pochta,sdek',
            'deliveryAddress'  => 'nullable|string|max:500',
        ]);

        $order = $this->getUserCart($user->id);
        if (!$order) {
            return response()->json(['error' => 'Корзина не найдена'], 404);
        }

        $order->load('items.product');

        $productIds = $validated['productIds'] ?? null;
        $items = $productIds
            ? $order->items->whereIn('product_id', $productIds)
            : $order->items;

        // Check stock
        $adjusted = false;
        foreach ($items as $item) {
            $product = $item->product;
            $avail = $product ? max(0, $product->available_quantity) : 0;
            if (!$product || $item->quantity > $avail) {
                $adjusted = true;
                $newQty = $avail;
                if ($newQty === 0) {
                    $item->delete();
                } else {
                    $item->quantity = $newQty;
                    $item->save();
                }
            }
        }

        if ($adjusted) {
            if ($order->items()->count() === 0) {
                $order->delete();
                $order = null;
            }

            return response()->json([
                'success' => false,
                'adjusted' => true,
                'cart' => $this->formatCart($order ? $order->fresh() : null),
            ]);
        }

        $deliveryFields = [
            'delivery_method'  => $validated['deliveryMethod']  ?? null,
            'delivery_carrier' => $validated['deliveryCarrier'] ?? null,
            'delivery_address' => $validated['deliveryAddress'] ?? null,
        ];

        // Stock OK — create confirmed order
        if ($productIds) {
            $newOrder = Order::create(array_merge([
                'user_id' => $user->id,
                'status'  => 'в ожидании',
            ], $deliveryFields));

            foreach ($items as $item) {
                OrderItem::create([
                    'order_id'   => $newOrder->id,
                    'product_id' => $item->product_id,
                    'quantity'   => $item->quantity,
                ]);

                $product = Product::find($item->product_id);
                if ($product) {
                    $product->available_quantity = max(0, $product->available_quantity - $item->quantity);
                    $product->save();
                }

                $item->delete();
            }

            if ($order->items()->count() === 0) {
                $order->delete();
                $order = null;
            }
        } else {
            foreach ($order->items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->available_quantity = max(0, $product->available_quantity - $item->quantity);
                    $product->save();
                }
            }

            $order->status = 'в ожидании';
            foreach ($deliveryFields as $field => $value) {
                $order->$field = $value;
            }
            $order->save();
            $order = null;
        }

        $remaining = $this->getUserCart($user->id);

        return response()->json([
            'success' => true,
            'cart' => $this->formatCart($remaining),
        ]);
    }
}

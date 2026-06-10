<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ManualSale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatisticsController extends Controller
{
    public function index(Request $request)
    {
        $type    = $request->input('type', 'product');
        $id      = (int) $request->input('id', 0);
        $groupBy = $request->input('groupBy', 'month');
        $from    = $request->input('from');
        $to      = $request->input('to');
        $source  = $request->input('source', '');

        // type='all' — агрегируем продажи по всем товарам, id не требуется
        if ($type !== 'all' && !$id) {
            return response()->json([]);
        }

        $onlineData  = [];
        $offlineData = [];

        if ($source !== 'offline') {
            $periodExpr = $this->periodExpr($groupBy, 'orders.created_at');

            $q = DB::table('order_items')
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.status', 'выдано')
                ->selectRaw("({$periodExpr}) as period, SUM(order_items.quantity) as total");

            $this->applyTypeFilter($q, $type, $id, 'order_items.product_id');

            if ($from) $q->where('orders.created_at', '>=', $from . ' 00:00:00');
            if ($to)   $q->where('orders.created_at', '<=', $to . ' 23:59:59');

            $q->groupByRaw($periodExpr);

            foreach ($q->get() as $row) {
                $onlineData[(string) $row->period] = (int) $row->total;
            }
        }

        if ($source !== 'online') {
            $periodExpr = $this->periodExpr($groupBy, 'manual_sales.sale_date');

            $q = DB::table('manual_sale_items')
                ->join('manual_sales', 'manual_sales.id', '=', 'manual_sale_items.manual_sale_id')
                ->selectRaw("({$periodExpr}) as period, SUM(manual_sale_items.quantity) as total");

            $this->applyTypeFilter($q, $type, $id, 'manual_sale_items.product_id');

            if ($from) $q->where('manual_sales.sale_date', '>=', $from);
            if ($to)   $q->where('manual_sales.sale_date', '<=', $to);

            $q->groupByRaw($periodExpr);

            foreach ($q->get() as $row) {
                $offlineData[(string) $row->period] = (int) $row->total;
            }
        }

        $allPeriods = array_unique(array_merge(array_keys($onlineData), array_keys($offlineData)));
        sort($allPeriods);

        $result = [];
        foreach ($allPeriods as $period) {
            $result[] = [
                'period'  => $this->formatLabel($period, $groupBy),
                'online'  => $onlineData[$period]  ?? 0,
                'offline' => $offlineData[$period] ?? 0,
            ];
        }

        return response()->json($result);
    }

    private function periodExpr(string $groupBy, string $col): string
    {
        return match ($groupBy) {
            'day'     => "DATE({$col})",
            'week'    => "DATE_FORMAT({$col}, '%x-W%v')",
            'month'   => "DATE_FORMAT({$col}, '%Y-%m')",
            'quarter' => "CONCAT(YEAR({$col}), '-Q', QUARTER({$col}))",
            'year'    => "YEAR({$col})",
            default   => "DATE_FORMAT({$col}, '%Y-%m')",
        };
    }

    private function applyTypeFilter($query, string $type, int $id, string $productIdCol): void
    {
        if ($type === 'product') {
            $query->where($productIdCol, $id);
        } elseif ($type === 'category') {
            $productIds = DB::table('category_product')
                ->where('category_id', $id)
                ->pluck('product_id');
            $query->whereIn($productIdCol, $productIds);
        }
    }

    private function formatLabel(string $period, string $groupBy): string
    {
        $months = [
            '01' => 'Янв', '02' => 'Фев', '03' => 'Мар', '04' => 'Апр',
            '05' => 'Май', '06' => 'Июн', '07' => 'Июл', '08' => 'Авг',
            '09' => 'Сен', '10' => 'Окт', '11' => 'Ноя', '12' => 'Дек',
        ];

        return match ($groupBy) {
            'month' => (function () use ($period, $months) {
                $parts = explode('-', $period);
                $y = $parts[0] ?? '';
                $m = $parts[1] ?? '';
                return ($months[$m] ?? $m) . ' ' . $y;
            })(),
            'quarter' => (function () use ($period) {
                if (preg_match('/^(\d{4})-Q(\d)$/', $period, $m)) {
                    return $m[2] . ' квартал ' . $m[1];
                }
                return $period;
            })(),
            'week' => (function () use ($period) {
                if (preg_match('/^(\d{4})-W(\d{1,2})$/', $period, $m)) {
                    $start = new \DateTime();
                    $start->setISODate((int) $m[1], (int) $m[2], 1);
                    $end = (clone $start)->modify('+6 days');
                    return $m[1] . ' ' . $start->format('d.m') . '–' . $end->format('d.m');
                }
                return $period;
            })(),
            'day' => (function () use ($period) {
                $d = \DateTime::createFromFormat('Y-m-d', $period);
                return $d ? $d->format('d.m.y') : $period;
            })(),
            default => $period,
        };
    }

    public function storeSale(Request $request)
    {
        $request->validate([
            'saleDate'              => 'required|date|before_or_equal:today',
            'items'                 => 'required|array|min:1',
            'items.*.productId'     => 'required|integer|exists:products,id',
            'items.*.quantity'      => 'required|integer|min:1',
            'items.*.price'         => 'nullable|numeric|min:0',
        ]);

        $sale = ManualSale::create([
            'sale_date'  => $request->input('saleDate'),
            'created_by' => $request->user()->id,
        ]);

        foreach ($request->input('items') as $item) {
            $qty = (int) $item['quantity'];

            $sale->items()->create([
                'product_id' => (int) $item['productId'],
                'quantity'   => $qty,
                'price'      => (float) ($item['price'] ?? 0),
            ]);

            // Остаток может уйти в минус (например, товар уже заказан онлайн,
            // а потом продан на физической точке) — это допустимо.
            DB::table('products')
                ->where('id', (int) $item['productId'])
                ->update([
                    'available_quantity' => DB::raw("available_quantity - {$qty}"),
                ]);
        }

        return response()->json(['success' => true]);
    }
}

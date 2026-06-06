<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    private function formatProduct($p): array
    {
        $discountPercent = (int) ($p->discount_percent ?? 0);
        $images = $p->images ?? [];
        $primaryImage = !empty($images) ? $images[0] : '/dataImg/noimagebig.png';

        return [
            'id'                 => $p->id,
            'name'               => $p->name,
            'price'              => $p->price,
            'discount_percent'   => $discountPercent,
            'discounted_price'   => $discountPercent > 0
                ? round($p->price * (1 - $discountPercent / 100), 2)
                : null,
            'image'              => $primaryImage,
            'images'             => $images,
            'description'        => $p->description,
            'available_quantity' => $p->available_quantity,
            'avg_rating'         => (isset($p->reviews_avg_rating) && $p->reviews_avg_rating !== null)
                ? round((float) $p->reviews_avg_rating, 1)
                : null,
            'reviews_count'      => (int) ($p->reviews_count ?? 0),
            'category'           => $p->categories->pluck('id')->toArray(),
            'categories'         => $p->categories->map(fn($c) => ['id' => $c->id, 'name' => $c->name])->toArray(),
            'characteristics'    => $p->characteristics->map(fn($ch) => [
                'name'       => $ch->name,
                'value'      => $ch->value,
                'templateId' => $ch->template_id,
            ])->toArray(),
        ];
    }

    private function processImageOrder(array $imageOrder, array $newFiles): array
    {
        $result = [];
        foreach ($imageOrder as $item) {
            if (str_starts_with((string) $item, '__new__')) {
                $idx = (int) substr($item, 7);
                if (isset($newFiles[$idx])) {
                    $path = $newFiles[$idx]->store('uploads', 'public');
                    $result[] = '/storage/' . $path;
                }
            } else {
                $result[] = $item;
            }
        }
        return \array_values(\array_slice($result, 0, 10));
    }

    public function index(Request $request)
    {
        $query = Product::with('categories', 'characteristics');

        if ($q = $request->input('q')) {
            $query->where(function ($qb) use ($q) {
                $qb->where('name', 'like', "%{$q}%")
                   ->orWhere('description', 'like', "%{$q}%");
            });
        }

        if ($categoryId = $request->input('categoryId')) {
            $catIds = collect([$categoryId]);
            $childIds = Category::where('parent_id', $categoryId)->pluck('id');
            $catIds = $catIds->merge($childIds);
            if ($childIds->isNotEmpty()) {
                $catIds = $catIds->merge(Category::whereIn('parent_id', $childIds)->pluck('id'));
            }
            $query->whereHas('categories', fn($qb) => $qb->whereIn('categories.id', $catIds));
        }

        if ($request->filled('minPrice')) $query->where('price', '>=', (float) $request->input('minPrice'));
        if ($request->filled('maxPrice')) $query->where('price', '<=', (float) $request->input('maxPrice'));
        if ($request->input('inStockOnly') === 'true') $query->where('available_quantity', '>', 0);
        if ($request->input('outOfStockOnly') === 'true') $query->where('available_quantity', '<=', 0);
        if ($request->input('hasDiscount') === 'true') $query->where('discount_percent', '>', 0);
        if ($request->input('noPhoto') === 'true') {
            $query->where(function ($qb) {
                $qb->whereNull('images')->orWhere('images', '[]')->orWhere('images', '');
            });
        }

        if ($request->filled('minRating')) {
            $minRating = (float) $request->input('minRating');
            $query->whereRaw("(SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.product_id = products.id AND r.status = 'approved') >= ?", [$minRating]);
        }

        // Characteristic filters — key is template ID (numeric) or name string (legacy)
        // Format: {"7":{"values":["A","B"]},"12":{"min":1,"max":5},"15":{"bool":true}}
        if ($charFilters = $request->input('charFilters')) {
            $filters = json_decode($charFilters, true) ?? [];
            foreach ($filters as $key => $filter) {
                $isId = is_numeric($key);
                if (isset($filter['values']) && !empty($filter['values'])) {
                    $vals = $filter['values'];
                    $query->whereHas('characteristics', function ($q) use ($key, $isId, $vals) {
                        if ($isId) $q->where('template_id', (int) $key);
                        else       $q->where('name', $key);
                        $q->whereIn('value', $vals);
                    });
                } elseif (isset($filter['min']) || isset($filter['max'])) {
                    $query->whereHas('characteristics', function ($q) use ($key, $isId, $filter) {
                        if ($isId) $q->where('template_id', (int) $key);
                        else       $q->where('name', $key);
                        if (isset($filter['min']) && $filter['min'] !== '') {
                            $q->whereRaw('CAST(value AS DECIMAL(10,2)) >= ?', [(float) $filter['min']]);
                        }
                        if (isset($filter['max']) && $filter['max'] !== '') {
                            $q->whereRaw('CAST(value AS DECIMAL(10,2)) <= ?', [(float) $filter['max']]);
                        }
                    });
                } elseif (!empty($filter['bool'])) {
                    $query->whereHas('characteristics', function ($q) use ($key, $isId) {
                        if ($isId) $q->where('template_id', (int) $key);
                        else       $q->where('name', $key);
                        $q->where('value', 'Да');
                    });
                }
            }
        }

        $sortBy  = $request->input('sortBy', 'id');
        $sortDir = $request->input('sortDir', 'asc');
        $dir     = $sortDir === 'desc' ? 'desc' : 'asc';

        if ($sortBy === 'category') {
            $query->leftJoin('category_product', 'products.id', '=', 'category_product.product_id')
                  ->leftJoin('categories', 'category_product.category_id', '=', 'categories.id')
                  ->select('products.*')
                  ->groupBy('products.id');
        }

        // Only approved reviews count toward the rating / review count shown on cards
        $approved = fn($q) => $q->where('status', 'approved');
        $query->withAvg(['reviews as reviews_avg_rating' => $approved], 'rating')
              ->withCount(['reviews as reviews_count' => $approved]);

        if ($sortBy === 'category') {
            $query->orderByRaw("MIN(categories.name) " . $dir);
        } elseif ($sortBy === 'rating') {
            $query->orderByRaw("reviews_avg_rating " . $dir);
        } elseif ($sortBy === 'popularity') {
            $query->orderByRaw("reviews_count " . $dir);
        } elseif (\in_array($sortBy, ['id', 'name', 'price', 'available_quantity', 'discount_percent', 'created_at'])) {
            $query->orderBy($sortBy, $dir);
        }

        $limit    = (int) $request->input('limit', 12);
        $page     = (int) $request->input('page', 1);
        $total    = $query->count();
        $products = $query->skip(($page - 1) * $limit)->take($limit)->get();

        return response()->json([
            'data'  => $products->map(fn($p) => $this->formatProduct($p)),
            'total' => $total,
            'page'  => $page,
            'limit' => $limit,
        ]);
    }

    public function show(int $id)
    {
        $approved = fn($q) => $q->where('status', 'approved');
        $product = Product::with('categories', 'characteristics')
            ->withAvg(['reviews as reviews_avg_rating' => $approved], 'rating')
            ->withCount(['reviews as reviews_count' => $approved])
            ->findOrFail($id);

        return response()->json($this->formatProduct($product));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'               => 'required|string|max:255',
            'price'              => 'nullable|numeric|min:0',
            'description'        => 'nullable|string',
            'available_quantity' => 'nullable|numeric|min:0',
            'category'           => 'nullable',
            'images.*'           => 'nullable|file|image|max:5120',
            'discount_percent'   => 'nullable|integer|min:0|max:100',
        ]);

        $imageOrder = json_decode($request->input('imageOrder', '[]'), true) ?? [];
        $newFiles   = $request->file('images') ?? [];
        $images     = $this->processImageOrder($imageOrder, $newFiles);

        $category = $request->input('category');
        if (\is_string($category)) $category = json_decode($category, true);

        $characteristics = $request->input('characteristics', []);
        if (\is_string($characteristics)) $characteristics = json_decode($characteristics, true) ?? [];

        $product = Product::create([
            'name'               => $request->input('name'),
            'price'              => (float) ($request->input('price') ?? 0),
            'description'        => $request->input('description') ?? '',
            'available_quantity' => (int) ($request->input('available_quantity') ?? 0),
            'images'             => $images ?: null,
            'discount_percent'   => (int) ($request->input('discount_percent') ?? 0),
        ]);

        if (!empty($category)) $product->categories()->sync($category);

        if (\is_array($characteristics)) {
            foreach ($characteristics as $ch) {
                $name       = trim((string) ($ch['name'] ?? ''));
                $value      = trim((string) ($ch['value'] ?? ''));
                $templateId = isset($ch['templateId']) ? (int) $ch['templateId'] : null;
                if ($name && $value) {
                    $product->characteristics()->create([
                        'name'        => $name,
                        'value'       => $value,
                        'template_id' => $templateId ?: null,
                    ]);
                }
            }
        }

        $approved = fn($q) => $q->where('status', 'approved');
        $product->load('categories', 'characteristics');
        $product->loadCount(['reviews as reviews_count' => $approved]);
        $product->loadAvg(['reviews as reviews_avg_rating' => $approved], 'rating');

        return response()->json(['success' => true, 'product' => $this->formatProduct($product)], 201);
    }

    public function update(Request $request, int $id)
    {
        $product = Product::findOrFail($id);

        $data = $request->only(['name', 'description']);
        if ($request->filled('price')) $data['price'] = (float) $request->input('price');
        if ($request->filled('available_quantity')) $data['available_quantity'] = (int) $request->input('available_quantity');
        if ($request->has('discount_percent')) $data['discount_percent'] = (int) $request->input('discount_percent', 0);

        if ($request->has('imageOrder')) {
            $imageOrder = json_decode($request->input('imageOrder', '[]'), true) ?? [];
            $newFiles   = $request->file('images') ?? [];
            $images     = $this->processImageOrder($imageOrder, $newFiles);
            $data['images'] = $images ?: null;
        }

        $product->update($data);

        if ($request->has('category')) {
            $category = $request->input('category');
            if (\is_string($category)) $category = json_decode($category, true);
            $product->categories()->sync($category);
        }

        if ($request->has('characteristics')) {
            $characteristics = $request->input('characteristics', []);
            if (\is_string($characteristics)) $characteristics = json_decode($characteristics, true) ?? [];
            $product->characteristics()->delete();
            if (\is_array($characteristics)) {
                foreach ($characteristics as $ch) {
                    $name       = trim((string) ($ch['name'] ?? ''));
                    $value      = trim((string) ($ch['value'] ?? ''));
                    $templateId = isset($ch['templateId']) ? (int) $ch['templateId'] : null;
                    if ($name && $value) {
                        $product->characteristics()->create([
                            'name'        => $name,
                            'value'       => $value,
                            'template_id' => $templateId ?: null,
                        ]);
                    }
                }
            }
        }

        $approved = fn($q) => $q->where('status', 'approved');
        $product->load('categories', 'characteristics');
        $product->loadCount(['reviews as reviews_count' => $approved]);
        $product->loadAvg(['reviews as reviews_avg_rating' => $approved], 'rating');

        return response()->json(['success' => true, 'product' => $this->formatProduct($product)]);
    }

    public function destroy(int $id)
    {
        Product::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}

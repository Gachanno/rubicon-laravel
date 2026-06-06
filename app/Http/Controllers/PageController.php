<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Slide;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PageController extends Controller
{
    public function main()
    {
        $products = Product::with('categories', 'characteristics')
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->where('available_quantity', '>', 0)
            ->orderBy('reviews_count', 'desc')
            ->take(8)
            ->get()
            ->map(fn($p) => $this->formatProduct($p));

        $slides = Slide::orderBy('created_at', 'asc')->get()->map(fn($s) => [
            'id'          => $s->id,
            'title'       => $s->title,
            'description' => $s->description,
            'link'        => $s->link,
            'image'       => $s->image,
        ]);

        return Inertia::render('Main', [
            'products' => $products,
            'slides'   => $slides,
        ]);
    }

    public function catalog(?int $categoryId = null)
    {
        $categories = Category::all()->map(fn($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'icon' => $c->icon,
            'description' => $c->description,
            'parentId' => $c->parent_id,
        ]);

        return Inertia::render('Catalog', [
            'categories' => $categories,
            'categoryId' => $categoryId,
        ]);
    }

    public function products(Request $request)
    {
        $categories = Category::all()->map(fn($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'icon' => $c->icon,
            'description' => $c->description,
            'parentId' => $c->parent_id,
        ]);

        return Inertia::render('Products', [
            'categories' => $categories,
        ]);
    }

    public function productDetail(int $id)
    {
        $product = Product::with('categories', 'characteristics')
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->find($id);

        if (!$product) {
            return Inertia::render('ProductDetail', ['product' => null]);
        }

        return Inertia::render('ProductDetail', [
            'product' => $this->formatProduct($product),
        ]);
    }

    public function cart()
    {
        return Inertia::render('Cart');
    }

    public function search()
    {
        return Inertia::render('Search');
    }

    public function login()
    {
        return Inertia::render('Login');
    }

    public function profile()
    {
        return Inertia::render('Profile');
    }

    public function admin()
    {
        return Inertia::render('Admin');
    }

    public function contacts()
    {
        return Inertia::render('Contacts');
    }

    private function formatProduct(Product $p): array
    {
        $discountPercent = (int) ($p->discount_percent ?? 0);
        $images = $p->images ?? [];
        return [
            'id' => $p->id,
            'name' => $p->name,
            'price' => $p->price,
            'discount_percent' => $discountPercent,
            'discounted_price' => $discountPercent > 0
                ? round($p->price * (1 - $discountPercent / 100), 2)
                : null,
            'image' => !empty($images) ? $images[0] : '/dataImg/noimagebig.png',
            'images' => $images,
            'description' => $p->description,
            'available_quantity' => $p->available_quantity,
            'avg_rating' => (isset($p->reviews_avg_rating) && $p->reviews_avg_rating !== null)
                ? round((float) $p->reviews_avg_rating, 1)
                : null,
            'reviews_count' => (int) ($p->reviews_count ?? 0),
            'category' => $p->categories->pluck('id')->toArray(),
            'characteristics' => $p->characteristics->map(fn($ch) => [
                'name' => $ch->name,
                'value' => $ch->value,
            ])->toArray(),
        ];
    }
}

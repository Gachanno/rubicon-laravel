<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::all()->map(fn($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'icon' => $c->icon,
            'description' => $c->description,
            'parentId' => $c->parent_id,
        ]);

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parentId' => 'nullable|numeric|exists:categories,id',
            'icon' => 'nullable|file|image|max:5120',
        ]);

        $iconPath = '/dataImg/noimagebig.png';
        if ($request->hasFile('icon')) {
            $file = $request->file('icon');
            $filename = 'cat_' . uniqid() . '.' . $file->getClientOriginalExtension();
            Storage::disk('public')->putFileAs('uploads', $file, $filename);
            $iconPath = '/storage/uploads/' . $filename;
        }

        $parentId = $request->input('parentId');
        if (is_string($parentId) && $parentId !== '') {
            $parentId = (int) $parentId;
        } elseif ($parentId === '' || $parentId === null) {
            $parentId = null;
        }

        $category = Category::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
            'parent_id' => $parentId,
            'icon' => $iconPath,
        ]);

        return response()->json([
            'id' => $category->id,
            'name' => $category->name,
            'icon' => $category->icon,
            'description' => $category->description,
            'parentId' => $category->parent_id,
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $category = Category::findOrFail($id);

        $data = [];
        if ($request->filled('name')) $data['name'] = $request->input('name');
        if ($request->has('description')) $data['description'] = $request->input('description') ?? '';
        if ($request->has('parentId')) {
            $parentId = $request->input('parentId');
            if (is_string($parentId) && $parentId !== '') {
                $parentId = (int) $parentId;
            } elseif ($parentId === '' || $parentId === null) {
                $parentId = null;
            }
            $data['parent_id'] = $parentId;
        }

        if ($request->hasFile('icon')) {
            $request->validate(['icon' => 'file|image|max:5120']);
            $file = $request->file('icon');
            $filename = 'cat_' . uniqid() . '.' . $file->getClientOriginalExtension();
            Storage::disk('public')->putFileAs('uploads', $file, $filename);
            $data['icon'] = '/storage/uploads/' . $filename;
        }

        $category->update($data);

        return response()->json([
            'id' => $category->id,
            'name' => $category->name,
            'icon' => $category->icon,
            'description' => $category->description,
            'parentId' => $category->parent_id,
        ]);
    }

    public function destroy(int $id)
    {
        $category = Category::findOrFail($id);

        DB::transaction(function () use ($category) {
            // 1. Собрать всё поддерево: саму категорию и всех её потомков
            $subtreeIds = $this->collectSubtreeIds($category->id);

            // 2. Товары, привязанные к удаляемому поддереву
            $productIds = DB::table('category_product')
                ->whereIn('category_id', $subtreeIds)
                ->pluck('product_id')
                ->unique();

            // 3. Удаляем только товары, у которых не остаётся ни одной категории
            //    ВНЕ удаляемого поддерева (иначе товар просто отвяжется от поддерева).
            $orphanIds = $productIds->filter(function ($pid) use ($subtreeIds) {
                $survivingLinks = DB::table('category_product')
                    ->where('product_id', $pid)
                    ->whereNotIn('category_id', $subtreeIds)
                    ->count();
                return $survivingLinks === 0;
            })->values();

            // Удаление товара каскадно (FK ON DELETE CASCADE) уносит:
            //   отзывы, характеристики товара, позиции заказов,
            //   позиции ручных продаж и связи category_product.
            if ($orphanIds->isNotEmpty()) {
                Product::whereIn('id', $orphanIds)->delete();
            }

            // 4. Удаляем категории поддерева. Каскадно удаляются:
            //   шаблоны характеристик категорий (characteristic_templates.category_id)
            //   и оставшиеся связи category_product у выживших товаров.
            Category::whereIn('id', $subtreeIds)->delete();
        });

        return response()->json(['success' => true]);
    }

    /**
     * Возвращает id категории и всех её потомков (рекурсивно, без циклов).
     */
    private function collectSubtreeIds(int $rootId): array
    {
        $ids   = [$rootId];
        $level = [$rootId];

        while (!empty($level)) {
            $children = Category::whereIn('parent_id', $level)
                ->pluck('id')
                ->all();
            $children = array_values(array_diff($children, $ids));
            if (empty($children)) {
                break;
            }
            $ids   = array_merge($ids, $children);
            $level = $children;
        }

        return $ids;
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CharacteristicTemplate;
use Illuminate\Http\Request;

class CharacteristicTemplateController extends Controller
{
    private function format(CharacteristicTemplate $t): array
    {
        return [
            'id'           => $t->id,
            'categoryId'   => $t->category_id,
            'categoryName' => $t->category?->name ?? '—',
            'name'         => $t->name,
            'type'         => $t->type,
            'options'      => $t->options,
            'isFilterable' => $t->is_filterable,
        ];
    }

    public function index(Request $request)
    {
        $q = CharacteristicTemplate::with('category');

        if ($catId = $request->input('categoryId')) {
            $q->where('category_id', (int) $catId);
        }

        $templates = $q->orderBy('category_id')->orderBy('name')->get();

        return response()->json($templates->map(fn($t) => $this->format($t)));
    }

    public function store(Request $request)
    {
        $request->validate([
            'categoryId'   => 'required|integer|exists:categories,id',
            'name'         => 'required|string|max:255',
            'type'         => 'required|in:text,select,range,boolean',
            'options'      => 'nullable|array',
            'isFilterable' => 'boolean',
        ]);

        $t = CharacteristicTemplate::create([
            'category_id'   => $request->input('categoryId'),
            'name'          => $request->input('name'),
            'type'          => $request->input('type', 'text'),
            'options'       => $request->input('options'),
            'is_filterable' => $request->boolean('isFilterable'),
        ]);

        $t->load('category');

        return response()->json(['success' => true, 'template' => $this->format($t)], 201);
    }

    public function update(Request $request, int $id)
    {
        $t = CharacteristicTemplate::findOrFail($id);

        $request->validate([
            'categoryId'   => 'sometimes|integer|exists:categories,id',
            'name'         => 'sometimes|required|string|max:255',
            'type'         => 'sometimes|required|in:text,select,range,boolean',
            'options'      => 'nullable|array',
            'isFilterable' => 'boolean',
        ]);

        $data = [];
        if ($request->has('categoryId'))   $data['category_id']   = $request->input('categoryId');
        if ($request->has('name'))         $data['name']          = $request->input('name');
        if ($request->has('type'))         $data['type']          = $request->input('type');
        if ($request->has('options'))      $data['options']       = $request->input('options');
        if ($request->has('isFilterable')) $data['is_filterable'] = $request->boolean('isFilterable');

        $t->update($data);
        $t->load('category');

        return response()->json(['success' => true, 'template' => $this->format($t)]);
    }

    public function destroy(int $id)
    {
        CharacteristicTemplate::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Slide;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SlideController extends Controller
{
    public function publicIndex()
    {
        $slides = Slide::orderBy('created_at', 'asc')
            ->get()
            ->map(fn($s) => $this->format($s));

        return response()->json($slides);
    }

    public function index(Request $request)
    {
        $query = Slide::query();

        if ($q = $request->input('q')) {
            $query->where('link', 'like', "%{$q}%");
        }

        $sortBy  = $request->input('sortBy', 'created_at');
        $sortDir = $request->input('sortDir', 'desc') === 'asc' ? 'asc' : 'desc';
        $allowed = ['id', 'title', 'created_at'];
        if (in_array($sortBy, $allowed)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $limit = (int) $request->input('limit', 10);
        $page  = (int) $request->input('page', 1);
        $total = $query->count();
        $slides = $query->skip(($page - 1) * $limit)->take($limit)->get();

        return response()->json([
            'data'  => $slides->map(fn($s) => $this->format($s)),
            'total' => $total,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'link'        => 'nullable|string|max:500',
            'image'       => 'required|file|mimes:jpg,jpeg,png,gif,webp|max:5120',
        ]);

        $file = $request->file('image');
        $filename = 'slide_' . uniqid() . '.' . $file->getClientOriginalExtension();
        Storage::disk('public')->putFileAs('slides', $file, $filename);
        $imagePath = '/storage/slides/' . $filename;

        $slide = Slide::create([
            'title'       => $request->input('title'),
            'description' => $request->input('description'),
            'link'        => $request->input('link'),
            'image'       => $imagePath,
        ]);

        return response()->json(['success' => true, 'slide' => $this->format($slide)], 201);
    }

    public function update(Request $request, int $id)
    {
        $slide = Slide::findOrFail($id);

        $request->validate([
            'title'       => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'link'        => 'nullable|string|max:500',
            'image'       => 'nullable|file|mimes:jpg,jpeg,png,gif,webp|max:5120',
        ]);

        $data = [];
        if ($request->filled('title')) $data['title'] = $request->input('title');
        if ($request->has('description')) $data['description'] = $request->input('description');
        if ($request->has('link')) $data['link'] = $request->input('link');

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = 'slide_' . uniqid() . '.' . $file->getClientOriginalExtension();
            Storage::disk('public')->putFileAs('slides', $file, $filename);
            $data['image'] = '/storage/slides/' . $filename;
        }

        $slide->update($data);

        return response()->json(['success' => true, 'slide' => $this->format($slide)]);
    }

    public function destroy(int $id)
    {
        Slide::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    private function format(Slide $s): array
    {
        return [
            'id'          => $s->id,
            'title'       => $s->title,
            'description' => $s->description,
            'link'        => $s->link,
            'image'       => $s->image,
            'createdAt'   => $s->created_at?->toISOString(),
        ];
    }
}

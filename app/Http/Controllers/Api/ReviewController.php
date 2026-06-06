<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    // Public: only approved reviews
    public function index(int $productId)
    {
        $reviews = Review::with('user')
            ->where('product_id', $productId)
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($r) => $this->formatReview($r));

        return response()->json($reviews);
    }

    public function canReview(Request $request, int $productId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['canReview' => false, 'hasReview' => false, 'review' => null]);
        }

        $hasDelivered = Order::where('user_id', $user->id)
            ->where('status', 'выдано')
            ->whereHas('items', fn($q) => $q->where('product_id', $productId))
            ->exists();

        $review = Review::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->first();

        return response()->json([
            'canReview' => $hasDelivered,
            'hasReview' => $review !== null,
            'review' => $review ? [
                'id'        => $review->id,
                'rating'    => $review->rating,
                'body'      => $review->body,
                'images'    => $review->images ?? [],
                'status'    => $review->status,
                'createdAt' => $review->created_at?->toISOString(),
            ] : null,
        ]);
    }

    public function store(Request $request, int $productId)
    {
        $user = $request->user();

        $hasDelivered = Order::where('user_id', $user->id)
            ->where('status', 'выдано')
            ->whereHas('items', fn($q) => $q->where('product_id', $productId))
            ->exists();

        if (!$hasDelivered) {
            return response()->json(['error' => 'Вы можете оставить отзыв только на полученный товар'], 403);
        }

        $existing = Review::where('user_id', $user->id)->where('product_id', $productId)->first();
        if ($existing) {
            return response()->json(['error' => 'Вы уже оставили отзыв на этот товар'], 409);
        }

        $request->validate([
            'rating'    => 'required|integer|min:1|max:5',
            'body'      => 'nullable|string|max:2000',
            'images'    => 'nullable|array|max:5',
            'images.*'  => 'file|mimes:jpg,jpeg,png,gif,webp|max:5120',
        ]);

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach (array_slice($request->file('images'), 0, 5) as $file) {
                $path = $file->store('reviews', 'public');
                $imagePaths[] = '/storage/' . $path;
            }
        }

        $review = Review::create([
            'user_id'    => $user->id,
            'product_id' => $productId,
            'rating'     => (int) $request->input('rating'),
            'body'       => $request->input('body'),
            'images'     => $imagePaths,
            'status'     => 'pending',
        ]);

        $review->load('user');

        return response()->json(['success' => true, 'review' => $this->formatReview($review)], 201);
    }

    public function update(Request $request, int $productId)
    {
        $user = $request->user();

        $review = Review::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->firstOrFail();

        $request->validate([
            'rating'         => 'required|integer|min:1|max:5',
            'body'           => 'nullable|string|max:2000',
            'images'         => 'nullable|array|max:5',
            'images.*'       => 'file|mimes:jpg,jpeg,png,gif,webp|max:5120',
            'existingImages' => 'nullable|string',
        ]);

        $existingImages = json_decode($request->input('existingImages', '[]'), true) ?? [];

        $newImagePaths = [];
        if ($request->hasFile('images')) {
            $remaining = max(0, 5 - count($existingImages));
            foreach (array_slice($request->file('images'), 0, $remaining) as $file) {
                $path = $file->store('reviews', 'public');
                $newImagePaths[] = '/storage/' . $path;
            }
        }

        $review->update([
            'rating' => (int) $request->input('rating'),
            'body'   => $request->input('body'),
            'images' => array_slice(array_merge($existingImages, $newImagePaths), 0, 5),
            'status' => 'pending', // re-submit goes back to moderation
        ]);

        $review->load('user');

        return response()->json(['success' => true, 'review' => $this->formatReview($review)]);
    }

    public function adminIndex(Request $request)
    {
        $query = Review::with('user', 'product');

        if ($q = $request->input('q')) {
            $query->where(function ($qb) use ($q) {
                if (is_numeric($q)) {
                    $qb->where('reviews.id', (int) $q)
                       ->orWhereHas('user', fn($u) => $u->where('last_name', 'like', "%{$q}%")
                           ->orWhere('first_name', 'like', "%{$q}%"));
                } else {
                    $qb->whereHas('user', fn($u) => $u->where('last_name', 'like', "%{$q}%")
                        ->orWhere('first_name', 'like', "%{$q}%"));
                }
            });
        }

        if ($product = $request->input('product')) {
            $query->whereHas('product', fn($p) => $p->where('name', 'like', "%{$product}%"));
        }

        if ($from = $request->input('from')) {
            $query->where('reviews.created_at', '>=', $from . ' 00:00:00');
        }
        if ($to = $request->input('to')) {
            $query->where('reviews.created_at', '<=', $to . ' 23:59:59');
        }

        if ($rating = $request->input('rating')) {
            $query->where('rating', (int) $rating);
        }

        $hasPhoto = $request->input('hasPhoto');
        if ($hasPhoto === 'yes') {
            $query->where(fn($qb) => $qb->whereNotNull('images')->where('images', '!=', '[]')->where('images', '!=', ''));
        } elseif ($hasPhoto === 'no') {
            $query->where(fn($qb) => $qb->whereNull('images')->orWhere('images', '[]')->orWhere('images', ''));
        }

        if ($status = $request->input('status')) {
            $query->where('reviews.status', $status);
        }

        $sortBy  = $request->input('sortBy', 'id');
        $sortDir = $request->input('sortDir', 'desc') === 'asc' ? 'asc' : 'desc';
        if (in_array($sortBy, ['id', 'rating', 'created_at'])) {
            $query->orderBy('reviews.' . $sortBy, $sortDir);
        }

        $limit = (int) $request->input('limit', 10);
        $page  = (int) $request->input('page', 1);
        $total = $query->count();
        $reviews = $query->skip(($page - 1) * $limit)->take($limit)->get();

        return response()->json([
            'data'         => $reviews->map(fn($r) => $this->formatAdminReview($r)),
            'total'        => $total,
            'pendingCount' => Review::where('status', 'pending')->count(),
        ]);
    }

    public function approve(int $reviewId)
    {
        $review = Review::findOrFail($reviewId);
        $review->update(['status' => 'approved']);

        return response()->json(['success' => true, 'review' => $this->formatAdminReview($review->load('user', 'product'))]);
    }

    public function destroyOwn(Request $request, int $productId)
    {
        $user = $request->user();
        Review::where('user_id', $user->id)->where('product_id', $productId)->firstOrFail()->delete();
        return response()->json(['success' => true]);
    }

    public function destroy(int $reviewId)
    {
        Review::findOrFail($reviewId)->delete();
        return response()->json(['success' => true]);
    }

    public function destroyUserReviews(int $userId)
    {
        Review::where('user_id', $userId)->delete();
        User::findOrFail($userId)->delete();
        return response()->json(['success' => true]);
    }

    private function formatAdminReview(Review $r): array
    {
        return [
            'id'          => $r->id,
            'productId'   => $r->product_id,
            'productName' => $r->product?->name ?? '—',
            'userId'      => $r->user_id,
            'userName'    => $r->user
                ? trim($r->user->last_name . ' ' . mb_strtoupper(mb_substr($r->user->first_name, 0, 1)) . '.')
                : 'Пользователь',
            'rating'      => $r->rating,
            'body'        => $r->body,
            'images'      => $r->images ?? [],
            'status'      => $r->status,
            'createdAt'   => $r->created_at?->format('d.m.Y'),
        ];
    }

    private function formatReview(Review $r): array
    {
        return [
            'id'        => $r->id,
            'userId'    => $r->user_id,
            'userName'  => $r->user
                ? trim($r->user->last_name . ' ' . mb_strtoupper(mb_substr($r->user->first_name, 0, 1)) . '.')
                : 'Пользователь',
            'rating'    => $r->rating,
            'body'      => $r->body,
            'images'    => $r->images ?? [],
            'status'    => $r->status,
            'createdAt' => $r->created_at?->toISOString(),
        ];
    }
}

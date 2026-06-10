<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PageController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\CharacteristicTemplateController;
use App\Http\Controllers\Api\SlideController;
use App\Http\Controllers\Api\StatisticsController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentCardController;

Route::get('/', [PageController::class, 'main'])->name('home');
Route::get('/catalog/{categoryId?}', [PageController::class, 'catalog'])->name('catalog');
Route::get('/products', [PageController::class, 'products'])->name('products');
Route::get('/products/{id}', [PageController::class, 'productDetail'])->name('product.detail');
Route::get('/cart', [PageController::class, 'cart'])->name('cart')->middleware('auth');
Route::get('/search', [PageController::class, 'search'])->name('search');
Route::get('/login', [PageController::class, 'login'])->name('login');
Route::get('/contacts', [PageController::class, 'contacts'])->name('contacts');
Route::get('/profile', [PageController::class, 'profile'])->name('profile')->middleware('auth');
Route::get('/admin', [PageController::class, 'admin'])->name('admin')->middleware('auth');

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::prefix('api')->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::post('/products', [ProductController::class, 'store'])->middleware('auth');
    Route::patch('/products/{id}', [ProductController::class, 'update'])->middleware('auth');
    Route::delete('/products/{id}', [ProductController::class, 'destroy'])->middleware('auth');

    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store'])->middleware('auth');
    Route::patch('/categories/{id}', [CategoryController::class, 'update'])->middleware('auth');
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy'])->middleware('auth');

    Route::get('/orders', [OrderController::class, 'index'])->middleware('auth');
    Route::get('/orders/{id}', [OrderController::class, 'show'])->middleware('auth');
    Route::post('/orders', [OrderController::class, 'store'])->middleware('auth');
    Route::patch('/orders/{id}', [OrderController::class, 'update'])->middleware('auth');

    Route::get('/users', [UserController::class, 'index'])->middleware('auth');
    Route::post('/users', [UserController::class, 'store'])->middleware('auth');
    Route::get('/users/{id}', [UserController::class, 'show'])->middleware('auth');
    Route::patch('/users/{id}', [UserController::class, 'update'])->middleware('auth');
    Route::delete('/users/{id}', [UserController::class, 'destroy'])->middleware('auth');

    Route::middleware('auth')->prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'index']);
        Route::post('/items', [CartController::class, 'addItem']);
        Route::patch('/items/{productId}', [CartController::class, 'updateItem']);
        Route::delete('/items/{productId}', [CartController::class, 'removeItem']);
        Route::delete('/', [CartController::class, 'clear']);
        Route::post('/confirm', [CartController::class, 'confirm']);
    });

    // Reviews
    Route::get('/products/{productId}/reviews', [ReviewController::class, 'index']);
    Route::get('/products/{productId}/reviews/can-review', [ReviewController::class, 'canReview'])->middleware('auth');
    Route::post('/products/{productId}/reviews', [ReviewController::class, 'store'])->middleware('auth');
    Route::patch('/products/{productId}/reviews', [ReviewController::class, 'update'])->middleware('auth');
    Route::delete('/products/{productId}/reviews', [ReviewController::class, 'destroyOwn'])->middleware('auth');

    // Admin reviews
    Route::get('/admin/reviews', [ReviewController::class, 'adminIndex'])->middleware('auth');
    Route::patch('/admin/reviews/{id}/approve', [ReviewController::class, 'approve'])->middleware('auth');
    Route::delete('/admin/reviews/{id}', [ReviewController::class, 'destroy'])->middleware('auth');
    Route::delete('/admin/reviews/{id}/user', [ReviewController::class, 'destroyUserReviews'])->middleware('auth');

    // Characteristic templates
    Route::get('/char-templates', [CharacteristicTemplateController::class, 'index']);
    Route::post('/char-templates', [CharacteristicTemplateController::class, 'store'])->middleware('auth');
    Route::patch('/char-templates/{id}', [CharacteristicTemplateController::class, 'update'])->middleware('auth');
    Route::delete('/char-templates/{id}', [CharacteristicTemplateController::class, 'destroy'])->middleware('auth');

    // Statistics & manual sales
    Route::get('/statistics', [StatisticsController::class, 'index'])->middleware('auth');
    Route::post('/manual-sales', [StatisticsController::class, 'storeSale'])->middleware('auth');

    // Order status notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->middleware('auth');

    // Сохранённые банковские карты (хранятся в БД зашифрованными)
    Route::get('/payment-cards', [PaymentCardController::class, 'index'])->middleware('auth');
    Route::post('/payment-cards', [PaymentCardController::class, 'store'])->middleware('auth');
    Route::delete('/payment-cards/{id}', [PaymentCardController::class, 'destroy'])->middleware('auth');

    // Slides
    Route::get('/slides', [SlideController::class, 'publicIndex']);
    Route::get('/admin/slides', [SlideController::class, 'index'])->middleware('auth');
    Route::post('/admin/slides', [SlideController::class, 'store'])->middleware('auth');
    Route::patch('/admin/slides/{id}', [SlideController::class, 'update'])->middleware('auth');
    Route::delete('/admin/slides/{id}', [SlideController::class, 'destroy'])->middleware('auth');
});

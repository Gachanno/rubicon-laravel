<?php

namespace Database\Seeders\Concerns;

use Illuminate\Support\Facades\Http;

/**
 * Скачивает подходящее стоковое фото с Pixabay и кладёт его в public/dataImg/seed.
 * Используется сидерами товаров и категорий, когда нет предзагруженного изображения.
 *
 * Уже скачанные файлы переиспользуются, поэтому повторный сидинг быстрый и работает офлайн.
 */
trait FetchesStockImages
{
    protected function stockImagesEnabled(): bool
    {
        return !empty(config('services.pixabay.key'));
    }

    /**
     * @return string|null Публичный путь (например, /dataImg/seed/cat-5-garden-shovel.jpg) или null при неудаче.
     */
    protected function fetchStockImage(string $query, string $slug): ?string
    {
        $key = config('services.pixabay.key');
        if (!$key) {
            return null;
        }

        $destDir    = public_path('dataImg/seed');
        $destFile   = $destDir . DIRECTORY_SEPARATOR . $slug . '.jpg';
        $publicPath = '/dataImg/seed/' . $slug . '.jpg';

        if (file_exists($destFile)) {
            return $publicPath; // кэш предыдущего запуска
        }

        if (!is_dir($destDir)) {
            mkdir($destDir, 0775, true);
        }

        try {
            // withoutVerifying(): на многих Windows/OSPanel сборках PHP нет CA-бандла (cURL error 60).
            $resp = Http::withoutVerifying()->timeout(20)->get('https://pixabay.com/api/', [
                'key'         => $key,
                'q'           => $query,
                'image_type'  => 'photo',
                'orientation' => 'horizontal',
                'safesearch'  => 'true',
                'per_page'    => 3,
            ]);

            if (!$resp->ok()) {
                return null;
            }

            $hits = $resp->json('hits') ?? [];
            $url  = $hits[0]['webformatURL'] ?? $hits[0]['largeImageURL'] ?? null;
            if (!$url) {
                return null;
            }

            $img = Http::withoutVerifying()->timeout(30)->get($url);
            if (!$img->ok()) {
                return null;
            }

            file_put_contents($destFile, $img->body());

            return $publicPath;
        } catch (\Throwable $e) {
            return null;
        }
    }
}

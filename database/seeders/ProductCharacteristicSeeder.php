<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Заполняет характеристики товаров на основе ШАБЛОНОВ их категорий.
 *
 * Гарантирует: если у категории товара есть шаблонные характеристики —
 * они ВСЕ заполнены реалистичными значениями и привязаны к шаблону
 * (template_id), чтобы по ним работала фильтрация. Дополнительно к каждому
 * товару добавляются свободные характеристики (производитель, страна и т.п.).
 */
class ProductCharacteristicSeeder extends Seeder
{
    private array $brands = ['Сибртех', 'ЗУБР', 'PALISAD', 'GRINDA', 'Gardena', 'Fiskars', 'Росток', 'Калибр', 'Агрос', 'СоюзСад'];
    private array $countries = ['Россия', 'Россия', 'Россия', 'Россия', 'Китай', 'Германия', 'Польша'];

    public function run(): void
    {
        // Шаблоны характеристик по категориям
        $templates = DB::table('characteristic_templates')->get();
        $tplByCat = [];
        foreach ($templates as $t) {
            $tplByCat[$t->category_id][] = $t;
        }

        // Категории (для определения родитель/потомок)
        $cats = DB::table('categories')->get()->keyBy('id');

        // Товары и их категории
        $products = DB::table('products')->get();
        $prodCats = [];
        foreach (DB::table('category_product')->get() as $cp) {
            $prodCats[$cp->product_id][] = $cp->category_id;
        }

        $rows = [];

        foreach ($products as $product) {
            $catIds = $prodCats[$product->id] ?? [];

            // Сначала подкатегории (parent_id != null) — их шаблоны конкретнее,
            // поэтому при дублировании имени берём вариант подкатегории.
            usort($catIds, function ($a, $b) use ($cats) {
                $aChild = isset($cats[$a]) && $cats[$a]->parent_id !== null ? 1 : 0;
                $bChild = isset($cats[$b]) && $cats[$b]->parent_id !== null ? 1 : 0;
                return $bChild <=> $aChild;
            });

            // Собираем уникальные (по имени) шаблоны со всех категорий товара
            $chosen = [];
            foreach ($catIds as $catId) {
                foreach ($tplByCat[$catId] ?? [] as $t) {
                    if (!isset($chosen[$t->name])) {
                        $chosen[$t->name] = $t;
                    }
                }
            }

            // Заполняем КАЖДУЮ шаблонную характеристику
            foreach ($chosen as $t) {
                $rows[] = [
                    'product_id'  => $product->id,
                    'template_id' => $t->id,
                    'name'        => $t->name,
                    'value'       => $this->valueForTemplate($t, $product),
                ];
            }

            // Доп. свободные характеристики (без шаблона)
            foreach ($this->extraCharacteristics($product) as $name => $value) {
                $rows[] = [
                    'product_id'  => $product->id,
                    'template_id' => null,
                    'name'        => $name,
                    'value'       => $value,
                ];
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('product_characteristics')->insert($chunk);
        }
    }

    private function valueForTemplate(object $t, object $product): string
    {
        $options = $t->options ? (json_decode($t->options, true) ?: null) : null;

        return match ($t->type) {
            'select'  => $this->pickSelect(is_array($options) ? array_values($options) : [], $product, $t),
            'range'   => $this->pickRange(is_array($options) ? $options : [], $product, $t),
            'boolean' => $this->pickBool($product, $t) ? 'Да' : 'Нет',
            'text'    => $this->pickText($t, $product),
            default   => '—',
        };
    }

    /**
     * Для select подбираем подходящий вариант: если корень варианта встречается
     * в названии товара — берём его (реалистично), иначе детерминированный выбор.
     */
    private function pickSelect(array $options, object $product, object $t): string
    {
        if (empty($options)) {
            return '—';
        }

        $name = $this->mbLower($product->name);
        foreach ($options as $opt) {
            $o = $this->mbLower((string) $opt);
            $stems = array_unique([
                $o,
                mb_substr($o, 0, max(3, mb_strlen($o) - 1)),
                mb_substr($o, 0, max(3, mb_strlen($o) - 2)),
            ]);
            foreach ($stems as $stem) {
                if ($stem !== '' && mb_strpos($name, $stem) !== false) {
                    return (string) $opt;
                }
            }
        }

        return (string) $options[$this->hash($t->name . '|' . $product->id) % count($options)];
    }

    private function pickRange(array $opts, object $product, object $t): string
    {
        $min  = isset($opts['min']) ? (float) $opts['min'] : 0;
        $max  = isset($opts['max']) ? (float) $opts['max'] : 1;
        $unit = $opts['unit'] ?? '';
        if ($max < $min) {
            [$min, $max] = [$max, $min];
        }

        $steps = 10;
        $frac  = ($this->hash($t->name . '#' . $product->id) % ($steps + 1)) / $steps;
        $val   = $min + $frac * ($max - $min);

        // Точность зависит от единицы измерения: кг/л — дробные, остальное — целые.
        // Гарантируем, что значение не округлится до нуля.
        if (in_array($unit, ['кг', 'л'], true)) {
            $val = $max <= 2 ? round($val, 2) : round($val, 1);
            if ($val <= 0) {
                $val = $max <= 2 ? round(max($min, 0.05), 2) : round(max($min, 0.1), 1);
            }
        } else {
            $val = (float) round($val);
            if ($val < 1) {
                $val = (float) max(1, (int) ceil($min));
            }
        }

        $str = rtrim(rtrim(number_format($val, 2, '.', ''), '0'), '.');

        return $unit !== '' ? "{$str} {$unit}" : $str;
    }

    private function pickBool(object $product, object $t): bool
    {
        // ~60% «Да» — детерминированно по товару и шаблону
        return ($this->hash($t->name . '!' . $product->id) % 5) < 3;
    }

    private function pickText(object $t, object $product): string
    {
        if (mb_stripos($t->name, 'NPK') !== false) {
            $variants = ['10:10:10', '16:16:16', '20:20:20', '13:19:24', '11:11:21'];
            return $variants[$this->hash('npk' . $product->id) % count($variants)];
        }

        return 'Соответствует ГОСТ';
    }

    private function extraCharacteristics(object $product): array
    {
        return [
            'Производитель'       => $this->brands[$product->id % count($this->brands)],
            'Страна производства' => $this->countries[$product->id % count($this->countries)],
        ];
    }

    private function hash(string $s): int
    {
        return abs(crc32($s));
    }

    private function mbLower(string $s): string
    {
        return function_exists('mb_strtolower') ? mb_strtolower($s) : strtolower($s);
    }
}

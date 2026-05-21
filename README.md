# МинскБиз — Mini App

Telegram Mini App для маркетплейса фермерских продуктов в Минске и области.

## Стек

- Vite + React 18 + TypeScript (strict, `noUncheckedIndexedAccess`)
- Tailwind CSS
- React Router v6
- Yandex Maps JS API 2.1 (требуется `VITE_YANDEX_MAPS_API_KEY`)
- Recharts — графики аналитики списаний

## Запуск

```bash
cp .env.example .env
npm install
npm run dev
```

Откройте `http://localhost:5173/farmers`.

В обычном браузере (без Telegram) бэкенд вернёт 401 — это ожидаемо. Чтобы проверить авторизованные запросы локально, положите валидный `initData` в `VITE_DEV_INIT_DATA`.

## Сборка

```bash
npm run build
```

## Деплой

Vercel. SPA-rewrite уже настроен в `vercel.json` — все маршруты возвращают `index.html`.

## Структура

- `/farmers` — карта фермеров: фильтры по категории и радиусу, попап с товаром и кнопкой "В корзину".
- Корзина / отходы / чеки — в следующих итерациях.

## Заметки

- Все запросы идут с заголовком `X-Telegram-Init-Data` (см. `src/api/client.ts`).
- Тема Telegram читается через `themeParams` и применяется как CSS-переменные на `:root`.

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Рубикон</title>
    <link rel="icon" type="image/svg+xml" href="{{asset('/favicon.svg')}}">
    <link rel="icon" type="image/png" sizes="32x32" href="{{asset('/favicon-32x32.png')}}">
    <link rel="icon" type="image/png" sizes="16x16" href="{{asset('/favicon-16x16.png')}}">
    <link rel="icon" href="{{asset('/favicon.ico')}}" sizes="any">
    <link rel="apple-touch-icon" sizes="180x180" href="{{asset('/apple-touch-icon.png')}}">
    <link rel="manifest" href="{{asset('/site.webmanifest')}}">
    <link rel="icon" type="image/png" sizes="512x512" href="{{asset('/android-chrome-512x512.png')}}">
    <link rel="icon" type="image/png" sizes="192x192" href="{{asset('/android-chrome-192x192.png')}}">
    @viteReactRefresh
    @vite('resources/js/app.jsx')
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>

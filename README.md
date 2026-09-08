# И так сойдёт — frontend

Клиентская часть проекта на React 18 и Vite.

## Требования

- Node.js 20.19 или новее
- npm 10 или новее

## Команды

```bash
npm install
npm start
npm run build
npm run preview
npm test
npm run lint
npm run lint:styles
```

Development-сервер запускается на `http://localhost:3000`. Production-сборка
создаётся в папке `build`, которую может раздавать backend.

## Переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните значения. Новые переменные
используют префикс `VITE_`. Для совместимости во время перехода также читаются
старые переменные с префиксом `REACT_APP_`.

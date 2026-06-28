# Finca Ganadera

Gestión de ganado en tiempo real: registro de animales, reportes con fotos/videos, historial de salud y soporte multi-finca/multi-usuario.

Estructura:
- `backend/` — API REST (Node/Express + Prisma/PostgreSQL + almacenamiento S3 para fotos/videos)
- `web/` — App web (Next.js)
- `mobile/` — App Android (Flutter)

## 0. Instalar herramientas (una sola vez)

```bash
# Homebrew (si no lo tienes)
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js y PostgreSQL
brew install node postgresql@16
brew services start postgresql@16

# Flutter (para la app Android) + Android Studio (para el SDK/emulador)
brew install --cask flutter android-studio
flutter doctor   # sigue sus indicaciones (licencias Android, etc.)
```

## 1. Backend

```bash
cd backend
cp .env.example .env
npm install
createdb finca_ganadera
npm run prisma:migrate -- --name init
npm run dev   # http://localhost:4000
```

Edita `.env` con tus credenciales reales de S3 (o un bucket compatible) para que las fotos/videos se guarden correctamente.

## 2. Web

```bash
cd web
cp .env.local.example .env.local
npm install
npm run dev   # http://localhost:3000
```

## 3. App móvil (Android)

La carpeta `mobile/` ya tiene el código Dart (`pubspec.yaml` + `lib/`), pero le falta el andamiaje nativo de Android (se genera con `flutter create`):

```bash
cd mobile
flutter create --org com.fincaganadera --project-name finca_ganadera .
flutter pub get
flutter run   # con un emulador Android abierto o un dispositivo conectado
```

Por defecto la app apunta a `http://10.0.2.2:4000/api` (así el emulador de Android ve el `localhost` de tu Mac). Si usas un dispositivo físico, cambia `baseUrl` en `lib/api_client.dart` por la IP de tu máquina en la red local.

## Flujo de uso

1. En la web, crea tu finca en `/registro` (esto crea el usuario ADMIN).
2. Inicia sesión en la web o en la app móvil con ese usuario.
3. Registra animales y sube reportes (con fotos/videos) desde la cámara del celular o desde la web.
4. Los reportes aparecen en ambas plataformas (la lista se refresca cada 15s).

# 🎥 Qb1tyCinema Media Service (gRPC + S3 + CloudFront)

Высокопроизводительный микросервис для потоковой загрузки, обработки и хранения медиафайлов. Архитектура построена на базе **NestJS**, **gRPC** (Client-Side Streaming) и **AWS SDK v3**.

Сервис спроектирован с упором на минимальное потребление оперативной памяти (Zero-copy буферизация) и высокую скорость отдачи контента через CDN.

## ✨ Ключевые особенности

- 🚀 **gRPC Streaming (RxJS ReplaySubject):** Файлы нарезаются на чанки по 64 KB на Gateway и стримятся в микросервис по протоколу HTTP/2, предотвращая `TimeoutError` и переполнение памяти (Out-Of-Memory).
- 🖼️ **On-the-fly Image Processing:** Обработка изображений "на лету" с помощью `sharp` (C++ libvips). Изображения автоматически поворачиваются, масштабируются (max 1920x1920) и конвертируются в оптимизированный формат `.webp` (quality 80).
- ☁️ **AWS S3 & CloudFront:** Потоковая загрузка напрямую в Yandex Cloud / AWS S3 через `@aws-sdk/lib-storage` (пайплайн `PassThrough -> sharp -> S3`).
- 🧹 **Авто-инвалидация кэша CDN:** При удалении файла микросервис не только стирает его из S3 бакета, но и автоматически отправляет `CreateInvalidationCommand` в AWS CloudFront для мгновенного обновления кэша на Edge-серверах по всему миру.
- 🛡️ **Строгая валидация:** Защита на уровне `MulterOptions` отклоняет вредоносные файлы и проверяет MIME-типы (JPG, PNG, WEBP, GIF) еще на этапе парсинга HTTP-запроса.
- ⚡ **Мультиплексирование HTTP/2:** Поддержка параллельной загрузки массива файлов без блокировки Node.js Event Loop с защищенной оркестрацией через `Promise.allSettled`.

---

## 🏗 Архитектура (Flow)

1. **Client** отправляет `multipart/form-data` на API Gateway.
2. **Gateway** валидирует файл (размер, тип) и создает RxJS `ReplaySubject`.
3. Файл режется на чанки и отправляется в `MediaClientGrpc`.
4. **Media Service** получает поток, конвертирует сырые байты обратно в Node.js `Buffer` без копирования памяти (`Buffer.from(chunk.buffer)`).
5. Поток проходит через трансформацию `sharp` и улетает в **S3 Bucket**.
6. Gateway получает S3 Key и публичный URL, отдавая их клиенту.

---

## ⚙️ Переменные окружения (.env)

Для работы сервиса необходимо задать следующие переменные для модуля S3/CloudFront:

```env
# Хранилище (S3)
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=your_access_key
STORAGE_SECRET_KEY=your_secret_key
STORAGE_BUCKET=qb1tycinema-media
STORAGE_PUBLIC_URL=[https://cdn.qb1tycinema.com](https://cdn.qb1tycinema.com)

# CDN (CloudFront) - необходимо для сброса кэша при удалении
STORAGE_CF_DISTRIBUTION_ID=YOUR_ID
```

---

## 🚀 API Endpoints (Gateway)

Документация доступна в Swagger UI (`/documentation`).

### 1. Загрузка одного файла (Аватар, Постер)
**POST** `/upload`
- **Headers:** `Authorization: Bearer <token>`
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `file`: `binary` (Файл изображения, макс 10 МБ)
  - `folder` *(optional)*: `string` (Название папки в S3, по умолчанию `general`)
- **Response (200 OK):**
  ```json
  {
      "key": "avatars/123e4567-e89b-12d3-a456-426614174000-image.webp",
      "url": "[https://cdn.qb1tycinema.com/avatars/123e4567-e89b-12d3-a456-426614174000-image.webp](https://cdn.qb1tycinema.com/avatars/123e4567-e89b-12d3-a456-426614174000-image.webp)"
  }
  ```

### 2. Загрузка массива файлов (Мультиплексирование)
**POST** `/upload/multiple`
- **Headers:** `Authorization: Bearer <token>`
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `files`: `array of binary` (До 10 файлов одновременно)
  - `folder` *(optional)*: `string`
- **Response (200 OK):**
  ```json
  {
      "total": 2,
      "uploaded": 1,
      "failed": 1,
      "successful": [
          {
              "key": "general/uuid-img1.webp",
              "url": "[https://cdn.qb1tycinema.com/general/uuid-img1.webp](https://cdn.qb1tycinema.com/general/uuid-img1.webp)"
          }
      ],
      "errors": [
          {
              "fileName": "document.pdf",
              "reason": "Разрешены только изображения форматов: JPG, JPEG, PNG, WEBP, GIF"
          }
      ]
  }
  ```

### 3. Удаление файла
**DELETE** `/`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
      "key": "avatars/123e4567-e89b-12d3-a456-426614174000-image.webp"
  }
  ```
- **Response (200 OK):** `true` (Удаляет файл из S3 и инвалидирует кэш CloudFront по этому пути).

---

## 🛠 Технологический стек

- **Backend:** NestJS, TypeScript, Node.js (Stream API)
- **RPC:** gRPC, Protobuf, RxJS (Observables, ReplaySubject)
- **Storage & CDN:** AWS S3 (`@aws-sdk/client-s3`), AWS CloudFront (`@aws-sdk/client-cloudfront`)
- **Image Processing:** Sharp (libvips)
- **Validation:** class-validator, Multer

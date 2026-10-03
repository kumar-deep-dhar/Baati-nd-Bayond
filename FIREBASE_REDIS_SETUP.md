# Firebase + Redis setup

## 1. Firebase

1. Create a Firebase project and register a Web app.
2. Enable **Authentication > Email/Password** and optionally Google sign-in.
3. Create a Firestore database.
4. Copy the Web app values into a local `.env` file using `.env.example`.

The browser uses Firebase for:

- customer authentication
- product records in the `products` collection
- order records in the `orders` collection
- wishlist records in the `wishlists` collection

For an initial prototype, use these Firestore rules and tighten them before launch:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /orders/{orderId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /wishlists/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 2. Redis

Install Redis locally or create a managed Redis database, then set:

```text
REDIS_URL=redis://localhost:6379
```

The Express API keeps product snapshots in Redis for five minutes. Redis credentials stay server-side; the browser only calls `/api/cache/products`.

## 3. Run

```bash
npm run dev:full
```

This starts Vite on `http://localhost:5173` and the API on `http://localhost:3001`. Check the connection at `/api/health`.

Without Firebase or Redis environment variables, the application continues to use its local prototype storage.

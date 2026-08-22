# Stellar Secret — Zero-Knowledge Secret Sharing

Stellar Secret is a one-time, end-to-end encrypted secret sharing system designed for people who actually care about privacy. No tracking, no recovery, no server-side decryption. If you lose the link, the secret is gone forever — exactly as a true zero-knowledge system should work.

This project includes:

- The **Stellar Secret UI App** (Angular + Ionic)
- The **Stellar Secret UI API** (Laravel)
- The **Stellar Secret Base API** (Laravel)
- A strict zero-knowledge architecture
- Optional password protection
- Burn-after-view and automatic expiration

---

## 🔗 Repositories

Stellar Secret consists of multiple components:

- **UI API (Laravel)**  
  Handles UI-facing API requests (validation, expiry logic, file metadata, etc.):  
  `https://github.com/StellerSecurity/Stellar.Secret.UI.APIApp`

- **Base API (Laravel)**  
  Minimal, zero-knowledge backend that stores only encrypted payloads and metadata:  
  `https://github.com/StellerSecurity/Stellar.Secret.API`

- **Web App (Angular/Ionic)**  
  The Stellar Secret web client, responsible for all client-side encryption, decryption, and link generation.  
  Live at: `https://stellarsecret.io/`

---

## 📱 Live App

Stellar Secret is available here:

- **Web:**  
  `https://stellarsecret.io/`

- **Google Play Store:**  
  Available as a mobile app for Android (Stellar Secret). Search for *“Stellar Secret”* in Google Play to download the official app.

All clients follow the same zero-knowledge principles: encryption and decryption always happen on the device, never on the server.

---

## 🔐 How Stellar Secret Works

### 1. The link *is* the decryption key

Every secret generates a UUID, for example:

```text
https://stellarsecret.io/2f141e70-e558-4f2f-a0d0-90114e404404
```

The final part:

```text
2f141e70-e558-4f2f-a0d0-90114e404404
```

is the **AES key** used to encrypt and decrypt the secret.

The backend only receives **SHA-512(UUID)** as the ID.

- If you lose the link, you lose the key.
- If you lose the key, the secret is gone forever.

No recovery. No backdoor. No “forgot password” button.

This is not a limitation. It is the security model.

---

## 🔑 True End-to-End Encryption

All encryption happens **locally** on the client:

- AES-256 encryption using CryptoJS
- The server never sees the key (UUID or password)
- Only ciphertext is stored in the database and file storage
- Optional attached file is encrypted with the same key

Even with full access to the database and storage, the contents remain unreadable.

---

## 🔏 Optional Password Protection

Users can optionally add a password when creating a secret.

If a password is set:

- The password becomes the encryption key instead of the UUID
- The server receives **only** a boolean flag: `has_password = true`
- No password hashes, verifiers, salts, or derivations are sent or stored
- Decryption is only possible with:
    - the secret link, and
    - the correct password

If you forget the password, the secret cannot be recovered.

---

## 🔥 Automatic Destruction

Secrets support:

- Burn-after-view behaviour
- Configurable expiration (in hours)
- Backend cleanup via scheduled jobs (e.g. Azure Functions / cron)

Once a secret is opened and/or expired, it is removed permanently from the backend.

---

## 🧱 Zero-Knowledge Data Model

The server stores only:

```text
id           = SHA512(uuid)
message      = AES ciphertext
files        = AES ciphertext (optional)
expires_at   = timestamp
has_password = boolean
```

There is:

- No plaintext
- No encryption keys
- No password hashes
- No user accounts
- No IP-based identity mapping

The backend cannot decrypt or reconstruct any secret.

---

## 📦 Tech Stack

### Frontend

- Angular
- Ionic
- CryptoJS (AES-256)
- UUIDv4
- Client-side only encryption/decryption

### Backend (UI API + Base API)

- Laravel
- Azure Storage (for encrypted file blobs)
- No user sessions / accounts required
- No logging of sensitive data or decrypted content

---

## 🚀 Features

- One-time secret links
- Full end-to-end encryption
- Optional password protection
- File attachment support (single file per secret)
- Burn-after-view
- Automatic expiration
- Zero-knowledge backend
- Open-source and auditable

---

## 📄 Example Create Flow

1. User writes a message and/or attaches a file.
2. Client generates a UUID (`secret_id`).
3. Client uses:
    - `secret_id` as the AES key, **or**
    - a user-defined password as the AES key.
4. Client encrypts message and file content locally.
5. Client sends to backend:
    - `id = sha512(secret_id)`
    - `message = ciphertext`
    - `files = ciphertext (optional)`
    - `expires_at`
    - `has_password` (true/false)
6. Backend stores encrypted data and returns success.
7. Client shows the final link with the raw UUID part.

---

## 📄 Example View Flow

1. User opens a Stellar Secret link in the browser or app.
2. Client extracts the UUID from the URL.
3. Client calls backend with `sha512(uuid)` to fetch the encrypted secret.
4. If `has_password = false`:
    - Client decrypts with UUID directly.
5. If `has_password = true`:
    - Client prompts for password.
    - Client decrypts locally using the provided password.
6. Backend deletes the secret after it is opened / expired.

At no point can the server decrypt or inspect the contents.

---

## 🛡 Security Guarantees

### Defends Against

- Server compromise
- Database leaks
- File storage extraction
- Network interception (MITM)
- Insider access on the backend
- Legal data requests (no readable content stored)
- Offline password cracking via stored hashes (none exist)

### Does Not Defend Against

- Sharing the link with the wrong person
- Someone reading your screen
- Losing the link or forgetting the password

There is no recovery mechanism by design.

---

## 🧩 Installation

### Frontend

```bash
nvm use 24
npm install
npm start
```

For a production/SSR build:

```bash
npm run build
npm run serve:ssr
```

After the first successful install, commit the generated `package-lock.json` and use `npm ci` in reproducible builds.

### Backend (UI API / Base API)

```bash
composer install
php artisan migrate
php artisan serve
```

You can deploy the Laravel APIs on any PHP-capable environment (Azure, VPS, container, etc.) and point the UI app to those endpoints.

---

## 📜 License

Stellar Secret is released under the MIT License.  
Privacy should be transparent, auditable, and accessible to everyone.
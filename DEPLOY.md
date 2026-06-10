# راهنمای استقرار روی لیارا

## پیش‌نیاز (یک‌بار)

1. **Node.js** نصب باشد
2. **Liara CLI** نصب باشد:
   ```powershell
   npm install -g @liara/cli
   liara login
   ```

---

## استقرار نسخه جدید

از ریشه پروژه:

```powershell
npm run deploy:liara
```

همین. حدود ۱ تا ۳ دقیقه طول می‌کشد.

**آدرس سایت:** https://jamejahani-shad.liara.run

---

## این دستور چه کار می‌کند؟

1. لوکال build می‌گیرد (فرانت + سرور)
2. پوشه `deploy/` را آماده می‌کند
3. روی لیارا آپلود می‌کند (build در **ایران**)

> پکیج‌ها روی سرور لیارا نصب نمی‌شوند — همه‌چیز از قبل لوکال آماده شده.

---

## توسعه لوکال

```powershell
npm install
npm run dev
```

مرورگر: http://localhost:3000

---

## متغیرهای محیطی (پنل لیارا)

برنامه → `jamejahani-shad` → **متغیرها**

| متغیر | الزامی | توضیح |
|--------|--------|--------|
| `SHAD_LANDING_ID` | برای شاد | شناسه لندینگ |
| `SHAD_USERNAME` | برای شاد | نام کاربری |
| `SHAD_PASSWORD` | برای شاد | رمز عبور |
| `DATABASE_URL` | خیر | اتصال PostgreSQL (شبکه خصوصی لیارا) |
| `DATABASE_SSL` | خیر | فقط برای اتصال عمومی: `true` — شبکه خصوصی لیارا نیاز ندارد |

متغیرها با deploy عوض نمی‌شوند — یک‌بار در پنل کافی است.

### اتصال PostgreSQL (لیارا)

1. دیتابیس و برنامه در **یک شبکه خصوصی**
2. در متغیرهای برنامه: `DATABASE_URL=postgresql://root:PASSWORD@شناسه-db:5432/postgres`
3. **SSL لازم نیست** — شبکه خصوصی لیارا بدون SSL کار می‌کند
4. ری‌استارت یا `npm run deploy:liara`
5. در لاگ باید ببینید: `❇️ PostgreSQL initialization completed.`

جدول داده: `participants` — چک در pgAdmin:
```sql
SELECT * FROM participants;
```

---

## ذخیره داده‌ها

- **دیسک:** `jam-data` → مسیر `/app/data`
- **فایل داده:** `/app/data/participants.json`
- داده‌ها بعد از deploy **حفظ می‌شوند**

دیدن داده از API:
```
https://jamejahani-shad.liara.run/api/participants
```

---

## عیب‌یابی

| مشکل | راه‌حل |
|------|--------|
| build گیر کرد | deploy قدیمی «معلق» را در پنل **لغو** کنید |
| `liara` پیدا نشد | `npx liara deploy --path=deploy --app=jamejahani-shad` |
| سایت بالا نمی‌آید | پنل → لاگ برنامه را ببینید |

---

## دستورات مفید

```powershell
npm run deploy:prepare   # فقط آماده‌سازی deploy/ بدون آپلود
liara app logs --app=jamejahani-shad   # دیدن لاگ سرور
```

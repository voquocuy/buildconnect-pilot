# Deploy BuildConnect Pilot

## 1. Dieu quan trong can hieu

ChatGPT Plus giup ban dung ChatGPT tot hon, nhung khong phai la hosting.

De website co link cong khai cho nguoi khac truy cap, can them mot noi chay website:

- Render, Railway, Fly.io hoac VPS.
- Neu chay ban tinh thi co the dung Vercel/Netlify, nhung ban Pilot nay co backend va luu du lieu nen nen dung hosting Node.js.

## 2. Ban Pilot hien tai gom gi

```text
server.js              Backend Node.js
public/                Giao dien website
data/db.json           Database Pilot dang JSON
package.json           Cau hinh chay npm start
render.yaml            Goi y cau hinh deploy tren Render
```

## 3. Cach chay local

Trong thu muc `buildconnect-pilot`, chay:

```text
npm start
```

Sau do mo:

```text
http://127.0.0.1:4180/
```

## 4. Cach deploy de co link online

Huong don de lam voi Render:

1. Tao tai khoan Render.
2. Tao GitHub repository cho source code BuildConnect Pilot.
3. Day thu muc `buildconnect-pilot` len GitHub.
4. Vao Render, chon `New Web Service`.
5. Ket noi repository vua tao.
6. Cau hinh:

```text
Environment: Node
Build Command: de trong hoac npm install
Start Command: npm start
```

7. Tao bien moi truong:

```text
DB_PATH=/var/data/db.json
NODE_ENV=production
```

8. Neu Render cho gan disk/persistent storage, gan:

```text
Mount path: /var/data
Size: 1GB
```

9. Deploy.
10. Render se cap link dang:

```text
https://buildconnect-pilot.onrender.com
```

## 5. Luu y ve du lieu

Ban Pilot hien tai luu data vao file JSON. Khi deploy online, bat buoc can noi luu du lieu ben vung.

Tam chap nhan cho Pilot nho:

- Persistent disk tren hosting.

Nen nang cap truoc khi dung that:

- PostgreSQL hoac Supabase.
- Dang nhap bao mat that.
- Backup tu dong.

## 6. Tai khoan demo

```text
Super Admin
admin@buildconnect.vn
admin123
```

```text
Admin van hanh
operator@buildconnect.vn
operator123
```

```text
Doanh nghiep demo
company@example.com
company123
```

```text
Ung vien demo
candidate@example.com
candidate123
```

## 7. Buoc tiep theo tot nhat

Neu muc tieu la cho nguoi that dung thu, nen lam theo thu tu:

1. Dua source code len GitHub.
2. Deploy len Render/Railway.
3. Test link online.
4. Gan ten mien khi dang ky xong.
5. Chuyen database sang Supabase/PostgreSQL truoc khi mo rong.

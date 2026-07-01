# Huong Dan Chay Thu BuildConnect Pilot

## 1. Link mo thu

Mo tren trinh duyet:

```text
http://127.0.0.1:4180/
```

Day la ban Pilot local, co backend va database dang file JSON.

## 2. Tai khoan demo

```text
Super Admin
Email: admin@buildconnect.vn
Mat khau: admin123
Quyen: xac nhan thanh toan, duyet/tat ca thao tac quan tri
```

```text
Admin van hanh
Email: operator@buildconnect.vn
Mat khau: operator123
Quyen: duyet hoac tu choi tin, khong xac nhan thanh toan
```

```text
Doanh nghiep demo
Email: company@example.com
Mat khau: company123
Quyen: xem luong doanh nghiep o muc demo
```

```text
Ung vien demo
Email: candidate@example.com
Mat khau: candidate123
Quyen: tao ho so, ung tuyen demo
```

## 3. Luong chay thu dang tin

1. Mo trang `http://127.0.0.1:4180/`.
2. Dang nhap demo bang `Super Admin`.
3. Vao muc `Dang yeu cau`.
4. Nhap thong tin doanh nghiep va vi tri tuyen dung.
5. Chon goi phi theo bai dang.
6. Tick dong y cam ket dich vu / hop dong dien tu Pilot.
7. Bam `Tao ma thanh toan`.
8. He thong sinh ma dang `PAY-2026-00000x`.
9. Vao muc `Admin/CRM`.
10. Bam `Xac nhan` o giao dich vua tao.
11. Tin chuyen sang `Cho duyet`.
12. Bam `Duyet`.
13. Tin hien thi o muc `Viec lam dang tuyen`.

## 4. Luong thanh toan Pilot

Giai doan Pilot dung xac nhan thu cong:

- Khach hang chuyen khoan dung noi dung ma thanh toan.
- Super Admin kiem tra app ngan hang.
- Super Admin bam `Xac nhan` trong CRM.
- Sau do admin duyet noi dung tin.

Thong tin tam:

```text
Hotline: 090 123 4567
Tai khoan: BUILDCONNECT PILOT - 0123456789
```

## 5. File database

Du lieu duoc luu tai:

```text
data/db.json
```

Trong ban Pilot nay, moi thao tac tao ho so, tao tin, xac nhan thanh toan va duyet tin se ghi vao file nay.

## 6. Luu y quan trong

Ban nay dung de chay Pilot noi bo va hieu luong van hanh. Chua phai ban production cong khai.

Truoc khi dua len internet can bo sung:

- Dang nhap bao mat that.
- Database cloud nhu Supabase/PostgreSQL.
- Phan quyen chat hon.
- Backup du lieu.
- Domain va SSL.
- Chinh sach bao mat va dieu khoan su dung ban chinh thuc.
- Tich hop thanh toan/webhook neu can tu dong hoa.

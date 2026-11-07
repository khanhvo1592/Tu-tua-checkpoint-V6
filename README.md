# Tự tua checkpoint V6

Userscript Tampermonkey dành cho Bình dân học vụ số: phát 2–4 giây, tua 8–15 giây, chờ câu hỏi checkpoint rồi tiếp tục.

## Tệp chính

- `outputs/tu-tua-checkpoint-V6.user.js`: bản cài trong Tampermonkey.
- `outputs/huong-dan-tu-tua-checkpoint-V6.html`: hướng dẫn Windows/Mac, ảnh và mã script nhúng.
- `outputs/tu-tua-checkpoint-V6.js`: bản Console gốc.
- `work/`: script tạo file và kiểm tra mô phỏng.

## Cập nhật

Sửa bản userscript hoặc script tạo file theo nhu cầu. Sau khi thay userscript, chạy `python3 work/make-guide.py` để nhúng bản mới vào hướng dẫn.

Chạy lại `python3 work/build_userscript.py` sẽ tạo lại userscript từ bản Console gốc; các thay đổi trực tiếp vào userscript cần đưa vào trình tạo trước khi chạy lại.

## Kiểm tra

```sh
node --check outputs/tu-tua-checkpoint-V6.user.js
node work/test-userscript.cjs
```

## Yêu cầu nội dung hướng dẫn

Hỗ trợ Windows và Mac. Không thêm lại footer Zalo hỗ trợ cài đặt. Không thêm lại hai đoạn trạng thái kiểm tra đã được người dùng yêu cầu xóa.

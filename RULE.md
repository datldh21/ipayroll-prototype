Từ việc đối chiếu dữ liệu bảng tính thực tế trong "iPayroll_ Demo bảng lương" và các mô tả logic nghiệp vụ của chị Hiền, dưới đây là thống kê chi tiết toàn bộ công thức và luồng xử lý số liệu. Bạn có thể dùng tài liệu này làm logic đầu vào (Business Logic/Formulas) cho phần đặc tả phần mềm iPayroll.

**1. NHÓM TÍNH TOÁN THU NHẬP THEO NGÀY CÔNG (PRORATED SALARY)**
Hệ thống chia làm hai giai đoạn hưởng lương (Thử việc và Chính thức) để tính toán dựa trên số ngày công thực tế đi làm.

* **Công chuẩn:** Là mốc ngày công quy định trong tháng (Trong bảng demo T2/2026 đang lấy mốc là 20 ngày).
* **Gói thu nhập theo hợp đồng (Gross Package):** Gồm Lương cơ bản, Trợ cấp ăn trưa, Hỗ trợ điện thoại, Thưởng hiệu quả CV và các khoản trợ cấp khác.
* **Công thức tính thu nhập thực tế theo ngày công:**
  * **Khoản thu nhập thực tế** = `(Khoản thu nhập trong gói HĐ / Công chuẩn) * Số ngày công thực tế`.
  * *Lưu ý:* Áp dụng công thức này cho từng khoản nhỏ (Lương CB, Ăn trưa, Điện thoại...) để ra con số thực tế, sau đó **Cộng** các khoản này lại thành "Thu nhập theo ngày công trong tháng" (chia rõ cho cột Thử việc và cột Chính thức).

**2. NHÓM THU NHẬP KHÁC VÀ TỔNG THU NHẬP (GROSS INCOME)**

* **Thu nhập khác:** Bằng tổng các khoản được nhập tay bổ sung vào cuối tháng bao gồm: Hoa hồng + Thưởng khác + Thu nhập khác (ví dụ: hỗ trợ L&D) + Trợ cấp khác (ví dụ: OT, đi lại).
* **Tổng thu nhập (Lương Gross):**
  * **Công thức:** `(Cộng Thu nhập theo ngày công thử việc) + (Cộng Thu nhập theo ngày công chính thức) + (Cộng Thu nhập khác)`.

**3. NHÓM XÁC ĐỊNH THU NHẬP CHỊU THUẾ**

* **Thu nhập chịu thuế:** Là phần thu nhập dùng làm căn cứ để tính toán trước khi áp dụng các khoản giảm trừ.
  * **Công thức:** `Tổng thu nhập - Trợ cấp ăn trưa (thực tế) - Hỗ trợ điện thoại (thực tế)`. Hai khoản trợ cấp hai vùng này được cấu hình là không phải chịu thuế.

**4. NHÓM TÍNH TOÁN KHẤU TRỪ BẢO HIỂM VÀ GIẢM TRỪ**

* **Mức đóng Bảo hiểm xã hội (Căn cứ đóng):** Được quy định cụ thể theo từng nhân sự, thông thường bằng 50% Gói thu nhập (Lương cơ bản).
* **BH bắt buộc trừ lương (Phần nhân viên đóng - 10.5%):**
  * **BHXH (8%):** `Mức đóng BHXH * 8%`.
  * **BHYT (1.5%):** `Mức đóng BHXH * 1.5%`.
  * **BHTN (1%):** `Mức đóng BHXH * 1%`.
  * **Cộng (10.5%):** Tổng 3 khoản trên. *Ngoại lệ: Trường hợp trạng thái là "Thai sản" thì các khoản BHXH này tự động bằng 0 (không đóng)*.
* **Các khoản Giảm trừ gia cảnh (Áp dụng cho đối tượng tính thuế lũy tiến):**
  * **Giảm trừ bản thân:** Mức quy định trên hệ thống demo là `15.500.000 VNĐ`.
  * **Giảm trừ Người phụ thuộc (NPT):** `Số lượng NPT * 6.200.000 VNĐ` (Số lượng NPT được lấy từ tab thông tin NPT).

**5. NHÓM TÍNH TOÁN THUẾ TNCN**
Hệ thống tự động phân loại biểu thuế (LT hoặc 10%) dựa vào trạng thái nhân viên:

* **Trường hợp 1: Thuế Lũy tiến (Trạng thái Chính thức, Thai sản, Hết thử việc trong tháng)**.
  * **Thu nhập tính thuế:** `Thu nhập chịu thuế - Các khoản giảm trừ (Cộng BH bắt buộc 10.5% + Giảm trừ bản thân + Giảm trừ NPT)`. Nếu kết quả < 0 thì hệ thống mặc định bằng 0.
  * **Thuế TNCN final:** Lấy `Thu nhập tính thuế` áp dụng theo công thức bậc thang lũy tiến tiêu chuẩn.
* **Trường hợp 2: Thuế 10% (Trạng thái Thử việc, Nghỉ việc chính thức, Nghỉ việc thử việc)**.
  * **Thu nhập tính thuế:** Bằng chính `Thu nhập chịu thuế` (Tuyệt đối không trừ khoản giảm trừ gia cảnh hay bảo hiểm).
  * **Thuế TNCN final:** `Thu nhập tính thuế * 10%`.

**6. NHÓM KHẤU TRỪ THỰC TẾ VÀ LƯƠNG THỰC LĨNH (NET PAY)**

* **Khoản trừ vào lương (Cộng khấu trừ):**
  * **Công thức:** `Thuế TNCN final + BH bắt buộc trừ lương (10.5%) + Truy thu sau thuế (nhập tay)`.
  * *Đặc biệt lưu ý:* **Đoàn phí (2% Mức đóng BHXH)** được hiển thị trên bảng lương cho mục đích hợp lý hóa số liệu với cơ quan nhà nước, nhưng **KHÔNG ĐƯỢC CỘNG** vào tổng tiền khấu trừ của người lao động vì công ty đã đóng thay.
* **Cộng thêm sau thuế:** Nhập tay trong các trường hợp đền bù hoặc trả thiếu lương tháng trước.
* **Thực lĩnh (Net Salary):**
  * **Công thức:** `Tổng thu nhập - Khoản trừ vào lương + Cộng thêm sau thuế`.

**7. NHÓM TÍNH TOÁN CHI PHÍ CÔNG TY TRẢ (EMPLOYER COSTS)**
Đây là nhóm số liệu không hiển thị trên phiếu lương nhân viên nhưng cần tính trên bảng lương tổng để làm dữ liệu tài chính cho công ty:

* **Tổng chi phí công ty chi trả:** Bao gồm tiền Lương Thực Lĩnh cộng với các chi phí BHXH ngoài lương công ty phải đóng.
* **Chi phí BH bắt buộc công ty đóng (21.5%):**
  * **BHXH (17.5%):** `Mức đóng BHXH * 17.5%`.
  * **BHYT (3%):** `Mức đóng BHXH * 3%`.
  * **BHTN (1%):** `Mức đóng BHXH * 1%`.
* **Đoàn phí công ty đóng:** `Mức đóng BHXH * 2%`.

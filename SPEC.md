**TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SPEC) DÀNH CHO BẢN MẪU (PROTOTYPE) HỆ THỐNG IPAYROLL**

**1. TỔNG QUAN HỆ THỐNG**
Hệ thống tính lương nội bộ (iPayroll) dùng để tự động hóa quá trình tổng hợp dữ liệu, tính toán lương gross sang net, khấu trừ thuế/bảo hiểm và tự động xuất/gửi phiếu lương cho nhân viên qua email.

**2. CÁC THỰC THỂ DỮ LIỆU ĐẦU VÀO (INPUT ENTITIES)**

**2.1. Dữ liệu Chấm công (Timekeeping - iCheck)**
Được import hoặc đồng bộ hàng tháng, bao gồm:

* **Công chuẩn:** Số ngày làm việc quy định trong tháng (thường trừ thứ 7, chủ nhật).
* **Công thực tế:** Số ngày nhân viên thực tế đi làm.
* **Phép dư:** Số ngày phép còn lại, dùng để tính toán khi nghỉ việc hoặc hết phép, tính bằng 1 ngày công bình thường.
* **Nghỉ không lương:** Số ngày nghỉ không được trả lương.

**2.2. Dữ liệu Nhân sự (Employee Profile - HRIS)**
Chứa các thông tin cá nhân và hợp đồng cơ bản:

* **Trạng thái nhân viên (Cực kỳ quan trọng để rẽ nhánh logic):** Cần phân loại chi tiết thành: Chính thức, Thai sản, Nghỉ việc chính thức, Hết thử việc trong tháng, Thử việc, Nghỉ việc thử việc.
* **Ngày tháng hợp đồng:** Ngày onboard (bắt đầu thử việc), Ngày chính thức, Ngày làm việc cuối cùng/Ngày nghỉ việc.
* **Thông tin cá nhân:** Email, Thông tin tài khoản ngân hàng, Nhóm vị trí, Level.
* **Người phụ thuộc:** Điền tay hoặc lấy từ HRIS (hiện tại chỉ cần lấy số lượng người phụ thuộc).

**2.3. Dữ liệu Lương cơ bản & Thu nhập**

* **Mức lương:** Được chốt mốc vào ngày đầu tháng nếu có thay đổi trong tháng.
* **Khoản thu nhập nhập tay (Variable Incomes):** Hoa hồng, Thường khác (thưởng lễ tết, thâm niên), Thu nhập khác (Hỗ trợ từ L&D), Trợ cấp khác (OT, đi lại).

**2.4. Phân hệ Bảo hiểm xã hội (Social Insurance - SI Module)**
*Lưu ý: Yêu cầu tạo một module/bảng tách biệt riêng cho BHXH, sau đó dùng hàm mapping (tương tự VLOOKUP) để kéo dữ liệu sang bảng lương chính.*

* **Mức đóng bảo hiểm (Căn cứ đóng):** Mặc định là 50% Tổng thu nhập (Lương cơ bản), mức tối thiểu là 5.310.000 VNĐ.
* **Quy tắc mốc thời gian (Rule 15th):** Nhân viên pass thử việc trước ngày 15 -> Đóng BHXH trong tháng; Sau ngày 15 -> Tháng sau mới bắt đầu đóng.
* **Các trường hợp ngoại lệ:**
  * **Thai sản:** Mặc định KHÔNG đóng BHXH tháng đó, nhưng **vẫn phải tính thuế TNCN lũy tiến** như bình thường.
  * **Nghỉ việc trong tháng:** Nghỉ đầu tháng chỉ đóng BHYT, nghỉ cuối tháng đóng toàn bộ BHXH.

**3. QUY TRÌNH XỬ LÝ LÝ VÀ TÍNH TOÁN (PROCESSING LOGIC)**

**Bước 3.1: Tính Tổng thu nhập (Gross Salary)**

* **Công thức:** Lương cơ bản thực tế + Phụ cấp (Ăn trưa, Điện thoại, Đi lại...) + Hoa hồng + Các khoản Thưởng + Thu nhập khác + Trợ cấp khác.

**Bước 3.2: Xác định Thu nhập chịu thuế & Thu nhập tính thuế**

* **Thu nhập chịu thuế** = Tổng thu nhập - Các khoản không tính thuế (Trợ cấp ăn trưa, Hỗ trợ điện thoại, Trợ cấp 2 vùng).
* **Thu nhập tính thuế** = Thu nhập chịu thuế - Các khoản giảm trừ (Gồm: BHXH bắt buộc trừ lương, Giảm trừ bản thân, Giảm trừ người phụ thuộc).

**Bước 3.3: Tính Thuế Thu nhập cá nhân (TNCN)**
Hệ thống cần rẽ nhánh 2 công thức tính thuế dựa vào **Trạng thái nhân viên**:

* **Nhánh 1 (Thuế Lũy tiến):** Áp dụng cho trạng thái *Chính thức*, *Hết thử việc trong tháng*, *Thai sản* (những người tiếp tục đồng hành). Nhóm này được trừ đi phần giảm trừ không tính thuế để ra thu nhập tính thuế rồi mới áp công thức lũy tiến.
* **Nhánh 2 (Thuế 10% Flat rate):** Áp dụng cho trạng thái *Thử việc*, *Nghỉ việc chính thức*, *Nghỉ việc thử việc* (không chắc chắn đồng hành). Nhóm này **không được tính các khoản giảm trừ**, thuế được nhân thẳng 10% trên Tổng thu nhập/Thu nhập chịu thuế.

**Bước 3.4: Tính các khoản Khấu trừ (Deductions)**

* **BHXH trừ vào lương:** Bằng 10.5% của *Mức đóng bảo hiểm xã hội*.
* **Đoàn phí:** Bằng 2% của *Mức đóng bảo hiểm xã hội*. *Lưu ý nghiệp vụ:* Khoản này công ty đóng thay cho nhân viên, tuy nhiên vẫn hiển thị trên bảng lương để hợp lý hóa. Hệ thống cần thực hiện thao tác **trừ đoàn phí đi sau đó lại cộng ngược lại** để số dư thực lĩnh không bị ảnh hưởng.

**Bước 3.5: Các khoản điều chỉnh thủ công (Manual Adjustments)**

* **Truy thu sau thuế (Trừ đi):** Trừ tiền người lao động do tháng trước tính sai lương hoặc đền bù chi phí.
* **Cộng thêm sau thuế (Cộng vào):** Bù tiền lương tháng trước tính thiếu cho nhân viên.

**Bước 3.6: Tính Lương Thực lĩnh (Net Salary)**

* **Công thức:** Tổng thu nhập - Các khoản khấu trừ (Thuế TNCN, BHXH) - Truy thu sau thuế + Cộng thêm sau thuế.

**4. QUY TRÌNH DUYỆT VÀ ĐẦU RA (WORKFLOW & OUTPUT)**

**4.1. Quy trình phê duyệt**

* Cần có tính năng phân quyền: Chuyên viên C&B (chị Hiền) lập bảng lương -> Gửi cho Quản lý (chị Nguyệt / anh Quyết) xem xét và "Chốt/Duyệt" (Approve).

**4.2. Xuất dữ liệu và gửi Email**

* **Tạo phiếu lương (Payslip Generator):** Hệ thống có một mẫu Template (dạng Word rút gọn chỉ chứa mục Thu nhập, Khấu trừ, Thực lĩnh). Hệ thống cần map các trường dữ liệu từ bảng lương tổng vào template này cho từng nhân viên.
* **Tự động gửi mail:** Nút action 1-click tự động gửi hàng loạt phiếu lương cá nhân qua Email (đã khai báo ở mục 2.2) cho toàn bộ nhân viên, thay vì xuất file gửi tay.

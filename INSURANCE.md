Dựa trên dữ liệu từ file ghi âm mô tả quy trình và bảng dữ liệu Excel, các khoản trong mục Bảo hiểm xã hội (BHXH) được quy định chi tiết như sau:

**1. Mức căn cứ đóng Bảo hiểm**

* Mức đóng BHXH mặc định được tính bằng **50% tổng thu nhập** (lương cơ bản) của nhân viên,.
* Trong trường hợp 50% thu nhập thấp hơn mức tối thiểu vùng, hệ thống sẽ mặc định lấy mức tối thiểu là 5.310.000 VNĐ để làm căn cứ đóng.

**2. Tỷ lệ trích đóng Bảo hiểm (Tổng cộng 32%)**
Quỹ bảo hiểm được chia thành 2 phần: phần trừ vào lương của người lao động và phần chi phí do công ty đóng thêm. Cụ thể theo bảng dữ liệu chuẩn:

* **Phần người lao động đóng (Trừ thẳng vào lương thực lĩnh - 10.5%):**
  * Bảo hiểm xã hội (BHXH): 8%
  * Bảo hiểm y tế (BHYT): 1.5%
  * Bảo hiểm thất nghiệp (BHTN): 1%
* **Phần công ty đóng (Chi phí ngoài lương - 21.5%):**
  * Bảo hiểm xã hội (BHXH): 17.5%
  * Bảo hiểm y tế (BHYT): 3%
  * Bảo hiểm thất nghiệp (BHTN): 1%

*(Ngoài ra, có một khoản Đoàn phí bằng 2% mức đóng BHXH, khoản này do công ty đóng hoàn toàn cho nhân viên)*,.

**3. Các quy tắc tính toán đặc biệt (Ngoại lệ)**
Chị Hiền đã thiết lập một số quy tắc để rẽ nhánh việc có đóng bảo hiểm hay không trong từng trường hợp:

* **Quy tắc mốc ngày 15:** Nếu nhân viên qua thời gian thử việc và ký hợp đồng chính thức trước ngày 15 của tháng thì sẽ đóng bảo hiểm luôn trong tháng đó. Nếu chính thức sau ngày 15 thì sang tháng sau mới bắt đầu đóng,.
* **Trường hợp Thai sản:** Mặc định trong tháng thai sản nhân viên **không phải đóng bảo hiểm xã hội** (các khoản tỷ lệ bảo hiểm tự động bằng 0), tuy nhiên trên hệ thống vẫn phải tính thuế TNCN theo mức lũy tiến như bình thường,.
* **Trường hợp Nghỉ việc:** Nếu nhân viên nghỉ việc vào thời điểm đầu tháng thì chỉ phải đóng Bảo hiểm y tế (BHYT). Nếu nhân viên nghỉ việc vào cuối tháng thì sẽ phải đóng toàn bộ các khoản BHXH,.

Chính vì các trường hợp ngoại lệ này khá phức tạp nên nghiệp vụ hiện tại đang phải tạo một file tính Bảo hiểm xã hội riêng biệt, sau đó dùng hàm VLOOKUP để kéo dữ liệu vào bảng lương chính.

Dựa trên nguyên lý thiết kế hệ thống tracking đã phân tích từ bảng dữ liệu, dưới đây là **Tài liệu SPEC Tracking Tiêu chuẩn (Universal Tracking SPEC)** được tổng quát hóa.

Bạn có thể dùng file này làm **System Prompt** hoặc **Base Guidelines** đưa cho AI (ChatGPT, Cursor, Copilot) khi khởi tạo hệ thống tracking cho **bất kỳ dự án nào**, từ E-commerce, SaaS, đến Mobile App.

---

### TÀI LIỆU SPEC: TIÊU CHUẨN THIẾT KẾ HỆ THỐNG EVENT TRACKING (AI READABLE)

**1. Hướng dẫn chung dành cho AI (System Prompt)**

* **Mục tiêu:** Định nghĩa và sinh (generate) code cho hệ thống Event Tracking của dự án tuân thủ nghiêm ngặt các nguyên tắc dưới đây.
* **Naming Convention (Quy tắc đặt tên):** Bắt buộc sử dụng `snake_case` và chữ in thường (lowercase) cho TẤT CẢ Event Name, Params Key, và các giá trị tĩnh (Enum Values).
* **Kiến trúc gom nhóm (Module-based Design):** `Event Name` KHÔNG ĐƯỢC LÀ một hành động cụ thể (VD: ❌ `click_buy_button`). `Event Name` phải là tên của một **Tính năng/Module lớn** (VD: ✅ `checkout`, ✅ `user_profile`, ✅ `system_log`). Mọi hành động chi tiết sẽ được đẩy vào tham số `action_name` bên trong.
* **Data Integrity:** Sử dụng TypeScript Interfaces, Type Union và Enums cho các tập giá trị cố định để tránh rác dữ liệu.

**2. Cấu trúc Tham số Cốt lõi (Base Event Params)**
Mọi sự kiện trong hệ thống (dù thuộc dự án nào) đều bắt buộc phải kế thừa `BaseTrackingParams`.

```typescript
// Các loại hành động cốt lõi của người dùng hoặc hệ thống
type ActionType = 'action' | 'start' | 'end' | 'click_view' | 'system_trigger' | 'search';

// Các trạng thái kết quả chung cho mọi thao tác
type StatusResult = 'success' | 'fail' | 'pending' | 'no_result';

// Tracking sự thay đổi dữ liệu
type StatusChange = 'yes' | 'no';

/**
 * BASE PARAMS: Bắt buộc có trong mọi payload gửi lên server
 */
interface BaseTrackingParams {
  feature: string;        // Tên Module lớn (VD: 'auth', 'payment', 'cart', 'ui_track').
  action_type?: ActionType; // Phân loại hành động.
  action_name: string;    // Hành động cụ thể: Cú pháp [verb]_[object] (VD: 'add_to_cart', 'confirm_payment').
  u_id: string;           // Định danh người dùng (User ID, Email, UUID...).
  version?: string;       // Phiên bản Web/App hiện tại.
  placement?: string;     // Vị trí UI nơi thao tác diễn ra (VD: 'homepage', 'header_nav').
}
```

**3. Quy tắc mở rộng Tham số cho từng Module (Module-Specific Extension)**
AI khi viết code cho một tính năng mới phải định nghĩa Interface riêng kế thừa từ `BaseTrackingParams`. Các tham số bổ sung phải tuân thủ quy tắc:

* **ID:** `[đối tượng]_id` (VD: `order_id`, `product_id`).
* **Đặc tính:** `[đối tượng]_[thuộc tính]` (VD: `product_name`, `order_total_value`).
* **Lý do/Kết quả:** `status_result`, `fail_reason`, `error_code`.

*Ví dụ minh họa cho AI cách định nghĩa 2 module tiêu biểu (Thương mại điện tử & Lỗi hệ thống):*

```typescript
// --- VÍ DỤ MODULE 1: GIAO DỊCH / THANH TOÁN ---
type CheckoutAction = 
  | 'start_checkout' | 'select_payment_method' | 'apply_voucher' 
  | 'confirm_checkout' | 'cancel_checkout' | 'checkout_success';

interface CheckoutEventParams extends BaseTrackingParams {
  feature: 'checkout';
  action_name: CheckoutAction;
  
  // Contextual Params (Dữ liệu động theo nghiệp vụ)
  order_id?: string;
  total_amount?: number;
  currency?: string;
  payment_method?: 'credit_card' | 'cod' | 'e_wallet';
  voucher_code?: string;
  
  // Tracking kết quả của hành động
  status_result?: StatusResult;
  fail_reason?: string;
}

// --- VÍ DỤ MODULE 2: SYSTEM LOGGING (Mọi dự án đều cần) ---
interface LogBugParams extends BaseTrackingParams {
  feature: 'log_bug'; // Theo chuẩn tên event của hệ thống logs.
  action_name: 'system_error' | 'api_timeout' | 'crash';
  
  // System Params
  error_type?: string;     // VD: 'Network Error', 'Syntax Error'.
  error_code?: string;     // VD: '404', '500'.
  end_point?: string;      // API endpoint gây lỗi.
  logs_message?: string;   // Chi tiết lỗi.
  device_info?: string;    // Bổ sung cho Mobile/Web
}
```

**4. Hướng dẫn AI triển khai Code (Implementation Guide)**
AI cần tạo ra một `Core Function` để giao tiếp với SDK (Mixpanel, Google Analytics, Amplitude...) và các `Wrapper Functions` cho từng tính năng để Dev gọi ra sử dụng dễ dàng.

```typescript
/**
 * Core Dispatcher: Gửi dữ liệu lên Tracking Provider
 */
function dispatchEvent(eventName: string, payload: BaseTrackingParams) {
  // AI lưu ý: eventName chính là giá trị của payload.feature
  // Ví dụ: analyticsProvider.track(eventName, payload);
  console.log(`[Track] ${eventName}`, payload);
}

/**
 * Tracking Service: AI tạo các Wrapper Functions dựa trên Interfaces đã định nghĩa
 */
export const TrackingService = {
  // Wrapper cho Module Thanh toán
  trackCheckout: (
    action: CheckoutAction, 
    payload: Omit<CheckoutEventParams, 'feature' | 'action_name' | 'action_type'>
  ) => {
    dispatchEvent('checkout', {
      feature: 'checkout',
      action_type: 'action',
      action_name: action,
      ...payload
    });
  },

  // Wrapper cho System Bugs
  trackSystemBug: (
    action: LogBugParams['action_name'],
    payload: Omit<LogBugParams, 'feature' | 'action_name' | 'action_type'>
  ) => {
    dispatchEvent('log_bug', {
      feature: 'log_bug',
      action_type: 'system_trigger',
      action_name: action,
      ...payload
    });
  }
};
```

**5. Luồng xử lý cho Dev (Development Workflow đưa cho AI)**
Khi nhận yêu cầu: *"Hãy thêm tracking cho tính năng Quản lý User"*. AI sẽ thực hiện 3 bước:

1. Định nghĩa `UserModuleAction` union type (chứa các verb như `add_user`, `delete_user`).
2. Định nghĩa `UserEventParams` kế thừa `BaseTrackingParams`.
3. Viết thêm hàm `trackUser` vào `TrackingService`.

---
**Cách sử dụng file SPEC này:**
Bạn chỉ cần đưa file markdown này cho AI và ra lệnh: *"Dựa vào tài liệu SPEC kiến trúc tracking này, hãy viết cho tôi bộ tracking cho tính năng [Tên_Tính_Năng_Của_Bạn] của dự án [Tên_Dự_Án]"*. AI sẽ tự động hiểu cách đóng gói Event, thiết lập Base Params và sinh code chuẩn xác.

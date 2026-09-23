import { Link } from 'react-router-dom';

export function PrivacyFooter() {
  return (
    <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 py-3">
      <div className="space-y-1 text-center">
        <p className="desktop-only text-[10px] text-gray-500">
          UStudy là công cụ cá nhân, không đại diện cho Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM hay bất kỳ đơn vị trực thuộc nào. Dữ liệu được lưu tại Local Storage và sẽ xóa khi Đăng xuất.
        </p>
        <p className="text-[10px] text-gray-500">
          Copyright © 2026 Unopia. All rights reserved.
        </p>
        {/* <nav className="flex items-center justify-center gap-3 text-[10px]" aria-label="Liên kết thông tin">
          <Link className="font-medium text-[#0056A6] hover:underline" to="/guide">Hướng dẫn UStudy</Link>
          <Link className="font-medium text-[#0056A6] hover:underline" to="/privacy">Quyền riêng tư</Link>
        </nav> */}
      </div>
    </div>
  );
}

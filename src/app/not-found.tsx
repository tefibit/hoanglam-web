import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <div className="empty">
        <h1>Không tìm thấy trang</h1>
        <p>Trang bạn tìm không tồn tại hoặc đã được di chuyển.</p>
        <Link href="/" className="primary" style={{ display: "inline-block", marginTop: 16, textDecoration: "none" }}>
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}

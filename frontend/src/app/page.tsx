"use client";

import { useEffect, useState } from "react";
import {
  checkBackendHealth,
  createShortLink,
  updateShortLink,
  deleteShortLink,
  getAllLinks,
  getLinkStats,
  LinkResponse,
  LinkStatsResponse,
  HealthResponse,
} from "@/lib/api";

export default function Home() {
  // Form State: Create
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [campaign, setCampaign] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [bannerAlert, setBannerAlert] = useState<string | null>(null);

  // Links List
  const [links, setLinks] = useState<LinkResponse[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Edit Modal State
  const [editingLink, setEditingLink] = useState<LinkResponse | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editCampaign, setEditCampaign] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Stats Modal State
  const [statsData, setStatsData] = useState<LinkStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Backend Health Status
  const [backendHealth, setBackendHealth] = useState<{
    ok: boolean;
    data?: HealthResponse;
    loading: boolean;
  }>({ ok: false, loading: true });

  const getFrontendShortUrl = (code: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/${code}`;
    }
    return `https://qlink.tvquang.id.vn/${code}`;
  };

  const fetchHealthAndLinks = async () => {
    setBackendHealth((prev) => ({ ...prev, loading: true }));
    const health = await checkBackendHealth();
    setBackendHealth({ ok: health.ok, data: health.data, loading: false });

    if (health.ok) {
      try {
        const linkList = await getAllLinks();
        setLinks(linkList);
      } catch {
        // Backend warming up
      }
    }
  };

  useEffect(() => {
    fetchHealthAndLinks();
    const interval = setInterval(fetchHealthAndLinks, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const notFoundCode = params.get("notfound");
      const error = params.get("error");
      if (notFoundCode) {
        setBannerAlert(`Không tìm thấy hoặc liên kết '${notFoundCode}' đã hết hạn.`);
      } else if (error) {
        setBannerAlert("Đã xảy ra lỗi khi chuyển hướng liên kết.");
      }
    }
  }, []);

  // Handle Create Link
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setCreateLoading(true);
    setFormError(null);

    try {
      const newLink = await createShortLink({
        originalUrl: url.trim(),
        title: title.trim() || undefined,
        campaign: campaign.trim() || undefined,
        customCode: customCode.trim() || undefined,
      });

      setLinks((prev) => [newLink, ...prev]);
      setUrl("");
      setTitle("");
      setCampaign("");
      setCustomCode("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tạo liên kết.";
      setFormError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (link: LinkResponse) => {
    setEditingLink(link);
    setEditUrl(link.originalUrl);
    setEditTitle(link.title || "");
    setEditCampaign(link.campaign || "");
    setEditIsActive(link.isActive);
    setEditError(null);
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink || !editUrl.trim()) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const updated = await updateShortLink(editingLink.code, {
        originalUrl: editUrl.trim(),
        title: editTitle.trim() || undefined,
        campaign: editCampaign.trim() || undefined,
        isActive: editIsActive,
      });

      setLinks((prev) => prev.map((item) => (item.code === updated.code ? updated : item)));
      setEditingLink(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể cập nhật liên kết.";
      setEditError(message);
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Delete Link
  const handleDelete = async (code: string) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa liên kết này không?");
    if (!confirmDelete) return;

    try {
      await deleteShortLink(code);
      setLinks((prev) => prev.filter((item) => item.code !== code));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Xóa liên kết thất bại.";
      alert(message);
    }
  };

  // Open Stats Modal
  const openStatsModal = async (code: string) => {
    setStatsLoading(true);
    setStatsError(null);
    setStatsData(null);

    try {
      const stats = await getLinkStats(code, 7);
      setStatsData(stats);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể tải số liệu thống kê.";
      setStatsError(message);
    } finally {
      setStatsLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, code: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-lg tracking-wider">
              Q
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-slate-900 tracking-tight">QLink</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200">
                  Quản lý & Đo lường
                </span>
              </div>
              <p className="text-xs text-slate-500">Rút gọn liên kết và theo dõi lượt nhấp chuột</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                backendHealth.ok
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  backendHealth.ok ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {backendHealth.loading && !backendHealth.data
                ? "Đang kết nối..."
                : backendHealth.ok
                ? "Máy chủ: Trực tuyến"
                : "Máy chủ: Chưa kết nối"}
            </div>

            <button
              onClick={fetchHealthAndLinks}
              className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition-colors"
            >
              Làm mới
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Intro */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tạo & Quản Lý Liên Kết Rút Gọn
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Rút ngắn đường dẫn, tùy biến tiêu đề chiến dịch và kiểm soát lượt nhấp trong ngày chính xác.
          </p>
        </div>

        {/* Banner Alert (Ví dụ khi redirect mã không tồn tại / hết hạn) */}
        {bannerAlert && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between">
            <div>
              <span className="font-semibold">Thông báo: </span>
              {bannerAlert}
            </div>
            <button
              onClick={() => setBannerAlert(null)}
              className="text-amber-700 hover:text-amber-900 font-bold px-2 py-1 text-xs"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Create Link Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Tạo liên kết mới
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Đường dẫn gốc <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://example.com/duong-dan-dai-can-rut-gon"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Custom Alias / Đuôi tùy chỉnh */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Đuôi link tùy chỉnh (Tùy chọn)
                  </label>
                  <span className="text-[11px] text-slate-400">VD: fb, bio, cv</span>
                </div>
                <div className="flex rounded-lg border border-slate-300 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent overflow-hidden">
                  <span className="inline-flex items-center px-3 bg-slate-100 text-slate-600 text-xs font-mono border-r border-slate-300 select-none">
                    {typeof window !== "undefined" ? `${window.location.host}/` : "qlink.tvquang.id.vn/"}
                  </span>
                  <input
                    type="text"
                    placeholder="fb"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                    maxLength={30}
                    className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 placeholder-slate-400 font-mono focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Nếu để trống, hệ thống sẽ tự sinh chuỗi 7 ký tự ngẫu nhiên.
                </p>
              </div>

              {/* Campaign / Chiến dịch */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Chiến dịch / Nguồn (Tùy chọn)
                  </label>
                  <span className="text-[11px] text-slate-400">UTM / Kênh</span>
                </div>
                <input
                  type="text"
                  placeholder="Ví dụ: facebook, tiktok-bio, newsletter"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Gom nhóm các link theo kênh/chiến dịch để so sánh hiệu quả lượt click.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tiêu đề nhận diện (Tùy chọn)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Trang cá nhân Facebook của Quang"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={createLoading || !url.trim()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow-sm transition"
              >
                {createLoading ? "Đang xử lý..." : "Tạo liên kết rút gọn"}
              </button>
            </div>
          </form>
        </div>

        {/* Links Table / List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Danh sách liên kết</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold font-mono">
                {links.length}
              </span>
            </h2>

            {!backendHealth.ok && (
              <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
                Hãy bật backend API để đồng bộ dữ liệu
              </span>
            )}
          </div>

          {links.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <p className="text-slate-500 text-sm">
                Chưa có liên kết nào. Hãy nhập đường dẫn ở trên để tạo liên kết đầu tiên.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm overflow-hidden">
              {links.map((item) => {
                const shortUrl = getFrontendShortUrl(item.code);
                return (
                  <div
                    key={item.id}
                    className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Left Column: Link Info */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={shortUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-base font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {shortUrl}
                        </a>

                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            item.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {item.isActive ? "Hoạt động" : "Tạm dừng"}
                        </span>

                        {item.campaign && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                            {item.campaign}
                          </span>
                        )}

                        {item.title && (
                          <span className="text-xs text-slate-600 truncate max-w-xs">
                            {item.title}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 truncate font-mono">
                        Gốc: {item.originalUrl}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        Tạo ngày {new Date(item.createdAt).toLocaleDateString("vi-VN")} lúc{" "}
                        {new Date(item.createdAt).toLocaleTimeString("vi-VN")}
                      </div>
                    </div>

                    {/* Right Column: Click Metrics & Actions */}
                    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                      {/* Clicks Today */}
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center min-w-[75px]">
                        <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                          Hôm nay
                        </div>
                        <div className="text-base font-extrabold text-emerald-800 font-mono">
                          {item.clicksToday ?? 0}
                        </div>
                      </div>

                      {/* Total Clicks */}
                      <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-center min-w-[75px]">
                        <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                          Tổng cộng
                        </div>
                        <div className="text-base font-extrabold text-slate-900 font-mono">
                          {item.clickCount}
                        </div>
                      </div>

                      {/* Actions Group */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => copyToClipboard(shortUrl, item.code)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                            copiedCode === item.code
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                          }`}
                        >
                          {copiedCode === item.code ? "Đã chép" : "Sao chép"}
                        </button>

                        <button
                          onClick={() => openEditModal(item)}
                          className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition"
                        >
                          Chỉnh sửa
                        </button>

                        <button
                          onClick={() => openStatsModal(item.code)}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition"
                        >
                          Thống kê
                        </button>

                        <a
                          href={shortUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition"
                        >
                          Mở link
                        </a>

                        <button
                          onClick={() => handleDelete(item.code)}
                          className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Edit Link */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Chỉnh sửa liên kết</h3>
                <span className="font-mono text-xs text-blue-600">{getFrontendShortUrl(editingLink.code)}</span>
              </div>
              <button
                onClick={() => setEditingLink(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Đường dẫn gốc <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Chiến dịch / Nguồn
                </label>
                <input
                  type="text"
                  value={editCampaign}
                  onChange={(e) => setEditCampaign(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="activeCheckbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="activeCheckbox" className="text-sm font-medium text-slate-700">
                  Kích hoạt liên kết (Cho phép chuyển hướng)
                </label>
              </div>

              {editError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="px-4 py-2 text-sm font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Click Stats */}
      {(statsData || statsLoading || statsError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Báo cáo lượt nhấp chuột</h3>
                {statsData && (
                  <span className="font-mono text-xs text-blue-600">{getFrontendShortUrl(statsData.code)}</span>
                )}
              </div>
              <button
                onClick={() => {
                  setStatsData(null);
                  setStatsLoading(false);
                  setStatsError(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                Đóng
              </button>
            </div>

            {statsLoading && (
              <div className="py-12 text-center text-slate-500 text-sm">
                Đang tải dữ liệu phân tích...
              </div>
            )}

            {statsError && (
              <div className="py-8 text-center text-red-600 text-sm">
                {statsError}
              </div>
            )}

            {statsData && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                    <div className="text-xs uppercase font-bold text-emerald-700 tracking-wider">
                      Lượt nhấp hôm nay
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-800 font-mono mt-1">
                      {statsData.clicksToday}
                    </div>
                    <div className="text-[11px] text-emerald-600 mt-0.5">lượt truy cập</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-xs uppercase font-bold text-slate-600 tracking-wider">
                      Tổng toàn thời gian
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
                      {statsData.totalClicks}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">lượt truy cập</div>
                  </div>
                </div>

                {/* 7-day daily breakdown */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                    Tần suất theo ngày (7 ngày gần nhất)
                  </h4>
                  <div className="space-y-2">
                    {statsData.dailyClicks.map((point) => {
                      const maxCount = Math.max(...statsData.dailyClicks.map((d) => d.clicks), 1);
                      const percent = Math.round((point.clicks / maxCount) * 100);

                      return (
                        <div
                          key={point.date}
                          className="flex items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                        >
                          <span className="w-24 font-mono text-slate-600">{point.date}</span>
                          <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="w-12 text-right font-mono font-bold text-slate-800">
                            {point.clicks}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Visits Log */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                    Nhật ký truy cập gần nhất
                  </h4>
                  {statsData.recentClicks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Chưa có lượt nhấp nào được ghi nhận.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {statsData.recentClicks.map((rc, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1 truncate">
                            <span className="text-slate-500">Nguồn: </span>
                            <span className="text-slate-800 font-medium">
                              {rc.referer || "Truy cập trực tiếp"}
                            </span>
                          </div>
                          <span className="text-slate-500 font-mono whitespace-nowrap text-[11px]">
                            {new Date(rc.clickedAt).toLocaleTimeString("vi-VN")}{" "}
                            {new Date(rc.clickedAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

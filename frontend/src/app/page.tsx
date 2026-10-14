"use client";

import { useEffect, useState } from "react";
import {
  checkBackendHealth,
  createShortLink,
  getAllLinks,
  getLinkStats,
  LinkResponse,
  LinkStatsResponse,
  HealthResponse,
} from "@/lib/api";

export default function Home() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [campaign, setCampaign] = useState("");
  const [links, setLinks] = useState<LinkResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Selected link for Stats Modal
  const [selectedStats, setSelectedStats] = useState<LinkStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [backendHealth, setBackendHealth] = useState<{
    ok: boolean;
    data?: HealthResponse;
    loading: boolean;
  }>({ ok: false, loading: true });

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

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const newLink = await createShortLink({
        originalUrl: url.trim(),
        title: title.trim() || undefined,
        campaign: campaign.trim() || undefined,
      });

      setLinks((prev) => [newLink, ...prev]);
      setUrl("");
      setTitle("");
      setCampaign("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tạo link.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, code: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback
    }
  };

  const openStatsModal = async (code: string) => {
    setStatsLoading(true);
    setStatsError(null);
    setSelectedStats(null);

    try {
      const stats = await getLinkStats(code, 7);
      setSelectedStats(stats);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể tải thống kê.";
      setStatsError(message);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header Bar */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-8 border-b border-slate-800/80 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/30 text-white">
              Q
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                QLink
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                  MVP Live
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Link Tracking & Daily Click Analytics • ASP.NET Core 9 + PostgreSQL + Next.js
              </p>
            </div>
          </div>

          {/* Backend Status Badge */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                backendHealth.ok
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                  : "bg-amber-950/40 border-amber-500/30 text-amber-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  backendHealth.ok
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-amber-400"
                }`}
              />
              {backendHealth.loading && !backendHealth.data
                ? "Kiểm tra API..."
                : backendHealth.ok
                ? `C# API Online (:5102)`
                : "C# API Offline (Chưa bật)"}
            </div>

            <button
              onClick={fetchHealthAndLinks}
              title="Làm mới trạng thái kết nối"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors text-xs"
            >
              🔄
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="text-center my-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
            Rút gọn URL & Đo lường Click trong ngày
          </h2>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Tạo link chuyển hướng nhanh chóng, theo dõi chính xác lượt nhấp trong ngày và lịch sử truy cập.
          </p>
        </div>

        {/* Input Form Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/20">
          <form onSubmit={handleShorten} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                URL Gốc Cần Rút Gọn <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  placeholder="https://example.com/very-long-url-path..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-4 py-3.5 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Tiêu Đề (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Link Portfolio 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Chiến Dịch / Campaign (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: facebook-ads, resume"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-sm flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>⚡ Rút Gọn Link</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Links List Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>📋 Danh sách Link đã tạo</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {links.length}
              </span>
            </h3>

            {!backendHealth.ok && (
              <span className="text-xs text-amber-400/90 bg-amber-950/30 px-3 py-1 rounded-md border border-amber-900/40">
                Tip: Chạy <code className="font-mono text-white">docker compose up -d</code> rồi khởi chạy backend!
              </span>
            )}
          </div>

          {links.length === 0 ? (
            <div className="border border-slate-800/80 rounded-2xl p-10 text-center bg-slate-900/20">
              <p className="text-slate-400 text-sm">
                Chưa có liên kết nào. Hãy nhập một URL ở trên để tạo liên kết rút gọn đầu tiên!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-4 sm:p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={item.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-base font-semibold text-indigo-400 hover:text-indigo-300 underline decoration-indigo-500/40 underline-offset-4"
                      >
                        {item.shortUrl}
                      </a>
                      {item.campaign && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {item.campaign}
                        </span>
                      )}
                      {item.title && (
                        <span className="text-xs text-slate-400 truncate max-w-[200px]">
                          • {item.title}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-xl font-mono">
                      ↳ {item.originalUrl}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Tạo lúc {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    {/* Clicks Today Counter (Highlighted per requirement) */}
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-center min-w-[75px]">
                      <div className="text-[11px] text-emerald-400 font-medium">Hôm nay</div>
                      <div className="text-base font-bold text-emerald-300 font-mono">
                        {item.clicksToday ?? 0}
                      </div>
                    </div>

                    {/* Total Clicks counter */}
                    <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-center min-w-[75px]">
                      <div className="text-[11px] text-slate-400">Tổng click</div>
                      <div className="text-base font-bold text-white font-mono">
                        {item.clickCount}
                      </div>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => copyToClipboard(item.shortUrl, item.code)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                        copiedCode === item.code
                          ? "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                          : "bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200"
                      }`}
                    >
                      {copiedCode === item.code ? "✓ Đã chép" : "Sao chép"}
                    </button>

                    {/* View Stats Analytics Modal */}
                    <button
                      onClick={() => openStatsModal(item.code)}
                      className="px-3 py-2 rounded-lg bg-violet-600/20 border border-violet-500/40 hover:bg-violet-600/30 text-violet-300 text-xs font-medium transition-all"
                    >
                      📊 Thống kê
                    </button>

                    {/* Direct redirect test button */}
                    <a
                      href={item.shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium transition-all"
                    >
                      Mở Link ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Detailed Analytics & Daily Clicks */}
        {(selectedStats || statsLoading || statsError) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
              <button
                onClick={() => {
                  setSelectedStats(null);
                  setStatsLoading(false);
                  setStatsError(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 text-xs font-bold"
              >
                ✕ Đóng
              </button>

              {statsLoading && (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
                  <span className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải số liệu thống kê...</span>
                </div>
              )}

              {statsError && (
                <div className="py-8 text-center text-rose-400 text-sm">
                  ⚠️ {statsError}
                </div>
              )}

              {selectedStats && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>📊 Báo Cáo Lượt Click</span>
                      <span className="font-mono text-sm px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        {selectedStats.code}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 truncate">
                      Đích: {selectedStats.originalUrl}
                    </p>
                  </div>

                  {/* Summary metric cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                      <div className="text-xs text-emerald-400 font-medium">Hôm Nay</div>
                      <div className="text-3xl font-extrabold text-emerald-300 font-mono mt-1">
                        {selectedStats.clicksToday}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">lượt truy cập</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                      <div className="text-xs text-slate-400 font-medium">Tổng Toàn Thời Gian</div>
                      <div className="text-3xl font-extrabold text-white font-mono mt-1">
                        {selectedStats.totalClicks}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">lượt truy cập</div>
                    </div>
                  </div>

                  {/* Daily breakdown (7 Days) */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                      Lịch Sử 7 Ngày Qua
                    </h4>
                    <div className="space-y-2">
                      {selectedStats.dailyClicks.map((point) => {
                        const maxCount = Math.max(
                          ...selectedStats.dailyClicks.map((d) => d.clicks),
                          1
                        );
                        const percent = Math.round((point.clicks / maxCount) * 100);

                        return (
                          <div
                            key={point.date}
                            className="flex items-center gap-3 text-xs bg-slate-950/40 p-2 rounded-lg border border-slate-800/60"
                          >
                            <span className="w-24 font-mono text-slate-400">{point.date}</span>
                            <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="w-12 text-right font-mono font-bold text-slate-200">
                              {point.clicks}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Click Events Log */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                      Các Lượt Click Gần Nhất
                    </h4>
                    {selectedStats.recentClicks.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Chưa có lượt click nào được ghi nhận.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {selectedStats.recentClicks.map((rc, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1 truncate">
                              <span className="text-slate-400">Nguồn: </span>
                              <span className="text-slate-200 font-mono">
                                {rc.referer || "Truy cập trực tiếp (Direct)"}
                              </span>
                            </div>
                            <span className="text-slate-400 font-mono whitespace-nowrap">
                              {new Date(rc.clickedAt).toLocaleTimeString("vi-VN")}
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
    </div>
  );
}

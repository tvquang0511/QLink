"use client";

import { useState } from "react";
import { DailyClickPoint } from "@/lib/api";

interface Props {
  data: DailyClickPoint[];
  days: number;
  onDaysChange: (days: number) => void;
  isLoading?: boolean;
}

export default function ClickFrequencyChart({
  data,
  days,
  onDaysChange,
  isLoading = false,
}: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
        Chưa có đủ dữ liệu thống kê cho khoảng thời gian này.
      </div>
    );
  }

  // Dimensions
  const svgWidth = 640;
  const svgHeight = 240;
  const padLeft = 45;
  const padRight = 25;
  const padTop = 30;
  const padBottom = 40;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  const clicksArray = data.map((d) => d.clicks);
  const rawMax = Math.max(...clicksArray, 0);
  // Đảm bảo trục tung tối thiểu là 4 để luôn có các mốc lưới đẹp mắt
  const maxVal = Math.max(rawMax, 4);
  const totalInPeriod = clicksArray.reduce((acc, curr) => acc + curr, 0);
  const peakClicks = rawMax;

  // Tính tọa độ (x, y) cho từng điểm
  const points = data.map((item, index) => {
    const x =
      data.length > 1
        ? padLeft + (index / (data.length - 1)) * chartWidth
        : padLeft + chartWidth / 2;
    const y = padTop + chartHeight - (item.clicks / maxVal) * chartHeight;
    return { x, y, date: item.date, clicks: item.clicks };
  });

  // Đường Path Line
  const linePath = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  // Đường Path Area (phủ mờ bên dưới đường line)
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${
          padTop + chartHeight
        } L ${points[0].x} ${padTop + chartHeight} Z`
      : "";

  // Các mốc lưới ngang (3 mốc: Max, Nửa, 0)
  const yTicks = [
    { value: maxVal, y: padTop },
    { value: Math.round(maxVal / 2), y: padTop + chartHeight / 2 },
    { value: 0, y: padTop + chartHeight },
  ];

  // Format ngày hiển thị trục hoành DD/MM
  const formatShortDate = (isoDate: string) => {
    try {
      const parts = isoDate.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
      return isoDate;
    } catch {
      return isoDate;
    }
  };

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
      {/* Header điều khiển thời gian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Biểu đồ tần suất click theo thời gian
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Tổng lượt click trong kỳ: <span className="font-semibold text-slate-900 font-mono">{totalInPeriod}</span> | Cao nhất: <span className="font-semibold text-blue-700 font-mono">{peakClicks} lượt/ngày</span>
          </p>
        </div>

        {/* Nút lọc ngày */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 self-start sm:self-auto shadow-xs">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDaysChange(d)}
              disabled={isLoading}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                days === d
                  ? "bg-blue-600 text-white shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {d} ngày
            </button>
          ))}
        </div>
      </div>

      {/* Vùng vẽ đồ thị SVG */}
      <div className="relative w-full overflow-hidden bg-white rounded-lg border border-slate-200 p-2 sm:p-3">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10 text-xs text-blue-600 font-medium">
            Đang cập nhật biểu đồ...
          </div>
        )}

        <div className="w-full aspect-[21/9] min-h-[220px]">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full overflow-visible"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Các đường lưới ngang */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={tick.y}
                  x2={padLeft + chartWidth}
                  y2={tick.y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={tick.y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                  fontFamily="monospace"
                >
                  {tick.value}
                </text>
              </g>
            ))}

            {/* Vùng mờ Area dưới Line */}
            {areaPath && (
              <path d={areaPath} fill="url(#areaGradient)" />
            )}

            {/* Đường Line chính */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Các điểm nút (Points) và sự kiện Hover */}
            {points.map((pt, i) => {
              const isHovered = hoveredIndex === i;
              return (
                <g key={i}>
                  {/* Vùng bắt chuột rộng hơn để dễ bấm/hover */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={12}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />

                  {/* Nút tròn thực tế */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5.5 : 3.5}
                    fill={isHovered ? "#2563eb" : "#ffffff"}
                    stroke="#2563eb"
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all duration-150 pointer-events-none"
                  />

                  {/* Nhãn trục hoành Ngày (hiển thị cách quãng để không bị đè chữ nếu xem 30 ngày) */}
                  {(days <= 7 ||
                    (days === 14 && i % 2 === 0) ||
                    (days === 30 && i % 5 === 0) ||
                    i === points.length - 1) && (
                    <text
                      x={pt.x}
                      y={padTop + chartHeight + 20}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#64748b"
                      fontFamily="monospace"
                    >
                      {formatShortDate(pt.date)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Tooltip Card khi hover vào điểm */}
        {hoveredPoint && (
          <div className="mt-2 text-center text-xs py-1.5 px-3 bg-slate-900 text-white rounded-lg inline-block mx-auto flex items-center justify-center gap-3 shadow-md max-w-fit">
            <span>Ngày: <strong className="font-mono text-blue-300">{hoveredPoint.date}</strong></span>
            <span>Lượt click: <strong className="font-mono text-emerald-400">{hoveredPoint.clicks}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}

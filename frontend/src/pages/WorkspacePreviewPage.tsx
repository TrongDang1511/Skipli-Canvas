import { FC, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Sparkles,
  Send,
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  Code2,
  Eye,
  Share2,
  Download,
  LogOut,
  ExternalLink,
  ChevronDown,
  Wand2,
  CheckCircle2,
  SlidersHorizontal,
  Paperclip,
} from 'lucide-react';

export const WorkspacePreviewPage: FC = () => {
  const { user, logout } = useAuth();
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [promptText, setPromptText] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'user',
      text: 'Tạo một trang web sang trọng giới thiệu bộ sưu tập đồng hồ và trang sức cao cấp với phong cách Minimalist & Luxury.',
      time: '10:42 AM',
    },
    {
      id: 2,
      sender: 'ai',
      text: 'Tôi đã tạo xong phiên bản v1.0 của website **AURA LUXURY**. Đã tối ưu bố cục Hero Banner, danh mục sản phẩm độc bản và form đặt lịch hẹn VIP.',
      time: '10:43 AM',
      version: 'v1.0',
      steps: [
        'Khởi tạo kiến trúc giao diện Light & Luxurious',
        'Tích hợp bảng màu Navy Blue (#0B192C) & Metallic Gold (#D4AF37)',
        'Xây dựng 3 section: Hero Exclusive, Featured Collection, VIP Appointment',
      ],
    },
  ]);

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: promptText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setPromptText('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Đang áp dụng thay đổi mới vào Canvas của bạn...',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          version: 'v1.1',
          steps: ['Phân tích yêu cầu bổ sung', 'Cập nhật trực tiếp trên Live Preview Canvas'],
        },
      ]);
    }, 800);
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-[375px]';
      case 'tablet':
        return 'max-w-[768px]';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  return (
    <div className="h-screen w-full bg-beige-50 text-navy-950 flex flex-col font-sans overflow-hidden">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="h-14 bg-white border-b border-beige-200 px-4 flex items-center justify-between z-30 shrink-0 select-none shadow-xs">
        {/* Left: Brand & Project Name */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/Skipli_logo.png" alt="Skipli" className="h-7 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-none text-navy-950">Skipli</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-gold-500">Canvas</span>
            </div>
          </div>

          <div className="h-5 w-px bg-beige-300" />

          {/* Project Title & Status */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-beige-100 text-xs font-semibold text-navy-900 transition-colors">
              <span>Aura Luxury Showcase</span>
              <ChevronDown className="w-3.5 h-3.5 text-navy-400" />
            </button>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold-100 text-gold-800 border border-gold-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
              v1.0 (Live)
            </span>
          </div>
        </div>

        {/* Center: Viewport Switcher & Controls */}
        <div className="flex items-center gap-1 bg-beige-100 p-1 rounded-lg border border-beige-200">
          <button
            onClick={() => setViewport('desktop')}
            title="Desktop View (100%)"
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewport === 'desktop'
                ? 'bg-white text-navy-950 shadow-xs border border-beige-200'
                : 'text-navy-600 hover:text-navy-950'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>

          <button
            onClick={() => setViewport('tablet')}
            title="Tablet View (768px)"
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewport === 'tablet'
                ? 'bg-white text-navy-950 shadow-xs border border-beige-200'
                : 'text-navy-600 hover:text-navy-950'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>

          <button
            onClick={() => setViewport('mobile')}
            title="Mobile View (375px)"
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewport === 'mobile'
                ? 'bg-white text-navy-950 shadow-xs border border-beige-200'
                : 'text-navy-600 hover:text-navy-950'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>

          <div className="h-4 w-px bg-beige-300 mx-1" />

          <button
            title="Tải lại preview"
            className="p-1 rounded text-navy-600 hover:text-navy-950 hover:bg-beige-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: View Mode, Export, User & Logout */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-beige-100 p-0.5 rounded-lg border border-beige-200">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'preview'
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'text-navy-600 hover:text-navy-950'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'code'
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'text-navy-600 hover:text-navy-950'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
          </div>

          <button className="px-2.5 py-1.5 rounded-lg border border-beige-300 hover:bg-beige-100 text-xs font-semibold text-navy-800 flex items-center gap-1.5 transition-colors">
            <Share2 className="w-3.5 h-3.5 text-navy-500" />
            <span className="hidden md:inline">Chia sẻ</span>
          </button>

          <button className="px-3 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Xuất bản</span>
          </button>

          <div className="h-5 w-px bg-beige-300 mx-1" />

          {/* User Avatar & Logout */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-navy-900 text-gold-300 font-bold text-xs flex items-center justify-center border border-gold-400">
              {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              title="Đăng xuất"
              className="p-1.5 text-navy-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. SPLIT SCREEN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: AI Chat & Prompt Interface (Lovable Style) */}
        <aside className="w-full lg:w-[420px] xl:w-[460px] bg-white border-r border-beige-200 flex flex-col shrink-0 z-10 shadow-sm">
          {/* AI Header Bar */}
          <div className="p-3.5 border-b border-beige-100 flex items-center justify-between bg-beige-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-navy-900 text-gold-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-navy-950">Skipli AI Copilot</h2>
                <p className="text-[10px] text-navy-500">GoClaw Streaming Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-medium text-navy-600 bg-white px-2.5 py-1 rounded-md border border-beige-200">
              <SlidersHorizontal className="w-3 h-3 text-gold-600" />
              <span>Tailwind + HTML</span>
            </div>
          </div>

          {/* Messages History List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-semibold text-navy-400">
                    {msg.sender === 'user' ? 'Bạn' : 'Skipli Canvas AI'}
                  </span>
                  <span className="text-[9px] text-navy-400">{msg.time}</span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-navy-950 text-white rounded-tr-xs shadow-xs'
                      : 'bg-beige-100 text-navy-900 rounded-tl-xs border border-beige-200'
                  }`}
                >
                  <p className="font-normal">{msg.text}</p>

                  {/* AI Execution Details */}
                  {msg.steps && (
                    <div className="mt-3 pt-2.5 border-t border-beige-300/60 space-y-1.5">
                      <p className="text-[11px] font-semibold text-navy-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Các bước đã hoàn thiện:
                      </p>
                      <ul className="space-y-1 pl-4 list-disc text-[10.5px] text-navy-600">
                        {msg.steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-4 py-2 border-t border-beige-100 flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px]">
            <button
              onClick={() => setPromptText('Thêm hiệu ứng hover sang trọng cho các thẻ trang sức')}
              className="px-2.5 py-1 bg-beige-100 hover:bg-beige-200 text-navy-700 rounded-full border border-beige-200 shrink-0 transition-colors"
            >
              ✨ Thêm hiệu ứng hover
            </button>
            <button
              onClick={() => setPromptText('Bổ sung phần đánh giá từ khách hàng VIP (Testimonials)')}
              className="px-2.5 py-1 bg-beige-100 hover:bg-beige-200 text-navy-700 rounded-full border border-beige-200 shrink-0 transition-colors"
            >
              ⭐ Thêm Testimonials VIP
            </button>
            <button
              onClick={() => setPromptText('Tạo footer với liên kết mạng xã hội & bản quyền')}
              className="px-2.5 py-1 bg-beige-100 hover:bg-beige-200 text-navy-700 rounded-full border border-beige-200 shrink-0 transition-colors"
            >
              📄 Bổ sung Footer
            </button>
          </div>

          {/* Prompt Composer Box */}
          <div className="p-3.5 border-t border-beige-200 bg-white">
            <form onSubmit={handleSendPrompt} className="relative">
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Yêu cầu AI điều chỉnh giao diện, màu sắc, bổ sung section..."
                rows={3}
                className="w-full bg-beige-50 text-navy-950 text-xs rounded-xl p-3 pb-10 border border-beige-300 focus:outline-none focus:ring-1 focus:ring-navy-900 focus:border-navy-900 transition-all resize-none shadow-inner"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt(e);
                  }
                }}
              />

              <div className="absolute bottom-2.5 left-3 right-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Đính kèm tệp mẫu"
                    className="p-1.5 text-navy-400 hover:text-navy-700 rounded-md transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Tối ưu prompt với AI"
                    className="p-1.5 text-gold-600 hover:text-gold-700 rounded-md transition-colors"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!promptText.trim()}
                  className="px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>Gửi</span>
                  <Send className="w-3 h-3 text-gold-400" />
                </button>
              </div>
            </form>
          </div>
        </aside>

        {/* RIGHT PANEL: Live Preview Canvas / Code Viewer */}
        <main className="flex-1 bg-beige-100 p-4 sm:p-6 flex flex-col items-center justify-start overflow-auto">
          {/* Canvas Top Simulated Browser Address Bar */}
          <div className="w-full max-w-5xl mb-3 bg-white/90 backdrop-blur-sm border border-beige-300 rounded-lg px-3 py-1.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="h-3.5 w-px bg-beige-300 mx-1" />
              <div className="flex items-center gap-1.5 text-[11px] text-navy-600 bg-beige-100 px-2.5 py-0.5 rounded-md border border-beige-200">
                <span className="text-navy-400 font-mono">https://</span>
                <span className="font-semibold text-navy-800">aura-luxury.skiplicanvas.app</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-navy-500 font-medium">
              <span>{viewport === 'desktop' ? '1280 × 800px' : viewport === 'tablet' ? '768 × 1024px' : '375 × 812px'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-navy-400 hover:text-navy-700 cursor-pointer" />
            </div>
          </div>

          {/* MAIN CANVAS BODY */}
          <div
            className={`w-full ${getViewportWidth()} transition-all duration-300 ease-in-out bg-white rounded-xl border border-beige-300 shadow-xl overflow-hidden flex flex-col min-h-[700px]`}
          >
            {viewMode === 'preview' ? (
              /* LIVE PREVIEW SIMULATION (Light & Luxurious High-End Mock Landing Page) */
              <div className="w-full h-full bg-[#FAF9F6] text-navy-950 flex flex-col selection:bg-gold-200">
                {/* Simulated Web Header */}
                <nav className="h-16 px-6 sm:px-10 border-b border-beige-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-xl font-bold tracking-widest text-navy-950 uppercase">
                      Aura
                    </span>
                    <span className="text-[10px] tracking-widest uppercase font-semibold text-gold-600 border-l border-gold-400 pl-2">
                      Haute Joaillerie
                    </span>
                  </div>

                  <div className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wider uppercase text-navy-700">
                    <span className="hover:text-gold-600 cursor-pointer transition-colors">Bộ Sưu Tập</span>
                    <span className="hover:text-gold-600 cursor-pointer transition-colors">Độc Bản</span>
                    <span className="hover:text-gold-600 cursor-pointer transition-colors">Di Sản</span>
                    <span className="hover:text-gold-600 cursor-pointer transition-colors">Showroom VIP</span>
                  </div>

                  <button className="px-4 py-2 rounded-full bg-navy-950 text-gold-300 text-xs font-semibold tracking-wider hover:bg-navy-900 transition-all border border-gold-500/30 shadow-xs">
                    Đặt Lịch Hẹn
                  </button>
                </nav>

                {/* Hero Section */}
                <section className="py-16 sm:py-24 px-6 sm:px-12 max-w-4xl mx-auto text-center space-y-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-50 border border-gold-300/80 text-gold-900 text-[11px] font-semibold tracking-widest uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                    Bộ Sưu Tập Mùa Thu 2026
                  </div>

                  <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-navy-950 tracking-tight leading-tight">
                    Nghệ Thuật Chế Tác <br />
                    <span className="text-gold-600 italic font-normal">Trang Sức Độc Bản</span>
                  </h1>

                  <p className="text-xs sm:text-sm text-navy-600 max-w-xl mx-auto leading-relaxed font-light">
                    Mỗi tác phẩm tại Aura là sự giao thoa hoàn mỹ giữa kim cương tuyển chọn, vàng nguyên khối và kỹ nghệ chế tác kim hoàn thủ công đỉnh cao.
                  </p>

                  <div className="pt-4 flex items-center justify-center gap-4">
                    <button className="px-6 py-3 rounded-full bg-navy-950 text-white font-medium text-xs tracking-wider uppercase hover:bg-navy-900 transition-all shadow-md">
                      Khám Phá Danh Mục
                    </button>
                    <button className="px-6 py-3 rounded-full bg-white text-navy-900 border border-beige-300 font-medium text-xs tracking-wider uppercase hover:bg-beige-100 transition-all">
                      Xem Video Chế Tác
                    </button>
                  </div>
                </section>

                {/* Featured Products Grid */}
                <section className="py-12 px-6 sm:px-12 bg-white border-t border-beige-200">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="font-serif text-xl sm:text-2xl font-bold text-navy-950">Kiệt Tác Nổi Bật</h2>
                        <p className="text-xs text-navy-500 mt-0.5">Tuyển chọn các thiết kế giới hạn được yêu thích nhất</p>
                      </div>
                      <span className="text-xs font-semibold text-gold-700 hover:underline cursor-pointer">
                        Xem tất cả (18) →
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* Card 1 */}
                      <div className="bg-beige-50/60 rounded-xl p-5 border border-beige-200/80 hover:border-gold-300 hover:shadow-md transition-all group">
                        <div className="h-44 bg-white rounded-lg border border-beige-200 flex items-center justify-center text-4xl mb-4 group-hover:scale-[1.02] transition-transform">
                          💎
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600">Độc Bản 01/05</span>
                        <h3 className="font-serif text-sm font-bold text-navy-950 mt-1">Dây Chuyền Aura Royal Diamond</h3>
                        <p className="text-xs font-bold text-navy-900 mt-2">128,000,000 ₫</p>
                      </div>

                      {/* Card 2 */}
                      <div className="bg-beige-50/60 rounded-xl p-5 border border-beige-200/80 hover:border-gold-300 hover:shadow-md transition-all group">
                        <div className="h-44 bg-white rounded-lg border border-beige-200 flex items-center justify-center text-4xl mb-4 group-hover:scale-[1.02] transition-transform">
                          👑
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600">Vàng 18K & Sapphire</span>
                        <h3 className="font-serif text-sm font-bold text-navy-950 mt-1">Nhẫn Hoàng Gia Crown Sapphire</h3>
                        <p className="text-xs font-bold text-navy-900 mt-2">85,500,000 ₫</p>
                      </div>

                      {/* Card 3 */}
                      <div className="bg-beige-50/60 rounded-xl p-5 border border-beige-200/80 hover:border-gold-300 hover:shadow-md transition-all group">
                        <div className="h-44 bg-white rounded-lg border border-beige-200 flex items-center justify-center text-4xl mb-4 group-hover:scale-[1.02] transition-transform">
                          ✨
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600">Bạch Kim & Ngọc Trai</span>
                        <h3 className="font-serif text-sm font-bold text-navy-950 mt-1">Bông Tai Pearl Solitaire</h3>
                        <p className="text-xs font-bold text-navy-900 mt-2">64,000,000 ₫</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* VIP Newsletter Section */}
                <section className="py-12 px-6 bg-navy-950 text-white text-center">
                  <div className="max-w-md mx-auto space-y-4">
                    <span className="text-[10px] font-bold tracking-widest text-gold-400 uppercase">
                      Đặc Quyền Hội Viên
                    </span>
                    <h3 className="font-serif text-xl font-bold">Nhận Thư Mời Sự Kiện VIP & Xem Trước Bộ Sưu Tập</h3>
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="email"
                        placeholder="Nhập email của quý khách..."
                        className="flex-1 bg-navy-900 border border-navy-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-gold-400 placeholder:text-navy-400"
                      />
                      <button className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold text-xs rounded-lg transition-colors">
                        Đăng Ký
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              /* CODE VIEW MODE */
              <div className="w-full h-full bg-navy-950 text-beige-100 p-6 font-mono text-xs overflow-auto">
                <div className="flex items-center justify-between pb-3 border-b border-navy-800 text-[11px] text-navy-400">
                  <span>generated_index.html (Tailwind CSS)</span>
                  <span>142 lines • 4.2 KB</span>
                </div>
                <pre className="pt-4 leading-relaxed text-beige-200 selection:bg-gold-500/30">
{`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AURA Luxury - Haute Joaillerie</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#FAF9F6] text-[#0B192C] font-sans">
  <!-- Navigation Header -->
  <header class="h-16 px-10 border-b border-stone-200 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
    <div class="font-serif text-xl font-bold tracking-widest uppercase">AURA</div>
    <nav class="flex gap-8 text-xs font-medium tracking-wider uppercase text-slate-700">
      <a href="#collection">Bộ Sưu Tập</a>
      <a href="#bespoke">Độc Bản</a>
      <a href="#heritage">Di Sản</a>
    </nav>
    <button class="px-4 py-2 rounded-full bg-[#0B192C] text-[#D4AF37] text-xs font-semibold">
      Đặt Lịch Hẹn VIP
    </button>
  </header>

  <!-- Hero Section -->
  <section class="py-24 px-12 max-w-4xl mx-auto text-center">
    <span class="px-3.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-semibold tracking-widest uppercase">
      Bộ Sưu Tập Mùa Thu 2026
    </span>
    <h1 class="font-serif text-5xl font-extrabold mt-6 leading-tight">
      Nghệ Thuật Chế Tác <br />
      <span class="text-[#D4AF37] italic font-normal">Trang Sức Độc Bản</span>
    </h1>
  </section>
</body>
</html>`}
                </pre>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

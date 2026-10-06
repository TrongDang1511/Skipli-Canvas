import { FC, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChatStream } from '../hooks/useChatStream';
import { ViewportMode, ViewMode } from '../types/chat.types';
import { WorkspaceHeader } from '../components/features/workspace/WorkspaceHeader';
import { HomeDashboard } from '../components/features/workspace/HomeDashboard';
import { ChatSidebar } from '../components/features/workspace/ChatSidebar';
import { CanvasPreview } from '../components/features/workspace/CanvasPreview';
import { CodeViewer } from '../components/features/workspace/CodeViewer';

export const WorkspacePreviewPage: FC = () => {
  const { user, logout } = useAuth();
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [viewMode, setViewMode] = useState<ViewMode>('preview');

  const {
    messages,
    hasStartedChat,
    isStreaming,
    extractedHtml,
    sendPrompt,
    stopGeneration,
    resetCanvas,
  } = useChatStream();

  const handleExportHtml = () => {
    if (!extractedHtml) return;
    const blob = new Blob([extractedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skipli_canvas_website.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen w-full bg-[#0B192C] text-stone-100 flex flex-col font-sans overflow-hidden">
      {/* 1. Top Bar Navigation */}
      <WorkspaceHeader
        hasStartedChat={hasStartedChat}
        viewport={viewport}
        setViewport={setViewport}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onReset={resetCanvas}
        onExport={handleExportHtml}
        user={user}
        logout={logout}
      />

      {/* 2. Main Content Area */}
      {!hasStartedChat ? (
        /* Màn hình Khởi Tạo / Home Dashboard khi chưa chat (Navy Blue Dark Theme) */
        <HomeDashboard
          userName={user?.name || user?.email?.split('@')[0]}
          onStartChat={sendPrompt}
          isStreaming={isStreaming}
        />
      ) : (
        /* Màn hình Workspace khi đã bắt đầu Chat & Sinh Code */
        <div className="flex-1 flex overflow-hidden">
          {/* Khung Chat Bên Trái */}
          <ChatSidebar
            messages={messages}
            isStreaming={isStreaming}
            onSendPrompt={sendPrompt}
            onStopGeneration={stopGeneration}
          />

          {/* Khung Live Preview Canvas Hoặc Xem Code Bên Phải */}
          {viewMode === 'preview' ? (
            <CanvasPreview
              htmlContent={extractedHtml}
              viewport={viewport}
              isStreaming={isStreaming}
            />
          ) : (
            <CodeViewer code={extractedHtml} />
          )}
        </div>
      )}
    </div>
  );
};

import { FC, useState } from 'react';
import { useSession } from '../contexts/SessionContext';
import { useTheme } from '../contexts/ThemeContext';
import { useChatStream } from '../hooks/useChatStream';
import { ViewportMode, ViewMode } from '../types/chat.types';
import { MasterSidebar } from '../components/layout/MasterSidebar';
import { HomeDashboard } from '../components/features/workspace/HomeDashboard';
import { ChatSidebar } from '../components/features/workspace/ChatSidebar';
import { CanvasPreview } from '../components/features/workspace/CanvasPreview';
import { CodeViewer } from '../components/features/workspace/CodeViewer';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils/cn';

export const WorkspacePreviewPage: FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const {
    activeSession,
    activeSessionId,
    setActiveSessionId,
    selectSession,
    fetchSessions,
    fetchStorageFiles,
    setSidebarOpen,
    updateActiveSessionLatestHtml,
  } = useSession();

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
    loadSession,
  } = useChatStream({
    onTurnComplete: async (newOrExistingSessionId, newHtml) => {
      await Promise.all([fetchSessions(), fetchStorageFiles()]);
      if (newOrExistingSessionId) {
        setActiveSessionId(newOrExistingSessionId);
      }
      if (newHtml) {
        updateActiveSessionLatestHtml(newHtml);
      }
    },
  });

  const handleSelectSession = async (sessionId: string) => {
    const detail = await selectSession(sessionId);
    if (detail) {
      loadSession(detail.messages || [], detail.session.latestHtml || '');
    }
  };

  const handleNewWeb = () => {
    resetCanvas();
    setActiveSessionId(null);
  };

  const handleSendPrompt = async (promptText: string) => {
    // Khi người dùng ấn gửi prompt ở Dashboard hoặc bắt đầu chat, tự động thu gọn thanh chat history
    if (!hasStartedChat) {
      setSidebarOpen(false);
    }
    await sendPrompt(promptText, activeSessionId || undefined);
  };

  const handleExportHtml = () => {
    if (!extractedHtml) return;
    const filename = activeSession?.title
      ? `${activeSession.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_website.html`
      : 'skipli_canvas_website.html';
    const blob = new Blob([extractedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn(
        'h-screen w-full flex overflow-hidden font-sans transition-colors duration-200',
        theme === 'dark' ? 'dark bg-[#0B192C] text-stone-100' : 'light bg-[#FAF9F6] text-slate-900'
      )}
    >
      {/* 1. Master Collapsible History Sidebar (ChatGPT / Gemini Style) */}
      <MasterSidebar
        onNewWeb={handleNewWeb}
        onSelectSession={handleSelectSession}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Dynamic Workspace Body */}
        {!hasStartedChat ? (
          /* Home Dashboard khi chưa chọn hoặc bắt đầu phiên */
          <HomeDashboard
            userName={user?.name || user?.email?.split('@')[0]}
            onStartChat={handleSendPrompt}
            isStreaming={isStreaming}
          />
        ) : (
          /* Split-Screen Workspace khi đã có nội dung chat & preview */
          <div className="flex-1 flex overflow-hidden">
            {/* Khung Chat Bên Trái */}
            <ChatSidebar
              messages={messages}
              isStreaming={isStreaming}
              onSendPrompt={handleSendPrompt}
              onStopGeneration={stopGeneration}
              sessionTitle={activeSession?.title}
            />

            {/* Khung Live Preview Canvas hoặc Code Viewer Bên Phải */}
            {viewMode === 'preview' ? (
              <CanvasPreview
                htmlContent={extractedHtml}
                viewport={viewport}
                setViewport={setViewport}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onExport={handleExportHtml}
                isStreaming={isStreaming}
              />
            ) : (
              <CodeViewer
                code={extractedHtml}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import { FC, useState } from 'react';
import { useSession } from '../contexts/SessionContext';
import { useChatStream } from '../hooks/useChatStream';
import { ViewportMode, ViewMode } from '../types/chat.types';
import { MasterSidebar } from '../components/layout/MasterSidebar';
import { WorkspaceHeader } from '../components/features/workspace/WorkspaceHeader';
import { HomeDashboard } from '../components/features/workspace/HomeDashboard';
import { ChatSidebar } from '../components/features/workspace/ChatSidebar';
import { CanvasPreview } from '../components/features/workspace/CanvasPreview';
import { CodeViewer } from '../components/features/workspace/CodeViewer';
import { useAuth } from '../hooks/useAuth';

export const WorkspacePreviewPage: FC = () => {
  const { user } = useAuth();
  const {
    activeSession,
    activeSessionId,
    setActiveSessionId,
    selectSession,
    fetchSessions,
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
      await fetchSessions();
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

  const handleExportCustomHtml = (html: string, title: string) => {
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_website.html`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
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
    <div className="h-screen w-full bg-[#0B192C] text-stone-100 flex overflow-hidden font-sans">
      {/* 1. Master Collapsible History Sidebar (ChatGPT / Gemini Style) */}
      <MasterSidebar
        onNewWeb={handleNewWeb}
        onSelectSession={handleSelectSession}
        onExportHtml={handleExportCustomHtml}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar Header */}
        <WorkspaceHeader
          hasStartedChat={hasStartedChat}
          viewport={viewport}
          setViewport={setViewport}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onExport={handleExportHtml}
          sessionTitle={activeSession?.title}
        />

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
            />

            {/* Khung Live Preview Canvas hoặc Code Viewer Bên Phải */}
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
    </div>
  );
};

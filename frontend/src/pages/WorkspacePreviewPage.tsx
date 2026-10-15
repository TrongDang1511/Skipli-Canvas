import { FC, useState } from 'react';
import { useSession } from '../contexts/SessionContext';
import { useTheme } from '../contexts/ThemeContext';
import { useChatStream } from '../hooks/useChatStream';
import { ViewportMode, ViewMode, ChatMessage } from '../types/chat.types';
import { MasterSidebar } from '../components/layout/MasterSidebar';
import { HomeDashboard } from '../components/features/workspace/HomeDashboard';
import { ChatSidebar } from '../components/features/workspace/ChatSidebar';
import { CanvasPreview } from '../components/features/workspace/CanvasPreview';
import { CodeViewer } from '../components/features/workspace/CodeViewer';
import { RollbackWarningModal } from '../components/features/workspace/RollbackWarningModal';
import { Toast, ToastType } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import { sessionApi } from '../services/session.api';
import { storageService } from '../services/storage.service';
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
    fetchGroupedStorageFiles,
    setSidebarOpen,
    updateActiveSessionLatestHtml,
  } = useSession();

  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [rollbackTarget, setRollbackTarget] = useState<{ message: ChatMessage; index: number } | null>(null);
  const [isRollbacking, setIsRollbacking] = useState<boolean>(false);
  const [prefillPrompt, setPrefillPrompt] = useState<string>('');
  const [toastInfo, setToastInfo] = useState<{
    isOpen: boolean;
    type?: ToastType;
    title?: string;
    message: string;
  }>({
    isOpen: false,
    message: '',
  });

  const {
    messages,
    hasStartedChat,
    isStreaming,
    extractedHtml,
    presignedUrl,
    sendPrompt,
    stopGeneration,
    resetCanvas,
    loadSession,
    updateExtractedHtml,
    applyRollback,
  } = useChatStream({
    onTurnComplete: async (newOrExistingSessionId, newHtml) => {
      await Promise.all([fetchSessions(), fetchStorageFiles(), fetchGroupedStorageFiles()]);
      if (newOrExistingSessionId) {
        setActiveSessionId(newOrExistingSessionId);
      }
      if (newHtml) {
        updateActiveSessionLatestHtml(newHtml);
      }
    },
  });

  const handleSaveHtml = async (cleanHtml: string) => {
    if (!activeSessionId) {
      setToastInfo({
        isOpen: true,
        type: 'error',
        title: 'Chưa Chọn Phiên',
        message: 'Vui lòng bắt đầu hoặc chọn một phiên hội thoại trước khi lưu.',
      });
      return;
    }

    try {
      const result = await sessionApi.overwriteCanvas(activeSessionId, cleanHtml);
      updateExtractedHtml(result.cleanHtml);
      updateActiveSessionLatestHtml(result.cleanHtml);
      fetchStorageFiles();

      setToastInfo({
        isOpen: true,
        type: 'success',
        title: 'Lưu Thành Công',
        message: 'Mã nguồn website và các hình ảnh mới đã được đồng bộ an toàn lên Cloud.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu website lên Cloud';
      setToastInfo({
        isOpen: true,
        type: 'error',
        title: 'Lưu Thất Bại',
        message: msg,
      });
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    const detail = await selectSession(sessionId);
    if (detail) {
      loadSession(
        detail.messages || [],
        detail.session.latestHtml || '',
        detail.session.presignedUrl
      );
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

  const handleStartRollback = (message: ChatMessage, index: number) => {
    setRollbackTarget({ message, index });
  };

  const handleConfirmRollback = async () => {
    if (!activeSessionId || !rollbackTarget) return;

    try {
      setIsRollbacking(true);
      const result = await sessionApi.rollbackUserTurn(
        activeSessionId,
        rollbackTarget.message.id,
        rollbackTarget.message.text
      );

      applyRollback(rollbackTarget.message.id, result.restoredHtml, result.presignedUrl);
      updateActiveSessionLatestHtml(result.restoredHtml || '');
      fetchGroupedStorageFiles();

      // Tự động điền câu prompt cũ vào ô nhập liệu
      setPrefillPrompt(rollbackTarget.message.text);

      setToastInfo({
        isOpen: true,
        type: 'success',
        title: 'Khôi Phục Thành Công',
        message: result.restoredVersion
          ? `Đã khôi phục về phiên bản ${result.restoredVersion}. Câu prompt đã được điền lại vào ô chat!`
          : 'Đã hoàn tác về trạng thái ban đầu. Bạn có thể sửa câu prompt và tạo lại ngay!',
      });
      setRollbackTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi hoàn tác về phiên bản trước';
      setToastInfo({
        isOpen: true,
        type: 'error',
        title: 'Hoàn Tác Thất Bại',
        message: msg,
      });
    } finally {
      setIsRollbacking(false);
    }
  };

  const handleExportHtml = async () => {
    if (activeSessionId) {
      await storageService.downloadStorageFile(activeSessionId, activeSession?.title);
      return;
    }
    if (presignedUrl || activeSession?.presignedUrl) {
      window.open(presignedUrl || activeSession?.presignedUrl, '_blank');
    }
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
              onStartRollback={handleStartRollback}
              prefillPrompt={prefillPrompt}
            />

            {/* Khung Live Preview Canvas hoặc Code Viewer Bên Phải */}
            {viewMode === 'preview' ? (
              <CanvasPreview
                presignedUrl={presignedUrl || activeSession?.presignedUrl}
                htmlContent={extractedHtml || activeSession?.latestHtml}
                onSaveHtml={handleSaveHtml}
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
                presignedUrl={presignedUrl || activeSession?.presignedUrl}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
            )}
          </div>
        )}
      </div>

      {/* Thông báo Toast sang trọng khi lưu hoặc có sự kiện */}
      <Toast
        isOpen={toastInfo.isOpen}
        type={toastInfo.type}
        title={toastInfo.title}
        message={toastInfo.message}
        onClose={() => setToastInfo((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Modal Cảnh Báo Rollback & Sửa Prompt (Hình 2) */}
      <RollbackWarningModal
        isOpen={!!rollbackTarget}
        promptText={rollbackTarget?.message.text || ''}
        deletedMessagesCount={rollbackTarget ? messages.length - rollbackTarget.index : 0}
        deletedVersions={
          rollbackTarget
            ? messages
                .slice(rollbackTarget.index)
                .filter((m) => m.sender === 'ai' && m.version)
                .map((m) => m.version as string)
            : []
        }
        isSubmitting={isRollbacking}
        onClose={() => setRollbackTarget(null)}
        onConfirm={handleConfirmRollback}
      />
    </div>
  );
};

import { useEffect, useRef, useState, useCallback } from 'react';
import { sendAssistantMessageApi } from '../../api/Assistant_api';

// ─── MARKDOWN RENDERER ────────────────────────────────────────────────────────
// Render markdown tables, bold, italic, lists, inline code từ chuỗi formatted

const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Table: detect header row followed by separator
        if (
            i + 1 < lines.length &&
            /^\|.+\|$/.test(line.trim()) &&
            /^\|[\s\-|]+\|$/.test(lines[i + 1].trim())
        ) {
            const headers = line
                .split('|')
                .slice(1, -1)
                .map((h) => h.trim());
            i += 2; // skip separator
            const rows = [];
            while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
                rows.push(
                    lines[i]
                        .split('|')
                        .slice(1, -1)
                        .map((c) => c.trim())
                );
                i++;
            }
            elements.push(
                <div
                    key={`tbl-${i}`}
                    style={{ overflowX: 'auto', marginTop: '10px', marginBottom: '6px' }}
                >
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                {headers.map((h, hi) => (
                                    <th key={hi} style={styles.th}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, ri) => (
                                <tr
                                    key={ri}
                                    style={{
                                        background: ri % 2 === 0 ? '#fff' : '#f8fafc',
                                    }}
                                >
                                    {row.map((cell, ci) => (
                                        <td key={ci} style={styles.td}>
                                            {inlineFormat(cell)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            continue;
        }

        // Heading ## or ###
        if (/^###\s/.test(line)) {
            elements.push(
                <div key={i} style={styles.h3}>
                    {inlineFormat(line.replace(/^###\s/, ''))}
                </div>
            );
            i++;
            continue;
        }
        if (/^##\s/.test(line)) {
            elements.push(
                <div key={i} style={styles.h2}>
                    {inlineFormat(line.replace(/^##\s/, ''))}
                </div>
            );
            i++;
            continue;
        }

        // Bullet list
        if (/^[-*]\s/.test(line)) {
            const items = [];
            while (i < lines.length && /^[-*]\s/.test(lines[i])) {
                items.push(lines[i].replace(/^[-*]\s/, ''));
                i++;
            }
            elements.push(
                <ul key={`ul-${i}`} style={styles.ul}>
                    {items.map((it, idx) => (
                        <li key={idx} style={styles.li}>
                            {inlineFormat(it)}
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // Italic note line (starts with _)
        if (/^_.*_$/.test(line.trim())) {
            elements.push(
                <div key={i} style={styles.note}>
                    {line.replace(/^_/, '').replace(/_$/, '')}
                </div>
            );
            i++;
            continue;
        }

        // Empty line → spacer
        if (line.trim() === '') {
            elements.push(<div key={i} style={{ height: '4px' }} />);
            i++;
            continue;
        }

        // Normal paragraph
        elements.push(
            <div key={i} style={{ lineHeight: 1.55 }}>
                {inlineFormat(line)}
            </div>
        );
        i++;
    }

    return elements;
};

/** Convert **bold**, *italic*, `code` inline */
const inlineFormat = (text) => {
    if (!text) return text;
    const parts = [];
    // Split on **bold**, *italic*, `code`
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    let last = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > last) parts.push(text.slice(last, match.index));
        const raw = match[0];
        if (raw.startsWith('**')) {
            parts.push(<strong key={key++}>{raw.slice(2, -2)}</strong>);
        } else if (raw.startsWith('*')) {
            parts.push(<em key={key++}>{raw.slice(1, -1)}</em>);
        } else if (raw.startsWith('`')) {
            parts.push(
                <code key={key++} style={styles.code}>
                    {raw.slice(1, -1)}
                </code>
            );
        }
        last = match.index + raw.length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length ? parts : text;
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = {
    table: {
        borderCollapse: 'collapse',
        width: '100%',
        fontSize: '12.5px',
        minWidth: '360px',
    },
    th: {
        background: '#1e40af',
        color: '#fff',
        padding: '7px 10px',
        textAlign: 'left',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        borderRight: '1px solid #1d4ed8',
    },
    td: {
        padding: '6px 10px',
        borderBottom: '1px solid #e5e7eb',
        borderRight: '1px solid #f1f5f9',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
    },
    h2: {
        fontWeight: 700,
        fontSize: '14px',
        color: '#1e3a8a',
        marginTop: '4px',
        marginBottom: '2px',
    },
    h3: {
        fontWeight: 600,
        fontSize: '13px',
        color: '#374151',
        marginTop: '6px',
    },
    ul: {
        margin: '4px 0',
        paddingLeft: '16px',
    },
    li: {
        lineHeight: 1.6,
        marginBottom: '2px',
    },
    note: {
        fontSize: '12px',
        color: '#94a3b8',
        fontStyle: 'italic',
        marginTop: '4px',
    },
    code: {
        background: '#f1f5f9',
        borderRadius: '4px',
        padding: '1px 5px',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#dc2626',
    },
};

// ─── ACTION BADGE ─────────────────────────────────────────────────────────────

const ACTION_META = {
    GV_GET_MY_CLASSES: { label: 'Lớp của tôi', color: '#3b82f6' },
    GV_GET_CLASS_DETAIL: { label: 'Chi tiết lớp', color: '#3b82f6' },
    GV_GET_CLASS_SESSIONS: { label: 'Buổi học', color: '#3b82f6' },
    GV_CREATE_SESSION: { label: 'Tạo buổi học', color: '#10b981' },
    GV_OPEN_ATTENDANCE: { label: 'Mở điểm danh', color: '#10b981' },
    GV_CLOSE_ATTENDANCE: { label: 'Đóng điểm danh', color: '#ef4444' },
    GV_START_ATTENDANCE: { label: 'Bắt đầu nhận diện', color: '#10b981' },
    GV_STOP_ATTENDANCE: { label: 'Dừng nhận diện', color: '#ef4444' },
    GV_GET_ACTIVE_SESSION: { label: 'Phiên hiện tại', color: '#3b82f6' },
    GV_MARK_ATTENDANCE: { label: 'Điểm danh thủ công', color: '#f59e0b' },
    GV_GET_ATTENDANCE_HISTORY: { label: 'Lịch sử điểm danh', color: '#3b82f6' },
    GV_GET_SESSION_ATTENDANCE: { label: 'Điểm danh buổi', color: '#3b82f6' },
    GV_GET_ATTENDANCE_HISTORY_DETAIL: { label: 'Chi tiết buổi', color: '#3b82f6' },
    ADMIN_GET_CLASS_SECTIONS: { label: 'DS lớp học phần', color: '#8b5cf6' },
    ADMIN_GET_STUDENTS: { label: 'DS sinh viên', color: '#8b5cf6' },
    ADMIN_GET_LECTURERS: { label: 'DS giảng viên', color: '#8b5cf6' },
    ADMIN_GET_SUBJECTS: { label: 'DS môn học', color: '#8b5cf6' },
    ADMIN_GET_KHOA: { label: 'DS khoa', color: '#8b5cf6' },
    ADMIN_GET_LOP_SV: { label: 'DS lớp SV', color: '#8b5cf6' },
    ADMIN_GET_REGISTRATIONS: { label: 'SV trong lớp HP', color: '#8b5cf6' },
    ADMIN_CREATE_STUDENT: { label: 'Tạo sinh viên', color: '#10b981' },
    ADMIN_CREATE_LECTURER: { label: 'Tạo giảng viên', color: '#10b981' },
    ADMIN_CREATE_CLASS_SECTION: { label: 'Tạo lớp HP', color: '#10b981' },
    ADMIN_ASSIGN_LECTURER: { label: 'Phân công GV', color: '#f59e0b' },
    ADMIN_REGISTER_STUDENT: { label: 'Đăng ký SV', color: '#f59e0b' },
    ADMIN_CANCEL_REGISTRATION: { label: 'Hủy đăng ký', color: '#ef4444' },
    ADMIN_DELETE_STUDENT: { label: 'Xóa sinh viên', color: '#ef4444' },
    ADMIN_DELETE_LECTURER: { label: 'Xóa giảng viên', color: '#ef4444' },
    ADMIN_DELETE_CLASS_SECTION: { label: 'Xóa lớp HP', color: '#ef4444' },
    ADMIN_TRAIN_FACE_DATA: { label: 'Train khuôn mặt', color: '#f59e0b' },
    ADMIN_SYNC_FACE_DATA: { label: 'Đồng bộ khuôn mặt', color: '#f59e0b' },
    NONE: { label: 'Hỏi đáp', color: '#64748b' },
};

const ActionBadge = ({ action, executed }) => {
    if (!action) return null;
    const meta = ACTION_META[action] || { label: action, color: '#64748b' };
    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                marginTop: '8px',
                padding: '3px 8px',
                borderRadius: '999px',
                background: meta.color + '18',
                border: `1px solid ${meta.color}40`,
                fontSize: '11px',
                color: meta.color,
                fontWeight: 600,
            }}
        >
            <span
                style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: executed ? '#10b981' : '#94a3b8',
                    flexShrink: 0,
                }}
            />
            {meta.label}
            {executed != null && (
                <span style={{ color: executed ? '#10b981' : '#94a3b8', fontWeight: 400 }}>
                    · {executed ? 'Đã thực hiện' : 'Chưa thực hiện'}
                </span>
            )}
        </div>
    );
};

// ─── LOADING DOTS ─────────────────────────────────────────────────────────────

const LoadingDots = () => (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}>
        {[0, 1, 2].map((i) => (
            <div
                key={i}
                style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#94a3b8',
                    animation: 'bounce 1.2s infinite ease-in-out',
                    animationDelay: `${i * 0.2}s`,
                }}
            />
        ))}
        <style>{`
            @keyframes bounce {
                0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
            }
        `}</style>
    </div>
);

// ─── QUICK MESSAGES ───────────────────────────────────────────────────────────

const QUICK_MESSAGES_GV = [
    { label: '📚 Lớp của tôi', text: 'Cho tôi xem danh sách lớp học phần của tôi' },
    { label: '📅 Lịch sử điểm danh', text: 'Cho tôi xem lịch sử điểm danh' },
    { label: '🟢 Phiên đang chạy', text: 'Phiên điểm danh hiện tại của tôi là gì?' },
];

const QUICK_MESSAGES_ADMIN = [
    { label: '📚 Lớp học phần', text: 'Cho tôi xem danh sách lớp học phần' },
    { label: '🎓 Sinh viên', text: 'Cho tôi xem danh sách sinh viên' },
    { label: '👨‍🏫 Giảng viên', text: 'Cho tôi xem danh sách giảng viên' },
    { label: '📖 Môn học', text: 'Cho tôi xem danh sách môn học' },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const AssistantChatBox = ({ userRole = 'giang_vien' }) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [chats, setChats] = useState([
        {
            role: 'assistant',
            content: 'Xin chào! Tôi là **trợ lý hệ thống điểm danh**.\n\nBạn cần hỗ trợ gì?',
        },
    ]);

    const bottomRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chats, loading]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height =
                Math.min(textareaRef.current.scrollHeight, 90) + 'px';
        }
    }, [message]);

    const sendMessage = useCallback(
        async (quickText = '') => {
            const text = (quickText || message).trim();
            if (!text || loading) return;

            setChats((prev) => [...prev, { role: 'user', content: text }]);
            setMessage('');
            setLoading(true);

            try {
                const history = chats.slice(-8).map((c) => ({
                    role: c.role,
                    content: c.content,
                }));

                const res = await sendAssistantMessageApi({ message: text, history });
                const result = res.data?.data;

                setChats((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: result?.reply || 'Trợ lý đã phản hồi.',
                        action: result?.action,
                        executed: result?.executed,
                        formatted: result?.formatted ?? null,
                        // data kept for reference but not rendered raw
                    },
                ]);
            } catch (error) {
                setChats((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content:
                            error.response?.data?.message ||
                            '⚠️ Không thể kết nối trợ lý. Vui lòng thử lại.',
                    },
                ]);
            } finally {
                setLoading(false);
            }
        },
        [message, loading, chats]
    );

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const quickMessages =
        userRole === 'admin' ? QUICK_MESSAGES_ADMIN : QUICK_MESSAGES_GV;

    return (
        <>
            {/* ── Chat Window ── */}
            {open && (
                <div
                    style={{
                        position: 'fixed',
                        right: '24px',
                        bottom: '90px',
                        width: '440px',
                        maxWidth: 'calc(100vw - 32px)',
                        height: '600px',
                        maxHeight: 'calc(100vh - 120px)',
                        background: '#fff',
                        borderRadius: '20px',
                        boxShadow: '0 24px 64px rgba(15, 23, 42, 0.22)',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        zIndex: 9999,
                        animation: 'slideUp 0.22s ease',
                    }}
                >
                    <style>{`
                        @keyframes slideUp {
                            from { opacity: 0; transform: translateY(16px) scale(0.97); }
                            to   { opacity: 1; transform: translateY(0) scale(1); }
                        }
                        .chat-scroll::-webkit-scrollbar { width: 4px; }
                        .chat-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                        .quick-btn:hover { background: #dbeafe !important; }
                        .send-btn:hover:not(:disabled) { background: #1d4ed8 !important; }
                        .close-btn:hover { background: rgba(255,255,255,0.3) !important; }
                        .clear-btn:hover { background: rgba(255,255,255,0.2) !important; }
                    `}</style>

                    {/* Header */}
                    <div
                        style={{
                            padding: '14px 16px',
                            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexShrink: 0,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '18px',
                                }}
                            >
                                🤖
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>
                                    Trợ lý điểm danh
                                </div>
                                <div
                                    style={{
                                        fontSize: '11.5px',
                                        opacity: 0.85,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    <span
                                        style={{
                                            width: '7px',
                                            height: '7px',
                                            borderRadius: '50%',
                                            background: '#4ade80',
                                            display: 'inline-block',
                                        }}
                                    />
                                    Đang hoạt động
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {/* Clear chat */}
                            <button
                                className="clear-btn"
                                type="button"
                                title="Xóa lịch sử"
                                onClick={() =>
                                    setChats([
                                        {
                                            role: 'assistant',
                                            content:
                                                'Xin chào! Tôi là **trợ lý hệ thống điểm danh**.\n\nBạn cần hỗ trợ gì?',
                                        },
                                    ])
                                }
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'rgba(255,255,255,0.15)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'background 0.15s',
                                }}
                            >
                                🗑
                            </button>
                            <button
                                className="close-btn"
                                type="button"
                                onClick={() => setOpen(false)}
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'rgba(255,255,255,0.15)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    transition: 'background 0.15s',
                                    lineHeight: 1,
                                }}
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        className="chat-scroll"
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: '#f8fafc',
                            overflowY: 'auto',
                        }}
                    >
                        {chats.map((item, index) => {
                            const isUser = item.role === 'user';
                            return (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        justifyContent: isUser ? 'flex-end' : 'flex-start',
                                        marginBottom: '10px',
                                    }}
                                >
                                    {/* Avatar for assistant */}
                                    {!isUser && (
                                        <div
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '8px',
                                                background: '#1e40af',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '13px',
                                                marginRight: '8px',
                                                flexShrink: 0,
                                                alignSelf: 'flex-start',
                                                marginTop: '2px',
                                            }}
                                        >
                                            🤖
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            maxWidth: isUser ? '75%' : '88%',
                                            padding: '10px 13px',
                                            borderRadius: isUser
                                                ? '16px 4px 16px 16px'
                                                : '4px 16px 16px 16px',
                                            fontSize: '13.5px',
                                            lineHeight: 1.5,
                                            wordBreak: 'break-word',
                                            background: isUser
                                                ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                                                : '#fff',
                                            color: isUser ? '#fff' : '#111827',
                                            border: isUser ? 'none' : '1px solid #e2e8f0',
                                            boxShadow: isUser
                                                ? '0 4px 12px rgba(37,99,235,0.25)'
                                                : '0 1px 4px rgba(0,0,0,0.05)',
                                        }}
                                    >
                                        {/* Message content (reply text) */}
                                        <div>{renderMarkdown(item.content)}</div>

                                        {/* Formatted table/data */}
                                        {!isUser && item.formatted && (
                                            <div
                                                style={{
                                                    marginTop: '10px',
                                                    paddingTop: '10px',
                                                    borderTop: '1px solid #e2e8f0',
                                                }}
                                            >
                                                {renderMarkdown(item.formatted)}
                                            </div>
                                        )}

                                        {/* Action badge */}
                                        {!isUser && item.action && item.action !== 'NONE' && (
                                            <ActionBadge
                                                action={item.action}
                                                executed={item.executed}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Loading indicator */}
                        {loading && (
                            <div
                                style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}
                            >
                                <div
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '8px',
                                        background: '#1e40af',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '13px',
                                        marginRight: '8px',
                                        flexShrink: 0,
                                    }}
                                >
                                    🤖
                                </div>
                                <div
                                    style={{
                                        background: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '4px 16px 16px 16px',
                                        padding: '10px 14px',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                                    }}
                                >
                                    <LoadingDots />
                                </div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Quick messages */}
                    <div
                        style={{
                            padding: '8px 12px',
                            display: 'flex',
                            gap: '6px',
                            overflowX: 'auto',
                            borderTop: '1px solid #f1f5f9',
                            background: '#fff',
                            flexShrink: 0,
                        }}
                    >
                        {quickMessages.map((item) => (
                            <button
                                key={item.text}
                                className="quick-btn"
                                type="button"
                                onClick={() => sendMessage(item.text)}
                                disabled={loading}
                                style={{
                                    whiteSpace: 'nowrap',
                                    border: '1px solid #bfdbfe',
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    padding: '6px 11px',
                                    borderRadius: '999px',
                                    fontSize: '12px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.6 : 1,
                                    transition: 'background 0.15s',
                                    fontWeight: 500,
                                }}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Input area */}
                    <div
                        style={{
                            padding: '10px 12px 12px',
                            borderTop: '1px solid #e2e8f0',
                            background: '#fff',
                            flexShrink: 0,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'flex-end',
                                background: '#f8fafc',
                                border: '1.5px solid #e2e8f0',
                                borderRadius: '14px',
                                padding: '6px 6px 6px 12px',
                                transition: 'border-color 0.15s',
                            }}
                            onFocusCapture={(e) =>
                                (e.currentTarget.style.borderColor = '#2563eb')
                            }
                            onBlurCapture={(e) =>
                                (e.currentTarget.style.borderColor = '#e2e8f0')
                            }
                        >
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập yêu cầu... (Enter để gửi)"
                                disabled={loading}
                                rows={1}
                                style={{
                                    flex: 1,
                                    resize: 'none',
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '13.5px',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                    lineHeight: 1.5,
                                    paddingTop: '4px',
                                    paddingBottom: '4px',
                                    color: '#111827',
                                    maxHeight: '90px',
                                    overflowY: 'auto',
                                }}
                            />
                            <button
                                className="send-btn"
                                type="button"
                                onClick={() => sendMessage()}
                                disabled={loading || !message.trim()}
                                style={{
                                    flexShrink: 0,
                                    width: '36px',
                                    height: '36px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background:
                                        loading || !message.trim() ? '#cbd5e1' : '#2563eb',
                                    color: '#fff',
                                    cursor:
                                        loading || !message.trim() ? 'not-allowed' : 'pointer',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.15s',
                                }}
                                title="Gửi (Enter)"
                            >
                                ↑
                            </button>
                        </div>
                        <div
                            style={{
                                marginTop: '5px',
                                fontSize: '11px',
                                color: '#94a3b8',
                                textAlign: 'right',
                            }}
                        >
                            Shift+Enter để xuống dòng
                        </div>
                    </div>
                </div>
            )}

            {/* ── FAB Button ── */}
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                style={{
                    position: 'fixed',
                    right: '24px',
                    bottom: '24px',
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    border: 'none',
                    background: open
                        ? '#1e40af'
                        : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#fff',
                    fontSize: '22px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                    zIndex: 9999,
                    transition: 'transform 0.2s, background 0.2s',
                    transform: open ? 'rotate(0deg)' : 'rotate(0deg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                title={open ? 'Đóng trợ lý' : 'Mở trợ lý'}
            >
                {open ? '×' : '🤖'}
            </button>
        </>
    );
};

export default AssistantChatBox;
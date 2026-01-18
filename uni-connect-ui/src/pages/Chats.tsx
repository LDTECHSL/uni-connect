import { useEffect, useMemo, useState, useRef } from "react";
import "../styles/chats.css";
import { getAllChats, getMessagesByChat, sendMessage, markMessagesAsRead } from "../services/chats-api";
import { Divider } from "@mui/material";
import { showError } from "../components/Toast";

type User = { id: number; name: string; lastMessage?: string, unreadCount?: number };
type ChatItem = {
    id: number;
    user1: number;
    user2: number;
    createdAt?: string;
    lastMessage?: string;
    receiverName: string;
    unreadCount?: number;
};
type Message = {
    conversationId: number;
    sender: number;
    message: string;
    fileName: string | string[] | null;
    fileType: string | string[] | null;
    fileData: number[] | number[][] | string | string[] | null;
    sentAt: string;
    isRead: boolean;
    readAt: string | null;
    id: number;
};

type NormalizedFile = {
    fileName: string | null;
    fileType: string | null;
    fileData: number[] | string | null;
};

const SAMPLE_USERS: User[] = [
    { id: 1, name: "Alice Johnson", lastMessage: "Hey — are you coming?" },
    { id: 2, name: "Ben Carter", lastMessage: "Sent the files 👍" },
    { id: 3, name: "Chloe Park", lastMessage: "Let’s meet at 5pm" },
    { id: 4, name: "Dinesh Kumar", lastMessage: "Great job on that post" },
];

export default function Chats() {
    const [query, setQuery] = useState("");
    const [activeId, setActiveId] = useState<number | null>(null);
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [draft, setDraft] = useState("");
    const [attachments, setAttachments] = useState<File[]>([]);

    const token = sessionStorage.getItem('jwtToken') || '';
    const userId = sessionStorage.getItem("userId") || "";

    const fetchChats = async () => {
        try {
            const response = await getAllChats(token, Number(userId));
            setChats(response.data);
        } catch (error) {
            setChats([]);
        }
    }

    useEffect(() => {
        fetchChats();
    }, []);

    const displayChats = useMemo(() => {
        if (chats && chats.length > 0) {
            return chats.map((c) => ({
                id: c.id,
                name: c.receiverName,
                receiverName: c.receiverName,
                lastMessage: c.lastMessage,
                unreadCount: c.unreadCount,
            }));
        }
        return [];
    }, [chats]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return displayChats;
        return displayChats.filter((u) => {
            const target = (u as any).receiverName ? (u as any).receiverName : (u as any).name;
            return target.toLowerCase().includes(q);
        });
    }, [query, displayChats]);

    // Fetch messages when activeId changes
    useEffect(() => {
        const fetchMessages = async () => {
            if (activeId) {
                try {
                    const response = await getMessagesByChat(token, activeId);
                    setMessages(response.data);
                    // mark messages as read on open
                    try {
                        await markMessagesAsRead(token, { conversationId: activeId, userId: Number(userId) });
                        setChats((prev) => prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c)));
                    } catch {
                        // ignore mark-as-read errors
                    }
                } catch {
                    setMessages([]);
                }
            }
        };
        fetchMessages();
    }, [activeId]);

    const clickTimer = useRef<number | null>(null);

    // refresh conversations + messages on any click (debounced)
    useEffect(() => {
        const handler = () => {
            if (clickTimer.current) {
                clearTimeout(clickTimer.current);
            }
            clickTimer.current = window.setTimeout(async () => {
                try {
                    await fetchChats();
                    if (activeId) {
                        try {
                            const resp = await getMessagesByChat(token, activeId);
                            setMessages(resp.data);
                            try {
                                await markMessagesAsRead(token, { conversationId: activeId, userId: Number(userId) });
                                setChats((prev) => prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c)));
                            } catch {
                                // ignore
                            }
                        } catch {
                            // ignore
                        }
                    }
                } catch {
                    // ignore
                }
            }, 250);
        };

        document.addEventListener("click", handler);
        return () => {
            document.removeEventListener("click", handler);
            if (clickTimer.current) clearTimeout(clickTimer.current);
        };
    }, [activeId, token, userId]);

    function normalizeFiles(msg: Message): NormalizedFile[] {
        const names = Array.isArray(msg.fileName) ? msg.fileName : msg.fileName ? [msg.fileName] : [];
        const types = Array.isArray(msg.fileType) ? msg.fileType : msg.fileType ? [msg.fileType] : [];

        const dataArr =
            Array.isArray(msg.fileData) && Array.isArray((msg.fileData as any)[0])
                ? (msg.fileData as number[][])
                : Array.isArray(msg.fileData)
                ? (msg.fileData as (number[] | string)[])
                : msg.fileData
                ? [msg.fileData as number[] | string]
                : [];

        const max = Math.max(names.length, types.length, dataArr.length);
        const files: NormalizedFile[] = [];
        for (let i = 0; i < max; i++) {
            files.push({
                fileName: names[i] ?? null,
                fileType: types[i] ?? null,
                fileData: dataArr[i] ?? null,
            });
        }
        return files;
    }

    function inferMime(fileName: string | null): string {
        const name = (fileName || "").toLowerCase();
        if (name.endsWith(".pdf")) return "application/pdf";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".gif")) return "image/gif";
        if (name.endsWith(".webp")) return "image/webp";
        return "image/png"; // fallback
    }

    function renderFile(file: NormalizedFile) {
        if (!file.fileData) return null;

        const mime = inferMime(file.fileName);
        if (!mime.startsWith("image/")) return null;

        let url = "";
        if (typeof file.fileData === "string") {
            url = file.fileData.startsWith("data:")
                ? file.fileData
                : `data:${mime};base64,${file.fileData}`;
        } else {
            const byteArray = new Uint8Array(file.fileData);
            const blob = new Blob([byteArray], { type: mime });
            url = URL.createObjectURL(blob);
        }

        return <img src={url} alt={file.fileName || "attachment"} className="chatImg" />;
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!activeId) return;

        const form = new FormData();
        form.append("ConversationId", String(activeId));
        form.append("Sender", String(Number(userId)));
        form.append("Message", draft);

        attachments.forEach((file) => {
            form.append("Attachments", file);
        });

        try {
            await sendMessage(token, form);
            setDraft("");
            setAttachments([]);
            const response = await getMessagesByChat(token, activeId);
            setMessages(response.data);
        } catch {
            showError("Failed to send message");
        }
    }

    return (
        <div className="chatsPage">
            <div className="postsHeader">
                <h2 className="postsTitle">Chats</h2>
            </div>

            <div className="chatsSearchWrap">
                <input
                    className="chatsSearch"
                    placeholder="Search chats..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search chats"
                />
            </div>

            <div className="chatsGrid">
                <aside className="chatsList" aria-label="Chats list">
                    {filtered.length === 0 ? (
                        <div className="chatsEmpty">No users found</div>
                    ) : (
                        filtered.map((u) => (
                            <button
                                key={u.id}
                                className={"chatItem " + (u.id === activeId ? "active" : "")}
                                onClick={() => setActiveId(u.id)}
                                style={{ position: "relative" }}
                            >
                                <div className="chatAvatar" aria-hidden>
                                    {u.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                                </div>
                                <div className="chatMeta">
                                    <div className="chatName">{u.name}</div>
                                    <div className="chatLast">{u.lastMessage}</div>
                                </div>
                                {u.unreadCount && u.unreadCount > 0 ? (
                                    <span
                                        className="unreadBadge"
                                        aria-label={`${u.unreadCount} unread messages`}
                                        style={{
                                            position: "absolute",
                                            top: 10,
                                            right: 10,
                                            background: "#e53935",
                                            color: "#fff",
                                            borderRadius: 12,
                                            padding: "2px 6px",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            minWidth: 20,
                                            textAlign: "center",
                                            lineHeight: "16px",
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                        }}
                                    >
                                        {u.unreadCount > 99 ? "99+" : u.unreadCount}
                                    </span>
                                ) : null}
                            </button>
                        ))
                    )}
                </aside>

                <main className="chatPane" aria-label="Chat pane">
                    {activeId === null ? (
                        <div className="chatPlaceholder">Please click a chat to open</div>
                    ) : (
                        <div className="chatWindow">
                            <div className="chatHeader">
                                {displayChats.find((u) => u.id === activeId)?.name}
                            </div>

                            <Divider />

                            <div className="chatBody">
                                {messages.length === 0 ? (
                                    <div className="chatPlaceholder">No messages yet</div>
                                ) : (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={
                                                "chatMsg " +
                                                (msg.sender === Number(userId) ? "right" : "left")
                                            }
                                        >
                                            <div className="chatMsgBubble">
                                                <div className="chatMsgText">{msg.message}</div>
                                                <div className="chatFiles">
                                                    {normalizeFiles(msg).map((f, idx) => (
                                                        <div key={idx} className="chatFileItem">
                                                            {renderFile(f)}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="chatMsgTime">
                                                    {new Date(msg.sentAt).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form className="chatComposer" onSubmit={handleSend}>
                                <label className="attachBtn" title="Attach image">
                                    📎
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="attachInput"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
                                            setAttachments(files);
                                        }}
                                    />
                                </label>
                                <input
                                    className="chatComposerInput"
                                    placeholder="Type a message..."
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                />
                                <button className="chatComposerBtn" type="submit" disabled={!draft.trim() && attachments.length === 0}>
                                    Send
                                </button>
                            </form>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
import { useEffect, useMemo, useState } from "react";
import { getAllPosts } from "../services/post-api";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type ApiByteArray = string | number[];

interface PostResponse {
    id: number;
    caption?: string | null;
    category?: string | null;
    images?: unknown;
    userId?: number | null;
    createdAt: string;
    userName?: string | null;
}

const SAVED_POST_IDS_KEY = "uni-connect:savedPostIds";

const cardStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: 16,
};

const subtleTextStyle: React.CSSProperties = {
    color: "var(--muted)",
    fontSize: "var(--text-sm)",
};

const modalBackdropStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "color-mix(in srgb, var(--fg) 70%, transparent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 1000,
};

const modalPanelStyle: React.CSSProperties = {
    width: "min(980px, 100%)",
    maxHeight: "min(86vh, 900px)",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
};

function safeArrayFromDotNet<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === "object" && Array.isArray((value as any).$values)) {
        return (value as any).$values as T[];
    }
    return [];
}

function safeByteArrayFromDotNet(value: unknown): ApiByteArray[] {
    const list = safeArrayFromDotNet<unknown>(value);
    return list
        .map((item) => {
            if (typeof item === "string") return item;
            if (Array.isArray(item) && item.every((x) => typeof x === "number")) return item as number[];
            if (item && typeof item === "object" && Array.isArray((item as any).$values)) {
                const inner = (item as any).$values;
                if (Array.isArray(inner) && inner.every((x: unknown) => typeof x === "number")) return inner as number[];
            }
            return null;
        })
        .filter((x): x is ApiByteArray => x !== null);
}

function bytesToBase64(bytes: number[]): string {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
}

function toImageSrc(value: ApiByteArray, mimeType = "image/jpeg"): string {
    if (typeof value === "string") {
        if (value.startsWith("data:")) return value;
        return `data:${mimeType};base64,${value}`;
    }

    // If the API ever returns a numeric byte array instead of base64
    const base64 = bytesToBase64(value);
    return `data:${mimeType};base64,${base64}`;
}

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

function readSavedIds(): number[] {
    try {
        const raw = localStorage.getItem(SAVED_POST_IDS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as JsonValue;
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((x) => (typeof x === "number" ? x : Number.NaN))
            .filter((x) => Number.isFinite(x));
    } catch {
        return [];
    }
}

function writeSavedIds(ids: number[]) {
    localStorage.setItem(SAVED_POST_IDS_KEY, JSON.stringify(ids));
}

export default function Posts() {
    const [posts, setPosts] = useState<PostResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedIds, setSavedIds] = useState<number[]>(() => readSavedIds());
    const [expandedCaptionIds, setExpandedCaptionIds] = useState<number[]>([]);
    const [modal, setModal] = useState<{ open: boolean; postId: number | null; images: string[]; index: number }>(
        { open: false, postId: null, images: [], index: 0 }
    );

    const handleGetPosts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getAllPosts();
            const list = safeArrayFromDotNet<PostResponse>(response.data);
            setPosts(list);
        } catch (error) {
            setPosts([]);
            setError("Failed to load posts");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        handleGetPosts();
    }, []);

    const savedSet = useMemo(() => new Set(savedIds), [savedIds]);
    const expandedSet = useMemo(() => new Set(expandedCaptionIds), [expandedCaptionIds]);

    const toggleSave = (postId: number) => {
        setSavedIds((prev) => {
            const next = prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId];
            writeSavedIds(next);
            return next;
        });
    };

    const toggleCaption = (postId: number) => {
        setExpandedCaptionIds((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]));
    };

    const openModal = (postId: number, rawImages: ApiByteArray[], index: number) => {
        const urls = rawImages.map((img) => toImageSrc(img));
        setModal({ open: true, postId, images: urls, index });
    };

    const closeModal = () => setModal({ open: false, postId: null, images: [], index: 0 });

    const goPrev = () =>
        setModal((m) => {
            if (!m.open || m.images.length === 0) return m;
            return { ...m, index: (m.index - 1 + m.images.length) % m.images.length };
        });

    const goNext = () =>
        setModal((m) => {
            if (!m.open || m.images.length === 0) return m;
            return { ...m, index: (m.index + 1) % m.images.length };
        });

    useEffect(() => {
        if (!modal.open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeModal();
            if (e.key === "ArrowLeft") goPrev();
            if (e.key === "ArrowRight") goNext();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [modal.open]);
    
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Posts</h2>
            <button
                type="button"
                onClick={handleGetPosts}
                disabled={loading}
                style={{
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 12px",
                }}
            >
                {loading ? "Loading…" : "Refresh"}
            </button>
        </div>

        {error && (
            <div style={{ ...cardStyle, marginBottom: 16 }}>
                <div style={{ color: "var(--muted)" }}>{error}</div>
            </div>
        )}

        {!loading && posts.length === 0 && !error && (
            <div style={{ ...cardStyle, textAlign: "center" }}>
                <div style={subtleTextStyle}>No posts yet.</div>
            </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
            {posts.map((post) => {
                const rawImages = safeByteArrayFromDotNet(post.images);
                const displayImages = rawImages.slice(0, 4);
                const extraCount = Math.max(0, rawImages.length - 4);
                const isSaved = savedSet.has(post.id);
                const isCaptionExpanded = expandedSet.has(post.id);
                const caption = post.caption ?? "";
                const captionLimit = 220;
                const shouldTruncateCaption = caption.length > captionLimit;
                const captionText = shouldTruncateCaption && !isCaptionExpanded ? `${caption.slice(0, captionLimit)}…` : caption;

                return (
                    <div key={post.id} style={cardStyle}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{post.userName ?? "Unknown"}</div>
                                <div style={subtleTextStyle}>{formatDate(post.createdAt)}</div>
                            </div>

                            <button
                                type="button"
                                onClick={() => toggleSave(post.id)}
                                style={{
                                    border: "1px solid var(--border)",
                                    background: isSaved ? "var(--brand-soft)" : "var(--surface)",
                                    borderRadius: "var(--radius-sm)",
                                    padding: "8px 12px",
                                    whiteSpace: "nowrap",
                                }}
                                aria-pressed={isSaved}
                            >
                                {isSaved ? "Saved" : "Save"}
                            </button>
                        </div>

                        {post.category && (
                            <div style={{ marginTop: 10 }}>
                                <span
                                    style={{
                                        display: "inline-block",
                                        padding: "4px 10px",
                                        borderRadius: 999,
                                        border: "1px solid var(--border)",
                                        background: "var(--brand-soft)",
                                        fontSize: "var(--text-sm)",
                                    }}
                                >
                                    {post.category}
                                </span>
                            </div>
                        )}

                        {caption.length > 0 && (
                            <div style={{ marginTop: 10 }}>
                                <div style={{ whiteSpace: "pre-wrap" }}>{captionText}</div>
                                {shouldTruncateCaption && (
                                    <button
                                        type="button"
                                        onClick={() => toggleCaption(post.id)}
                                        style={{
                                            marginTop: 6,
                                            border: "none",
                                            background: "transparent",
                                            padding: 0,
                                            color: "var(--brand)",
                                            fontSize: "var(--text-sm)",
                                        }}
                                    >
                                        {isCaptionExpanded ? "See less" : "See more"}
                                    </button>
                                )}
                            </div>
                        )}

                        {displayImages.length > 0 && (
                            <div
                                style={{
                                    marginTop: 12,
                                    display: "grid",
                                    gridTemplateColumns: displayImages.length === 1 ? "1fr" : "repeat(2, minmax(0, 1fr))",
                                    gap: 8,
                                }}
                            >
                                {displayImages.map((img, idx) => {
                                    const showExtraOverlay = idx === 3 && extraCount > 0;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => openModal(post.id, rawImages, idx)}
                                            style={{
                                                border: "none",
                                                padding: 0,
                                                background: "transparent",
                                                textAlign: "inherit",
                                                position: "relative",
                                            }}
                                            aria-label={`Open image ${idx + 1} of ${rawImages.length}`}
                                        >
                                            <img
                                                src={toImageSrc(img)}
                                                alt={`Post ${post.id} image ${idx + 1}`}
                                                loading="lazy"
                                                style={{
                                                    width: "100%",
                                                    aspectRatio: "1 / 1",
                                                    objectFit: "cover",
                                                    borderRadius: "var(--radius-sm)",
                                                    border: "1px solid var(--border)",
                                                }}
                                            />

                                            {showExtraOverlay && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        borderRadius: "var(--radius-sm)",
                                                        border: "1px solid var(--border)",
                                                        background: "color-mix(in srgb, var(--fg) 45%, transparent)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontWeight: 700,
                                                        fontSize: "var(--text-xl)",
                                                        color: "var(--surface)",
                                                    }}
                                                >
                                                    +{extraCount}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        {modal.open && (
            <div
                role="dialog"
                aria-modal="true"
                style={modalBackdropStyle}
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) closeModal();
                }}
            >
                <div style={modalPanelStyle}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            padding: 12,
                            borderBottom: "1px solid var(--border)",
                        }}
                    >
                        <div style={subtleTextStyle}>
                            Image {modal.images.length === 0 ? 0 : modal.index + 1} of {modal.images.length}
                        </div>
                        <button
                            type="button"
                            onClick={closeModal}
                            style={{
                                border: "1px solid var(--border)",
                                background: "var(--surface)",
                                borderRadius: "var(--radius-sm)",
                                padding: "6px 10px",
                            }}
                        >
                            Close
                        </button>
                    </div>

                    <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 12, gap: 12, overflowY: "auto" }}>
                        {modal.images.length > 0 && (
                            <img
                                src={modal.images[modal.index]}
                                alt="Selected"
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "70vh",
                                    objectFit: "contain",
                                    borderRadius: "var(--radius-sm)",
                                    border: "1px solid var(--border)",
                                    background: "var(--bg)",
                                }}
                            />
                        )}

                        {modal.images.length > 1 && (
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    type="button"
                                    onClick={goPrev}
                                    style={{
                                        border: "1px solid var(--border)",
                                        background: "var(--surface)",
                                        borderRadius: "var(--radius-sm)",
                                        padding: "8px 12px",
                                    }}
                                >
                                    Prev
                                </button>
                                <button
                                    type="button"
                                    onClick={goNext}
                                    style={{
                                        border: "1px solid var(--border)",
                                        background: "var(--surface)",
                                        borderRadius: "var(--radius-sm)",
                                        padding: "8px 12px",
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}
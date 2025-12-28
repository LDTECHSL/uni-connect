import { useEffect, useMemo, useState } from "react";
import { getAllPosts } from "../services/post-api";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type ApiByteArray = string | number[];

interface PostResponse {
    id: number;
    caption?: string | null;
    category?: string | null;
    images?: ApiByteArray[] | null;
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

function safeArrayFromDotNet<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === "object" && Array.isArray((value as any).$values)) {
        return (value as any).$values as T[];
    }
    return [];
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

    const toggleSave = (postId: number) => {
        setSavedIds((prev) => {
            const next = prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId];
            writeSavedIds(next);
            return next;
        });
    };
    
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
                const images = (post.images ?? []).slice(0, 5);
                const isSaved = savedSet.has(post.id);

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

                        {post.caption && <div style={{ marginTop: 10 }}>{post.caption}</div>}

                        {images.length > 0 && (
                            <div
                                style={{
                                    marginTop: 12,
                                    display: "grid",
                                    gridTemplateColumns: images.length === 1 ? "1fr" : "repeat(2, minmax(0, 1fr))",
                                    gap: 8,
                                }}
                            >
                                {images.map((img, idx) => (
                                    <img
                                        key={idx}
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
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
  )
}
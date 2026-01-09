import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/marketplace.css"
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { showError, showSuccess } from "../components/Toast";
import { createItem, getAllItems, getItemsByUser } from "../services/marketplace-api";

type ApiByteArray = string | number[];

interface MarketplaceItem {
    id: number;
    name: string;
    description?: string | null;
    price: number;
    images?: unknown;
    userId?: number | null;
    userName?: string | null;
    createdAt: string;
}

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

    const base64 = bytesToBase64(value);
    return `data:${mimeType};base64,${base64}`;
}

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

export default function MarketPlace() {
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"all" | "myItems">("all");
    const [createOpen, setCreateOpen] = useState(false);
    const [createName, setCreateName] = useState("");
    const [createDescription, setCreateDescription] = useState("");
    const [createPrice, setCreatePrice] = useState("");
    const [createFiles, setCreateFiles] = useState<File[]>([]);
    const [createPreviewUrls, setCreatePreviewUrls] = useState<string[]>([]);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const createFileInputRef = useRef<HTMLInputElement | null>(null);

    const token = sessionStorage.getItem('jwtToken') || '';

    const handleGetItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getAllItems(token);
            
            // Handle both direct array and .NET $values wrapper
            let list: MarketplaceItem[] = [];
            if (Array.isArray(response.data)) {
                list = response.data;
            } else if (response.data && typeof response.data === 'object' && Array.isArray((response.data as any).$values)) {
                list = (response.data as any).$values;
            } else {
                list = safeArrayFromDotNet<MarketplaceItem>(response.data);
            }
            
            setItems(list || []);
        } catch (err) {
            console.error("Error fetching items:", err);
            setItems([]);
            setError("Failed to load marketplace items");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        handleGetItems();
    }, []);

    const visibleItems = useMemo(() => {
        if (viewMode === "all") return items;
        // Filter for current user's items (would need userId from context)
        return items.filter((item) => item.userId === parseInt(sessionStorage.getItem('userId') || '0'));
    }, [items, viewMode]);

    useEffect(() => {
        const urls = createFiles.map((file) => URL.createObjectURL(file));
        setCreatePreviewUrls(urls);
        return () => {
            for (const url of urls) URL.revokeObjectURL(url);
        };
    }, [createFiles]);

    const openCreate = () => {
        setCreateName("");
        setCreateDescription("");
        setCreatePrice("");
        setCreateFiles([]);
        setCreateOpen(true);
    };

    const closeCreate = () => {
        if (createSubmitting) return;
        setCreateOpen(false);
    };

    const handleCreateFiles = (files: FileList | null) => {
        const picked = files ? Array.from(files) : [];
        if (picked.length === 0) return;

        setCreateFiles((prev) => {
            const remainingSlots = Math.max(0, 5 - prev.length);
            const toAdd = picked.slice(0, remainingSlots);

            if (picked.length > remainingSlots) {
                showError("Only 5 images allowed");
            }

            return [...prev, ...toAdd];
        });

        if (createFileInputRef.current) {
            createFileInputRef.current.value = "";
        }
    };

    const removeCreateFile = (index: number) => {
        setCreateFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmitCreate = async () => {
        if (!createName.trim()) {
            showError("Item name is required");
            return;
        }
        if (!createPrice.trim() || isNaN(parseFloat(createPrice))) {
            showError("Valid price is required");
            return;
        }

        try {
            setCreateSubmitting(true);
            const userId = parseInt(sessionStorage.getItem('userId') || '0');
            
            const itemData = {
                title: createName,
                description: createDescription,
                price: parseFloat(createPrice),
                userId: userId,
                images: createFiles
            };

            await createItem(itemData, token);
            showSuccess("Item added successfully!");
            
            // Reset form and close modal
            setCreateName("");
            setCreateDescription("");
            setCreatePrice("");
            setCreateFiles([]);
            setCreateOpen(false);
            
            // Refresh items list
            setTimeout(() => {
                handleGetItems();
            }, 500);
        } catch (err) {
            showError("Failed to add item");
            console.error(err);
            setCreateSubmitting(false);
        }
    };

    const handleChatWithSeller = (itemId: number, sellerName?: string) => {
        // TODO: Implement chat functionality
        showSuccess(`Opening chat with ${sellerName || 'seller'}...`);
    };

    return (
        <div className="marketPlacePage">
            <div className="marketPlaceHeader">
                <h2 className="marketPlaceTitle">MarketPlace</h2>
                <div className="marketPlaceToolbarActions">
                    <div className="marketPlaceViewToggle">
                        <button
                            type="button"
                            className={`marketPlaceViewBtn ${viewMode === "all" ? "active" : ""}`}
                            onClick={() => setViewMode("all")}
                        >
                            All Items
                        </button>
                        <button
                            type="button"
                            className={`marketPlaceViewBtn ${viewMode === "myItems" ? "active" : ""}`}
                            onClick={() => setViewMode("myItems")}
                        >
                            My Items
                        </button>
                    </div>
                    <button
                        type="button"
                        className="marketPlaceCreateButton"
                        onClick={openCreate}
                    >
                        <AddIcon fontSize="small" />
                        Add Item
                    </button>
                </div>
            </div>

            {error && (
                <div className="marketPlaceCard marketPlaceError">
                    <div className="marketPlaceMuted">{error}</div>
                </div>
            )}

            {loading && (
                <div className="marketPlaceCard marketPlaceCardCenter">
                    <div className="marketPlaceMuted">Loading items...</div>
                </div>
            )}

            {!loading && items.length === 0 && !error && (
                <div className="marketPlaceCard marketPlaceCardCenter">
                    <div className="marketPlaceMuted">No items yet.</div>
                </div>
            )}

            {!loading && (
                <div className="marketPlaceList">
                    {visibleItems.map((item) => {
                    const rawImages = safeByteArrayFromDotNet(item.images);
                    const displayImage = rawImages.length > 0 ? toImageSrc(rawImages[0]) : null;
                    const description = item.description ?? "";
                    const descriptionLimit = 150;
                    const shouldTruncateDesc = description.length > descriptionLimit;
                    const descriptionText = shouldTruncateDesc ? `${description.slice(0, descriptionLimit)}…` : description;

                    return (
                        <div key={item.id} className="marketPlaceCard">
                            <div className="itemImageWrapper">
                                {displayImage ? (
                                    <img src={displayImage} alt={item.name} className="itemImage" />
                                ) : (
                                    <div className="itemImagePlaceholder">No Image</div>
                                )}
                            </div>
                            
                            <div className="itemContent">
                                <div className="itemHeader">
                                    <div>
                                        <h3 className="itemName">{item.name}</h3>
                                        <div className="itemSellerInfo">
                                            <span className="itemSeller">{item.userName ?? "Unknown"}</span>
                                            <span className="itemDate">{formatDate(item.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div className="itemPrice">${item.price}</div>
                                </div>

                                {description && (
                                    <div className="itemDescription">
                                        <p className="descriptionText">{descriptionText}</p>
                                    </div>
                                )}

                                <div className="itemActions">
                                    <button
                                        type="button"
                                        className="chatButton"
                                        onClick={() => handleChatWithSeller(item.id, item.userName ?? undefined)}
                                    >
                                        Chat with Seller
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                </div>
            )}

            {createOpen && (
                <div className="createModal">
                    <div className="createModalContent">
                        <div className="createModalHeader">
                            <h3 className="createModalTitle">Add New Item</h3>
                            <button
                                type="button"
                                className="closeButton"
                                onClick={closeCreate}
                                disabled={createSubmitting}
                                aria-label="Close modal"
                            >
                                <CloseIcon fontSize="small" />
                            </button>
                        </div>

                        <div className="createModalBody">
                            <div className="formGroup">
                                <label className="formLabel">Item Name *</label>
                                <input
                                    type="text"
                                    className="formInput"
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                    placeholder="e.g., Used Textbook"
                                    disabled={createSubmitting}
                                />
                            </div>

                            <div className="formGroup">
                                <label className="formLabel">Description</label>
                                <textarea
                                    className="formTextarea"
                                    value={createDescription}
                                    onChange={(e) => setCreateDescription(e.target.value)}
                                    placeholder="Describe your item..."
                                    rows={4}
                                    disabled={createSubmitting}
                                />
                            </div>

                            <div className="formGroup">
                                <label className="formLabel">Price (USD) *</label>
                                <input
                                    type="number"
                                    className="formInput"
                                    value={createPrice}
                                    onChange={(e) => setCreatePrice(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    disabled={createSubmitting}
                                />
                            </div>

                            <div className="formGroup">
                                <label className="formLabel">Images</label>
                                <div className="fileInputWrapper">
                                    <input
                                        ref={createFileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => handleCreateFiles(e.target.files)}
                                        disabled={createSubmitting}
                                        style={{ display: "none" }}
                                    />
                                    <button
                                        type="button"
                                        className="filePickerButton"
                                        onClick={() => createFileInputRef.current?.click()}
                                        disabled={createSubmitting}
                                    >
                                        <AddIcon fontSize="small" />
                                        Pick Images
                                    </button>
                                    <div className="filePickerHint">
                                        {createFiles.length > 0 ? `${createFiles.length} image(s) selected` : "Select up to 5 images"}
                                    </div>
                                </div>

                                {createPreviewUrls.length > 0 && (
                                    <div className="previewGrid">
                                        {createPreviewUrls.map((url, index) => (
                                            <div key={index} className="previewItem">
                                                <img src={url} alt={`Preview ${index}`} className="previewImage" />
                                                <button
                                                    type="button"
                                                    className="removePreviewBtn"
                                                    onClick={() => removeCreateFile(index)}
                                                    disabled={createSubmitting}
                                                    aria-label={`Remove image ${index + 1}`}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="createModalFooter">
                            <button
                                type="button"
                                className="cancelButton"
                                onClick={closeCreate}
                                disabled={createSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="submitButton"
                                onClick={handleSubmitCreate}
                                disabled={createSubmitting}
                            >
                                {createSubmitting ? "Adding..." : "Add Item"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
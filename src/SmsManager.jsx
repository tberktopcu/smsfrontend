import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function SmsManager() {
    const [infos, setInfos] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingInfo, setEditingInfo] = useState(null);

    const [smsHeaderId, setSmsHeaderId] = useState("");
    const [isLocked, setIsLocked] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [smsText, setSmsText] = useState("");

    const [showHeaderModal, setShowHeaderModal] = useState(false);
    const [newHeader, setNewHeader] = useState("");
    const [editingHeader, setEditingHeader] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: "", id: null });
    const [popup, setPopup] = useState({ show: false, message: "", type: "success" });
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    // 401 için merkezi fetch fonksiyonu
    async function fetchWithAuth(url, options = {}) {
        const res = await fetch(url, options);
        if (res.status === 401) {
            localStorage.removeItem("token");
            navigate("/");
            return null;
        }
        return res;
    }

    // Otomatik popup kapama
    useEffect(() => {
        if (popup.show) {
            const timeout = setTimeout(() => {
                setPopup({ show: false, message: "", type: "success" });
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [popup.show]);

    function logout() {
        setIsLoading(true);
        localStorage.removeItem("token");
        navigate("/");
        setIsLoading(false);
    }

    function spinnerDotStyle(delay) {
        return {
            width: 16,
            height: 16,
            borderRadius: "50%",
            backgroundColor: "#fff",
            animation: `bounce 1.4s infinite ease-in-out`,
            animationDelay: `${delay * 0.2}s`
        };
    }

    function openHeaderModal() {
        setShowHeaderModal(true);
        setNewHeader("");
        setEditingHeader(null);
    }

    function closeHeaderModal() {
        setShowHeaderModal(false);
        setNewHeader("");
        setEditingHeader(null);
    }

    async function handleHeaderSave(e) {
        e.preventDefault();
        if (!newHeader.trim()) return;
        setIsLoading(true);
        const payload = { header: newHeader };
        const url = `${API_BASE_URL}/SmsHeader${editingHeader ? `/${editingHeader.id}` : ""}`;
        const method = editingHeader ? "PUT" : "POST";
        try {
            const res = await fetchWithAuth(url, {
                method,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(editingHeader ? { ...payload, id: editingHeader.id } : payload),
            });
            if (!res) return;
            if (res.ok) {
                await fetchHeaders();
                setPopup({
                    show: true,
                    message: editingHeader ? "Başlık başarıyla güncellendi." : "Başlık başarıyla eklendi.",
                    type: "success"
                });
                if (editingHeader) {
                    setEditingHeader({ ...editingHeader, header: newHeader });
                    setNewHeader(newHeader);
                } else {
                    setNewHeader("");
                }
            } else {
                setPopup({
                    show: true,
                    message: "Başlık kaydedilemedi.",
                    type: "error"
                });
            }
        } catch {
            setPopup({
                show: true,
                message: "Bir hata oluştu.",
                type: "error"
            });
        }
        setIsLoading(false);
    }

    function handleHeaderDelete(id) {
        const isUsed = infos.some(info => info.smsHeaderId === id);
        if (isUsed) {
            setPopup({
                show: true,
                message: "Bu başlık bir SMS şablonu tarafından kullanıldığı için silinemez.",
                type: "error"
            });
            return;
        }
        setDeleteConfirm({ show: true, type: "header", id });
    }

    function handleDelete(id) {
        setDeleteConfirm({ show: true, type: "info", id });
    }

    async function confirmDelete() {
        setIsLoading(true);
        if (deleteConfirm.type === "info") {
            try {
                const res = await fetchWithAuth(`${API_BASE_URL}/Info/${deleteConfirm.id}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (!res) return;
                if (res.ok) {
                    fetchInfos();
                    setPopup({
                        show: true,
                        message: "Şablon başarıyla silindi.",
                        type: "success"
                    });
                } else {
                    setPopup({
                        show: true,
                        message: "Şablon silinemedi.",
                        type: "error"
                    });
                }
            } catch {
                setPopup({
                    show: true,
                    message: "Bir hata oluştu.",
                    type: "error"
                });
            }
        } else if (deleteConfirm.type === "header") {
            try {
                const res = await fetchWithAuth(`${API_BASE_URL}/SmsHeader/${deleteConfirm.id}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (!res) return;
                if (res.ok) {
                    fetchHeaders();
                    setPopup({
                        show: true,
                        message: "Başlık başarıyla silindi.",
                        type: "success"
                    });
                } else {
                    setPopup({
                        show: true,
                        message: "Başlık silinemedi.",
                        type: "error"
                    });
                }
            } catch {
                setPopup({
                    show: true,
                    message: "Bir hata oluştu.",
                    type: "error"
                });
            }
        }
        setIsLoading(false);
        setDeleteConfirm({ show: false, type: "", id: null });
    }

    function cancelDelete() {
        setDeleteConfirm({ show: false, type: "", id: null });
    }

    useEffect(() => {
        fetchHeaders();
        fetchInfos();
        // eslint-disable-next-line
    }, []);

    async function fetchHeaders() {
        setIsLoading(true);
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/SmsHeader`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!res) return;
            const data = await res.json();
            setHeaders(data);
        } catch (error) {
            console.error("Header verileri alınamadı:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchInfos() {
        setIsLoading(true);
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/Info`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!res) return;
            const data = await res.json();
            setInfos(data.sort((a, b) => b.id - a.id));
        } catch (error) {
            console.error("Info verileri alınırken hata oluştu:", error);
        } finally {
            setIsLoading(false);
        }
    }

    function openModal(info = null) {
        if (info) {
            setEditingInfo(info);
            setSmsHeaderId(info.smsHeaderId);
            setIsLocked(info.isLocked);
            setTemplateName(info.templateName || "");
            setSmsText(info.smsText);
        } else {
            setEditingInfo(null);
            setSmsHeaderId(headers.length > 0 ? headers[0].id : "");
            setIsLocked(false);
            setTemplateName("");
            setSmsText("");
        }
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
    }

    async function handleSave(e) {
        e.preventDefault();

        if (!smsHeaderId || smsText.trim() === "") {
            return;
        }
        setIsLoading(true);
        const payload = {
            smsHeaderId: Number(smsHeaderId),
            isLocked,
            templateName,
            smsText,
        };

        try {
            if (editingInfo) {
                const res = await fetchWithAuth(`${API_BASE_URL}/Info/${editingInfo.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ ...payload, id: editingInfo.id }),
                });
                if (!res) return;
                if (res.ok) {
                    fetchInfos();
                    fetchInfos();
                    setPopup({
                        show: true,
                        message: "Şablon başarıyla güncellendi.",
                        type: "success"
                    });
                    setIsLoading(false);
                    closeModal();
                } else {
                    setPopup({
                        show: true,
                        message: "Şablon güncellenemedi.",
                        type: "error"
                    });
                    setIsLoading(false);
                }
            } else {
                const res = await fetchWithAuth(`${API_BASE_URL}/Info`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload),
                });
                if (!res) return;
                if (res.ok) {
                    fetchInfos();
                    setPopup({
                        show: true,
                        message: "Şablon başarıyla eklendi.",
                        type: "success"
                    });
                    setIsLoading(false);
                    closeModal();
                } else {
                    setPopup({
                        show: true,
                        message: "Şablon eklenemedi.",
                        type: "error"
                    });
                    setIsLoading(false);
                }
            }
        } catch {
            setPopup({
                show: true,
                message: "Bir hata oluştu.",
                type: "error"
            });
            setIsLoading(false);
        }
    }

    return (
        <>
            {/* Animasyon tanımı */}
            <style>
                {`
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
            }
            40% {
              transform: scale(1.0);
            }
          }
        `}
            </style>

            {/* Ortada otomatik kaybolan popup */}
            {popup.show && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0,0,0,0.15)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 12000
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 10,
                            boxShadow: "0 4px 15px rgba(0,0,0,0.18)",
                            padding: "28px 48px",
                            color: popup.type === "error" ? "#dc3545" : "#28a745",
                            fontWeight: "bold",
                            fontSize: 18,
                            border: `2px solid ${popup.type === "error" ? "#dc3545" : "#28a745"}`,
                            minWidth: 260,
                            maxWidth: 400,
                            textAlign: "center"
                        }}
                    >
                        {popup.message}
                    </div>
                </div>
            )}

            <div
                style={{
                    minHeight: "100vh",
                    width: "100vw",
                    padding: "30px 50px",
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    boxSizing: "border-box",
                }}
            >
                <h1 style={{ marginBottom: 20 }}>SMS Şablonları</h1>

                <button
                    onClick={() => openModal()}
                    style={{
                        cursor: "pointer",
                        padding: "10px 18px",
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: "#007bff",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 20,
                        marginRight: 20,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0056b3")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#007bff")}
                >
                    + Yeni Ekle
                </button>

                <button
                    onClick={openHeaderModal}
                    style={{
                        cursor: "pointer",
                        padding: "10px 18px",
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: "#28a745",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: 16,
                        marginRight: 1374,
                        marginBottom: 20,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e7e34")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#28a745")}
                >
                    SMS Başlıklarını Yönet
                </button>

                <button
                    onClick={logout}
                    style={{
                        cursor: "pointer",
                        padding: "10px 18px",
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: "#FF0000",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 20,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#dc3545")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FF0000")}
                >
                    Çıkış Yap
                </button>

                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        backgroundColor: "white",
                        boxShadow: "0 2px 8px rgb(0 0 0 / 0.1)",
                        color: "#000000",
                    }}
                >
                    <thead style={{ backgroundColor: "#007bff", color: "white" }}>
                        <tr>
                            <th style={{ padding: 12, textAlign: "left" }}>Sms Başlığı</th>
                            <th style={{ padding: 12, textAlign: "center", width: 100 }}>Kilitli Mi?</th>
                            <th style={{ padding: 12, textAlign: "left" }}>Şablon Adı</th>
                            <th style={{ padding: 12, textAlign: "left" }}>Sms Mesaj Metni</th>
                            <th style={{ padding: 12, textAlign: "center", width: 140 }}>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {infos.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: 16, textAlign: "center", color: "#777" }}>
                                    Kayıtlı SMS Şablonu bulunmamaktadır.
                                </td>
                            </tr>
                        )}
                        {infos.map((info) => {
                            const headerObj = headers.find((h) => h.id === info.smsHeaderId);
                            return (
                                <tr
                                    key={info.id}
                                    style={{
                                        borderBottom: "1px solid #ddd",
                                        cursor: "default",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f7ff")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                                >
                                    <td style={{ padding: 12 }}>{headerObj ? headerObj.header : "Bilinmiyor"}</td>
                                    <td style={{ padding: 12, textAlign: "center" }}>
                                        {info.isLocked ? "Evet" : "Hayır"}
                                    </td>
                                    <td style={{ padding: 12 }}>{info.templateName || "-"}</td>
                                    <td style={{ padding: 12, whiteSpace: "pre-wrap" }}>{info.smsText}</td>
                                    <td
                                        style={{
                                            padding: 12,
                                            textAlign: "center",
                                            display: "flex",
                                            justifyContent: "center",
                                            gap: 10,
                                        }}
                                    >
                                        <button
                                            onClick={() => openModal(info)}
                                            style={{
                                                padding: "6px 12px",
                                                borderRadius: 6,
                                                border: "1.5px solid #007bff",
                                                backgroundColor: "white",
                                                color: "#007bff",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = "#007bff";
                                                e.currentTarget.style.color = "white";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = "white";
                                                e.currentTarget.style.color = "#007bff";
                                            }}
                                        >
                                            Düzenle
                                        </button>
                                        <button
                                            onClick={() => handleDelete(info.id)}
                                            style={{
                                                padding: "6px 12px",
                                                borderRadius: 6,
                                                border: "1.5px solid #dc3545",
                                                backgroundColor: "white",
                                                color: "#dc3545",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = "#dc3545";
                                                e.currentTarget.style.color = "white";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = "white";
                                                e.currentTarget.style.color = "#dc3545";
                                            }}
                                        >
                                            Sil
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {showHeaderModal && (
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100vw",
                            height: "100vh",
                            backgroundColor: "rgba(0, 0, 0, 0.3)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 9999,
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: "#ffffff",
                                padding: 24,
                                borderRadius: 8,
                                minWidth: 350,
                                maxWidth: "90vw",
                                boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
                                color: "#000000",
                                fontWeight: "bold",
                                position: "relative"
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={closeHeaderModal}
                                style={{
                                    position: "absolute",
                                    top: 10,
                                    right: 16,
                                    background: "transparent",
                                    border: "none",
                                    fontSize: 24,
                                    color: "#888",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                }}
                                aria-label="Kapat"
                            >
                                &times;
                            </button>
                            <h2 style={{ marginBottom: 16, color: "#000000" }}>
                                {editingHeader ? "Başlık Düzenle" : "Yeni Başlık Ekle"}
                            </h2>
                            <form onSubmit={handleHeaderSave}>
                                <div style={{ marginBottom: 12 }}>
                                    <label
                                        htmlFor="headerInput"
                                        style={{ display: "block", marginBottom: 4, color: "#000000" }}
                                    >
                                        Başlık:
                                    </label>
                                    <input
                                        id="headerInput"
                                        type="text"
                                        value={newHeader}
                                        onChange={(e) => setNewHeader(e.target.value)}
                                        required
                                        style={{
                                            width: "95%",
                                            padding: 8,
                                            borderRadius: 4,
                                            border: "1px solid #ccc",
                                            color: "#000000",
                                            backgroundColor: "#ffffff",
                                        }}
                                    />
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: "8px 16px",
                                            cursor: "pointer",
                                            backgroundColor: "#007bff",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 4,
                                        }}
                                    >
                                        {editingHeader ? "Güncelle" : "Ekle"}
                                    </button>
                                    {editingHeader && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingHeader(null);
                                                setNewHeader("");
                                            }}
                                            style={{
                                                padding: "8px 16px",
                                                cursor: "pointer",
                                                backgroundColor: "#6c757d",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 4,
                                                marginLeft: 8
                                            }}
                                        >
                                            Yeni Başlık Ekle
                                        </button>
                                    )}
                                </div>
                            </form>

                            <hr style={{ margin: "16px 0" }} />

                            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                                {headers.map(h => (
                                    <li
                                        key={h.id}
                                        style={{
                                            marginBottom: 8,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            color: "#000000",
                                        }}
                                    >
                                        <span>{h.header}</span>
                                        <div>
                                            <button
                                                onClick={() => {
                                                    setNewHeader(h.header);
                                                    setEditingHeader(h);
                                                }}
                                                style={{
                                                    padding: "6px 12px",
                                                    borderRadius: 6,
                                                    border: "1.5px solid #007bff",
                                                    backgroundColor: "white",
                                                    color: "#007bff",
                                                    fontWeight: "600",
                                                    cursor: "pointer",
                                                    marginRight: 8,
                                                }}
                                            >
                                                Düzenle
                                            </button>
                                            <button
                                                onClick={() => handleHeaderDelete(h.id)}
                                                style={{
                                                    padding: "6px 12px",
                                                    borderRadius: 6,
                                                    border: "1.5px solid #FF0000",
                                                    backgroundColor: "white",
                                                    color: "#FF0000",
                                                    fontWeight: "600",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Sil
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {deleteConfirm.show && (
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100vw",
                            height: "100vh",
                            backgroundColor: "rgba(0,0,0,0.2)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 10000,
                        }}
                        onClick={cancelDelete}
                    >
                        <div
                            style={{
                                backgroundColor: "#fff",
                                padding: 24,
                                borderRadius: 8,
                                minWidth: 300,
                                maxWidth: "90vw",
                                boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
                                color: "#000",
                                fontWeight: "bold",
                                textAlign: "center"
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ marginBottom: 16 }}>
                                Silmek istediğinize emin misiniz?
                            </div>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    padding: "8px 16px",
                                    cursor: "pointer",
                                    backgroundColor: "#dc3545",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 4,
                                    marginRight: 12
                                }}
                            >
                                Evet, Sil
                            </button>
                            <button
                                onClick={cancelDelete}
                                style={{
                                    padding: "8px 16px",
                                    cursor: "pointer",
                                    backgroundColor: "#ccc",
                                    border: "none",
                                    borderRadius: 4
                                }}
                            >
                                Vazgeç
                            </button>
                        </div>
                    </div>
                )}

                {showModal && (
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100vw",
                            height: "100vh",
                            backgroundColor: "rgba(0, 0, 0, 0.3)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 9999,
                        }}
                        onClick={closeModal}
                    >
                        <div
                            style={{
                                backgroundColor: "#ffffff",
                                padding: 24,
                                borderRadius: 8,
                                minWidth: 350,
                                maxWidth: "90vw",
                                boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
                                color: "#000000",
                                fontWeight: "bold",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 style={{ marginBottom: 16, color: "#000000" }}>
                                {editingInfo ? "Düzenle" : "Yeni Ekle"}
                            </h2>
                            <form onSubmit={handleSave}>
                                <div style={{ marginBottom: 12 }}>
                                    <label
                                        htmlFor="smsHeader"
                                        style={{ display: "block", marginBottom: 4, color: "#000000" }}
                                    >
                                        Sms Başlığı:
                                    </label>
                                    <select
                                        id="smsHeader"
                                        value={smsHeaderId}
                                        onChange={(e) => setSmsHeaderId(e.target.value)}
                                        required
                                        style={{
                                            width: "100%",
                                            padding: 8,
                                            borderRadius: 4,
                                            border: "1px solid #ccc",
                                            color: "#000000",
                                            backgroundColor: "#ffffff",
                                        }}
                                    >
                                        {headers.map((h) => (
                                            <option key={h.id} value={h.id}>
                                                {h.header}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label
                                        htmlFor="isLocked"
                                        style={{ color: "#000000", marginRight: 8, fontWeight: "normal" }}
                                    >
                                        Kilitli Mi?:
                                    </label>
                                    <input
                                        id="isLocked"
                                        type="checkbox"
                                        checked={isLocked}
                                        onChange={(e) => setIsLocked(e.target.checked)}
                                        style={{ transform: "scale(1.3)", cursor: "pointer" }}
                                    />
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label
                                        htmlFor="templateName"
                                        style={{ display: "block", marginBottom: 4, color: "#000000" }}
                                    >
                                        Şablon Adı:
                                    </label>
                                    <input
                                        id="templateName"
                                        type="text"
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        style={{
                                            width: "95%",
                                            padding: 8,
                                            borderRadius: 4,
                                            border: "1px solid #ccc",
                                            color: "#000000",
                                            backgroundColor: "#ffffff",
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label
                                        htmlFor="smsText"
                                        style={{ display: "block", marginBottom: 4, color: "#000000" }}
                                    >
                                        Sms Mesaj Metni:
                                    </label>
                                    <textarea
                                        id="smsText"
                                        rows={4}
                                        value={smsText}
                                        onChange={(e) => setSmsText(e.target.value)}
                                        required
                                        style={{
                                            width: "95%",
                                            height: 150,
                                            padding: 8,
                                            borderRadius: 10,
                                            border: "1px solid #ccc",
                                            color: "#000000",
                                            backgroundColor: "#ffffff",
                                            resize: "vertical",
                                        }}
                                    />
                                </div>

                                <div style={{ textAlign: "right" }}>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        style={{
                                            marginRight: 12,
                                            padding: "8px 16px",
                                            cursor: "pointer",
                                            backgroundColor: "#ccc",
                                            border: "none",
                                            borderRadius: 4,
                                        }}
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: "8px 16px",
                                            cursor: "pointer",
                                            backgroundColor: "#007bff",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 4,
                                        }}
                                    >
                                        {editingInfo ? "Güncelle" : "Ekle"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 11000
                    }}>
                        <div style={{
                            display: "flex",
                            gap: 10,
                        }}>
                            <div style={spinnerDotStyle(0)}></div>
                            <div style={spinnerDotStyle(1)}></div>
                            <div style={spinnerDotStyle(2)}></div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
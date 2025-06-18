import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

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

    const handleLogin = async () => {
        setMessage("");
        setIsLoading(true);
        try {
            const res = await fetch(`${baseUrl}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                setMessage("Email veya Şifre hatalı");
                setMessageType("error");
                setIsLoading(false);
                return;
            }

            const data = await res.json();
            setToken(data.token);
            localStorage.setItem("token", data.token);
            setMessage("Giriş başarılı!");
            setMessageType("success");
            setIsLoading(false);
            navigate("/sms-manager");
        } catch (err) {
            setMessage("Bir hata oluştu.");
            setMessageType("error");
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        setMessage("");
        setIsLoading(true);
        try {
            const res = await fetch(`${baseUrl}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const err = await res.text();
                setMessage("Kayıt başarısız: Parolalar en az bir alfanümerik olmayan karakter(örneğin: !, @, #, $) içermelidir. Parolalar en az bir rakam(0–9) içermelidir.Parolalar en az bir büyük harf(A–Z) içermelidir.");
                setMessageType("error");
                setIsLoading(false);
                return;
            }

            setMessage("Kayıt başarılı, giriş yapabilirsiniz.");
            setMessageType("success");
            setIsLogin(true);
            setIsLoading(false);
        } catch (err) {
            setMessage("Bir hata oluştu.");
            setMessageType("error");
            setIsLoading(false);
        }
    };

    // Pop-up (modal) stil objeleri
    const modalOverlayStyle = {
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
    };

    const modalStyle = {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 8,
        width: 300,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        position: "relative",
        textAlign: "center",
    };

    const closeButtonStyle = {
        position: "absolute",
        top: 8,
        right: 12,
        border: "none",
        background: "transparent",
        fontSize: 20,
        cursor: "pointer",
        fontWeight: "bold",
    };

    const messageTextStyle = {
        color: messageType === "error" ? "#b00020" : "#006400",
        fontWeight: "600",
    };

    return (
        <div style={{
            minHeight: "100vh",
            width: "100vw",
            padding: "30px 50px",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            backgroundColor: "#ffffff",
            color: "#000000",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
        }}>
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
            <div style={{
                width: 360,
                boxShadow: "0 2px 8px rgb(0 0 0 / 0.1)",
                borderRadius: 10,
                padding: 30,
                backgroundColor: "white",
                boxSizing: "border-box",
            }}>
                <h2 style={{ textAlign: "center", marginBottom: 20 }}>
                    {isLogin ? "Giriş Yap" : "Kayıt Ol"}
                </h2>

                <div style={{
                    display: "flex",
                    marginBottom: 25,
                    borderBottom: "2px solid #d0d7ff",
                }}>
                    <div
                        style={{
                            flex: 1,
                            padding: 12,
                            cursor: "pointer",
                            fontWeight: "600",
                            color: isLogin ? "#0047b3" : "#007bff",
                            borderBottom: isLogin ? "3px solid #0047b3" : "3px solid transparent",
                            textAlign: "center",
                            transition: "border-bottom 0.3s",
                            userSelect: "none",
                        }}
                        onClick={() => setIsLogin(true)}
                    >
                        Giriş
                    </div>
                    <div
                        style={{
                            flex: 1,
                            padding: 12,
                            cursor: "pointer",
                            fontWeight: "600",
                            color: !isLogin ? "#0047b3" : "#007bff",
                            borderBottom: !isLogin ? "3px solid #0047b3" : "3px solid transparent",
                            textAlign: "center",
                            transition: "border-bottom 0.3s",
                            userSelect: "none",
                        }}
                        onClick={() => setIsLogin(false)}
                    >
                        Kayıt
                    </div>
                </div>

                <input
                    style={{
                        width: "100%",
                        padding: "10px 12px",
                        marginBottom: 20,
                        fontSize: 15,
                        borderRadius: 6,
                        border: "1.5px solid #d0d7ff",
                        outlineColor: "#007bff",
                        backgroundColor: "white",
                        color: "black",
                        boxSizing: "border-box",
                    }}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                />
                <input
                    style={{
                        width: "100%",
                        padding: "10px 12px",
                        marginBottom: 20,
                        fontSize: 15,
                        borderRadius: 6,
                        border: "1.5px solid #d0d7ff",
                        outlineColor: "#007bff",
                        backgroundColor: "white",
                        color: "black",
                        boxSizing: "border-box",
                    }}
                    type="password"
                    placeholder="Şifre"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                />

                <button
                    style={{
                        width: "100%",
                        padding: "12px",
                        fontSize: 16,
                        fontWeight: "700",
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: "#007bff",
                        color: "white",
                        cursor: "pointer",
                        transition: "background-color 0.3s",
                        userSelect: "none",
                    }}
                    onClick={isLogin ? handleLogin : handleRegister}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0047b3")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#007bff")}
                    disabled={isLoading}
                >
                    {isLogin ? "Giriş Yap" : "Kayıt Ol"}
                </button>
            </div>

            {/* Mesaj varsa pop-up modal göster */}
            {message && (
                <div style={modalOverlayStyle} onClick={() => setMessage("")}>
                    <div style={modalStyle} onClick={e => e.stopPropagation()}>
                        <button
                            style={closeButtonStyle}
                            onClick={() => setMessage("")}
                            aria-label="Close message"
                        >
                            &times;
                        </button>
                        <div style={messageTextStyle}>{message}</div>
                    </div>
                </div>
            )}

            {/* Loading animasyonu */}
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
    );
}
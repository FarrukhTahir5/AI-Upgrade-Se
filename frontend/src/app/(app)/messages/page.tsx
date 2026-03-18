"use client";

export default function MessagesPage() {
    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Messages</h1>
                <p className="page-subtitle">AI-generated messages for customer outreach</p>
            </div>
            <div className="page-body">
                <div className="card" style={{ textAlign: "center", padding: 60 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Generate Messages from Customer Detail</h3>
                    <p style={{ color: "var(--text-secondary)", maxWidth: 400, margin: "0 auto" }}>
                        Go to any customer&apos;s detail page and use the AI Message Generator
                        to create personalized WhatsApp, SMS, email, or call script messages.
                    </p>
                </div>
            </div>
        </>
    );
}

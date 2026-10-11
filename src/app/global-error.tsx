"use client";

// Root layout өөрөө унасан үед. globals.css, фонт ачаалагддаггүй тул загвар нь inline.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="mn">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          background: "#0f1410",
          color: "#f2f5ee",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <title>Алдаа гарлаа · Фитнес Хяналт</title>
        <h1 style={{ margin: 0, fontSize: 28 }}>Алдаа гарлаа</h1>
        <p style={{ margin: 0, maxWidth: 420, color: "#a9b3a6" }}>
          Түр зуурын саатал байж магадгүй. Хэсэг хугацааны дараа дахин оролдоно уу.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            marginTop: 8,
            padding: "12px 22px",
            border: 0,
            borderRadius: 999,
            background: "#d2fc4a",
            color: "#0f1410",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Дахин оролдох
        </button>
        {error.digest && <p style={{ margin: 0, fontSize: 12, color: "#a9b3a6" }}>Алдааны код: {error.digest}</p>}
      </body>
    </html>
  );
}

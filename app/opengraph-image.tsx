import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SpendMRR — Spend Someone's MRR";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          background: "#091316",
        }}
      >
        {/* Gradient blobs to mimic the Warp shader */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -200,
            width: 800,
            height: 800,
            borderRadius: "50%",
            background: "radial-gradient(circle, #55a04b 0%, transparent 70%)",
            opacity: 0.6,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -200,
            right: -100,
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle, #aeff00 0%, transparent 70%)",
            opacity: 0.4,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 100,
            right: 200,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, #55a04b 0%, transparent 60%)",
            opacity: 0.3,
            display: "flex",
          }}
        />
        {/* Diagonal stripes overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(50deg, transparent, transparent 30px, rgba(174,255,0,0.05) 30px, rgba(174,255,0,0.05) 60px)",
            display: "flex",
          }}
        />
        {/* Dark overlay for contrast */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(9,19,22,0.3)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: 120,
              fontWeight: 700,
              color: "white",
              letterSpacing: -2,
              lineHeight: 1,
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
            }}
          >
            SpendMRR
          </div>
          <div
            style={{
              fontSize: 32,
              color: "rgba(255,255,255,0.8)",
              marginTop: 24,
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            Pick a startup. Spend their MRR on stuff.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 40,
              fontSize: 20,
              color: "rgba(174,255,0,0.9)",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#aeff00",
                display: "flex",
              }}
            />
            Share the receipt
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            display: "flex",
            fontSize: 18,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          spendmrr.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}

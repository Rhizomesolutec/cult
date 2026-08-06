import { Suspense } from "react";
import AdminLoginPage from "./page-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div style={{ color: "#8a8580", padding: "2rem", textAlign: "center" }}>
          Loading…
        </div>
      }
    >
      <AdminLoginPage />
    </Suspense>
  );
}

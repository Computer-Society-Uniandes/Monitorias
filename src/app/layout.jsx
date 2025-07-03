import "./globals.css";
import AuthWrapper from "./context/AuthWrapper";

export const metadata = {
  title: "Calico",
  description: "Proyecto de monitorías",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}

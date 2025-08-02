import "./globals.css";
import AuthWrapper from "./context/AuthWrapper";
import CalendarConnectionHandler from "./components/CalendarConnectionHandler";

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
        {/* Componente seguro para manejar la conexión de Google Calendar */}
        <CalendarConnectionHandler />
      </body>
    </html>
  );
}

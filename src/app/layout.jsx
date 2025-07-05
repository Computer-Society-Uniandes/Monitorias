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
        
        {/* Script para manejar el estado de Google Calendar */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  function checkAndHandleCalendarConnection() {
                    const urlParams = new URLSearchParams(window.location.search);
                    console.log('🔍 Checking URL params:', window.location.search);
                    if (urlParams.get('calendar_connected') === 'true') {
                      console.log('✅ Found calendar_connected=true, updating status...');
                      // Limpiar el parámetro URL
                      const newUrl = new URL(window.location);
                      newUrl.searchParams.delete('calendar_connected');
                      window.history.replaceState({}, '', newUrl);
                      
                      // Disparar evento personalizado después de un breve delay
                      setTimeout(function() {
                        console.log('📤 Dispatching calendar-status-update event...');
                        window.dispatchEvent(new CustomEvent('calendar-status-update'));
                      }, 500);
                    }
                  }
                  
                  // Ejecutar inmediatamente
                  checkAndHandleCalendarConnection();
                  
                  // También ejecutar cuando el DOM esté listo
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', checkAndHandleCalendarConnection);
                  }
                  
                  // Ejecutar cuando la página esté completamente cargada
                  window.addEventListener('load', checkAndHandleCalendarConnection);
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}

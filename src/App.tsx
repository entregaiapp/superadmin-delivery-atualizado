import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { AppRoutes } from "./app/routes";
import { EntregaiAnimatedSplash } from "./components/brand/EntregaiAnimatedSplash";

const queryClient = new QueryClient();

function App() {
  const [showPostLoginSplash, setShowPostLoginSplash] = useState(() => {
    return sessionStorage.getItem("entregai_post_login_splash") === "1";
  });

  useEffect(() => {
    const handlePostLoginSplash = () => setShowPostLoginSplash(true);
    window.addEventListener("entregai-post-login-splash", handlePostLoginSplash);
    return () => {
      window.removeEventListener("entregai-post-login-splash", handlePostLoginSplash);
    };
  }, []);

  const handleSplashFinish = useCallback(() => {
    sessionStorage.removeItem("entregai_post_login_splash");
    setShowPostLoginSplash(false);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      {showPostLoginSplash ? (
        <div className="fixed inset-0 z-[9999] flex">
          <EntregaiAnimatedSplash onFinish={handleSplashFinish} />
        </div>
      ) : null}
    </QueryClientProvider>
  );
}

export default App;

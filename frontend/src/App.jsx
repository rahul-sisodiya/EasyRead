import { Routes, Route, Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import UserBadge from "./components/UserBadge.jsx";
import Logo from "./components/Logo.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ReaderPage from "./pages/ReaderPage.jsx";
import VocabPage from "./pages/VocabPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

export default function App() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const isReader = location.pathname.startsWith("/reader");
  const user = (() => { try { return JSON.parse(localStorage.getItem("easyread_user") || "null"); } catch { return null; } })();
  const navigate = useNavigate();
  if (isLanding && user) {
    return <Navigate to="/upload" replace />;
  }
  const RequireAuth = ({ children }) => {
    if (!user) return <Navigate to="/signin" replace />;
    return children;
  };
  return (
    <div className="min-h-screen bg-black text-neutral-200 relative" style={{ background: "radial-gradient(1200px 600px at 20% 20%, rgba(168,85,247,0.08), transparent), radial-gradient(1000px 500px at 80% 40%, rgba(14,165,233,0.06), transparent), radial-gradient(600px 300px at 50% 90%, rgba(244,63,94,0.08), transparent)" }}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(0deg,transparent 24%,rgba(255,255,255,0.08) 25%,rgba(255,255,255,0.08) 26%,transparent 27%), linear-gradient(90deg,transparent 24%,rgba(255,255,255,0.08) 25%,rgba(255,255,255,0.08) 26%,transparent 27%)", backgroundSize: "50px 50px" }} />
      <header className="relative z-50 flex items-center justify-between px-8 py-4 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
        <Link to={isLanding ? "/" : "/upload"} className="font-semibold text-white text-xl"><Logo size={28} label="EasyRead" /></Link>
        {isLanding ? (
          <nav className="flex gap-4 items-center">
            <a href="#about" className="text-neutral-300 hover:text-white text-[15px] px-3 py-2 rounded-md hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700">About</a>
            <a href="#features" className="text-neutral-300 hover:text-white text-[15px] px-3 py-2 rounded-md hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700">Features</a>
            {user ? (
              <Link to="/upload" className="text-neutral-300 hover:text-white text-[15px] px-3 py-2 rounded-md hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700">Upload</Link>
            ) : (
              <Link to="/signin" className="text-neutral-300 hover:text-white text-[15px] px-3 py-2 rounded-md hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700">Upload</Link>
            )}
            {!user && <Link to="/signin" className="text-neutral-300 hover:text-white text-[15px] px-3 py-2 rounded-md hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700">Sign In</Link>}
            {!user && <Link to="/register" className="text-neutral-300 hover:text-white text-[15px] px-3 py-2 rounded-md hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700">Register</Link>}
          </nav>
        ) : (
          <div className="flex items-center gap-3">
            <nav className="flex gap-2 items-center">
              {user ? (
                <>
                  <Link to="/reader" className="text-neutral-300 hover:text-white text-[15px] px-3 py-2 rounded-md hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700">Reader</Link>
                  <Link to="/vocab" className="text-neutral-300 hover:text-white text-[15px] px-3 py-2 rounded-md hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700">Vocab</Link>
                  <Link to="/settings" className="text-neutral-300 hover:text-white text-[15px] px-3 py-2 rounded-md hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700">Settings</Link>
                  <Link to="/upload" className="text-neutral-300 hover:text-white text-[15px] px-3 py-2 rounded-md hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700">Upload</Link>
                </>
              ) : (
                <>
                  <Link to="/signin" className="text-neutral-300 hover:text-white text-[15px] px-3 py-2 rounded-md hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700">Sign In</Link>
                  <Link to="/register" className="text-neutral-300 hover:text-white text-[15px] px-3 py-2 rounded-md hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700">Register</Link>
                </>
              )}
            </nav>
            {user && <UserBadge />}
          </div>
        )}
      </header>
      <main className="p-0 relative z-10">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/reader" element={<ReaderPage />} />
          <Route path="/reader/:id" element={<ReaderPage />} />
          <Route path="/vocab" element={<RequireAuth><VocabPage /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
      
    </div>
  );
}

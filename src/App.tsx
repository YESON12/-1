import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { SettingsProvider } from './settings';
import { ToastProvider } from './components/ui';
import Home from './pages/Home';
import Reader from './pages/Reader';
import BookPicker from './pages/BookPicker';
import Search from './pages/Search';
import Lists from './pages/Lists';
import Prayers from './pages/Prayers';
import Creed from './pages/Creed';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Pending from './pages/Pending';
import { isNative } from './native';
import BundledBible from './components/BundledBible';

function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div className="update-banner">
      새 버전이 있습니다
      <button className="btn small primary" onClick={() => updateServiceWorker(true)}>
        업데이트
      </button>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        {/* HashRouter: GitHub Pages 와 Capacitor(Android)에서 서버 설정 없이 동작 */}
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/books" element={<BookPicker />} />
            <Route path="/read/:book/:chapter" element={<Reader />} />
            <Route path="/search" element={<Search />} />
            <Route path="/lists" element={<Lists />} />
            <Route path="/prayers" element={<Prayers />} />
            <Route path="/creed/:kind" element={<Creed />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
            <Route path="/hymns" element={<Pending title="새찬송가" file="new_song.txt" />} />
            <Route path="/readings" element={<Pending title="교독문" file="교독문.txt" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
        {/* 앱(APK)은 파일이 설치본에 들어 있으므로 서비스워커 업데이트가 필요 없음 */}
        {!isNative && <UpdateBanner />}
        <BundledBible />
      </ToastProvider>
    </SettingsProvider>
  );
}

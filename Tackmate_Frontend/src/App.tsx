import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { LanguageProvider } from './i18n';
import AuthGuard from './components/AuthGuard';

// Public Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/auth/AuthPage';
import VerifyPage from './pages/verify/VerifyPage';
import NotFound from './pages/NotFound';

// Role Pages
import TouristDashboard from './pages/tourist/Dashboard';
import TouristProfile from './pages/tourist/Profile';
import TouristItinerary from './pages/tourist/Itinerary';
import ResidentDashboard from './pages/resident/Dashboard';
import ResidentReport from './pages/resident/Report';
import ResidentFeed from './pages/resident/Feed';
import BusinessDashboard from './pages/business/Dashboard';
import BusinessProfile from './pages/business/Profile';
import AuthorityDashboard from './pages/authority/Dashboard';
import AuthorityEfir from './pages/authority/Efir';
import AuthorityAnalytics from './pages/authority/Analytics';
import AuthorityIncidents from './pages/authority/Incidents';
import AuthorityRosters from './pages/authority/AuthorityRosters';
import AuthorityZones from './pages/authority/ZoneManagement';
import AlertComposer from './pages/authority/AlertComposer';
import UserDetail from './pages/authority/UserDetail';
import DailyCheckins from './pages/authority/DailyCheckins';

export default function App() {
    return (
        <LanguageProvider>
        <BrowserRouter>
            <AuthProvider>
                <SocketProvider>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/verify/:blockchainId" element={<VerifyPage />} />

                        {/* Tourist Routes */}
                        <Route path="/tourist/*" element={
                            <AuthGuard role="tourist">
                                <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#1f1d17] pb-[80px] md:pb-0">
                                    <Routes>
                                        <Route path="dashboard" element={<TouristDashboard />} />
                                        <Route path="itinerary" element={<TouristItinerary />} />
                                        <Route path="plan" element={<TouristItinerary />} />
                                        <Route path="profile" element={<TouristProfile />} />
                                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                                    </Routes>
                                </div>
                            </AuthGuard>
                        } />

                        {/* Resident Routes */}
                        <Route path="/resident/*" element={
                            <AuthGuard role="resident">
                                <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#1a1c1a] pb-[80px] md:pb-0">
                                    <Routes>
                                        <Route path="dashboard" element={<ResidentDashboard />} />
                                        <Route path="feed" element={<ResidentFeed />} />
                                        <Route path="incidents" element={<ResidentFeed />} />
                                        <Route path="report" element={<ResidentReport />} />
                                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                                    </Routes>
                                </div>
                            </AuthGuard>
                        } />

                        {/* Business Routes */}
                        <Route path="/business/*" element={
                            <AuthGuard role="business">
                                <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#221c10] pb-[80px] md:pb-0">
                                    <Routes>
                                        <Route path="dashboard" element={<BusinessDashboard />} />
                                        <Route path="profile" element={<BusinessProfile />} />
                                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                                    </Routes>
                                </div>
                            </AuthGuard>
                        } />

                        {/* Authority Routes */}
                        <Route path="/authority/*" element={
                            <AuthGuard role="authority">
                                <div className="min-h-screen">
                                    <Routes>
                                        <Route path="dashboard" element={<AuthorityDashboard />} />
                                        <Route path="incidents" element={<AuthorityIncidents />} />
                                        <Route path="tourists" element={<AuthorityRosters />} />
                                        <Route path="residents" element={<AuthorityRosters />} />
                                        <Route path="businesses" element={<AuthorityRosters />} />
                                        <Route path="zones" element={<AuthorityZones />} />
                                        <Route path="checkins" element={<DailyCheckins />} />
                                        <Route path="efir" element={<AuthorityEfir />} />
                                        <Route path="analytics" element={<AuthorityAnalytics />} />
                                        <Route path="alerts" element={<AlertComposer />} />
                                        <Route path="user/:userId" element={<UserDetail />} />
                                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                                    </Routes>
                                </div>
                            </AuthGuard>
                        } />

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </SocketProvider>
            </AuthProvider>
        </BrowserRouter>
        </LanguageProvider>
    );
}

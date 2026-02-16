import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = () => {
    return (
        <div className="layout-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Header />
                <main className="main-content" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
                    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;

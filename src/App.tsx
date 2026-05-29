import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import AnnouncementList from './components/AnnouncementList'
import QuoteMap from './components/QuoteMap'
import AdminPanel from './components/AdminPanel'
import Settings from './components/Settings'
import Budget from './components/Budget'
import Kanban from './components/Kanban'
import Navigation from './components/Navigation'
import { Container, Center, Spinner, useToast } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { announcementService, userService } from './lib/data'

// 1. Main App Layout for Authenticated Users
const AppLayout = () => {
  const { user, signOut } = useAuth();
  const toast = useToast();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: 'Sessão terminada',
      description: 'Terminou a sessão com sucesso!',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  if (!user) {
    // This should not happen if routing is correct, but as a safeguard:
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navigation user={user} onLogout={handleLogout} />
      <Container maxW="container.xl" py={4}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/announcements" element={<AnnouncementListPage />} />
          <Route path="/quotes" element={<QuoteMap user={user} isAdmin={user.is_admin} />} />
          <Route path="/budget" element={<Budget user={user} />} />
          <Route path="/kanban" element={<Kanban onNavigate={() => {}} />} />
          <Route path="/settings" element={<Settings user={user} />} />
          {user.is_admin && <Route path="/admin" element={<AdminPanel />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </>
  );
};

// Wrapper for AnnouncementList to handle its own data
const AnnouncementListPage = () => {
    const { user } = useAuth()
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [userMap, setUserMap] = useState<Record<string, string>>({})
    const toast = useToast()

    useEffect(() => {
        const loadData = async () => {
            try {
                const [announcementsData, usersData] = await Promise.all([
                    announcementService.getAll(),
                    userService.getAll()
                ]);
                setAnnouncements(announcementsData);

                const map = usersData.reduce((acc, u) => {
                    if (u.email) {
                        acc[u.email] = u.name || u.email.split('@')[0];
                    }
                    return acc;
                }, {} as Record<string, string>);
                setUserMap(map);

            } catch (e) {
                toast({ title: "Error loading page data", status: 'error' })
            }
        }
        loadData()
    }, [])

    const handleNewAnnouncement = async (announcement: any) => {
        if(!user) return
        const newAnn = await announcementService.create({
            ...announcement,
            user_email: user.email,
            fraction: user.fraction
        })
        setAnnouncements(prev => [newAnn, ...prev])
    }

    const handleDeleteAnnouncement = async (id: string) => {
        await announcementService.delete(id)
        setAnnouncements(prev => prev.filter(a => a.id !== id))
    }

    if(!user) return null

    return <AnnouncementList 
        user={user} 
        announcements={announcements}
        userMap={userMap}
        onNewAnnouncement={handleNewAnnouncement}
        onDeleteAnnouncement={handleDeleteAnnouncement}
    />
}

// 2. Main Router Component
const AppRoutes = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('AppRoutes render:', { 
    user: user?.email, 
    loading, 
    pathname: location.pathname,
    hasUser: !!user 
  });

  if (loading) {
    console.log('AppRoutes: Showing loading spinner');
    return (
      <Center minH="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (user && location.pathname === '/login') {
    console.log('AppRoutes: User logged in, redirecting from login to dashboard');
    return <Navigate to="/" replace />;
  }
  
  if (!user && location.pathname !== '/login') {
    console.log('AppRoutes: No user, redirecting to login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  console.log('AppRoutes: Rendering routes');
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<AppLayout />} />
    </Routes>
  );
};

// 3. App Entry Point
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

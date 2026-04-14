import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';

export function SessionExpiredModal() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { sessionExpired, setSessionExpired } = useUIStore();

  const handleLogin = () => {
    setSessionExpired(false);
    logout();
    navigate('/login');
  };

  return (
    <Dialog open={sessionExpired} onOpenChange={(open) => {
      if (!open) handleLogin();
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session Expired</DialogTitle>
          <DialogDescription>
            Your session has expired. Please log in again to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleLogin}>Log In</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

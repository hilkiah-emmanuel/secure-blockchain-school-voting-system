import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVotingStore } from '@/lib/votingStore';
import Login from './Login';

const Index = () => {
  const navigate = useNavigate();
  const currentUser = useVotingStore((state) => state.currentUser);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  return <Login />;
};

export default Index;

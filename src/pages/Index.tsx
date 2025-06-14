
import { useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import { initializeSampleData } from '@/utils/storage';

const Index = () => {
  useEffect(() => {
    // Initialize sample data on first load
    initializeSampleData();
  }, []);

  return <Dashboard />;
};

export default Index;


import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import POS from '@/components/POS';
import Products from '@/components/Products';
import Customers from '@/components/Customers';
import Reports from '@/components/Reports';
import { initializeSampleData } from '@/utils/storage';

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    // Initialize sample data on first load
    initializeSampleData();
  }, []);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POS />;
      case 'products':
        return <Products />;
      case 'customers':
        return <Customers />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderCurrentPage()}
    </Layout>
  );
};

export default Index;

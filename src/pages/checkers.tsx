import Layout from '@/components/Layout';
import { Checkers } from '../components/Checkers';

export default function CheckersPage() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <h1 className="text-4xl font-bold mb-8">Checkers</h1>
        <Checkers />
      </div>
    </Layout>
  );
}



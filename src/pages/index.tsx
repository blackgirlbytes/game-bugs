import Layout from '../components/Layout';
import { Snake } from '@/components/Snake';

export default function Home() {


  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <h1 className="text-4xl font-bold mb-8">Snake Game</h1>
        <Snake />
      </div>
    </Layout>
  );
}
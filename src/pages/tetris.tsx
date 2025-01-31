import { Tetris } from '../components/Tetris';
import Layout from '../components/Layout';

export default function TetrisPage() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <h1 className="text-4xl font-bold mb-8">Tetris</h1>
        <Tetris />
      </div>
    </Layout>
  );
}
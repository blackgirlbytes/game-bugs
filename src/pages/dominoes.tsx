import Dominoes from '@/components/Dominoes';
import { useAIPlayer } from '@/components/Dominoes/AIPlayer';
import Layout from '@/components/Layout';

export default function DominoesPage() {
  // Initialize AI player hook
  useAIPlayer();

  return (
    <Layout>
        <div className="min-h-screen bg-gray-100">
      <Dominoes />
    </div>
    </Layout>
  
  );
}
import { loadBalloonData } from '@/lib/data/windborne';
import { DashboardClient } from '@/components/DashboardClient';

export default async function Home() {
  // Load balloon data on the server
  const balloons = await loadBalloonData();

  return <DashboardClient initialBalloons={balloons} />;
}

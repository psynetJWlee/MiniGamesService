import { RouterProvider } from 'react-router';
import { router } from './routes';
import { PlayerProvider } from './lib/player';
import '../styles/fonts.css';

export default function App() {
  return (
    <PlayerProvider>
      <RouterProvider router={router} />
    </PlayerProvider>
  );
}

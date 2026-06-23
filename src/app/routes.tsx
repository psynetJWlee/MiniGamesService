import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import FeedingGame from "./pages/FeedingGame";
import BalloonGame from "./pages/BalloonGame";
import MatchingGame from "./pages/MatchingGame";
import MonsterGame from "./pages/MonsterGame";
import SoundGame from "./pages/SoundGame";
import MazeGame from "./pages/MazeGame";
import HiddenGame from "./pages/HiddenGame";
import DinoGame from "./pages/DinoGame";
import HospitalGame from "./pages/HospitalGame";
import { Layout } from "./components/Layout";

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <span className="text-6xl mb-4">😮</span>
    <h2 className="text-3xl font-title text-gray-700">여기는 아무것도 없어요!</h2>
    <button
      onClick={() => (window.location.href = import.meta.env.BASE_URL)}
      className="mt-6 px-8 py-3 bg-orange-500 text-white rounded-2xl font-title text-xl"
    >
      처음으로 돌아가기
    </button>
  </div>
);

// On GitHub Pages the app is served from "/MiniGamesService/", so React Router
// needs that as its basename (it must match Vite's `base`). Without it every
// path falls through to the NotFound route.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export const router = createBrowserRouter(
  [
  {
    path: "/",
    element: (
      <Layout>
        <Home />
      </Layout>
    ),
  },
  { path: "/game/feeding", element: <FeedingGame /> },
  { path: "/game/balloons", element: <BalloonGame /> },
  { path: "/game/matching", element: <MatchingGame /> },
  { path: "/game/monsters", element: <MonsterGame /> },
  { path: "/game/sounds", element: <SoundGame /> },
  { path: "/game/maze", element: <MazeGame /> },
  { path: "/game/hidden", element: <HiddenGame /> },
  { path: "/game/dino", element: <DinoGame /> },
  { path: "/game/hospital", element: <HospitalGame /> },
    {
      path: "*",
      element: (
        <Layout>
          <NotFound />
        </Layout>
      ),
    },
  ],
  { basename },
);

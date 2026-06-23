import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import { Layout } from "./components/Layout";
import React from "react";

// Placeholder for NotFound
const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <span className="text-6xl mb-4">😮</span>
    <h2 className="text-3xl font-title text-gray-700">여기는 아무것도 없어요!</h2>
    <button 
      onClick={() => window.location.href = '/'}
      className="mt-6 px-8 py-3 bg-orange-500 text-white rounded-2xl font-title text-xl"
    >
      처음으로 돌아가기
    </button>
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Layout>
        <Home />
      </Layout>
    ),
  },
  {
    path: "*",
    element: (
      <Layout>
        <NotFound />
      </Layout>
    ),
  },
]);

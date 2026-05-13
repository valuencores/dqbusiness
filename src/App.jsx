import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import InputPage from './pages/InputPage';
import ResultPage from './pages/ResultPage';
import ScenarioPage from './pages/ScenarioPage';
import StrategyPage from './pages/StrategyPage';
import CalcPage from './pages/CalcPage';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="strategy" element={<StrategyPage />} />
          <Route path="input" element={<InputPage />} />
          <Route path="result" element={<ResultPage />} />
          <Route path="scenario" element={<ScenarioPage />} />
          <Route path="calc" element={<CalcPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

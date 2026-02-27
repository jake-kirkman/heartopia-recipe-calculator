import { HashRouter, Routes, Route } from 'react-router-dom';
import { BatchPlannerProvider } from './context/BatchPlannerContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { RecipesPage } from './pages/RecipesPage';
import { ProfitPage } from './pages/ProfitPage';
import { IngredientsPage } from './pages/IngredientsPage';
import { PlannerPage } from './pages/PlannerPage';

function App() {
  return (
    <HashRouter>
      <BatchPlannerProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/profit" element={<ProfitPage />} />
            <Route path="/ingredients" element={<IngredientsPage />} />
            <Route path="/planner" element={<PlannerPage />} />
          </Routes>
        </Layout>
      </BatchPlannerProvider>
    </HashRouter>
  );
}

export default App;

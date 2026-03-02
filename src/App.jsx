import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

import UsersListPage from "./pages/users/UsersListPage";
import UserFormPage from "./pages/users/UserFormPage";

import ResponsaveisListPage from "./pages/responsaveis/ResponsaveisListPage";
import ResponsavelFormPage from "./pages/responsaveis/ResponsavelFormPage";

import AnimaisListPage from "./pages/animais/AnimaisListPage";
import AnimalFormPage from "./pages/animais/AnimalFormPage";

import AtendimentosListPage from "./pages/atendimentos/AtendimentosListPage";
import AtendimentoFormPage from "./pages/atendimentos/AtendimentoFormPage";
import AtendimentoViewPage from "./pages/atendimentos/AtendimentoViewPage";
import AtendimentoBlocoPage from "./pages/atendimentos/AtendimentoBlocoPage";
import PerfilPage from "./pages/perfil/PerfilPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        <Route path="/perfil" element={<PerfilPage />} />

        <Route path="usuarios" element={<UsersListPage />} />
        <Route path="usuarios/novo" element={<UserFormPage mode="create" />} />
        <Route path="usuarios/:id/editar" element={<UserFormPage mode="edit" />} />

        <Route path="responsaveis" element={<ResponsaveisListPage />} />
        <Route path="responsaveis/novo" element={<ResponsavelFormPage mode="create" />} />
        <Route path="responsaveis/:id/editar" element={<ResponsavelFormPage mode="edit" />} />

        <Route path="animais" element={<AnimaisListPage />} />
        <Route path="animais/novo" element={<AnimalFormPage mode="create" />} />
        <Route path="animais/:id/editar" element={<AnimalFormPage mode="edit" />} />

        <Route path="atendimentos" element={<AtendimentosListPage />} />
        <Route path="atendimentos/novo" element={<AtendimentoFormPage mode="create" />} />
        <Route path="atendimentos/:id/editar" element={<AtendimentoFormPage mode="edit" />} />
        <Route path="atendimentos/:id/ver" element={<AtendimentoViewPage />} />

        {/* páginas para upsert dos blocos 1:1 */}
        <Route path="atendimentos/:id/bloco/:tipo" element={<AtendimentoBlocoPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
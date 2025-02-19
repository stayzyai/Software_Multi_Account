import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./components/Routes/Route";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

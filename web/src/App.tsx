import { AppRoutes } from "./routes/AppRoutes";
import Loader from "./components/Loader";
import { LoadingProvider } from "./context/LoadingContext";

function App() {
  return (
    <LoadingProvider>
      <Loader />
      <AppRoutes />
    </LoadingProvider>
  );
}

export default App;

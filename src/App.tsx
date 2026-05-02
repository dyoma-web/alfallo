import { AppRouter } from './routes';
import { CookieBanner } from './components/CookieBanner';

export default function App() {
  return (
    <>
      <AppRouter />
      <CookieBanner />
    </>
  );
}

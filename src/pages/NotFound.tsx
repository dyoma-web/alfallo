import { Link } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { Btn } from '../components/Btn';

export default function NotFound() {
  return (
    <AuthShell
      title="Página no encontrada"
      subtitle="Lo que buscas no existe o se movió."
    >
      <Link to="/">
        <Btn full size="lg">Volver al inicio</Btn>
      </Link>
    </AuthShell>
  );
}

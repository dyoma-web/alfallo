import { Link } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { Btn } from '../components/Btn';

export default function Forbidden() {
  return (
    <AuthShell
      title="No tienes permiso"
      subtitle="Tu rol no tiene acceso a esta sección."
    >
      <Link to="/dashboard">
        <Btn full size="lg" variant="secondary">Volver al dashboard</Btn>
      </Link>
    </AuthShell>
  );
}

import { Link } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { Btn } from '../components/Btn';

export default function Terminos() {
  return (
    <AuthShell
      title="Términos y Condiciones"
      subtitle="Versión completa en revisión por el equipo legal."
    >
      <div className="space-y-4 text-sm text-fg-2 leading-relaxed">
        <p>
          <strong>Naturaleza del servicio.</strong> Al Fallo es una herramienta de gestión de
          información para profesionales del entrenamiento y sus clientes. No es un proveedor
          de servicios de salud, ni intermediario comercial, ni pasarela de pagos. Las
          relaciones contractuales son entre los entrenadores, sus clientes y los gimnasios
          donde operan.
        </p>
        <p>
          <strong>Marcas de gimnasios.</strong> Las marcas, nombres y logotipos mencionados en
          la plataforma pertenecen a sus dueños. Al Fallo no promociona ni recomienda ninguno.
        </p>
        <p>
          <strong>Limitación de responsabilidad.</strong> En la máxima medida permitida por la
          ley colombiana, Al Fallo no responde por la calidad del servicio profesional prestado
          por entrenadores ni por consecuencias derivadas del entrenamiento.
        </p>
        <p>
          <strong>Ley aplicable.</strong> Estos términos se rigen por la legislación de la
          República de Colombia.
        </p>
        <p className="pt-2">
          El texto completo está disponible{' '}
          <a
            href="https://github.com/dyoma-web/alfallo/blob/main/docs/03-disclaimer-legal.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline-offset-2 hover:underline"
          >
            en este documento
          </a>
          .
        </p>
      </div>

      <div className="mt-6">
        <Link to="/login">
          <Btn variant="secondary" full>Volver</Btn>
        </Link>
      </div>
    </AuthShell>
  );
}

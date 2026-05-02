import { Link } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { Btn } from '../components/Btn';

export default function PoliticaDatos() {
  return (
    <AuthShell
      title="Política de Tratamiento de Datos"
      subtitle="Versión completa en revisión por el equipo legal."
    >
      <div className="space-y-4 text-sm text-fg-2 leading-relaxed">
        <p>
          Al Fallo trata tus datos personales conforme a la <strong>Ley 1581 de 2012</strong> y
          el <strong>Decreto 1377 de 2013</strong>. Solo recolectamos los datos necesarios para
          operar la plataforma. No los vendemos, no los entregamos a terceros con fines
          comerciales y no los usamos para perfilamiento publicitario externo.
        </p>
        <p>
          Tus datos sensibles (salud, fotos) tienen protección reforzada y solo son visibles para
          ti y para tu entrenador asignado, según el nivel de privacidad que configures.
        </p>
        <p>
          Tienes derecho a conocer, actualizar, rectificar y solicitar la supresión de tus datos
          en cualquier momento escribiendo a{' '}
          <a
            href="mailto:david.yomayusa@innovahub.org"
            className="text-accent underline-offset-2 hover:underline"
          >
            david.yomayusa@innovahub.org
          </a>
          .
        </p>
        <p className="pt-2">
          El texto completo (incluyendo finalidades, plazos y procedimientos) está disponible{' '}
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

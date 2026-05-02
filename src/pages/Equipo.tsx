import { Link } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';

export default function Equipo() {
  return (
    <AuthShell
      title="El equipo de administración"
      subtitle="Quién está detrás de Al Fallo"
    >
      <div className="space-y-5 text-sm text-fg-2 leading-relaxed">
        <p>
          Al Fallo es una herramienta operada por el <strong>equipo de administración</strong>.
          Nos encargamos del mantenimiento, soporte, atención de solicitudes Habeas Data y
          del crecimiento responsable de la plataforma.
        </p>

        <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3">
            Contacto principal
          </div>
          <div className="font-display text-base font-semibold text-fg">
            equipo@alfallo · vía{' '}
            <a
              href="mailto:david.yomayusa@innovahub.org"
              className="text-accent underline-offset-2 hover:underline"
            >
              david.yomayusa@innovahub.org
            </a>
          </div>
          <p className="text-fg-2 text-[13px]">
            Atendemos en horario hábil colombiano. Respondemos siempre dentro de los plazos
            que exige la ley para Habeas Data:
          </p>
          <ul className="text-[13px] space-y-1 ml-4">
            <li className="flex gap-2"><Icon name="check" size={12} color="#A6EDB1" strokeWidth={2.5} className="mt-1 flex-none" /> Consultas: 10 días hábiles</li>
            <li className="flex gap-2"><Icon name="check" size={12} color="#A6EDB1" strokeWidth={2.5} className="mt-1 flex-none" /> Reclamos: 15 días hábiles</li>
            <li className="flex gap-2"><Icon name="check" size={12} color="#A6EDB1" strokeWidth={2.5} className="mt-1 flex-none" /> Reclamos de marca: 5 días hábiles</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-fg mb-2 tracking-[-0.01em]">
            Naturaleza del proyecto
          </h2>
          <p>
            Al Fallo nació para ayudar a entrenadores y gimnasios a organizar la gestión de
            entrenamientos personalizados, semipersonalizados y grupales sin depender de
            hojas de cálculo dispersas o WhatsApp.
          </p>
          <p className="mt-2">
            Estamos en <strong>fase MVP / piloto controlado</strong>. Eso significa que el
            servicio está estable y operativo, pero la infraestructura es ligera (Google
            Sheets + Apps Script). Cuando crezcamos migraremos a una base de datos real.
            Esa transición no afectará a los usuarios — solo cambia la plomería de atrás.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-fg mb-2 tracking-[-0.01em]">
            Código abierto, marca cerrada
          </h2>
          <p>
            El código fuente está versionado en{' '}
            <a
              href="https://github.com/dyoma-web/alfallo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline-offset-2 hover:underline"
            >
              github.com/dyoma-web/alfallo
            </a>
            . El uso comercial requiere autorización expresa — la marca y el desarrollo
            están bajo licencia privativa.
          </p>
        </div>

        <p className="text-fg-3 text-[12px] pt-3 border-t border-line">
          ¿Tienes una idea para la plataforma o quieres reportar algo? Estamos abiertos.
          Escríbenos.
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

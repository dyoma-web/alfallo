import { Link } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { Btn } from '../components/Btn';

export default function PoliticaDatos() {
  return (
    <AuthShell
      title="Política de Tratamiento de Datos Personales"
      subtitle="Versión vigente · Operada bajo Ley 1581 de 2012 y Decreto 1377 de 2013"
    >
      <div className="space-y-5 text-sm text-fg-2 leading-relaxed">
        <Section title="1. Responsable del tratamiento">
          <p>
            <strong>David Yomayusa Salinas</strong>, persona natural responsable del
            proyecto <strong>Al Fallo</strong>. Domiciliado en Colombia. Contacto:{' '}
            <a
              href="mailto:david.yomayusa@innovahub.org"
              className="text-accent underline-offset-2 hover:underline"
            >
              david.yomayusa@innovahub.org
            </a>
            .
          </p>
        </Section>

        <Section title="2. Finalidad del tratamiento">
          <p>Tus datos se tratan únicamente para:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Operar la plataforma: cuenta, agendar entrenamientos, registrar asistencia, planes, rutinas, indicadores reportados voluntariamente.</li>
            <li>Comunicación: notificaciones in-app, correos transaccionales y atención de solicitudes.</li>
            <li>Seguridad y auditoría: logs de acceso e integridad.</li>
            <li>Mejora del producto: análisis estadístico <strong>agregado y anonimizado</strong>.</li>
            <li>Cumplimiento de obligaciones legales y atención de requerimientos de autoridades.</li>
          </ul>
          <p className="mt-2">
            <strong>NO vendemos tus datos. NO los entregamos a terceros con fines comerciales.
            NO los usamos para perfilamiento publicitario externo.</strong>
          </p>
        </Section>

        <Section title="3. Datos sensibles">
          <p>
            Algunos datos que tratamos son sensibles según el artículo 5 de la Ley 1581:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Datos de salud: peso, frecuencia cardíaca, presión, lesiones, dolor reportado.</li>
            <li>Imagen: foto de perfil y galería de progreso (cuando lo subas tú).</li>
          </ul>
          <p className="mt-2">
            <strong>Tratamiento especial:</strong> puedes negarte a entregarlos sin que esto te impida usar el servicio. Solo pedimos los estrictamente necesarios. Los datos de salud son visibles únicamente para ti y tu entrenador asignado. Las fotos tienen niveles de privacidad configurables.
          </p>
        </Section>

        <Section title="4. Tus derechos como titular">
          <p>Conforme al artículo 8 de la Ley 1581 puedes:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Conocer, actualizar y rectificar tus datos.</li>
            <li>Solicitar prueba de la autorización otorgada.</li>
            <li>Ser informado sobre el uso que se ha dado a tus datos.</li>
            <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones.</li>
            <li>Revocar la autorización y solicitar la supresión de los datos.</li>
            <li>Acceder gratuitamente a tus datos.</li>
          </ul>
        </Section>

        <Section title="5. Cómo ejercer tus derechos">
          <p>
            Escríbenos a{' '}
            <a
              href="mailto:david.yomayusa@innovahub.org"
              className="text-accent underline-offset-2 hover:underline"
            >
              david.yomayusa@innovahub.org
            </a>{' '}
            con asunto <strong>"Solicitud Habeas Data — [tipo de solicitud]"</strong>. Incluye:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Tus nombres y apellidos completos.</li>
            <li>Documento de identificación.</li>
            <li>Descripción precisa de la solicitud.</li>
            <li>Correo o dirección donde recibir respuesta.</li>
          </ul>
          <p className="mt-2">
            <strong>Tiempos de respuesta</strong> (artículo 14 Ley 1581):
            consultas <strong>10 días hábiles</strong> (prorrogables 5),
            reclamos <strong>15 días hábiles</strong> (prorrogables 8).
          </p>
        </Section>

        <Section title="6. Plazos de conservación">
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Cuenta activa: mientras dure la relación.</li>
            <li>Cuenta cancelada — datos personales: eliminación en máximo 30 días.</li>
            <li>Histórico anonimizado: hasta 5 años (estadísticas y obligaciones de auditoría).</li>
            <li>Logs de acceso y auditoría: 12 meses con archivado posterior.</li>
          </ul>
        </Section>

        <Section title="7. Almacenamiento y seguridad">
          <p>
            Los datos se almacenan en infraestructura de <strong>Google LLC</strong> (Google Sheets, Apps Script, Drive). Google es Encargado del Tratamiento bajo nuestras instrucciones, amparado por sus compromisos contractuales (Google Cloud DPA) y marcos de transferencia internacional vigentes.
          </p>
          <p className="mt-2">
            Aplicamos medidas razonables: hash SHA-256 con salt y pepper para passwords (jamás texto plano), tokens de sesión con expiración, control por roles, logs de auditoría, backups diarios cifrados y HTTPS en toda comunicación.
          </p>
          <p className="mt-2">
            <strong>Limitación declarada</strong>: el MVP usa Google Sheets como datastore. Aunque es operacionalmente funcional, no constituye infraestructura de grado financiero o médico. Al registrarte aceptas que el servicio está en fase piloto y que se migrará a infraestructura de producción al madurar.
          </p>
        </Section>

        <Section title="8. Cambios a esta política">
          <p>
            Cualquier cambio sustancial será notificado por correo electrónico y por aviso destacado en la plataforma con al menos <strong>15 días</strong> de anticipación.
          </p>
        </Section>

        <p className="text-fg-3 text-[12px] pt-3 border-t border-line">
          Texto técnico completo en{' '}
          <a
            href="https://github.com/dyoma-web/alfallo/blob/main/docs/03-disclaimer-legal.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg-2 underline-offset-2 hover:underline"
          >
            docs/03-disclaimer-legal.md
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-base font-semibold text-fg mb-2 tracking-[-0.01em]">
        {title}
      </h2>
      {children}
    </section>
  );
}

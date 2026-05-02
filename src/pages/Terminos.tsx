import { Link } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { Btn } from '../components/Btn';

export default function Terminos() {
  return (
    <AuthShell
      title="Términos y Condiciones de Uso"
      subtitle="Versión vigente · Regidos por la legislación de la República de Colombia"
    >
      <div className="space-y-5 text-sm text-fg-2 leading-relaxed">
        <Section title="1. Naturaleza del servicio">
          <p>
            Al Fallo es una <strong>herramienta de gestión de información</strong> para
            profesionales del entrenamiento físico y sus clientes. Permite organizar agendas,
            planes, asistencia, rutinas y progreso.
          </p>
          <p className="mt-2"><strong>Al Fallo NO es:</strong></p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>Una agencia de contratación ni intermediario comercial.</li>
            <li>Un proveedor de servicios de entrenamiento ni de salud.</li>
            <li>Un sistema de facturación electrónica ni pasarela de pagos.</li>
            <li>Un proveedor de consejo médico, nutricional ni deportivo.</li>
          </ul>
          <p className="mt-2"><strong>Al Fallo NO se hace responsable</strong> de:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>La calidad o resultados del servicio prestado por entrenadores, gimnasios o sedes.</li>
            <li>Las relaciones contractuales o disputas comerciales entre las partes registradas.</li>
            <li>Lesiones, daños físicos o consecuencias del entrenamiento.</li>
          </ul>
        </Section>

        <Section title="2. Roles y obligaciones">
          <p><strong>Cliente / Usuario:</strong></p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>Mantener actualizada su información personal y de salud (lo que decida compartir voluntariamente).</li>
            <li>Cumplir las políticas de cancelación de su entrenador o sede.</li>
            <li>No suplantar identidad ni crear cuentas fraudulentas.</li>
            <li>Respetar las normas de convivencia con otros usuarios.</li>
          </ul>
          <p className="mt-2"><strong>Entrenador:</strong></p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>Garantizar que su información profesional cargada (certificaciones, perfil) es veraz.</li>
            <li>Operar bajo las normas legales aplicables a su profesión en Colombia.</li>
            <li>Tratar la información de sus usuarios conforme a la Ley 1581 — actúa como co-responsable sobre los datos de sus clientes.</li>
            <li>Respetar los acuerdos comerciales con las sedes y gimnasios donde opere.</li>
          </ul>
          <p className="mt-2"><strong>Equipo de administración (Al Fallo):</strong></p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>Mantener la plataforma operativa en términos razonables.</li>
            <li>Responder oportunamente a solicitudes Habeas Data.</li>
            <li>No interferir indebidamente en relaciones comerciales entre las partes.</li>
          </ul>
        </Section>

        <Section title="3. Suspensión y cancelación de cuentas">
          <p>Podemos suspender o cancelar cuentas que:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>Violen la Política de Tratamiento de Datos.</li>
            <li>Suplanten identidad.</li>
            <li>Carguen contenido ofensivo, ilegal o que viole derechos de terceros.</li>
            <li>Usen la plataforma para fines distintos a los declarados.</li>
          </ul>
        </Section>

        <Section title="4. Limitación de responsabilidad">
          <p>
            En la <strong>máxima medida permitida por la ley colombiana</strong>, Al Fallo no responde por:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>Pérdida de información debida a fallas de servicios de terceros (Google Sheets, Apps Script, GitHub Pages) sobre los que no tenemos control.</li>
            <li>Interrupciones de servicio.</li>
            <li>Daños indirectos, lucro cesante o consecuencias derivadas del uso o imposibilidad de uso de la plataforma.</li>
          </ul>
          <p className="mt-2">
            Realizamos esfuerzos razonables (backups diarios, monitoreo) pero <strong>no garantizamos disponibilidad 24/7</strong> durante la fase MVP/piloto.
          </p>
        </Section>

        <Section title="5. Propiedad de los datos">
          <p>
            Cada usuario es propietario de los datos personales que carga. Al Fallo es responsable del tratamiento pero no propietario. Los datos operativos (agendamientos, asistencia, planes, indicadores) pertenecen al titular del dato.
          </p>
          <p className="mt-2">
            En caso de controversia sobre la titularidad de información cargada, se aplicará la legislación del territorio donde la información fue cargada originalmente. Para uso desde Colombia: Ley 1581 de 2012 y normas concordantes.
          </p>
        </Section>

        <Section title="6. Ley aplicable y jurisdicción">
          <p>
            Estos términos se rigen por las <strong>leyes de la República de Colombia</strong>. Cualquier controversia será resuelta ante los <strong>jueces ordinarios competentes en Colombia</strong>, salvo acuerdo expreso de arbitraje.
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

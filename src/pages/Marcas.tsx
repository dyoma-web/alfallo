import { Link } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { Btn } from '../components/Btn';

export default function Marcas() {
  return (
    <AuthShell
      title="Marcas y propiedad intelectual"
      subtitle="Sobre los gimnasios y entrenadores mencionados en Al Fallo"
    >
      <div className="space-y-5 text-sm text-fg-2 leading-relaxed">
        <Section title="Reconocimiento de propiedad">
          <p>
            Las marcas, nombres comerciales, logotipos, eslóganes e identidades visuales
            de gimnasios, sedes y entrenadores mencionados en Al Fallo son propiedad de sus
            respectivos titulares.
          </p>
          <p className="mt-2">
            La información sobre sedes y entrenadores en la plataforma es ingresada
            directamente por los entrenadores y administradores que la usan, no por Al Fallo.
          </p>
          <p className="mt-2">
            <strong>El uso de un nombre o marca en Al Fallo no implica</strong> relación
            comercial, patrocinio, afiliación ni respaldo entre Al Fallo y dicha marca.
          </p>
        </Section>

        <Section title="Procedimiento de reclamo">
          <p>
            Los titulares de derechos sobre una marca pueden contactarnos para:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Verificar la marca</strong> en la plataforma (recibe distintivo de "marca verificada" en una próxima iteración).</li>
            <li><strong>Restringir el uso</strong> de logotipos, fotos o elementos protegidos. Mostraremos la información en formato textual neutro.</li>
            <li><strong>Solicitar el retiro</strong> de menciones que violen sus derechos.</li>
          </ul>
          <p className="mt-2">
            Aplicamos un procedimiento de <strong>notificación y retiro</strong> análogo a la DMCA estadounidense, adaptado a la <strong>Ley 23 de 1982</strong> y la <strong>Decisión 351 de la Comunidad Andina</strong>. Recibida una solicitud fundamentada, el contenido reportado se retira en máximo <strong>5 días hábiles</strong>.
          </p>
        </Section>

        <Section title="Canal de reclamo">
          <p>
            Escribe a{' '}
            <a
              href="mailto:david.yomayusa@innovahub.org"
              className="text-accent underline-offset-2 hover:underline"
            >
              david.yomayusa@innovahub.org
            </a>{' '}
            con asunto <strong>"Reclamo de marca — [marca]"</strong>. Incluye:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Identificación del titular o representante legal.</li>
            <li>Marca afectada y su registro (si aplica).</li>
            <li>Descripción del uso reportado y dónde aparece en la plataforma.</li>
            <li>Acción solicitada: retirar, modificar, verificar.</li>
          </ul>
        </Section>

        <Section title="Disputas sobre datos cargados">
          <p>
            Si existe controversia sobre la titularidad o propiedad de información cargada
            en Al Fallo, se aplicará la legislación del territorio donde la información fue
            cargada originalmente. Para cargas desde Colombia, prevalece la <strong>Ley 1581
            de 2012</strong> y normas concordantes.
          </p>
        </Section>
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

# Academic Research Skills (ARS) — instalación y guía de uso

Referencia del plugin [`Imbad0202/academic-research-skills`](https://github.com/Imbad0202/academic-research-skills)
instalado en este repo: qué es, cómo quedó configurado y cómo se usa cada skill.

- **Versión documentada:** v3.19.0 (commit `32823c3`)
- **Licencia:** CC-BY-NC-4.0 — **no comercial**
- **Contenido:** 4 skills, 27 modos, 16 slash commands

---

## 1. Cómo quedó instalado

La instalación vive en `.claude/settings.json`, versionado en el repo:

```json
{
  "extraKnownMarketplaces": {
    "academic-research-skills": {
      "source": { "source": "github", "repo": "Imbad0202/academic-research-skills" }
    }
  },
  "enabledPlugins": { "academic-research-skills@academic-research-skills": true }
}
```

Al abrir este repo y confiar la carpeta, Claude Code ofrece instalar el marketplace y su
plugin. Como la config está commiteada, funciona igual en local que en una sesión web nueva.

### Instalación manual (equivalente, a nivel usuario)

Si además lo querés disponible en **todos** tus proyectos, no solo en este:

```
/plugin marketplace add Imbad0202/academic-research-skills
/plugin install academic-research-skills@academic-research-skills
```

El `install` necesita la forma `plugin@marketplace`. Acá los dos se llaman igual, de ahí el
nombre repetido.

### Verificar que quedó activo

```
/plugin
```

Debería listar `academic-research-skills` como instalado y enabled. Si no, `claude plugin install`
desde la terminal hace lo mismo sin entrar a la UI.

---

## 2. Cómo se invocan las skills

Hay tres formas, de menos a más explícita:

**a) Lenguaje natural (lo normal).** Las skills traen triggers en su descripción y se activan
solas. No hace falta nombrarlas:

> "Ayudame a escribir un paper sobre el impacto de la baja natalidad en universidades privadas"

**b) Forzando skill y modo.** Cuando querés un modo puntual y no el que Claude elegiría:

> "Usá `deep-research` en modo `systematic-review` sobre X"

**c) Slash commands.** 16 modos tienen atajo propio (ver §7).

Los triggers están en inglés, chino y coreano — no en español. Si escribís en español,
conviene nombrar la skill o el comando explícitamente para asegurar la activación.

---

## 3. `deep-research` — investigación (v2.11.0, 8 modos)

Pipeline de 13 agentes. Formulación de pregunta, búsqueda sistemática, verificación de fuentes,
síntesis cross-source, riesgo de sesgo, meta-análisis y compilación en APA 7.0.

| Modo | Salida | Supervisión | Cuándo |
|---|---|---|---|
| `full` | Reporte APA 7.0, 3.000–8.000 palabras | Alta | Investigación completa de un tema |
| `quick` | Brief de 500–1.500 palabras | Media | Panorama rápido, ~30 min |
| `review` | Reporte de revisor sobre un texto dado | Alta | Evaluar un paper o fuente ajena |
| `lit-review` | Bibliografía anotada + síntesis | Media | Estado del arte |
| `three-way-scan` | Shortlist WHY/HOW/WHAT + síntesis | Baja | Comparar papers por rol argumental |
| `fact-check` | Verificación claim por claim | Media | Auditar afirmaciones de un texto |
| `socratic` | Research Plan + colección de INSIGHTs | Muy alta | **Tenés una idea vaga y no sabés formular la pregunta** |
| `systematic-review` | Reporte PRISMA 2020, 5.000–15.000 palabras | Media | Revisión sistemática / meta-análisis |

**El modo que más se subestima es `socratic`.** No te da respuestas: te hace preguntas durante
5–15 rondas hasta que la pregunta de investigación queda enfocada. Es el punto de entrada
correcto cuando arrancás de cero.

> "Tengo una idea difusa sobre X pero no sé cómo enmarcar la pregunta. Guiame." → `socratic`
> "Revisión sistemática sobre X con meta-análisis" → `systematic-review`

---

## 4. `academic-paper` — escritura (v3.2.0, 11 modos)

Pipeline de 12 agentes. 6 tipos de paper, 5 formatos de cita, abstracts bilingües, salida
LaTeX / DOCX (vía Pandoc) / PDF. Incluye Style Calibration, Writing Quality Check y
Anti-Patterns con marcadores IRON RULE.

| Modo | Salida | Supervisión | Cuándo |
|---|---|---|---|
| `full` | Draft completo (IMRaD o según dominio) | Alta | Escribir el paper entero |
| `plan` | Chapter Plan + INSIGHTs (socrático) | Muy alta | Planificar capítulo por capítulo con vos |
| `outline-only` | Outline detallado + mapa de evidencia | Alta | Solo la estructura |
| `revision` | Draft revisado + respuestas R&R punto por punto | Alta | Ya tenés los comentarios de los revisores |
| `revision-coach` | Revision Roadmap + esqueleto de carta respuesta | Media | Parsear comentarios y armar plan antes de escribir |
| `abstract-only` | Abstract bilingüe (zh-TW + EN) + keywords | Media | Solo el abstract |
| `lit-review` | Bibliografía anotada en formato paper | Media | Sección de estado del arte publicable |
| `format-convert` | LaTeX / DOCX / PDF / MD | Baja | Cambiar formato o estilo de citas |
| `citation-check` | Reporte de errores de citación | Baja | Verificar referencias antes de enviar |
| `disclosure` | Declaración de uso de IA según el venue | Baja | El journal pide AI disclosure |
| `rebuttal-audit` | QA de un rebuttal ya escrito: cobertura, gaps, riesgos | Baja | **Antes de mandar tu respuesta a los revisores** |

Ojo: `abstract-only` genera bilingüe **chino tradicional + inglés**. Para español hay que pedirlo
explícitamente.

La secuencia natural post-revisión es `revision-coach` (entender qué piden) → `revision`
(escribir) → `rebuttal-audit` (verificar que no quedó ningún comentario sin responder).

---

## 5. `academic-paper-reviewer` — peer review simulado (v1.10.0, 6 modos)

Simula 5 revisores independientes con expertise específica del campo: un Journal-Fit Reviewer,
3 peer reviewers y un Devil's Advocate.

| Modo | Salida | Supervisión | Cuándo |
|---|---|---|---|
| `full` | 5 reportes + Editorial Decision + Revision Roadmap | Alta | Review completo antes de enviar |
| `re-review` | Checklist de verificación + issues residuales | Media | Ya revisaste: ¿quedó algo sin resolver? |
| `quick` | Assessment del Journal-Fit + issues clave | Baja | Chequeo rápido de encaje con el journal |
| `methodology-focus` | Review metodológico en profundidad | Media | La duda es el método, no el texto |
| `guided` | Diálogo socrático issue por issue | Muy alta | Querés entender los problemas, no que te los arreglen |
| `calibration` | Calibration Report / lectura direccional de 3 papers | Media | Medir qué tan acertado es el revisor simulado |

`calibration` existe para responder "¿le puedo creer a esto?". Le das papers cuyo resultado real
de review ya conocés y mide la precisión direccional del simulador.

---

## 6. `academic-pipeline` — orquestador (v3.19.0)

Encadena las tres anteriores en un flujo de 10 etapas:

```
research → write → integrity check → review → revise → re-review
        → re-revise → final integrity check → finalize
```

Con verificación de integridad obligatoria, peer review en dos etapas y quality gates
reproducibles.

> "Quiero producir un paper completo sobre cómo la IA agéntica está reconfigurando X"

**Presupuesto según el propio repo: ~USD 4–6 en API y 2–4 horas de trabajo colaborativo.**
No es un "dale y andá a hacer otra cosa" — hay checkpoints donde tenés que decidir.

Modo extra: `resume_from_passport=<hash>` retoma una corrida previa desde un reset boundary
del Material Passport. Es opt-in, requiere `ARS_PASSPORT_RESET=1`.

---

## 7. Slash commands

Atajos directos a un modo, sin depender de que el trigger se active:

| Comando | Equivale a |
|---|---|
| `/ars-full` | Pipeline completo: research → write → review → revise → finalize |
| `/ars-plan` | `academic-paper` `plan` — planificación socrática por capítulos |
| `/ars-outline` | `academic-paper` `outline-only` |
| `/ars-abstract` | `academic-paper` `abstract-only` |
| `/ars-lit-review` | `academic-paper` `lit-review` |
| `/ars-revision` | `academic-paper` `revision` |
| `/ars-revision-coach` | `academic-paper` `revision-coach` |
| `/ars-rebuttal-audit` | `academic-paper` `rebuttal-audit` |
| `/ars-citation-check` | `academic-paper` `citation-check` |
| `/ars-format-convert` | `academic-paper` `format-convert` |
| `/ars-disclosure` | `academic-paper` `disclosure` |
| `/ars-3w` | `deep-research` `three-way-scan` |
| `/ars-reviewer` | `academic-paper-reviewer` `full` |
| `/ars-mark-read` | Registra señal de "leído por humano" para claves de cita |
| `/ars-unmark-read` | Revierte una marca de leído previa |
| `/ars-cache-invalidate` | Descarta entradas cacheadas de verificación de una cita |

Los últimos tres no son modos: son utilidades del sistema de verificación de citas. `mark-read`
sirve para declarar que *vos* leíste una fuente, lo que cambia cómo el pipeline la trata en los
gates de integridad.

Si hay colisión de nombres con otro plugin, quedan namespaceados como
`/academic-research-skills:ars-full`.

---

## 8. Cosas a tener en cuenta

**Licencia no comercial.** CC-BY-NC-4.0. Para investigación propia está bien; para trabajo
facturable a un cliente, no.

**El plugin trae hooks.** Un `SessionStart` que anuncia la carga y un `PreToolUse` sobre
`Write|Edit|Bash` que actúa como guard de scope de escritura. El script está bien hecho —
degrada a pass-through si no encuentra Python en vez de bloquearte — pero es código de terceros
corriendo en cada tool call.

**Solapamiento con STORM.** Este repo *es* STORM (stanford-oval), que hace research
multiperspectiva, y ya existe la skill `investigacion-storm` con el mismo método. `deep-research`
pisa territorio parecido. Diferencia práctica: STORM está orientado a generar artículos tipo
Wikipedia con perspectivas contrapuestas; ARS apunta a output académico formal con PRISMA, APA y
peer review simulado. Conviven, pero elegí a conciencia cuál usás para qué.

**Idioma.** Todo el sistema está pensado en inglés / chino / coreano. Funciona en español, pero
los triggers automáticos no van a saltar solos y algunos defaults (como el abstract bilingüe)
hay que sobreescribirlos a mano.

**Clon local de referencia.** El repo completo está en `~/academic-research-skills` en esta
sesión. Ver `MODE_REGISTRY.md` (fuente de verdad de los 27 modos), `QUICKSTART.md` y
`docs/SETUP.md` para métodos de instalación alternativos.

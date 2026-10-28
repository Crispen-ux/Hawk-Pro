import type { ServiceContent } from "@/data/services";
export function ServiceOverview({ content }: { content: ServiceContent }) {
  return (
    <>
      <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:py-20 lg:px-8">
        <header className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[.3em] text-primary">
            {content.eyebrow}
          </p>
          <h2 className="text-balance font-serif text-4xl font-extrabold uppercase leading-tight sm:text-5xl">
            {content.title}
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            {content.intro}
          </p>
        </header>
        <div className="grid gap-4 lg:grid-cols-3">
          {content.cards.map((card) => (
            <article className="space-y-4 border bg-card p-6" key={card.title}>
              <h3 className="font-serif text-2xl font-bold uppercase leading-tight">
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {card.body}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section id="how-it-works" className="scroll-mt-24 border-y bg-card/40">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:py-16 lg:px-8">
          <h2 className="font-serif text-4xl font-extrabold uppercase sm:text-5xl">
            How it works.
          </h2>
          <ol className="grid gap-8 lg:grid-cols-3">
            {content.steps.map((step, i) => (
              <li key={step.title} className="space-y-3">
                <span className="block font-mono text-sm text-primary">
                  0{i + 1}
                </span>
                <h3 className="font-serif text-2xl font-bold uppercase">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
export function EnquiryChecklist({ content }: { content: ServiceContent }) {
  return (
    <div className="space-y-4 border bg-card p-5">
      <h3 className="font-serif text-xl font-bold uppercase">
        {content.checklistTitle}
      </h3>
      <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground">
        {content.checklist.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
export function ServiceFaq({ content }: { content: ServiceContent }) {
  return (
    <section
      className="mx-auto max-w-7xl space-y-7 border-t px-4 py-14 sm:py-16 lg:px-8"
      aria-labelledby="service-faq-title"
    >
      <h2
        id="service-faq-title"
        className="font-serif text-4xl font-extrabold uppercase sm:text-5xl"
      >
        Before you enquire.
      </h2>
      <div className="max-w-4xl divide-y border-y">
        {content.faqs.map((faq) => (
          <details key={faq.question} className="group py-5">
            <summary className="cursor-pointer rounded text-base font-semibold focus-visible:outline-2 focus-visible:outline-primary">
              {faq.question}
            </summary>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

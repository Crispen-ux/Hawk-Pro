export type ServiceContent = {
  eyebrow: string;
  title: string;
  intro: string;
  cards: { title: string; body: string }[];
  steps: { title: string; body: string }[];
  checklistTitle: string;
  checklist: string[];
  faqs: { question: string; answer: string }[];
};
export const RENTAL_CONTENT: ServiceContent = {
  eyebrow: "Plan your sound",
  title: "The right starting point for your event.",
  intro:
    "A sound setup starts with the space, the audience and what you want people to hear. Tell us whether you are planning speeches, music or a performance so we can review your requirements.",
  cards: [
    {
      title: "Speakers & PA equipment",
      body: "Enquire about speakers and related audio equipment for functions, events and performances. Include the size of your audience and whether the venue is indoors or outdoors.",
    },
    {
      title: "Subwoofers & system requirements",
      body: "If music is central to the event, tell us about the setup you have in mind and any equipment you already own. We can review your speaker and subwoofer requirements together.",
    },
    {
      title: "The details that complete a setup",
      body: "Let us know about microphones, stands, cabling or other items you may need. The quote will confirm the equipment and services included, subject to availability.",
    },
  ],
  steps: [
    {
      title: "Tell us about the event",
      body: "Send the event date, location, equipment requirements and any useful details about your venue and audience.",
    },
    {
      title: "Review the proposed setup",
      body: "We review your enquiry, clarify the requirements and respond with availability and a quote.",
    },
    {
      title: "Confirm the arrangements",
      body: "Agree the equipment, timing, costs and handover arrangements with the team before making plans around the booking.",
    },
  ],
  checklistTitle: "Have these details ready",
  checklist: [
    "Event date, start time and expected duration",
    "Venue, town or city, and indoor or outdoor setting",
    "Approximate audience size and intended use",
    "Equipment you need and anything you already have",
    "Any delivery, setup, collection or technical-support requirements",
  ],
  faqs: [
    {
      question: "Does submitting an enquiry reserve equipment?",
      answer:
        "No. An enquiry lets us review the request. Availability and booking arrangements must be confirmed by the team.",
    },
    {
      question: "What if I do not know which equipment I need?",
      answer:
        "Describe your event, audience, venue and intended use in the equipment field. You can also use the planning helper below to organise your requirements before sending the enquiry.",
    },
    {
      question: "Are delivery, setup and collection included?",
      answer:
        "Include these requirements in your enquiry. The team will confirm what can be arranged and which services and charges are included in the quote.",
    },
    {
      question: "How much does a rental cost, and is a deposit required?",
      answer:
        "Costs and any deposit or payment requirements are confirmed with your quote. They depend on the equipment, dates and arrangements agreed with the team.",
    },
    {
      question: "Can I change the date or equipment after enquiring?",
      answer:
        "Contact the team with the revised details. Changes need to be reviewed for availability and may require an updated quote.",
    },
  ],
};
export const REPAIR_CONTENT: ServiceContent = {
  eyebrow: "Start with the symptoms",
  title: "Tell us what has changed.",
  intro:
    "A clear description helps us understand the fault and plan the next step. We review repair enquiries before confirming an assessment, the work involved or a completion date.",
  cards: [
    {
      title: "No sound or intermittent output",
      body: "Tell us whether the speaker produces no sound, cuts out during use or works only some of the time. Include when the problem started and whether one or more units are affected.",
    },
    {
      title: "Distortion, buzzing or rattling",
      body: "Describe the sound you hear and when it happens. Let us know whether it occurs at particular levels or started after an event, transport or another change.",
    },
    {
      title: "Damage & servicing enquiries",
      body: "Describe visible damage, loose connections or changes in performance. Include the brand and model where possible so we can review whether the equipment and work are within scope.",
    },
  ],
  steps: [
    {
      title: "Describe the equipment & fault",
      body: "Send the brand, model if known, and a useful description of the symptoms. Include your contact details so we can follow up.",
    },
    {
      title: "Arrange an assessment",
      body: "We review the request and contact you about the assessment and how to get the equipment to us. Confirm the arrangements before bringing or sending it.",
    },
    {
      title: "Agree the next steps",
      body: "Following assessment, we discuss the findings, proposed work, costs and expected timing before you decide how to proceed.",
    },
  ],
  checklistTitle: "What helps us assess your enquiry",
  checklist: [
    "Equipment brand, model and whether it is a speaker or another audio device",
    "A clear description of the fault and when it started",
    "Whether the fault is constant or intermittent",
    "Any known incident, visible damage or previous repair",
    "Your preferred contact details and any timing requirements",
  ],
  faqs: [
    {
      question: "Can you quote from the fault description alone?",
      answer:
        "The description helps us review your enquiry, but the equipment may need an assessment before the work and costs can be confirmed.",
    },
    {
      question: "How long will a repair take?",
      answer:
        "Expected timing is discussed after assessment. It depends on the fault, the work required and any parts that may be needed. Mention any deadline in your enquiry.",
    },
    {
      question: "Can I bring or courier the equipment straight away?",
      answer:
        "Please contact the team first. Confirm the assessment and handover arrangements before travelling or sending equipment.",
    },
    {
      question: "Do you accept every brand or type of audio equipment?",
      answer:
        "Include the brand, model and fault in your request. We review each enquiry and confirm whether we can assess the equipment; a submission does not confirm that a repair can be carried out.",
    },
    {
      question: "What happens after I submit a request?",
      answer:
        "The team will contact you to clarify the details and discuss an assessment. The enquiry form does not take payment or book a confirmed repair slot.",
    },
  ],
};

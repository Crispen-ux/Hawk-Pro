import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button.tsx";
import { Form } from "@/components/ui/form.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import TextField from "@/components/forms/text-field.tsx";
import { createEnquiry } from "@/lib/api.ts";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s()-]{6,}$/, "Enter a valid phone number"),
  eventDate: z.string().min(1, "Choose an event date"),
  location: z.string().trim().min(2, "Enter the event location"),
  equipment: z.string().trim().min(3, "Tell us what equipment you need"),
  notes: z.string().trim().max(1000).optional(),
});
type Values = z.infer<typeof schema>;

export default function RentalForm() {
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      eventDate: "",
      location: "",
      equipment: "",
      notes: "",
    },
  });

  const onSubmit = async (values: Values) => {
    setSending(true);
    setError(null);
    try {
      await createEnquiry({
        kind: "rental",
        payload: {
          name: values.name,
          email: values.email,
          phone: values.phone,
          eventDate: values.eventDate,
          location: values.location,
          equipment: values.equipment,
          ...(values.notes ? { notes: values.notes } : {}),
        },
      });
      setDone(true);
      form.reset();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Your enquiry could not be sent. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
      >
        {done && (
          <Alert role="status">
            <AlertTitle>Enquiry sent</AlertTitle>
            <AlertDescription>
              Thanks — your rental enquiry is with us. We will get back to you
              to confirm availability and the booking.
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertTitle>Could not send your enquiry</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="name"
            label="Name"
            placeholder="John Smith"
          />
          <TextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            placeholder="example@gmail.com"
          />
          <TextField
            control={form.control}
            name="phone"
            label="Phone"
            type="tel"
            placeholder="082 000 0000"
          />
          <TextField
            control={form.control}
            name="eventDate"
            label="Event date"
            type="date"
          />
        </div>
        <TextField
          control={form.control}
          name="location"
          label="Event location"
          placeholder="Venue and town or city"
        />
        <TextField
          control={form.control}
          name="equipment"
          label="Equipment required"
          multiline
          placeholder="e.g. 2 speakers and 1 subwoofer for a 150-person function"
        />
        <TextField
          control={form.control}
          name="notes"
          label="Additional requirements (optional)"
          multiline
        />
        <Button type="submit" size="lg" disabled={sending}>
          {sending ? "Sending…" : "Submit enquiry"}
        </Button>
      </form>
    </Form>
  );
}

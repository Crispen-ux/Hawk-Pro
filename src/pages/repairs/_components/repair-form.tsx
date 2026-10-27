import { useRef, useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Form } from "@/components/ui/form.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import TextField from "@/components/forms/text-field.tsx";
import RepairAiTriage from "./repair-ai-triage.tsx";
import { createEnquiry } from "@/lib/api.ts";

const MAX_FILES = 4;

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s()-]{6,}$/, "Enter a valid phone number"),
  brand: z.string().trim().min(2, "Enter the speaker or equipment brand"),
  model: z.string().trim().optional(),
  fault: z
    .string()
    .trim()
    .min(10, "Please describe the fault (at least 10 characters)"),
});
type Values = z.infer<typeof schema>;

export default function RepairForm() {
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      brand: "",
      model: "",
      fault: "",
    },
  });

  const watched = useWatch({ control: form.control });

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
    e.target.value = "";
  };

  // Photos stay in memory: uploads are not wired up yet, so the selected
  // files are never sent with the request.
  const onSubmit = async (values: Values) => {
    setSending(true);
    setError(null);
    try {
      await createEnquiry({
        kind: "repair",
        payload: {
          name: values.name,
          email: values.email,
          phone: values.phone,
          brand: values.brand,
          ...(values.model ? { model: values.model } : {}),
          fault: values.fault,
        },
      });
      setDone(true);
      setFiles([]);
      form.reset();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Your repair request could not be sent. Please try again.",
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
            <AlertTitle>Request sent</AlertTitle>
            <AlertDescription>
              Thanks — your repair request is with us. We will contact you to
              arrange an assessment.
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertTitle>Could not send your request</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="name"
            label="Customer name"
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
            name="brand"
            label="Speaker or equipment brand"
            placeholder="Brand name"
          />
        </div>
        <TextField
          control={form.control}
          name="model"
          label="Model (if known)"
        />
        <TextField
          control={form.control}
          name="fault"
          label="Description of the fault"
          multiline
          placeholder="What is it doing, and when did it start?"
        />

        <RepairAiTriage
          brand={watched.brand ?? ""}
          model={watched.model ?? ""}
          fault={watched.fault ?? ""}
        />
        <div className="space-y-2">
          <Label htmlFor="photos">Photos (optional)</Label>
          <input
            ref={inputRef}
            id="photos"
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={onPick}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={files.length >= MAX_FILES}
          >
            <ImagePlusIcon /> Add photos
          </Button>
          <p className="text-xs text-muted-foreground">
            Up to {MAX_FILES} images. Photo upload is not connected yet —
            selected photos are not sent, so describe any visible damage in the
            fault description.
          </p>
          {files.length > 0 && (
            <ul className="flex flex-wrap gap-3 pt-1">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="relative">
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="size-20 object-cover"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute -right-2 -top-2 size-6 rounded-full"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                  >
                    <XIcon className="size-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="submit" size="lg" disabled={sending}>
          {sending ? "Sending…" : "Submit request"}
        </Button>
      </form>
    </Form>
  );
}

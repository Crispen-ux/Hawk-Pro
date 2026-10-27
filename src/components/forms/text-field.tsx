import type { ReactNode } from "react";
import {
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  hint?: ReactNode;
};

// Labelled text/textarea field wired to react-hook-form with inline validation messages.
export default function TextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  multiline,
  hint,
}: Props<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {multiline ? (
              <Textarea rows={4} placeholder={placeholder} {...field} />
            ) : (
              <Input type={type} placeholder={placeholder} {...field} />
            )}
          </FormControl>
          {hint}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

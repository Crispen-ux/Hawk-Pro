import ProductImageScale from "../product-image-scale";
import ProductImageUploader from "../product-image-uploader";
import ProductDetailsFields from "../product-details-fields";
import {
  DEFAULT_PRODUCT_DETAILS,
  normaliseProductDetails,
} from "../../../../../db/product-details";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeftIcon,
  ImagePlusIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Form } from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import TextField from "@/components/forms/text-field.tsx";
import {
  AVAILABILITY_LABEL,
  CATEGORIES,
  type Availability,
} from "@/data/products.ts";
import {
  PRODUCT_AVAILABILITY,
  productInputSchema,
  type ProductInput,
  type ProductRecord,
} from "../../../../../db/validation.ts";
import { createProduct, fetchProduct, updateProduct } from "@/lib/api.ts";

// The API takes the price as a number of rands; the form keeps it as text so
// the field behaves like every other input and only converts on save.
const formSchema = productInputSchema.extend({
  priceZar: z
    .string()
    .trim()
    .min(1, "Enter a price")
    .regex(/^\d+$/, "Enter a whole number of rands"),
});
type FormValues = z.infer<typeof formSchema>;

const DEFAULT_VALUES: FormValues = {
  name: "",
  slug: "",
  category: "speakers",
  priceZar: "",
  shortDescription: "",
  description: "",
  availability: "coming-soon",
  images: [],
  specs: [],
  published: false,
  details: DEFAULT_PRODUCT_DETAILS,
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export default function AdminProductEditor() {
  const { id = "" } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newImage, setNewImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [product, setProduct] = useState<ProductRecord | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  const specs = useFieldArray({ control: form.control, name: "specs" });
  const images = useWatch({ control: form.control, name: "images" }) ?? [];
  const name = useWatch({ control: form.control, name: "name" });
  const published = useWatch({ control: form.control, name: "published" });
  const details =
    useWatch({ control: form.control, name: "details" }) ??
    DEFAULT_PRODUCT_DETAILS;
  const category = useWatch({ control: form.control, name: "category" });
  const availability = useWatch({
    control: form.control,
    name: "availability",
  });

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    fetchProduct(id)
      .then((row) => {
        if (cancelled) return;
        setProduct(row);
        form.reset({
          name: row.name,
          slug: row.slug,
          category: row.category,
          priceZar: String(row.priceZar),
          shortDescription: row.shortDescription,
          description: row.description,
          availability: row.availability,
          images: row.images,
          specs: row.specs,
          published: row.published,
          details: normaliseProductDetails(row.details),
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Product not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form, id, isNew]);

  const addImage = () => {
    if (uploading || saving) return;
    const url = newImage.trim();
    if (!url) return;
    const parsed = z.string().url("Enter a valid image URL").safeParse(url);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid image URL");
      return;
    }
    if (images.length >= 8) {
      toast.error("Up to 8 images per product");
      return;
    }
    form.setValue("images", [...images, parsed.data], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setNewImage("");
  };

  const removeImage = (index: number) => {
    form.setValue(
      "images",
      images.filter((_, i) => i !== index),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const onSubmit = async (values: FormValues) => {
    if (uploading || saving) return;
    setSaving(true);
    setError("");
    try {
      const input: ProductInput = {
        ...values,
        priceZar: Number(values.priceZar),
      };
      if (isNew) await createProduct(input);
      else await updateProduct(id, input);
      toast.success(isNew ? "Product created" : "Product saved");
      navigate("/admin/products");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-10 lg:px-8">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-64 w-full" />
        <span className="sr-only" role="status">
          Loading product
        </span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 lg:px-8">
        <Alert variant="destructive" role="alert">
          <AlertTitle>Product could not be loaded</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
        <Button asChild variant="secondary">
          <Link to="/admin/products">
            <ArrowLeftIcon /> Back to products
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 lg:px-8">
      <header className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link to="/admin/products">
            <ArrowLeftIcon /> All products
          </Link>
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
              {isNew ? "New entry" : "Editing"}
            </p>
            <h1 className="font-serif text-5xl font-extrabold uppercase leading-none">
              {isNew ? "Add product" : (product?.name ?? "Product")}
            </h1>
          </div>
          {!isNew && product?.published && (
            <Button asChild variant="ghost" size="sm">
              <Link to={`/shop/${product.slug}`} target="_blank">
                View on site
              </Link>
            </Button>
          )}
        </div>
      </header>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-6 lg:grid-cols-3"
          noValidate
        >
          <div className="space-y-6 lg:col-span-2">
            <section className="space-y-5 border bg-card p-5">
              <h2 className="font-serif text-xl font-bold uppercase tracking-wide">
                Details
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  control={form.control}
                  name="name"
                  label="Product name"
                  placeholder='HAWK 12" Active Speaker'
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() =>
                        form.setValue("slug", slugify(name ?? ""), {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <SparklesIcon /> Use name
                    </Button>
                  </div>
                  <Input
                    id="slug"
                    placeholder="hawk-12-active-speaker"
                    {...form.register("slug")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Product link: /shop/{slugify(name || "your-product")}
                  </p>
                  {form.formState.errors.slug && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.slug.message}
                    </p>
                  )}
                </div>
              </div>

              <TextField
                control={form.control}
                name="shortDescription"
                label="One-line summary"
                placeholder="Shown on product cards"
              />
              <TextField
                control={form.control}
                name="description"
                label="Full description"
                multiline
                placeholder="What it is, who it is for, and what it sounds like."
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priceZar">Price (ZAR)</Label>
                  <Input
                    id="priceZar"
                    inputMode="numeric"
                    placeholder="24999"
                    {...form.register("priceZar")}
                  />
                  {form.formState.errors.priceZar && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.priceZar.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={category}
                    onValueChange={(value) =>
                      form.setValue(
                        "category",
                        value as ProductInput["category"],
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      )
                    }
                  >
                    <SelectTrigger className="w-full" aria-label="Category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.category.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <ProductDetailsFields
              value={details}
              onChange={(value) =>
                form.setValue("details", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            {form.formState.errors.details && (
              <p role="alert" className="text-destructive text-sm">
                Check the speaker details and ensure maximum dispatch time is
                not earlier than minimum dispatch time.
              </p>
            )}
            <section className="space-y-4 border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-xl font-bold uppercase tracking-wide">
                  Images
                </h2>
                <span className="text-xs text-muted-foreground">
                  {images.length}/8
                </span>
              </div>

              <ProductImageUploader
                key={id}
                remaining={8 - images.length}
                disabled={saving || (!isNew && product?.id !== id)}
                onBusyChange={setUploading}
                onUploaded={(urls) =>
                  form.setValue(
                    "images",
                    [...form.getValues("images"), ...urls],
                    { shouldDirty: true, shouldValidate: true },
                  )
                }
              />
              {images.length > 0 && (
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {images.map((src, i) => (
                    <li key={`${src}-${i}`} className="group relative">
                      <img
                        src={src}
                        alt=""
                        className="aspect-square w-full border bg-muted object-cover"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute -right-2 -top-2 size-6 rounded-full"
                        disabled={uploading || saving}
                        aria-label={`Remove image ${i + 1}`}
                        onClick={() => removeImage(i)}
                      >
                        <Trash2Icon className="size-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2">
                <Input
                  disabled={uploading || saving}
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  placeholder="https://…/product-photo.jpg"
                  aria-label="Image URL"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImage();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addImage}
                  disabled={uploading || saving || images.length >= 8}
                >
                  <ImagePlusIcon /> Add
                </Button>
              </div>
              <ProductImageScale
                src={images[0]}
                name={name || ""}
                value={details.imageDisplayScale ?? 100}
                disabled={saving}
                onChange={(value) =>
                  form.setValue("details.imageDisplayScale", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              {form.formState.errors.images && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.images.message}
                </p>
              )}
            </section>

            <section className="space-y-4 border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-xl font-bold uppercase tracking-wide">
                  Specifications
                </h2>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => specs.append({ label: "", value: "" })}
                >
                  <PlusIcon /> Add row
                </Button>
              </div>

              {specs.fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No specifications yet — power, weight, dispersion and inputs
                  are typical rows.
                </p>
              )}

              <div className="space-y-3">
                {specs.fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="grid flex-1 gap-4 sm:grid-cols-2">
                      <TextField
                        control={form.control}
                        name={`specs.${index}.label`}
                        label="Name"
                        placeholder="Power"
                      />
                      <TextField
                        control={form.control}
                        name={`specs.${index}.value`}
                        label="Value"
                        placeholder="1000 W peak"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-7"
                      aria-label={`Remove specification ${index + 1}`}
                      onClick={() => specs.remove(index)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="space-y-5 border bg-card p-5">
              <h2 className="font-serif text-xl font-bold uppercase tracking-wide">
                Publishing
              </h2>

              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label htmlFor="published">Published</Label>
                  <p className="text-xs text-muted-foreground">
                    Drafts stay out of the storefront.
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={published}
                  onCheckedChange={(checked) =>
                    form.setValue("published", checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Availability</Label>
                <Select
                  value={availability}
                  onValueChange={(value) =>
                    form.setValue("availability", value as Availability, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger className="w-full" aria-label="Availability">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_AVAILABILITY.map((value) => (
                      <SelectItem key={value} value={value}>
                        {AVAILABILITY_LABEL[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.availability && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.availability.message}
                  </p>
                )}
              </div>
            </section>

            <div className="flex flex-col gap-2">
              <Button type="submit" size="lg" disabled={saving || uploading}>
                {saving ? "Saving…" : isNew ? "Create product" : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/admin/products")}
                disabled={saving || uploading}
              >
                Cancel
              </Button>
            </div>
          </aside>
        </form>
      </Form>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { InboxIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  ENQUIRY_STATUSES,
  type EnquiryRecord,
  type EnquiryStatus,
} from "../../../../db/validation.ts";
import { fetchEnquiries, setEnquiryStatus } from "@/lib/api.ts";
import { formatDateTime } from "@/lib/format.ts";

const STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  eventDate: "Event date",
  location: "Event location",
  equipment: "Equipment required",
  notes: "Notes",
  brand: "Brand",
  model: "Model",
  fault: "Fault description",
};

function labelFor(key: string): string {
  return FIELD_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

function isEmail(value: string): boolean {
  return value.includes("@") && !value.includes(" ");
}

function isPhone(value: string): boolean {
  return /^[+\d][\d\s()-]{6,}$/.test(value.trim());
}

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | "all">(
    "all",
  );
  const [kindFilter, setKindFilter] = useState<"all" | "rental" | "repair">(
    "all",
  );
  const [updating, setUpdating] = useState("");
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(() => {
    let cancelled = false;
    fetchEnquiries()
      .then((rows) => {
        if (!cancelled) setEnquiries(rows);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setEnquiries([]);
          setError(e instanceof Error ? e.message : "Could not load enquiries");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load, attempt]);

  // Flag resets belong to the click handler so the effect stays free of
  // synchronous setState calls.
  const retry = () => {
    setLoading(true);
    setError("");
    setAttempt((v) => v + 1);
  };

  const visible = useMemo(() => {
    return [...enquiries]
      .filter((e) => statusFilter === "all" || e.status === statusFilter)
      .filter((e) => kindFilter === "all" || e.kind === kindFilter)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [enquiries, kindFilter, statusFilter]);

  const changeStatus = async (
    enquiry: EnquiryRecord,
    status: EnquiryStatus,
  ) => {
    const previous = enquiry.status;
    setUpdating(enquiry.id);
    setEnquiries((rows) =>
      rows.map((row) => (row.id === enquiry.id ? { ...row, status } : row)),
    );
    try {
      await setEnquiryStatus(enquiry.id, status);
      toast.success(`Marked as ${STATUS_LABEL[status].toLowerCase()}`);
    } catch (e) {
      setEnquiries((rows) =>
        rows.map((row) =>
          row.id === enquiry.id ? { ...row, status: previous } : row,
        ),
      );
      toast.error(e instanceof Error ? e.message : "Could not update status");
    } finally {
      setUpdating("");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
            Inbox
          </p>
          <h1 className="font-serif text-5xl font-extrabold uppercase leading-none">
            Enquiries
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {enquiries.length} total ·{" "}
          {enquiries.filter((e) => e.status === "new").length} new
        </p>
      </header>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Enquiries unavailable</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {error}
            <Button size="sm" variant="secondary" onClick={retry}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!loading && !error && (
        <div className="flex flex-wrap gap-3">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as EnquiryStatus | "all")}
          >
            <SelectTrigger className="w-44" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ENQUIRY_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABEL[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={kindFilter}
            onValueChange={(v) =>
              setKindFilter(v as "all" | "rental" | "repair")
            }
          >
            <SelectTrigger className="w-40" aria-label="Filter by type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="rental">Rental</SelectItem>
              <SelectItem value="repair">Repair</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>No enquiries here</EmptyTitle>
            <EmptyDescription>
              {enquiries.length === 0
                ? "Rental and repair requests from the site will appear in this inbox."
                : "Nothing matches the selected filters."}
            </EmptyDescription>
          </EmptyHeader>
          {enquiries.length > 0 && (
            <EmptyContent>
              <Button
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setKindFilter("all");
                }}
              >
                Clear filters
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <ul className="space-y-4">
          {visible.map((enquiry) => (
            <li key={enquiry.id} className="space-y-4 border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="uppercase tracking-wider">
                    {enquiry.kind}
                  </Badge>
                  <Badge
                    variant={enquiry.status === "new" ? "default" : "secondary"}
                  >
                    {STATUS_LABEL[enquiry.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(enquiry.createdAt)}
                  </span>
                </div>

                <Select
                  value={enquiry.status}
                  disabled={updating === enquiry.id}
                  onValueChange={(v) =>
                    void changeStatus(enquiry, v as EnquiryStatus)
                  }
                >
                  <SelectTrigger
                    className="w-40"
                    aria-label="Update enquiry status"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENQUIRY_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {Object.entries(enquiry.payload).map(([key, value]) => (
                  <div key={key} className="space-y-0.5">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {labelFor(key)}
                    </dt>
                    <dd className="text-sm">
                      {key === "email" && isEmail(value) ? (
                        <a
                          href={`mailto:${value}`}
                          className="text-primary underline underline-offset-4"
                        >
                          {value}
                        </a>
                      ) : key === "phone" && isPhone(value) ? (
                        <a
                          href={`tel:${value.replace(/[^\d+]/g, "")}`}
                          className="text-primary underline underline-offset-4"
                        >
                          {value}
                        </a>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

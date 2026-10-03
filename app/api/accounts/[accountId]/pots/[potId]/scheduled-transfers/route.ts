import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  defaultScheduledTransferStatuses,
  scheduledTransferStatuses,
  type ScheduledTransfer,
  type ScheduledTransferStatus,
} from "@/lib/scheduled-transfers/types";
import { isScheduledTransfer } from "@/lib/scheduled-transfers/validation";
import { fetchAuthenticatedBackend } from "@/lib/auth/backend-fetch.server";

type ScheduledTransfersResponse = {
  items: ScheduledTransfer[];
  total: number;
  limit: number;
  offset: number;
};

type RouteContext = {
  params: Promise<{ accountId: string; potId: string }>;
};

type ScheduleTransferRequest = {
  datetime: string;
  interval: (typeof transferIntervals)[number];
  type: (typeof transferTypes)[number];
  amount: number;
  pot_id: string;
  account_id: string;
};

const transferIntervals = ["daily", "weekly", "monthly"] as const;
const transferTypes = ["deposit", "withdraw"] as const;

const scheduleTransferKeys = [
  "datetime",
  "interval",
  "type",
  "amount",
  "pot_id",
  "account_id",
] as const;

function isScheduledTransfersResponse(
  value: unknown,
): value is ScheduledTransfersResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "items" in value &&
    Array.isArray(value.items) &&
    value.items.every(isScheduledTransfer) &&
    "total" in value &&
    typeof value.total === "number" &&
    Number.isSafeInteger(value.total) &&
    value.total >= 0 &&
    "limit" in value &&
    typeof value.limit === "number" &&
    Number.isSafeInteger(value.limit) &&
    value.limit > 0 &&
    "offset" in value &&
    typeof value.offset === "number" &&
    Number.isSafeInteger(value.offset) &&
    value.offset >= 0 &&
    value.items.length <= value.limit &&
    value.items.length <= value.total
  );
}

function getPagination(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const limitValue = searchParams.get("limit") ?? "50";
  const offsetValue = searchParams.get("offset") ?? "0";

  if (!/^\d+$/.test(limitValue) || !/^\d+$/.test(offsetValue)) {
    return null;
  }

  const limit = Number(limitValue);
  const offset = Number(offsetValue);

  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  ) {
    return null;
  }

  return { limit, offset };
}

function getStatuses(request: Request): ScheduledTransferStatus[] | null {
  const statusValue =
    new URL(request.url).searchParams.get("status") ??
    defaultScheduledTransferStatuses.join(",");
  const statuses = statusValue.split(",");

  if (
    statuses.length === 0 ||
    statuses.some(
      (status, index) =>
        !scheduledTransferStatuses.includes(status as ScheduledTransferStatus) ||
        statuses.indexOf(status) !== index,
    )
  ) {
    return null;
  }

  return statuses as ScheduledTransferStatus[];
}

function isUkDateTime(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):00([+-])(\d{2}):(\d{2})$/.exec(
      value,
    );

  if (!match) {
    return false;
  }

  const instant = new Date(value);

  if (Number.isNaN(instant.getTime())) {
    return false;
  }

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return (
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}` ===
    value.slice(0, 16)
  );
}

function isScheduleTransferRequest(
  value: unknown,
): value is ScheduleTransferRequest {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const keys = Object.keys(value);

  return (
    keys.length === scheduleTransferKeys.length &&
    keys.every((key) =>
      scheduleTransferKeys.includes(
        key as (typeof scheduleTransferKeys)[number],
      ),
    ) &&
    "datetime" in value &&
    typeof value.datetime === "string" &&
    isUkDateTime(value.datetime) &&
    "interval" in value &&
    typeof value.interval === "string" &&
    transferIntervals.includes(
      value.interval as (typeof transferIntervals)[number],
    ) &&
    "type" in value &&
    typeof value.type === "string" &&
    transferTypes.includes(value.type as (typeof transferTypes)[number]) &&
    "amount" in value &&
    typeof value.amount === "number" &&
    Number.isSafeInteger(value.amount) &&
    value.amount > 0 &&
    "pot_id" in value &&
    typeof value.pot_id === "string" &&
    Boolean(value.pot_id.trim()) &&
    "account_id" in value &&
    typeof value.account_id === "string" &&
    Boolean(value.account_id.trim())
  );
}

function toScheduledTransfer(value: ScheduledTransfer): ScheduledTransfer {
  return {
    setup_id: value.setup_id,
    transfer_id: value.transfer_id,
    status: value.status,
    created_at: value.created_at,
    executed_at: value.executed_at,
    scheduled_for: value.scheduled_for,
    interval: value.interval,
    type: value.type,
    amount: value.amount,
  };
}

async function getBackendDetails() {
  const cookieStore = await cookies();
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "session";
  const token = cookieStore.get(sessionCookieName)?.value;
  const baseUrl = process.env.BASE_URL?.replace(/\/+$/, "");

  return { token, baseUrl };
}

export async function GET(request: Request, context: RouteContext) {
  const { accountId, potId } = await context.params;

  if (!accountId.trim() || !potId.trim()) {
    return NextResponse.json(
      { error: "account_and_pot_ids_required" },
      { status: 400 },
    );
  }

  const pagination = getPagination(request);
  const statuses = getStatuses(request);

  if (!pagination || !statuses) {
    return NextResponse.json(
      { error: !pagination ? "invalid_pagination" : "invalid_status" },
      { status: 400 },
    );
  }

  const { token, baseUrl } = await getBackendDetails();

  if (!token) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  if (!baseUrl) {
    return NextResponse.json(
      { error: "authentication_not_configured" },
      { status: 500 },
    );
  }

  try {
    const backendUrl = new URL(`${baseUrl}/scheduled-transfers`);
    backendUrl.searchParams.set("account_id", accountId);
    backendUrl.searchParams.set("pot_id", potId);
    backendUrl.searchParams.set("limit", String(pagination.limit));
    backendUrl.searchParams.set("offset", String(pagination.offset));
    backendUrl.searchParams.set("status", statuses.join(","));

    const backendResponse = await fetchAuthenticatedBackend(backendUrl, token, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!backendResponse.ok) {
      const status =
        backendResponse.status >= 400 && backendResponse.status < 500
          ? backendResponse.status
          : 502;
      return NextResponse.json({ error: "scheduled_transfers_failed" }, { status });
    }

    const payload: unknown = await backendResponse.json();

    if (
      !isScheduledTransfersResponse(payload) ||
      payload.limit !== pagination.limit ||
      payload.offset !== pagination.offset
    ) {
      return NextResponse.json(
        { error: "invalid_scheduled_transfers_response" },
        { status: 502 },
      );
    }

    const scheduledTransfers = payload.items.map(toScheduledTransfer);
    const response = NextResponse.json({
      scheduledTransfers,
      total: payload.total,
      limit: payload.limit,
      offset: payload.offset,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json(
      { error: "scheduled_transfers_unavailable" },
      { status: 502 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { accountId, potId } = await context.params;

  if (!accountId.trim() || !potId.trim()) {
    return NextResponse.json(
      { error: "account_and_pot_ids_required" },
      { status: 400 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (
    !isScheduleTransferRequest(payload) ||
    payload.account_id !== accountId ||
    payload.pot_id !== potId
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { token, baseUrl } = await getBackendDetails();

  if (!token) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  if (!baseUrl) {
    return NextResponse.json(
      { error: "authentication_not_configured" },
      { status: 500 },
    );
  }

  try {
    const backendResponse = await fetchAuthenticatedBackend(
      `${baseUrl}/schedule-transfer`,
      token,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!backendResponse.ok) {
      const status =
        backendResponse.status >= 400 && backendResponse.status < 500
          ? backendResponse.status
          : 502;

      return NextResponse.json({ error: "schedule_transfer_failed" }, { status });
    }

    const backendPayload: unknown = await backendResponse.json();

    if (!isScheduledTransfer(backendPayload)) {
      return NextResponse.json(
        { error: "invalid_schedule_transfer_response" },
        { status: 502 },
      );
    }

    const response = NextResponse.json(toScheduledTransfer(backendPayload), {
      status: 201,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json(
      { error: "schedule_transfer_unavailable" },
      { status: 502 },
    );
  }
}
